# Progress Log

Read this at the start of every session. Current phase, decisions made, open questions, and anything waiting on Yousuf.

## Current status

**Phase 2: Mock bank and back office** — built on branch `phase-2-mock-bank`, pushed, not yet merged to `main`. Waiting on Yousuf to add a Postgres database and test it, then approve the merge.

## Decisions made

- **create-next-app options:** TypeScript, App Router, ESLint, Tailwind, no `src/` directory, `@/*` import alias, npm as package manager. Tailwind wasn't strictly required for an empty homepage but will be needed for `/call` and `/backoffice` in later phases, so it's in from the start.
- **Project folder name vs. npm package name:** `F:\GBA_Voice` has an uppercase letter, which `create-next-app` rejects as an npm package name. Scaffolded the app in a scratch folder under a valid lowercase name (`gulf-demo-bank`) and copied the generated files into `F:\GBA_Voice`, keeping the existing `CLAUDE.md`, `PRD.md`, `BUILD_PLAN.md`, and `.claude/` in place. The `package.json` "name" field is `gulf-demo-bank`; the folder name itself doesn't matter to Next.js or Vercel.
- **`.env.local`:** left for Yousuf to create by hand (the sandbox blocks me from writing to it, which also matches the CLAUDE.md rule not to read or edit it). `.env.example` lists the variable names only.
- **First push to `main`:** per Yousuf's explicit instruction (the GitHub repo is empty and he wants Vercel to import from `main`). From Phase 2 onward, back to branch-per-phase with his approval before merging.
- **Database driver:** started with `@vercel/postgres` per the build plan's wording, but it's deprecated (Vercel's own install warning pointed to Neon's own SDKs instead). Switched to plain `pg` reading a `POSTGRES_URL` connection string — works with any Postgres, including the Neon database Vercel's Storage tab provisions, and isn't tied to a deprecated package.
- **Lazy database connection:** `lib/db.ts` only reads env vars and opens the connection pool on the first real query, not at import time. `next build` imports every route module to collect its metadata, so a top-level throw-if-missing-env-var (my first attempt) broke the build before a database even exists. This also means `npm run build` succeeds today with no database configured — only *using* the endpoints needs one.
- **`/api/admin/snapshot` and `/api/admin/reset`:** not treated as "tool endpoints" needing `X-Tool-Secret`. They're page-internal (the `/backoffice` browser page calling its own backend), not something Noor's agent calls — the secret requirement in PRD.md section 10 is about the agent's tools (customer profile, accounts, cards), which are the ones that enforce it.
- **Secret check vs. DB check order:** if `TOOL_SECRET` isn't configured on the server at all, endpoints return 500 (server misconfigured) rather than 401, even when no header was sent. Verified 401 only fires once a real secret is configured and the caller's header doesn't match it.

## Open questions / waiting on Yousuf

- Run `elevenlabs auth login` himself (needs interactive browser login).
- Create `.env.local` with his real `ELEVENLABS_API_KEY` once he has one (not needed until Phase 3, but the file should exist locally so Next.js doesn't warn).
- Import the GitHub repo into Vercel (he said he'd do this himself).
- Add a Postgres database (Vercel Storage tab → Neon), then put its connection string in `.env.local` and Vercel's environment variables as `POSTGRES_URL`, and make up a `TOOL_SECRET` value for both places.
- Test `/backoffice` and the tool endpoints once the database exists, then approve merging `phase-2-mock-bank` into `main`.

## Phase history

- Phase 1 (Project skeleton, online): started and finished 2026-11-08. Approved by Yousuf. Next.js app on `main` at github.com/Yousuf1994/GulfBankVoice; ElevenLabs skills and CLI installed; home page placeholder live.
- Phase 2 (Mock bank and back office): started 2026-11-08, built and pushed to branch `phase-2-mock-bank`, not yet merged. Build, lint, and type-check all pass; API auth behavior (401/missing header) smoke-tested locally with a temporary test secret. Can't test the real database flow without Yousuf adding one.
