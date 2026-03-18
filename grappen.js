require('dotenv').config();
const https = require('https');
const path  = require('path');
const fs    = require('fs');

const LOG_PAD = path.join(__dirname, 'grappen-log.txt');

function logFout(bericht) {
    const regel = `[${new Date().toISOString()}] ${bericht}\n`;
    fs.appendFileSync(LOG_PAD, regel);
    console.error(bericht);
}

// ── HTML email bouwen ──────────────────────────────────────────────────────────
function buildEmail(grappen) {
    // grappen = array van { setup, punchline } or { grap } (for dad jokes)
    const datum = new Date().toLocaleDateString('nl-NL', { dateStyle: 'long' });

    const kaarten = grappen.map((g, i) => {
        const inhoud = g.grap
            ? `<p style="margin:0;font-size:16px;line-height:1.6;">${g.grap}</p>`
            : `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${g.setup}</p>
               <p style="margin:0;font-size:16px;font-weight:bold;color:#f0c040;">${g.punchline}</p>`;

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

module.exports = { buildEmail };
