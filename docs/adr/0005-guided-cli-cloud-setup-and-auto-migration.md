# ADR-0005: Guided CLI Cloud Setup and Auto-Migration (`orch setup:cloud`)

## Context
In "The Whole Factory" architecture, the cloud layer consists of **Neon** (serverless Postgres database & webhook inbox), **Vercel** (Hobby hosting for `/api/webhooks` and the remote Live Panel), and **Linear/GitHub webhooks**.
Requiring users to manually run SQL queries or manage heavy Infrastructure-as-Code (Terraform) introduces setup friction and violates our zero-friction template principles.

## Decision
1. **Interactive CLI Helper (`orch setup:cloud`)**:
   Provide a guided setup command: `node ./orchestrator/bin/orch.mjs setup:cloud` that:
   - Prompts for `NEON_DATABASE_URL` (free tier connection string from https://console.neon.tech).
   - Automatically executes the idempotent DDL migration script (`webhook_inbox` + `factory_events` tables) over stateless HTTP.
   - Verifies the connection and writes `NEON_DATABASE_URL` to `.env.local` (gitignored).
2. **Vercel Hobby Deployment**:
   - Uses Vercel's standard configuration (`vercel.json`) pointing to pre-bundled serverless endpoints (`/api/webhooks/linear`, `/api/webhooks/github`, `/api/events`).
   - Automatically outputs the exact public webhook endpoints to register in Linear/GitHub:
     - `https://<your-project>.vercel.app/api/webhooks/linear`
     - `https://<your-project>.vercel.app/api/webhooks/github`
3. **No Paid IaC Tools**:
   No Terraform, Pulumi, or paid cloud management dependencies required.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: Setup completed in under 2 minutes; automatic schema migrations ensure zero manual SQL console typing; preserves 100% $0 free tier cost structure.
- **Trade-off**: Requires the developer to manually create the free projects in Neon and Vercel web consoles once and copy the connection string.
