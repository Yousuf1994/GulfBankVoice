# PRD: Noor, the Gulf Demo Bank Voice Agent

| | |
|---|---|
| Owner | Yousuf |
| Status | Draft v1 |
| Last updated | 8 Nov 2026 |
| Platform | ElevenLabs Agents (ElevenAgents) |
| Related files | `BUILD_PLAN.md` (how to build it), `CLAUDE.md` (instructions for Claude Code) |

---

## 1. Summary

Noor is a voice agent for a fictional UAE bank, **Gulf Demo Bank**. A customer presses "Talk to us" on a web page and speaks to one calm, human-sounding agent that can handle almost anything they would phone a bank about: freezing a card, explaining a charge they don't recognise, filing a fraud dispute, ordering a cheque book, or opening a new account.

Noor doesn't just answer questions. She takes real actions in a mock core banking system, so every freeze, dispute and request changes data that can be watched live on a back office screen.

The product is a portfolio project designed to demonstrate, to ElevenLabs, how their Agents platform can be deployed for a high-stakes, multilingual enterprise use case in the Gulf.

---

## 2. Problem

### 2.1 Banking support is slow when it matters most

The clearest example: a customer gets an SMS about a card transaction they didn't make. Today they call the bank, navigate an IVR, wait on hold, and are told to fill in a dispute form and email it. UAE consumer columns are full of these stories, including investigations quoted at 120 days.

### 2.2 Chatbots fail people who are stressed

Bank text chatbots are menu trees with a text box. A panicking customer doesn't want to type, pick options, or be told to "visit the app". They want to say "I didn't do this, stop it" and hear a calm voice confirm it's handled.

### 2.3 The regulatory moment makes speed valuable

- From July 2025, UAE banks became fully liable to refund 3D Secure fraud authenticated with SMS OTP, and SMS/email OTPs had to be fully phased out by 31 March 2026.
- Central Bank consumer protection standards require unauthorised payments to be refunded after investigation or within 30 calendar days of notification, whichever is shorter (barring customer fraud or gross negligence).

Every minute between "customer notices" and "card frozen" is money the bank may have to refund.

### 2.4 Voice in fraud has a trust problem

Scammers impersonate banks by phone, and voice cloning makes this worse. A design where "an AI calls you about suspicious activity" trains customers to trust callers. Noor must be designed so it never weakens customer security habits.

---

## 3. Goals and non-goals

### Goals
1. Resolve the most common banking requests end to end by voice, without a human.
2. Get a caller from "I don't recognise this" to "card frozen" in under 60 seconds, and to "dispute filed" in under 2 minutes.
3. Make transaction history conversational: callers describe things vaguely and Noor finds them.
4. Handle English and Gulf Arabic, including switching mid-sentence.
5. Never collect secrets by voice; never take an action without confirmation and the right verification.
6. Produce evidence (metrics, test results, a field report) about where the platform performs well and where it struggles.

### Non-goals (v1)
- Phone numbers, WhatsApp, SMS (designed so they can be added later)
- Real bank systems, real customer data, real money movement
- Investment, loan or insurance advice
- Payments and transfers between accounts (high fraud risk; possible v2)

---

## 4. Users

### 4.1 Callers (demo personas)

| Persona | Profile | Languages | What they show |
|---|---|---|---|
| **Ahmed Al Mansoori** | Emirati, credit card holder, supplementary card for his wife Fatima | Arabic, English, code-switching | Fraud alert, family card recall, subscriptions, duplicate charge |
| **Priya Nair** | Indian expat, salary account, debit card, travels often | English, Hindi | False decline abroad ("that was me"), servicing |
| **Maria Santos** | Filipino expat, not yet a customer | English | Account opening without login |

### 4.2 Buyer (who would pay for this)
Heads of contact centre, digital banking and fraud operations at UAE retail banks. They care about call deflection, fraud losses, regulatory compliance, and customer satisfaction.

---

## 5. Product principles

1. **Verification matches risk.** No login for product questions or starting an application. In-app approval to read account data. A fresh approval to change anything.
2. **Never collect secrets by voice.** Noor never asks for a PIN, CVV, password, OTP or full card number, and says so when verifying.
3. **Inbound or app-initiated only.** Noor never cold-calls a customer asking them to do something.
4. **Speed is the safety feature.** In fraud cases, freeze first, explain second.
5. **Confirm before acting.** Every change is read back and confirmed out loud.
6. **One voice, several specialists.** The caller hears one persona; specialist sections handle each domain.
7. **Everything is logged.** Every tool call and outcome is auditable.
8. **Explain, don't advise.** Noor compares products factually but never recommends investments or says what's "best for your money".
9. **Short turns.** This is voice: one or two sentences per turn unless the caller asks for detail.

---

## 6. Functional requirements

Each capability lists user stories, tools Noor uses, and acceptance criteria.

### 6.1 Front Desk (greeting, verification, routing)

