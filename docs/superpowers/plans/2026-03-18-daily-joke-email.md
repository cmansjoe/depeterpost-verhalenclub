# Daily Joke Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `grappen.js`, a standalone Node.js script that fetches 3 jokes from different APIs and emails them to `cmansjoe@gmail.com` every morning at 10:00 AM via Windows Task Scheduler.

**Architecture:** A single self-contained script reads `.env` for credentials, fetches jokes from 3 different APIs (with 5s timeout and hardcoded fallbacks), builds a styled HTML email, and sends it via the existing Resend API (already configured in `.env`). Windows Task Scheduler triggers it daily at 10:00 AM.

**Note on email transport:** The spec mentioned nodemailer + Gmail SMTP, but the project already has a working Resend API key in `.env`. Using Resend avoids needing a Gmail App Password — simpler and consistent with the rest of the project.

**Tech Stack:** Node.js built-in `https`, `dotenv` (already installed), Resend API (already configured), Windows Task Scheduler

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `grappen.js` | Fetch jokes, build HTML, send via Resend |
| Modify | `.env` | No changes needed — Resend already configured |

---

## Task 1: Write the email HTML formatter (pure function, TDD)

**Files:**
- Create: `grappen.js` (skeleton + `buildEmail` function only)

- [ ] **Step 1.1: Create `grappen.js` with a failing test for `buildEmail`**

Create `grappen.js` with the following content:

```js
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
```

- [ ] **Step 1.2: Run the self-test to verify it passes**

```bash
node grappen.js --test
```

Expected output:
```
✅ buildEmail test geslaagd
```

- [ ] **Step 1.3: Commit**

```bash
git add grappen.js
git commit -m "feat: add grappen.js with buildEmail function and self-test"
```

---

## Task 2: Add joke fetching with fallbacks

**Files:**
- Modify: `grappen.js` (add `haalGrap` helper and 3 fetcher functions)

- [ ] **Step 2.1: Add the HTTP helper and fallback jokes after the `logFout` function**

Add the following code to `grappen.js`, after the `logFout` function and before `buildEmail`:

```js
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
        { naam: 'JokeAPI',      fn: haalJokeApi,       fallback: FALLBACKS[0] },
        { naam: 'DadJoke',      fn: haalDadJoke,        fallback: FALLBACKS[1] },
        { naam: 'OfficieleGrap',fn: haalOfficieleGrap,  fallback: FALLBACKS[2] },
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
```

- [ ] **Step 2.2: Run the self-test again to confirm nothing broke**

```bash
node grappen.js --test
```

Expected output:
```
✅ buildEmail test geslaagd
```

- [ ] **Step 2.3: Quick smoke test — fetch jokes manually**

```bash
node -e "
const { haalAlleGrappen } = require('./grappen');
haalAlleGrappen().then(g => { console.log(JSON.stringify(g, null, 2)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
" 2>&1 | head -30
```

Expected: 3 joke objects printed (setup+punchline or grap field). Fallback messages are OK if an API is down.

- [ ] **Step 2.4: Commit**

```bash
git add grappen.js
git commit -m "feat: add joke fetchers with 5s timeout and fallbacks"
```

---

## Task 3: Add email sending via Resend

**Files:**
- Modify: `grappen.js` (add `stuurGrappen` main function)

- [ ] **Step 3.1: Add the Resend email sender and main function at the bottom of `grappen.js`**

Replace the `module.exports` line and everything after it with:

```js
// ── E-mail versturen via Resend ───────────────────────────────────────────────
async function stuurGrappen(grappen) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY ontbreekt in .env');

    const vanAdres = process.env.EMAIL_VAN || 'onboarding@resend.dev';
    const datum = new Date().toLocaleDateString('nl-NL', { dateStyle: 'long' });
    const html  = buildEmail(grappen);

    const body = JSON.stringify({
        from: `VerhalenPost Grappen <${vanAdres}>`,
        to:   ['cmansjoe@gmail.com'],
        subject: `☀️ Jouw 3 grappen voor vandaag — ${datum}`,
        html,
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.resend.com',
            path:     '/emails',
            method:   'POST',
            headers:  {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type':  'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(true);
                } else {
                    reject(new Error(`Resend fout ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Hoofdprogramma ────────────────────────────────────────────────────────────
if (process.argv[2] !== '--test') {
    (async () => {
        try {
            console.log('🎭 Grappen ophalen...');
            const grappen = await haalAlleGrappen();
            console.log('📧 E-mail versturen...');
            await stuurGrappen(grappen);
            console.log('✅ Grappen-mail verstuurd!');
            process.exit(0);
        } catch (e) {
            logFout(`❌ Grappen-mail mislukt: ${e.message}`);
            process.exit(1);
        }
    })();
}

module.exports = { buildEmail, haalAlleGrappen };
```

- [ ] **Step 3.2: Run the self-test to confirm nothing broke**

```bash
node grappen.js --test
```

Expected output:
```
✅ buildEmail test geslaagd
```

- [ ] **Step 3.3: Send a real test email**

```bash
node grappen.js
```

Expected output:
```
🎭 Grappen ophalen...
📧 E-mail versturen...
✅ Grappen-mail verstuurd!
```

Then check `cmansjoe@gmail.com` inbox for the email.

- [ ] **Step 3.4: Add `grappen-log.txt` to `.gitignore`**

Open `.gitignore` (or create it if it doesn't exist) and add:
```
grappen-log.txt
```

- [ ] **Step 3.5: Commit**

```bash
git add grappen.js .gitignore
git commit -m "feat: add Resend email sender and main entry point to grappen.js"
```

---

## Task 4: Configure Windows Task Scheduler

- [ ] **Step 4.1: Open Task Scheduler**

Press `Win + S`, type "Taakplanner" (or "Task Scheduler"), open it.

- [ ] **Step 4.2: Create a new basic task**

Click **"Basistaak maken..."** (Create Basic Task) in the right panel.

- Name: `DagelijkseGrappen`
- Description: `Stuurt 3 grappen via e-mail elke ochtend`

- [ ] **Step 4.3: Set the trigger**

- Trigger: **Dagelijks** (Daily)
- Start time: **10:00:00**
- Recur every: **1** day

- [ ] **Step 4.4: Set the action**

- Action: **Een programma starten** (Start a program)
- Program/script: browse to `node.exe`, usually at:
  ```
  C:\Program Files\nodejs\node.exe
  ```
  (Or find it with: `where node` in Command Prompt)
- Add arguments (wrap in double quotes):
  ```
  "C:\Users\cmans\Desktop\depeterpost-verhalenclub\grappen.js"
  ```
- Start in:
  ```
  C:\Users\cmans\Desktop\depeterpost-verhalenclub
  ```

- [ ] **Step 4.5: Finish and verify**

- Click Finish
- In Task Scheduler, right-click **DagelijkseGrappen** → **Uitvoeren** (Run)
- Verify the email arrives at `cmansjoe@gmail.com`
- Check exit code: right-click task → Properties → History tab should show result `0x0` (success)

---

## Done ✅

After Task 4 completes:
- `grappen.js` exists and works standalone
- Windows Task Scheduler runs it daily at 10:00 AM
- Jokes are delivered to `cmansjoe@gmail.com` every morning
- Failures are logged to `grappen-log.txt`
