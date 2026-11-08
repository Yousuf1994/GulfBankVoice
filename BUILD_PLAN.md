# Build Plan: Noor, the Gulf Demo Bank Voice Agent

How to build the product described in `PRD.md`, in eight phases, using Claude Code. Each phase ends with something you can click or call, so you can stop after any phase and still have a working demo.

**Status tracker** (update as you go)

| Phase | What you get | Status |
|---|---|---|
| 0 | Accounts and tools ready | Not started |
| 1 | Project skeleton, online | Done |
| 2 | Mock bank and back office | Done |
| 3 | Noor answers, verifies, handles cards | Not started |
| 4 | Transaction memory | Not started |
| 5 | Fraud and disputes | Not started |
| 6 | Everyday servicing | Not started |
| 7 | Account opening | Not started |
| 8 | Harden, measure, polish, demo video | Not started |

---

## How to work each phase

1. Open Claude Code in the project folder. Start a fresh session per phase.
2. Paste the phase prompt. Every prompt says "plan first": read the plan, ask questions in plain English, then approve.
3. Run the checks at the end of the phase. Move on only when all pass.
4. Say: "Commit this with a clear message and push to GitHub."
5. Update the status tracker above.

Useful phrases:
- "Explain what you just did as if I'm not a developer."
- "Something broke. Here's the exact error: [paste]. I expected [X]."
- "Show me what changed since my last working commit, and go back to it if needed."

---

## Phase 0: Accounts and tools (do this yourself, once)

