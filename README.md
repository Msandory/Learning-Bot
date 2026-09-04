# PnS Learning Bot

A TypeScript + Playwright automation bot for navigating the Znanja-based
learning management system (LMS) used by Pack n Stack.

## ⚠️ Important: Ethical Purpose

This project is for educational purposes only. The goal is to explore:

- Modern web application architecture
- Browser automation with Playwright
- REST API interception and session management
- Recursive data structures (course tables of contents)
- Building resilient automation systems

**It is NOT designed to:**

- Fake course progress or falsify training completion
- Bypass required learning or assessments
- Automatically answer or submit quiz/test content on the user's behalf

**Assessment protection:** the bot is hardcoded to detect assessments,
quizzes, and graded activities via their rubric data. When one is detected,
the bot halts and hands control back to the user — it never submits an
answer automatically. An optional AI assist (see below) can draft a
suggested answer for open-ended questions, but only as a starting point for
the user to review and edit; it never posts anything itself.

## 🚀 Features

- **Automated authentication** — logs in using credentials from `.env`
- **Dynamic course discovery** — searches the LMS API for enrolled courses matching your configured course names
- **Recursive TOC parsing** — flattens nested course structures (folders → sub-folders → pages) into a flat page list
- **Assessment co-pilot** — detects rubric-bearing pages (quizzes/assessments) and pauses for manual completion
- **Optional AI draft assist** — for open-ended (non-quiz) assessment questions, can suggest a draft answer via the Gemini API for the user to review; degrades gracefully if no API key is configured
- **Heartbeat/ping system** — periodically pings the LMS to keep the session marked active
- **Progress persistence** — saves last-completed page per course to `course_progress.json`; resumes from there on restart
- **Human-like pacing** — jittered wait times between page navigations
- **Retry logic** — wraps API calls to recover from transient network errors

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Automation:** Playwright
- **Configuration:** dotenv
- **Persistence:** local JSON file
- **AI draft assist (optional):** Gemini API

## 📋 Prerequisites

- Node.js v16 or higher
- npm or yarn

## ⚙️ Installation & Setup

Clone the repository:

```bash
git clone https://github.com/your-username/pns-learning-bot.git
cd pns-learning-bot
```

Install dependencies:

```bash
npm install
```

Install the Playwright browser:

```bash
npx playwright install chromium
```

Configure environment variables — create a `.env` file in the project root:

```env
PNS_EMAIL=your-email@example.com
PNS_PASSWORD=your-password
PNS_BASE_URL=https://pack-n-stack.znanja.com

# Comma-separated list of course names to run (must match course titles exactly)
COURSES=Cybersecurity 1: Fundamentals for Employees, Cloud Park Integration

# Milliseconds to wait on each page (jittered ±20%)
PAGE_WAIT_TIME_MS=3000

HEADLESS=false

# Optional — enables AI-drafted answer suggestions for open-ended assessment
# questions. Get a free key at https://aistudio.google.com/apikey
GEMINI_API_KEY=
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PNS_EMAIL` | Yes | — | LMS login email |
| `PNS_PASSWORD` | Yes | — | LMS login password |
| `PNS_BASE_URL` | No | `https://pack-n-stack.znanja.com` | LMS base URL |
| `COURSES` | Yes | — | Comma-separated exact course names to process |
| `PAGE_WAIT_TIME_MS` | No | `3000` | Base wait time per page, in milliseconds |
| `HEADLESS` | No | `false` | Run the browser headless |
| `GEMINI_API_KEY` | No | — | Enables AI-drafted answers for open-ended assessment questions |

## 🚀 Usage

```bash
npm start
```

During execution:

1. The bot logs in and searches for your configured courses.
2. For each learning (non-assessment) page: it navigates there, sends a heartbeat ping, waits, and moves on.
3. When it hits an assessment page, it prints the question(s) to the console (with an AI-drafted suggestion for open-ended questions, if `GEMINI_API_KEY` is set) and pauses.
4. Complete the assessment yourself in the open browser window, then return to the terminal and press Enter to resume.
5. Progress is saved after every page, so a crash or manual stop can be resumed by just running `npm start` again.

## 📂 Project Structure

```
.
├── login.ts              # Authentication / login flow
├── courses.ts             # Course discovery & search
├── toc.ts                 # TOC fetching & flattening
├── courseRunner.ts        # Core navigation loop
├── assessmentDetector.ts  # Assessment detection & manual-halt handling
├── answerAssistant.ts     # Optional AI draft-answer helper (Gemini)
├── persistence.ts         # Progress save/load (course_progress.json)
├── timer.ts                # Jittered wait helper
├── cli.ts                  # Terminal prompt (resume-on-Enter)
├── requestHelper.ts        # Retry wrapper for API calls
├── logger.ts               # Logging
├── config.ts                # Centralized env/config
└── main.ts                  # Entry point
```

## 🛡️ Resilience & Safety

- **Retry logic:** API calls (page metadata, pings) are wrapped with a retry mechanism to ride out transient network errors.
- **Session sharing:** the same authenticated Playwright context is used for both UI navigation and background API requests.
- **Progress persistence:** last-completed page is saved per `course_id`, so multiple courses and resume-after-crash both work correctly.

## ⚖️ License

MIT License — see the `LICENSE` file for details.
