require('dotenv').config();
const https = require('https');
const path  = require('path');
const fs    = require('fs');

const LOG_PAD = path.join(__dirname, 'grappen-log.txt');

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function logFout(bericht) {
    const regel = `[${new Date().toISOString()}] ${bericht}\n`;
    try { fs.appendFileSync(LOG_PAD, regel); } catch (_) { /* noop */ }
    console.error(bericht);
}

// ── Fallback grappen (als API faalt) ──────────────────────────────────────────
const FALLBACKS = [
    { setup: 'Waarom kan een fiets niet zelfstandig staan?', punchline: 'Omdat hij twee-wielig is!' },
    { grap: 'Ik vertelde een grap over papier... maar die was tear-ible.' },
    { setup: 'What do you call a fish without eyes?', punchline: 'A fsh.' },
];

// ── HTTP helper met timeout ───────────────────────────────────────────────────
function haalJson(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const opties = new URL(url);
        const aanvraag = https.get({
            hostname: opties.hostname,
            path: opties.pathname + opties.search,
            headers: { 'User-Agent': 'grappen-mailer/1.0', ...headers },
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                clearTimeout(timer);
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse fout')); }
            });
        });
        const timer = setTimeout(() => {
            aanvraag.destroy();
            reject(new Error('Timeout'));
        }, 5000);
        aanvraag.on('error', (e) => { clearTimeout(timer); reject(e); });
    });
}

// ── Joke fetchers ─────────────────────────────────────────────────────────────
async function haalJokeApi() {
    const data = await haalJson(
        'https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,explicit,racist,sexist&type=twopart'
    );
    if (data.error) throw new Error('JokeAPI fout');
    return { setup: data.setup, punchline: data.delivery };
}

async function haalDadJoke() {
    const data = await haalJson(
        'https://icanhazdadjoke.com/',
        { 'Accept': 'application/json' }
    );
    if (!data.joke) throw new Error('icanhazdadjoke fout');
    return { grap: data.joke };
}

async function haalOfficieleGrap() {
    const data = await haalJson('https://official-joke-api.appspot.com/random_joke');
    if (!data.setup) throw new Error('Official Joke API fout');
    return { setup: data.setup, punchline: data.punchline };
}

async function haalAlleGrappen() {
    const fetchers = [
        { naam: 'JokeAPI',       fn: haalJokeApi,        fallback: FALLBACKS[0] },
        { naam: 'DadJoke',       fn: haalDadJoke,         fallback: FALLBACKS[1] },
        { naam: 'OfficieleGrap', fn: haalOfficieleGrap,   fallback: FALLBACKS[2] },
    ];

    return Promise.all(fetchers.map(async ({ naam, fn, fallback }) => {
        try {
            return await fn();
        } catch (e) {
            logFout(`⚠️ ${naam} mislukt: ${e.message} — fallback gebruikt`);
            return fallback;
        }
    }));
}

// ── HTML email bouwen ──────────────────────────────────────────────────────────
function buildEmail(grappen) {
    if (!Array.isArray(grappen) || grappen.length === 0) {
        throw new Error('buildEmail verwacht een niet-lege array van grappen');
    }
    // grappen = array van { setup, punchline } or { grap } (for dad jokes)
    const datum = new Date().toLocaleDateString('nl-NL', { dateStyle: 'long' });

    const kaarten = grappen.map((g, i) => {
        const inhoud = g.grap
            ? `<p style="margin:0;font-size:16px;line-height:1.6;">${escHtml(g.grap)}</p>`
            : `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${escHtml(g.setup)}</p>
               <p style="margin:0;font-size:16px;font-weight:bold;color:#f0c040;">${escHtml(g.punchline)}</p>`;

        return `
        <div style="background:#16213e;border-radius:12px;padding:24px;margin-bottom:20px;">
            <div style="font-size:12px;color:#888;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Grap ${i + 1}</div>
            ${inhoud}
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:'Nunito',Arial,sans-serif;color:#e0e0e0;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-family:'Fredoka One',Arial,sans-serif;color:#f0c040;font-size:28px;margin:0 0 8px;">
      ☀️ Jouw 3 grappen voor vandaag
    </h1>
    <p style="color:#888;font-size:14px;margin:0 0 28px;">${datum}</p>
    ${kaarten}
    <p style="text-align:center;color:#888;font-size:14px;margin-top:32px;">Geniet van je dag! 😄</p>
  </div>
</body>
</html>`;
}

// ── Self-test (node grappen.js --test) ────────────────────────────────────────
if (process.argv[2] === '--test') {
    const testGrappen = [
        { setup: 'Waarom kan een fiets niet zelfstandig staan?', punchline: 'Omdat hij twee-wielig is!' },
        { grap: 'Ik vertelde een grap over papier... het was tear-ible.' },
        { setup: 'What do you call a fish without eyes?', punchline: 'A fsh.' },
    ];
    const html = buildEmail(testGrappen);
    if (!html.includes('Grap 1')) throw new Error('Test mislukt: "Grap 1" niet gevonden in HTML');
    if (!html.includes('twee-wielig')) throw new Error('Test mislukt: punchline niet gevonden');
    if (!html.includes('tear-ible')) throw new Error('Test mislukt: enkele grap niet gevonden');
    if (!html.includes('Geniet van je dag')) throw new Error('Test mislukt: footer niet gevonden');
    console.log('✅ buildEmail test geslaagd');
    process.exit(0);
}

module.exports = { buildEmail, haalAlleGrappen, haalJson, haalJokeApi, haalDadJoke, haalOfficieleGrap, FALLBACKS };
