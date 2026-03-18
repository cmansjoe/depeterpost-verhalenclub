# Daily Joke Email — Design Spec

**Date:** 2026-03-18
**Status:** Approved

## Summary

A standalone Node.js script (`grappen.js`) that fetches 3 high-quality jokes from different free online APIs, formats them into a styled HTML email, and sends it to `cmansjoe@gmail.com` every morning at 10:00 AM via Windows Task Scheduler.

---

## Architecture

```
grappen.js (Node script)
  ├── Fetch joke 1 from JokeAPI (twopart: setup + delivery)
  ├── Fetch joke 2 from icanhazdadjoke.com (dad joke)
  ├── Fetch joke 3 from Official Joke API (classic)
  ├── Format into styled HTML email
  └── Send via nodemailer → cmansjoe@gmail.com

Windows Task Scheduler
  └── Triggers: node grappen.js — daily at 10:00 AM
```

---

## Components

### grappen.js
- Standalone Node.js script (no server dependency)
- Uses built-in `https` to call joke APIs (with 5-second timeout per request)
- Uses `nodemailer` (already installed) to send email
- Reads credentials from `.env` (`EMAIL_USER`, `EMAIL_PASS`)
- Ends with `process.exit(0)` on success, `process.exit(1)` on failure (prevents event loop hanging in Task Scheduler)

### Joke Sources

| # | API URL | Type | Required headers |
|---|---------|------|-----------------|
| 1 | `https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,explicit&type=twopart` | Mixed/variety | none |
| 2 | `https://icanhazdadjoke.com/` | Dad joke | `Accept: application/json` |
| 3 | `https://official-joke-api.appspot.com/random_joke` | Classic | none |

**JokeAPI response shape:** Using `?type=twopart` ensures every response has `setup` and `delivery` fields. No shape-branching needed.

**icanhazdadjoke response shape:** Returns `{ id, joke, status }` — the `joke` field is a single string (no setup/punchline split). Display as a single block.

**Official Joke API response shape:** Returns `{ setup, punchline }`.

### Email Format

- **To:** `cmansjoe@gmail.com`
- **From:** `EMAIL_USER`
- **Subject:** `☀️ Jouw 3 grappen voor vandaag — [datum]`
  - Date format: `new Date().toLocaleDateString('nl-NL', { dateStyle: 'long' })` → e.g. "18 maart 2026"
- **Body:** Styled HTML
  - Dark background (`#1a1a2e`)
  - 3 numbered joke cards, each with setup text + bold punchline (or single joke text for dad joke)
  - Footer: "Geniet van je dag! 😄"

### Nodemailer Transport Configuration

```js
{
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}
```

### Gmail Setup Requirements

`EMAIL_PASS` must be a **Gmail App Password**, NOT the Gmail account password.

To generate one:
1. Enable 2-Factor Authentication on the Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate a new app password for "Mail"
4. Store the 16-character code in `.env` as `EMAIL_PASS`

### Credentials (.env additions)

```
EMAIL_USER=cmansjoe@gmail.com
EMAIL_PASS=<16-character-gmail-app-password>
```

### HTTP Request Timeout

Every API call uses a 5-second timeout (via `AbortController` + `signal`). If a request times out or errors, the fallback joke is used instead.

### Windows Task Scheduler

- **Trigger:** Daily at 10:00 AM
- **Action:** `node C:\Users\cmans\Desktop\depeterpost-verhalenclub\grappen.js`
- **Start in:** `C:\Users\cmans\Desktop\depeterpost-verhalenclub`

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Joke API unreachable / timeout | Use hardcoded fallback joke for that slot |
| All 3 APIs fail | 3 fallback jokes sent, email still delivered |
| Email send fails | Log error with timestamp to `C:\Users\cmans\Desktop\depeterpost-verhalenclub\grappen-log.txt` |
| Script completes | `process.exit(0)` — Task Scheduler marks task as done |
| Script errors | `process.exit(1)` — Task Scheduler marks task as failed |

No retry logic — Task Scheduler retries tomorrow.

---

## Implementation Prerequisites

Before the script can run, the following must be in place:

1. **Create `grappen.js`** in the project root (this is the primary implementation deliverable)
2. **Add to `.env`:**
   ```
   EMAIL_USER=cmansjoe@gmail.com
   EMAIL_PASS=<16-character-gmail-app-password>
   ```
3. **`nodemailer`** is already present in `package.json` dependencies (`^8.0.1`) and `node_modules/` — no install needed

---

## Out of Scope

- No web UI
- No joke history / deduplication
- No unsubscribe flow
- No retry on failure
