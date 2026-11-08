# Progress Log

Read this at the start of every session. Current phase, decisions made, open questions, and anything waiting on Yousuf.

## Current status

**Phase 1: Project skeleton, online** — Done, approved by Yousuf. Moving to Phase 2 (mock bank and back office): plan written, waiting on his approval to build.

## Decisions made

- **create-next-app options:** TypeScript, App Router, ESLint, Tailwind, no `src/` directory, `@/*` import alias, npm as package manager. Tailwind wasn't strictly required for an empty homepage but will be needed for `/call` and `/backoffice` in later phases, so it's in from the start.
- **Project folder name vs. npm package name:** `F:\GBA_Voice` has an uppercase letter, which `create-next-app` rejects as an npm package name. Scaffolded the app in a scratch folder under a valid lowercase name (`gulf-demo-bank`) and copied the generated files into `F:\GBA_Voice`, keeping the existing `CLAUDE.md`, `PRD.md`, `BUILD_PLAN.md`, and `.claude/` in place. The `package.json` "name" field is `gulf-demo-bank`; the folder name itself doesn't matter to Next.js or Vercel.
- **`.env.local`:** left for Yousuf to create by hand (the sandbox blocks me from writing to it, which also matches the CLAUDE.md rule not to read or edit it). `.env.example` lists the variable names only.
- **First push to `main`:** per Yousuf's explicit instruction (the GitHub repo is empty and he wants Vercel to import from `main`). From Phase 2 onward, back to branch-per-phase with his approval before merging.

## Open questions / waiting on Yousuf

- Run `elevenlabs auth login` himself (needs interactive browser login).
- Create `.env.local` with his real `ELEVENLABS_API_KEY` once he has one (not needed until Phase 3, but the file should exist locally so Next.js doesn't warn).
- Import the GitHub repo into Vercel (he said he'd do this himself).
- Add the Postgres database (Vercel Storage tab) before Phase 2 can connect to it.

## Phase history

- Phase 1 (Project skeleton, online): started and finished 2026-11-08. Approved by Yousuf. Next.js app on `main` at github.com/Yousuf1994/GulfBankVoice; ElevenLabs skills and CLI installed; home page placeholder live.
