# ADR-0009: Third-Party Cloud Services Setup & Ingestion Architecture (Neon, Vercel, Linear, GitHub)

## Context
The Agent Factory template connects external intake sources (Linear tickets, GitHub Issues) with an orchestration runner running locally on macOS and a remote Live Board panel on Vercel, backed by a Neon serverless Postgres database. 

We require a setup process that:
1. Retains zero paid API keys and $0 free tier eligibility across all cloud services.
2. Avoids heavy Infrastructure-as-Code (Terraform, Pulumi) or global CLI tool dependencies (`vercel`, `neonctl`).
3. Handles secret distribution securely and ergonomically.
4. Transparently handles serverless cold-start latency (Neon scale-to-zero wakeups).
5. Provides bidirectional feedback to source tickets without hard dependency on paid tokens.

## Decision

### 1. Guided Zero-Dependency CLI (`orch setup:cloud`)
- **Initial Service Creation**: Developer creates free-tier projects via standard web consoles on [Neon](https://console.neon.tech) and [Vercel](https://vercel.com).
- **Interactive Provisioning**: `orch setup:cloud` prompts for `NEON_DATABASE_URL`, tests connectivity over HTTP, executes idempotent SQL DDL migrations, and generates cryptographically secure 256-bit HMAC secrets for Linear and GitHub webhooks.
- **Local Persistence**: Writes verified credentials to `.env.local` (strictly gitignored).

### 2. Ergonomic Vercel Environment Export
- `orch setup:cloud` outputs a formatted environment variable block and generates `.env.production.local`.
- If on macOS and confirmed by the user, copies the entire block to the system clipboard via `pbcopy` for 1-click paste into Vercel **Project Settings > Environment Variables**.
- Variables:
  ```env
  NEON_DATABASE_URL=postgres://...
  LINEAR_WEBHOOK_SECRET=lin_whsec_...
  GITHUB_WEBHOOK_SECRET=gh_whsec_...
  FACTORY_ADMIN_TOKEN=orch_sec_...
  ```

### 3. Stateless Idempotent Schema Management over HTTP
- Neon schema is managed via `orchestrator/src/engine/neon-sync.mjs` executing raw SQL over Neon's serverless HTTP API (`POST https://${host}/sql`).
- Idempotent `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` statements ensure safe re-runs during `orch setup:cloud` and `orch doctor`.
- No migration tracking tables or heavy ORM dependencies (Prisma/Drizzle) are required.

### 4. Resilient Webhook Intake on Vercel
- **Endpoints**:
  - `/api/webhooks/linear`
  - `/api/webhooks/github`
- **Verification**: Timing-safe buffer HMAC comparison (`Linear-Signature` and `X-Hub-Signature-256`).
- **Idempotency**: All incoming events are inserted into `webhook_inbox` with `ON CONFLICT (delivery_id) DO NOTHING`.
- **Cold-Start Resilience**: The serverless route implements up to 3 quick retries (500ms, 1000ms, 2000ms) to transparently absorb Neon's 1.5–2.5s scale-to-zero cold boot without returning HTTP 500 to webhook providers.

### 5. Outbound Ticket Feedback & Clarifications
- **GitHub Issues**: Uses local authenticated GitHub CLI (`gh issue comment <id>`) with zero extra keys under `@cesarchavezcal`.
- **Linear**: If `LINEAR_API_KEY` is present in `.env.local`, posts clarifications directly to the ticket via Linear's GraphQL API.
- **Graceful Local Fallback**: If `LINEAR_API_KEY` is absent, pauses the ticket in `state.json` (`status: "waiting_for_human"`), outputs the question in the terminal and Mission Control UI (`http://localhost:4321`), and awaits user input via `orch ticket:reply "<answer>"`.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: 100% $0 cost; setup completes in <3 minutes; no CLI installation friction; cold-starts do not drop incoming webhooks; developer can use GitHub issues completely key-free.
- **Trade-off**: Requires opening browser tabs to create initial Neon and Vercel accounts and pasting the environment block once into Vercel UI.
