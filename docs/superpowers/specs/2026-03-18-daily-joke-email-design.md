# Daily Joke Email — Design Spec

**Date:** 2026-03-18
**Status:** Approved

## Summary

A standalone Node.js script (`grappen.js`) that fetches 3 high-quality jokes from different free online APIs, formats them into a styled HTML email, and sends it to `cmansjoe@gmail.com` every morning at 10:00 AM via Windows Task Scheduler.

---

## Architecture

```
grappen.js (Node script)
  ├── Fetch joke 1 from JokeAPI (random: pun, misc, spooky, christmas)
  ├── Fetch joke 2 from icanhazdadjoke.com (dad joke)
  ├── Fetch joke 3 from Official Joke API (random type)
  ├── Format into styled HTML email
  └── Send via nodemailer → cmansjoe@gmail.com

Windows Task Scheduler
  └── Triggers: node grappen.js — daily at 10:00 AM
```

## Components

### grappen.js
- Standalone Node.js script (no server dependency)
- Uses `node-fetch` or built-in `https` to call joke APIs
- Uses `nodemailer` (already installed) to send email
- Reads credentials from `.env` (`EMAIL_USER`, `EMAIL_PASS`)

### Joke Sources
| # | API | Type |
|---|-----|------|
| 1 | `https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,explicit` | Mixed/variety |
| 2 | `https://icanhazdadjoke.com/` | Dad joke |
| 3 | `https://official-joke-api.appspot.com/random_joke` | Classic |

### Email Format
- **To:** `cmansjoe@gmail.com`
- **Subject:** `☀️ Jouw 3 grappen voor vandaag — [datum]`
- **Body:** Styled HTML — dark background, 3 joke cards (numbered), setup + bold punchline
- **Footer:** "Geniet van je dag! 😄"

### Credentials (.env)
```
EMAIL_USER=cmansjoe@gmail.com
EMAIL_PASS=<gmail-app-password>
```

### Windows Task Scheduler
- Trigger: Daily at 10:00 AM
- Action: `node C:\Users\cmans\Desktop\depeterpost-verhalenclub\grappen.js`
- Start in: `C:\Users\cmans\Desktop\depeterpost-verhalenclub`

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Joke API unreachable | Use hardcoded fallback joke |
| Email send fails | Log error to `grappen-log.txt` in project root |
| All 3 APIs fail | 3 fallback jokes still sent |

No retry logic — Task Scheduler retries tomorrow.

---

## Out of Scope

- No web UI
- No joke history / deduplication
- No unsubscribe flow
- No retry on failure