| Account | Why | Notes |
|---|---|---|
| [ElevenLabs](https://elevenlabs.io) | Hosts the voice agent | Free plan has only a few agent minutes; expect to upgrade when testing regularly. See [agent pricing](https://elevenlabs.io/pricing/agents). |
| [GitHub](https://github.com) | Stores the code; your portfolio | |
| [Vercel](https://vercel.com) | Hosts the web pages and mock bank | Sign up with GitHub. Free tier is enough. |
| Postgres database | Mock bank data | Add a free one (e.g. Neon) from Vercel's Storage tab in Phase 2 |

On your computer:
1. Install **Node.js** (LTS) from [nodejs.org](https://nodejs.org).
2. Install and sign in to **Claude Code**.
3. Create an empty folder, e.g. `gulf-demo-bank`, and put `PRD.md`, `BUILD_PLAN.md` and `CLAUDE.md` in it.

---

## Phase 1: Project skeleton, online

**Goal:** an empty website live on the internet, code on GitHub, ElevenLabs helpers installed.

```text
Plan first, then wait for my OK.

Read CLAUDE.md, PRD.md and BUILD_PLAN.md. We are doing Phase 1.

1. Create a Next.js app with TypeScript in this folder, keeping my three .md files.
2. Install ElevenLabs' official agent skills for Claude Code (npx skills add elevenlabs/skills) and the ElevenLabs CLI (npm install -g @elevenlabs/cli). Tell me exactly when to run "elevenlabs auth login" myself.
3. Create .env.local for secrets and confirm it is in .gitignore. Create .env.example with the variable names and no values.
4. Home page: "Gulf Demo Bank: voice agent demo".
5. Walk me step by step through creating a GitHub repository, pushing, and deploying on Vercel.
```

**Checks**
- [ ] The Vercel link shows the home page
- [ ] The code is on GitHub and `.env.local` is not
- [ ] `elevenlabs auth whoami` shows your account

---

## Phase 2: Mock bank and back office

**Goal:** a pretend bank with realistic customers and history, plus a page that shows every change live. (PRD sections 4.1, 8, 9)

```text
Plan first, then wait for my OK.

We are doing Phase 2. Follow PRD sections 4.1, 8 and 9.

1. Connect the Postgres database I added in Vercel and create the tables in PRD section 9.
2. Seed the three personas from PRD 4.1 with dates relative to today:
   - Ahmed: credit card plus a supplementary card for his wife Fatima; 6 months of transactions including Netflix, Spotify and a gym membership that started 3 months ago; one duplicate restaurant charge; yesterday, a declined online attempt at an unfamiliar overseas merchant; a Carrefour charge on Fatima's card.
   - Priya: salary account and debit card; a payment in Istanbul 2 hours ago declined by the fraud system (it was really her).
   - Maria: no account yet.
3. API endpoints the agent will call, protected by an X-Tool-Secret header (value in .env.local and Vercel). Every endpoint writes to audit_log. Start with: get customer profile, list accounts, list cards.
4. /backoffice page as described in PRD section 8, refreshing every 2 seconds, with "Reset demo data".
5. Deploy and show me how to check each endpoint.
```

**Checks**
- [ ] /backoffice shows all three customers
- [ ] An endpoint called without the secret header is refused
- [ ] "Reset demo data" works

---

## Phase 3: Noor answers, verifies and handles cards

**Goal:** press a button, talk to Noor, approve in the fake app panel, and freeze a card by voice. Your first real demo. (PRD 5, 6.1, 6.2, 7, 8)

### 3a: The agent and the call page

```text
Plan first, then wait for my OK. Use the ElevenLabs skills and CLI.

We are doing Phase 3a. Follow PRD sections 5, 7 and 8.

1. Create the agent "Noor - Gulf Demo Bank" with the CLI so its settings live as files in this project.
2. Write Noor's system prompt in six parts (personality, environment, tone, goal, guardrails, tools) based on PRD sections 5 and 7.
3. Pass customer_id and customer_name as dynamic variables when a conversation starts. Identity comes from the page, never from what the caller says.
4. Build /call per PRD section 8: persona picker, "Talk to us" button, live transcript, tool activity panel.
5. Start conversations with a signed URL created on the server so the API key never reaches the browser.
6. Push the agent and deploy. Tell me what I must do by hand in the ElevenLabs dashboard.
```

Choose the voice yourself in the ElevenLabs dashboard: listen to several, pick one natural in both English and Gulf Arabic.

### 3b: Verification and cards

```text
Plan first, then wait for my OK.

We are doing Phase 3b. Follow PRD sections 6.1 and 6.2.

1. Add the phone-shaped "Gulf Demo Bank app" panel to /call, and the verification tools from PRD 6.1 (request_verification, check_verification). The panel shows Approve / Deny.
2. Add the card endpoints and tools from PRD 6.2. Each checks the right verification level on the server.
3. Organise the agent as an ElevenLabs workflow: Front Desk node plus Cards node (card tools only). Keep the workflow in the project files.
4. Add create_handoff_ticket from PRD 6.1.
5. Add ElevenLabs tests: a tool-call test that "freeze my card" calls freeze_card for the right card; a scenario test that Noor refuses to read out a full card number.
```

**Checks**
- [ ] As Ahmed, "freeze my card" → approval prompt → Noor confirms the card → /backoffice shows it frozen
- [ ] Deny the approval: Noor does nothing and explains why
- [ ] "Can I talk to a person?" creates a handoff ticket
- [ ] Both tests pass

---

## Phase 4: Transaction memory

**Goal:** Noor finds and explains past transactions from vague descriptions. (PRD 6.3)

```text
Plan first, then wait for my OK.

We are doing Phase 4. Follow PRD section 6.3 exactly, including the acceptance criteria.

1. Add the endpoints and tools listed in PRD 6.3.
2. Add a Transactions node to the workflow with those tools and prompt rules that meet every acceptance criterion in 6.3.
3. Add tests: "what are my subscriptions" calls list_recurring_payments; "what was the 300 dirham charge last week" calls search_transactions with a sensible date and amount range.
```

**Checks**
- [ ] "What do I pay every month?" lists Netflix, Spotify and the gym with its start date
- [ ] "Was I charged twice anywhere?" finds the duplicate
- [ ] Asking about the Carrefour charge names Fatima's card
- [ ] Vague dates ("last weekend") still find the right charge

---

## Phase 5: Fraud and disputes

**Goal:** the hero journey. (PRD 6.4)

```text
Plan first, then wait for my OK.

We are doing Phase 5. Follow PRD section 6.4 exactly, including the behaviour steps and acceptance criteria.

1. Add the endpoints and tools listed in PRD 6.4. Store the 30-day refund period as a config value.
2. Add a Fraud node to the workflow. It can use the Transactions tools to rule out family cards and subscriptions first. Use a calmer, slower delivery for this node.
3. Add simulation tests:
   - Panicked caller about yesterday's declined attempt → card frozen, no dispute, told no money left.
   - Caller mentions "someone from the bank asked for my code" → escalate_to_fraud_team called.
   - Priya: "my card was declined in Istanbul, it was me" → confirm_genuine called.
4. Add a "time to card frozen" timer to /call.
```

**Checks**
- [ ] Ahmed's alert: frozen, told no money left, under 60 seconds
- [ ] Priya's decline: unblocked, told to retry
- [ ] Scam sign: escalated immediately
- [ ] Dispute and ticket show in /backoffice with the case number Noor said

---

## Phase 6: Everyday servicing

**Goal:** the requests that clog call centres. (PRD 6.5)

```text
Plan first, then wait for my OK.

We are doing Phase 6. Follow PRD section 6.5.

1. Add the endpoints and tools listed in PRD 6.5 and a Servicing node. Use a short list of fictional branches with time slots.
2. Every request returns a reference number Noor reads out and shows in /backoffice.
3. Add a tool-call test for the cheque book request.
```

**Checks**
- [ ] A 25-leaf cheque book is ordered with a reference number
- [ ] Changing email triggers a new approval and reads the address back
- [ ] Mixed requests in one call work

---

## Phase 7: Account opening

**Goal:** a prospect gets from "I want an account" to a submitted application. (PRD 6.6)

```text
Plan first, then wait for my OK.

We are doing Phase 7. Follow PRD section 6.6.

1. Write the three fictional product sheets and upload them to the agent's knowledge base.
2. Add the tools in PRD 6.6 and an Account Opening node reachable without verification. request_documents is a client tool that opens an upload panel in the app panel on /call (fake files are fine).
3. End with a simulated "finish your identity check in the app" button.
4. Add a scenario test: "which account will make me the most money?" gets a factual comparison, not advice.
```

**Checks**
- [ ] As Maria: recommended account, two files uploaded, application visible in /backoffice
- [ ] No financial advice given

---

## Phase 8: Harden, measure, polish

**Goal:** robust enough for a hiring manager; evidence for the field report. (PRD 10, 11, 12)

```text
Plan first, then wait for my OK.

We are doing Phase 8. Follow PRD sections 10, 11 and 12.

1. Add Arabic as a supported language. Help me write 20 test lines in Gulf Arabic and mixed Arabic-English across cards, transactions and fraud, and a simple sheet to record results.
2. Make sure every journey has simulation and tool-call tests, runnable from the CLI. Run each several times.
3. Set up success criteria and data collection in the agent's analysis settings: resolved, journey type, language, escalated.
4. Review prompts and endpoints for anything that could skip verification or leak data. Try to break it; fix what you find.
5. Polish /call for screen recording.
6. Write a README: what it is, architecture, how to run it, results.
```

**Checks**
- [ ] All tests pass on repeat runs
- [ ] 20 language lines tested and recorded
- [ ] A friend can use /call without help

---

## After Phase 8: the demo video and field report

### 90-second video (record a real call, /call and /backoffice side by side)
1. **0:00–0:10** The problem on screen: "An alert for a payment you didn't make. Today: hold music and a dispute form."
2. **0:10–0:45** Ahmed starts in Arabic, switches to English, approves in the app, card frozen, timer stops, back office updates.
3. **0:45–1:05** "What's this Carrefour charge?" → "That was on Fatima's card." Then: "What am I paying every month?"
4. **1:05–1:20** Quick cuts: cheque book; scam signal escalated.
5. **1:20–1:30** Architecture and your name.

Do two or three takes; keep the most natural, not the most perfect.

### One-page field report
- **What worked:** time to freeze, resolution rate, test pass rates
- **Where it struggled:** Gulf Arabic and code-switching results, mispronunciations, turn-taking
- **What you'd ask ElevenLabs to build:** 2–3 evidence-backed requests
- **How you'd sell it to a UAE bank:** business case, regulation, first pilot

Publish both with the GitHub link on LinkedIn; link them in the first line of applications.

---

## Troubleshooting

| Symptom | Likely cause | Tell Claude Code |
|---|---|---|
| Noor says she can't access the system | Tool URL or secret header wrong | "Tool calls are failing. Check the tool URLs point to my live Vercel site and the secret matches in ElevenLabs and Vercel." |
| Works locally, not online | Variable missing in Vercel | "Compare .env.local names with Vercel's environment variables; tell me what's missing." |
| Noor makes things up | Prompt or tool description unclear | In ElevenLabs call history, "Create test from this conversation", then ask Claude Code to fix the prompt until it passes |
| Noor talks too long | Prompt not strict enough | "Max two sentences per turn unless the caller asks for detail." |
| Microphone won't start | Browser permission | Allow the microphone in the address bar |
| Dashboard change disappeared | CLI pushed an older file | "Pull the latest agent settings from ElevenLabs before changing anything." |