**Stories**
- As a caller, I'm greeted by name (when known) and asked how Noor can help.
- As a caller, I approve a prompt in my bank app instead of answering security questions.
- As a caller, I can ask for a human at any time.

**Tools**
| Tool | Purpose |
|---|---|
| `request_verification(customer_id, level)` | Sends an approval prompt to the (simulated) bank app. Level 1 = read, level 2 = change. |
| `check_verification(verification_id)` | Returns pending / approved / denied / expired. Level 2 expires after 5 minutes. |
| `create_handoff_ticket(reason, summary, priority)` | Logs a callback request for a human with full context. |

**Acceptance**
- Identity (customer_id, customer_name) comes from the authenticated page session as dynamic variables, never from what the caller says.
- If approval is denied or expires, Noor takes no action and explains why.
- Verification is enforced by the server, not only by the prompt.

### 6.2 Cards

**Stories**
- Freeze or unfreeze my card temporarily.
- Block my card permanently because it's lost, stolen or damaged, and get a replacement.
- Request a new card or an additional card.
- Unblock my card after a false fraud decline.

**Tools:** `list_cards`, `freeze_card`, `unfreeze_card`, `block_card(reason)`, `request_replacement_card`, `request_new_card`

**Acceptance**
- Noor confirms which card (last 4 digits and holder) before acting.
- The change appears in the back office within 3 seconds.
- A permanent block always offers a replacement.

### 6.3 Transaction memory

The differentiator: Noor remembers the account history and talks it through like a person.

**Stories**
- "What was that 300 dirham charge last Tuesday?"
- "I don't recognise this Carrefour payment." → "That was on Fatima's card on the 3rd. Does that ring a bell?"
- "What am I paying every month?" → subscriptions, with start dates.
- "Was I charged twice anywhere?"
- "How much did I spend on restaurants this month?"

**Tools:** `search_transactions(date_from, date_to, amount_min, amount_max, merchant_text, card_last4, status)`, `get_transaction(id)`, `list_recurring_payments()`, `spending_summary(period, group_by)`, `find_duplicate_charges(period)`

**Acceptance**
- Vague dates and amounts ("last weekend", "around 300") are turned into sensible search ranges.
- When several transactions match, Noor names the top 2 or 3 and asks which.
- Dates and amounts are spoken naturally ("Tuesday the 3rd, around 8 in the evening, 312 dirhams").
- Never reads more than 3 items without offering more.
- Supplementary card charges name the cardholder.

### 6.4 Fraud and disputes (hero journey)

**Stories**
- "I got a message about a payment I didn't make."
- "My card was declined abroad, but it was me."
- "Someone from the bank called and asked for my code." (scam in progress)
- "What's happening with my dispute?"

**Tools:** `get_recent_alerts(customer_id)`, `report_unrecognised(transaction_ids, freeze_card)`, `confirm_genuine(transaction_id)`, `get_dispute_status(case_id)`, `escalate_to_fraud_team(reason, summary)`

**Behaviour**
1. One short reassuring sentence, then act.
2. Check first whether it was a supplementary card or a forgotten subscription.
3. **Declined attempt:** no money left; say so clearly; offer a freeze; no dispute needed.
4. **Posted transaction:** freeze, file dispute, read out case number and refund-by date (30 calendar days from today), explain next steps.
5. **"That was me":** mark genuine, lift the block, tell them to retry.
6. **Scam warning signs** (shared a code, "bank" caller on another line, screen-sharing app installed, being rushed to move money): escalate immediately and tell them to hang up on the other caller.

**Acceptance**
- Card frozen within 60 seconds of the caller stating the problem.
- Dispute filed within 2 minutes.
- Every scam warning sign leads to `escalate_to_fraud_team`.

### 6.5 Everyday servicing

**Stories:** order a cheque book; get a statement; update email, mobile or address; book a branch appointment; log a complaint.

**Tools:** `request_cheque_book(account_id, leaves, delivery)`, `send_statement(account_id, month)`, `update_contact_details(field, new_value)`, `book_branch_appointment(branch, date_time, purpose)`, `log_complaint(category, description)`

**Acceptance**
- Every request returns a reference number, which Noor reads out.
- Contact detail changes need a fresh level 2 approval and are read back before saving.
- Multiple requests in one call work.

### 6.6 Account opening

**Stories:** "I want to open an account." "Which account suits me?" "What documents do I need?" "What's the status of my application?"

**Tools:** `check_eligibility(residency_status, monthly_salary_band, employment_type)`, `start_application(name, mobile, email, product)`, `request_documents(application_id)` (client tool: opens an upload panel on the page), `get_application_status(application_id)`

**Knowledge base:** three fictional product sheets (Everyday Current Account, Salary Account, Savings Account): minimum balance, fees, who it suits, documents needed.

**Acceptance**
- No verification needed to start.
- Products are compared factually from the knowledge base only.
- Ends with a simulated "finish your identity check in the app" step.

---

## 7. Conversation design

