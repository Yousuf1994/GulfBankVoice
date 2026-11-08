# CLAUDE.md

Standing instructions for Claude Code in this project. Read this at the start of every session.

## What this project is

Noor: a multilingual banking voice agent for a fictional UAE bank, **Gulf Demo Bank**, built on **ElevenLabs Agents (ElevenAgents)**. Callers start a call from a web page; Noor verifies them through a simulated in-app approval and takes real actions in a mock core banking system.

- **What and why:** `PRD.md` (source of truth for requirements, tools and acceptance criteria)
- **How and in what order:** `BUILD_PLAN.md` (phases; check its status tracker to see where we are)

If a request conflicts with `PRD.md`, point it out and ask before proceeding.

## Who you're working with

The owner, Yousuf, is a product person with **no coding background**.
- Always **plan first and wait for approval** before writing code.
- Explain choices and results in plain English; avoid jargon or define it in one line.
- Give exact, copy-paste steps for anything he must do by hand (dashboards, logins, settings), and say why.
- Never ask him to paste secrets (API keys, passwords) into the chat. Tell him which file or settings page to put them in.
- After each working step, suggest committing with a clear message and pushing.
- At the end of a phase, list the checks from `BUILD_PLAN.md` and help him run them. Then update the phase status in `BUILD_PLAN.md`.

## Working autonomously

Work through `BUILD_PLAN.md` phase by phase without needing a new prompt for each phase. The phase prompts in the build plan are your task descriptions. Keep going on your own *within* a phase; stop at every gate below.

### The loop for each phase
1. **Plan gate (stop).** Write the phase plan in plain English: what you'll build, which files, anything Yousuf must do by hand, and risks. Wait for "approved".
2. **Build.** Work through the plan in small steps. Commit after each working step with a clear message. Don't stop to ask about routine choices; decide, and note the decision in `PROGRESS.md`.
3. **Self-check.** Run everything you can check yourself: the build, type checks, endpoint calls, ElevenLabs tests (several runs each). Fix failures. If the same problem fails 3 times, stop and explain it simply.
4. **Review gate (stop).** Report: what was built, what you checked and the results, decisions you made, and the phase's checks from `BUILD_PLAN.md` that Yousuf must do himself (with exact steps). Wait for "approved".
5. **Close the phase.** Push, update the status tracker in `BUILD_PLAN.md`, add a summary to `PROGRESS.md`, then start the next phase's plan gate.

### Always stop and ask before
- Pushing to GitHub or merging into `main` (this deploys the live site)
- `elevenlabs agents push` or any other change to the live ElevenLabs agent
- Deleting or overwriting data, files you didn't create, or the database schema in a destructive way
- Anything that costs money or changes an account setting
- Changing the PRD's scope, rules or tools (propose it instead)

### Stop and hand over when you need Yousuf to
- Log in to a service, add a secret, or click something in a dashboard. Give exact steps and wait.
- Make a product decision the PRD doesn't answer. Give 2 or 3 options with your recommendation.

### Keep a log
Maintain `PROGRESS.md`: current phase and step, decisions made (and why), open questions, and what's waiting on Yousuf. Read it at the start of every session so work resumes where it stopped.

### Secrets
Never read or edit `.env.local`. Keep `.env.example` up to date and ask Yousuf to copy new names into `.env.local` and Vercel himself.

## Tech stack

- **Web app and mock bank:** Next.js (TypeScript, App Router), deployed on Vercel
- **Database:** Postgres (added through Vercel Storage)
- **Voice agent:** ElevenLabs Agents, managed as code with the ElevenLabs CLI (`@elevenlabs/cli`)
- **Browser SDK:** `@elevenlabs/react`
- **ElevenLabs guidance:** official skills installed via `npx skills add elevenlabs/skills`. Use them; don't rely on memory for ElevenLabs APIs, which change often. If unsure, check https://elevenlabs.io/docs/llms.txt.

## Key pages

- `/call` - persona picker, "Talk to us" button, live transcript, tool activity panel, phone-shaped app panel (approvals, uploads, identity check)
- `/backoffice` - live view of customers, cards, transactions, disputes, requests, audit log; "Reset demo data"

## Non-negotiable rules

### Security
- The ElevenLabs API key and all secrets live only in `.env.local` (local) and Vercel environment variables. Never in client code, never committed. Keep `.env.example` updated with names only.
- Conversations start with a **signed URL** created by a server route.
- Every tool endpoint requires the `X-Tool-Secret` header and rejects requests without it.
- **Verification is enforced on the server**, not only in the prompt. Level 1 to read, level 2 (fresh, 5-minute expiry) to change anything.
- Customer identity comes from dynamic variables set by the page session (`customer_id`, `customer_name`), never from what the caller says.
- Every endpoint writes to `audit_log`.

### Data
- Fictional data only. Never use a real bank's name, logo or colours.
- Card numbers appear only as last 4 digits, everywhere.
- Seed data uses dates relative to today.
- Amounts are AED.
- Business rules that may change (e.g. the 30-day refund period) are config values, not hard-coded in prompts.

### Agent behaviour (apply to every prompt you write for Noor)
- Never ask for a PIN, CVV, password, OTP or full card number; say so when verifying.
- Confirm out loud before any action that changes data.
- One or two sentences per turn unless asked for detail.
- Follow the caller's language, including Arabic-English switching.
- Never more than 3 items read out without offering more.
- No investment or financial advice; product facts only from the knowledge base.
- On scam warning signs (shared a code, "bank" caller on another line, screen-sharing app, pressure to move money), escalate to the fraud team immediately.
- System prompts use six parts: personality, environment, tone, goal, guardrails, tools.

## Agent structure

One agent, organised as an ElevenLabs **workflow**:
- **Front Desk** node: greet, verify, route
- Specialist nodes: **Cards**, **Transactions**, **Fraud and disputes**, **Servicing**, **Account opening**
- Each node gets only the tools it needs (tool list per node in `PRD.md` section 6).
- Agent config, workflow, tools and tests live as files in the repo via the CLI. Before changing agent settings, pull the latest from ElevenLabs so dashboard edits aren't overwritten.

## Testing

- Every journey gets at least one ElevenLabs **simulation test** and one **tool-call test**, runnable from the CLI.
- Agent outputs vary between runs: run tests several times before calling them passing.
- When a real call goes wrong, create a test from that conversation first, then fix the prompt until it passes.

## Conventions

- Keep the code simple and readable over clever; add short comments explaining *why*.
- Small, focused commits with clear messages.
- When adding an endpoint: validate inputs, check the secret, check verification level, write to audit_log, return a short result the agent can speak.
- When adding a tool to the agent: clear name, a description that says when to use it, and parameter descriptions with examples.
