# Specification: Third-Party Cloud Services Setup & Ingestion Engine (Neon, Vercel, Linear, GitHub)

- **Author**: `@cesarchavezcal`
- **Repository**: `cesarchavezcal/agent-factory`
- **Specification ID**: `SPEC-002`
- **Status**: Locked & Approved
- **ADR References**:
  - [ADR-0005: Guided CLI Cloud Setup and Auto-Migration (`orch setup:cloud`)](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0005-guided-cli-cloud-setup-and-auto-migration.md)
  - [ADR-0006: Cryptographic HMAC Webhook Verification](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0006-cryptographic-hmac-webhook-verification.md)
  - [ADR-0007: Neon Scale-to-Zero Adaptive Polling Strategy](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0007-neon-scale-to-zero-adaptive-polling.md)
  - [ADR-0008: Focus-Aware SWR Polling for Vercel Live Panel](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0008-focus-aware-swr-polling-for-vercel-panel.md)
  - [ADR-0009: Third-Party Cloud Services Setup & Ingestion Architecture](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0009-third-party-cloud-services-setup-and-inbox-architecture.md)

---

## 1. Goal & Non-Goals

### Goals
1. **Zero-CLI Dependency Setup (`orch setup:cloud`)**: Provide an interactive wizard in `orchestrator/bin/orch.mjs` that connects to Neon Postgres over HTTP, applies the idempotent schema DDL without migration tables, and generates high-entropy cryptographic HMAC secrets.
2. **1-Click Vercel Deployment & Secret Sync**: Generate `.env.production.local` and optionally copy formatted environment variables to the macOS clipboard (`pbcopy`) for immediate pasting into Vercel Project Settings.
3. **Resilient Serverless Webhook Ingestion (`api/webhooks/linear.mjs` & `api/webhooks/github.mjs`)**:
   - Verify incoming payloads with timing-safe HMAC buffers (`Linear-Signature` and `X-Hub-Signature-256`).
   - Deduplicate events via `ON CONFLICT (delivery_id) DO NOTHING` into Neon `webhook_inbox`.
   - Implement a 3-attempt exponential backoff retry to transparently absorb Neon's 1.5–2.5s scale-to-zero cold boots without returning HTTP 500.
4. **Bidirectional Clarification Engine (`ticket-feedback.mjs`)**:
   - Post questions back to GitHub Issues via authenticated local `gh issue comment <id>` under `@cesarchavezcal` (zero extra keys).
   - Post to Linear tickets via Linear GraphQL if `LINEAR_API_KEY` is present.
   - Gracefully fallback to pausing execution (`status: "waiting_for_human"`) in `.orchestrator/state.json` and prompt via terminal/UI (`orch ticket:reply`).

### Non-Goals
1. **No Heavy Cloud Tooling**: No `neonctl`, `vercel` global npm packages, Terraform, or Docker requirements.
2. **No Paid Relational ORMs**: No Prisma, Drizzle ORM, or Knex dependencies in runtime; all migrations are raw idempotent SQL DDL over HTTP.
3. **No Unauthenticated Webhooks**: No webhook route will accept requests with invalid, malformed, or missing HMAC signatures.

---

## 2. Target Files & Component Architecture

```
agent-factory/
├── api/
│   └── webhooks/
│       ├── linear.mjs                           # Serverless endpoint for Linear webhooks
│       └── github.mjs                           # Serverless endpoint for GitHub webhooks
├── orchestrator/
│   ├── bin/
│   │   └── orch.mjs                             # Adds setup:cloud and ticket:reply subcommands
│   └── src/
│       └── engine/
│           ├── config.mjs                       # Validates cloud env variables & secrets
│           ├── neon-sync.mjs                    # HTTP DDL migration engine & connection verify
│           └── ticket-feedback.mjs              # Outbound comments via gh CLI & Linear GraphQL
├── .env.example                                 # Template for cloud environment variables
└── docs/
    └── specs/third-party-cloud-setup.md         # This specification
```

---

## 3. Data & State Contracts

### A. Neon Webhook Inbox Schema (`neon-sync.mjs`)
```sql
CREATE TABLE IF NOT EXISTS webhook_inbox (
  delivery_id VARCHAR(128) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  claimed_by VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_webhook_inbox_status ON webhook_inbox (status, received_at);

CREATE TABLE IF NOT EXISTS factory_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### B. Environment Contracts
```env
# Local runner config (.env.local)
NEON_DATABASE_URL=postgres://user:pass@ep-cool-project.us-east-2.aws.neon.tech/neondb?sslmode=require
LINEAR_WEBHOOK_SECRET=lin_whsec_0123456789abcdef0123456789abcdef
GITHUB_WEBHOOK_SECRET=gh_whsec_0123456789abcdef0123456789abcdef
LINEAR_API_KEY=lin_api_optional_key_here

# Remote Vercel Project Environment (.env.production.local)
NEON_DATABASE_URL=postgres://user:pass@ep-cool-project.us-east-2.aws.neon.tech/neondb?sslmode=require
LINEAR_WEBHOOK_SECRET=lin_whsec_0123456789abcdef0123456789abcdef
GITHUB_WEBHOOK_SECRET=gh_whsec_0123456789abcdef0123456789abcdef
FACTORY_ADMIN_TOKEN=orch_sec_0123456789abcdef
```

### C. Webhook Ingestion Contract (`api/webhooks/*`)
- **Linear Endpoint**: `POST /api/webhooks/linear`
  - Header: `Linear-Signature: <hex_digest>`
  - HMAC: `crypto.createHmac('sha256', process.env.LINEAR_WEBHOOK_SECRET).update(rawBody).digest('hex')`
  - Idempotency Key: `headers['linear-delivery'] || payload.data.id + '-' + payload.action`
- **GitHub Endpoint**: `POST /api/webhooks/github`
  - Header: `X-Hub-Signature-256: sha256=<hex_digest>`
  - HMAC: `crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest('hex')`
  - Idempotency Key: `headers['x-github-delivery']`

---

## 4. Execution Protocols & Verification

### Mandatory Runtime Verification Commands (`verifyCmd`)
```bash
# 1. Cloud CLI Setup & Invariant Validation
node ./orchestrator/bin/orch.mjs doctor

# 2. Automated Test Suite (Cloud Ingestion & Webhook HMAC Suite)
npm test

# 3. Simulated Webhook Delivery & DDL Check
node ./orchestrator/bin/orch.mjs demo
```
