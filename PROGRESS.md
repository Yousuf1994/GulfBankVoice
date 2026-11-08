# Progress Log

Read this at the start of every session. Current phase, decisions made, open questions, and anything waiting on Yousuf.

## Current status

**Phase 2: Mock bank and back office** — Done, approved by Yousuf, merged into `main`.

## Decisions made

- **create-next-app options:** TypeScript, App Router, ESLint, Tailwind, no `src/` directory, `@/*` import alias, npm as package manager. Tailwind wasn't strictly required for an empty homepage but will be needed for `/call` and `/backoffice` in later phases, so it's in from the start.
- **Project folder name vs. npm package name:** `F:\GBA_Voice` has an uppercase letter, which `create-next-app` rejects as an npm package name. Scaffolded the app in a scratch folder under a valid lowercase name (`gulf-demo-bank`) and copied the generated files into `F:\GBA_Voice`, keeping the existing `CLAUDE.md`, `PRD.md`, `BUILD_PLAN.md`, and `.claude/` in place. The `package.json` "name" field is `gulf-demo-bank`; the folder name itself doesn't matter to Next.js or Vercel.
- **`.env.local`:** left for Yousuf to create by hand (the sandbox blocks me from writing to it, which also matches the CLAUDE.md rule not to read or edit it). `.env.example` lists the variable names only.
- **First push to `main`:** per Yousuf's explicit instruction (the GitHub repo is empty and he wants Vercel to import from `main`). From Phase 2 onward, back to branch-per-phase with his approval before merging.
- **Database driver:** started with `@vercel/postgres` per the build plan's wording, but it's deprecated (Vercel's own install warning pointed to Neon's own SDKs instead). Switched to plain `pg` reading a `POSTGRES_URL` connection string — works with any Postgres, including the Neon database Vercel's Storage tab provisions, and isn't tied to a deprecated package.
- **Lazy database connection:** `lib/db.ts` only reads env vars and opens the connection pool on the first real query, not at import time. `next build` imports every route module to collect its metadata, so a top-level throw-if-missing-env-var (my first attempt) broke the build before a database even exists. This also means `npm run build` succeeds today with no database configured — only *using* the endpoints needs one.
- **`/api/admin/snapshot` and `/api/admin/reset`:** not treated as "tool endpoints" needing `X-Tool-Secret`. They're page-internal (the `/backoffice` browser page calling its own backend), not something Noor's agent calls — the secret requirement in PRD.md section 10 is about the agent's tools (customer profile, accounts, cards), which are the ones that enforce it.
- **Secret check vs. DB check order:** if `TOOL_SECRET` isn't configured on the server at all, endpoints return 500 (server misconfigured) rather than 401, even when no header was sent. Verified 401 only fires once a real secret is configured and the caller's header doesn't match it.
- **Vercel environment variable names are case-sensitive.** Yousuf first added the secret as `Tool_secret`, which our code (looking for exact-case `TOOL_SECRET`) never saw. Lesson for future env vars: double-check the exact capitalization typed into Vercel matches `.env.example`.
- **The Neon-via-Vercel Postgres integration only granted `POSTGRES_URL` to Production and Preview, not Development**, and that scoping wasn't editable from the plain Environment Variables screen (grayed out, managed by the integration). Rather than dig further into the integration's own settings, we tested against a live Preview deployment instead of `npm run dev` locally — `vercel curl <path> --deployment <url>` authenticates through the logged-in Vercel CLI session and bypasses the deployment-protection login wall, so no local database connection was needed for Phase 2's own tests. **Still open:** local `npm run dev` can't reach the database until someone finds where to add Development to the Postgres integration's scope (or we add a second, manually-created `POSTGRES_URL` variable scoped to Development only, pointing at the same database) — not urgent since Phase 3 testing can likely keep using Preview deployments the same way.

## Open questions / waiting on Yousuf

- Run `elevenlabs auth login` himself (needs interactive browser login).
- Create `.env.local` with his real `ELEVENLABS_API_KEY` once he has one (not needed until Phase 3, but the file should exist locally so Next.js doesn't warn). Note: `.env.local` now exists (created via `vercel env pull`), so this just means adding one more line to it.
- Local dev (`npm run dev`) still can't reach the database — see the Postgres/Development scoping note above. Not blocking, since we've been testing via Preview deployments.

## Phase history

- Phase 1 (Project skeleton, online): started and finished 2026-11-08. Approved by Yousuf. Next.js app on `main` at github.com/Yousuf1994/GulfBankVoice; ElevenLabs skills and CLI installed; home page placeholder live.
- Phase 2 (Mock bank and back office): started and finished 2026-11-08. Approved by Yousuf, merged into `main`. Database schema, seed data, three tool endpoints, and `/backoffice` all verified against a live Vercel Preview deployment with a real Postgres (Neon) database — reset, auth checks (401 on missing/wrong secret, 200 on correct), and all three personas' data confirmed correct.