| Aspect | Specification |
|---|---|
| Persona | Noor: warm, calm, concise; sounds like an experienced Dubai bank officer |
| Voice | Chosen by ear from the ElevenLabs library; must sound natural in English and Gulf Arabic |
| Languages | English and Gulf Arabic in v1; follow the caller when they switch; Hindi and Urdu later |
| Turn length | 1 to 2 sentences unless asked for detail |
| Tone by situation | Calmer and slower in fraud; brisk in servicing |
| Numbers | Amounts in dirhams, dates in natural speech, card numbers only as last 4 digits |
| First message | Short greeting with the bank name and the caller's first name |

### Agent structure (ElevenLabs workflow)
- **Front Desk** node: greet, verify, route
- Specialist nodes: **Cards**, **Transactions**, **Fraud and disputes**, **Servicing**, **Account opening**
- Each node has only the tools it needs.

---

## 8. Experience on the web page (`/call`)

- Persona picker (simulates who is logged in)
- "Talk to us" button
- Live transcript
- Tool activity panel (each tool call and its result)
- Phone-shaped "Gulf Demo Bank app" panel for approvals, document upload and the identity check
- For demos: a "time to card frozen" timer

Plus a `/backoffice` page: each customer's cards, transactions, disputes, requests and audit log, refreshing every 2 seconds, with a "Reset demo data" button.

---

## 9. Mock bank data model

| Table | Key fields |
|---|---|
| customers | name, preferred languages, email, mobile, address |
| accounts | type (current, salary, savings), balance AED, masked IBAN |
| cards | primary or supplementary, holder name and relationship, last 4, credit or debit, status (active, frozen, blocked), limits |
| transactions | date and time, amount AED, merchant, category, city and country, online or in-store, card, status (approved, declined, pending, posted), recurring flag |
| disputes | case number, transactions, status, refund-by date |
| service_requests | type, details, reference number, status |
| verifications | level, status, created and expiry times |
| applications | prospect details, product, documents, status |
| handoff_tickets | reason, summary, priority |
| audit_log | every tool call: who, what, when, result |

Seed data uses dates relative to today so the demo always looks current.

---

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Latency | Natural turn-taking; tool calls respond in under 1 second |
| Security | ElevenLabs API key only on the server; calls start via signed URL; tool endpoints require a secret header; verification checked server-side |
| Privacy | Fictional data only; no full card numbers anywhere |
| Reliability | Tool failures produce a graceful spoken fallback and a handoff offer |
| Auditability | Every action written to audit_log |
| Testability | Each journey has ElevenLabs simulation tests and tool-call tests runnable from the CLI |

---

## 11. Success metrics

| Metric | Target |
|---|---|
| Time to card frozen (fraud journey) | < 60 s |
| Time to dispute filed | < 2 min |
| Journeys resolved without human handoff | > 80% of test scenarios |
| Correct escalation on scam signals | 100% of test scenarios |
| Tool-call test pass rate (repeat runs) | > 95% |
| Gulf Arabic and code-switching test lines handled correctly | Measure and report (baseline) |

---

## 12. Risks and open questions

| Risk / question | Mitigation or next step |
|---|---|
| Gulf Arabic and code-switching accuracy may be weaker than English | Measure on 20 test lines; report honestly in the field report |
| Model may act without proper verification | Enforce verification on the server, not just the prompt; add tests |
| Long transaction lists are hard to follow by voice | Top 3 rule; clarifying questions |
| Hallucinated product facts | Products only from the knowledge base; scenario tests |
| Refund rule details may change | Keep "30 calendar days" as a config value; verify current regulation before any real pitch |

---

## 13. Future (v2+)

Phone number via Twilio or SIP; WhatsApp follow-ups (dispute summaries, document upload); Hindi, Urdu and Tagalog; proactive dispute status updates (app-initiated only); transfers and bill payments with strong step-up.

---

## 14. Sources

- CBUAE OTP phase-out and bank liability: [facephi.com](https://facephi.com/en/compliance/uae/), [Khaleej Times](https://www.khaleejtimes.com/uae/no-more-otps-banking-new-2026-payment-system-guide)
- 30-day refund standard: [Emirates 24/7 on Sanadak ruling](https://www.emirates247.com/uae/uae-bank-ordered-to-refund-customer-after-failing-to-prove-he-authorised-digital-payment-sanadak-rules/7227)
- Customer dispute experiences: [Gulf News](https://gulfnews.com/uae/how-to-recover-the-disputed-transaction-1.1541851909831), [The National](https://www.thenationalnews.com/business/money/2023/05/11/the-debt-panel-my-bank-is-ignoring-a-fraudulent-transaction-on-my-card)
- ElevenLabs Agents docs: [Workflows](https://elevenlabs.io/docs/eleven-agents/customization/agent-workflows), [Testing](https://elevenlabs.io/docs/agents-platform/customization/agent-testing), [Tools](https://elevenlabs.io/docs/conversational-ai/customization/tools)
