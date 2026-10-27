# Specification: Portable T3 Code Multi-Model Agent Factory Template

- **Author**: `@cesarchavezcal`
- **Repository**: `cesarchavezcal/agent-factory`
- **Specification ID**: `SPEC-001`
- **Status**: Locked & Approved
- **ADR References**:
  - [ADR-0001: Local-First Default with Seamless Cloud Upgrade](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0001-local-first-default-with-cloud-upgrade.md)
  - [ADR-0002: Worktree Isolation & Deterministic Port Offsets](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0002-worktree-isolation-and-deterministic-ports.md)
  - [ADR-0003: Incremental Rework with Model Escalation](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0003-incremental-rework-and-model-escalation.md)
  - [ADR-0004: Configurable PR Delivery and Merge Gate](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0004-configurable-pr-delivery-and-merge-gate.md)
  - [ADR-0005: Guided CLI Cloud Setup and Auto-Migration (`orch setup:cloud`)](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0005-guided-cli-cloud-setup-and-auto-migration.md)
  - [ADR-0006: Cryptographic HMAC Webhook Verification](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0006-cryptographic-hmac-webhook-verification.md)
  - [ADR-0007: Neon Scale-to-Zero Adaptive Polling Strategy](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0007-neon-scale-to-zero-adaptive-polling.md)
  - [ADR-0008: Focus-Aware SWR Polling for Vercel Live Panel](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0008-focus-aware-swr-polling-for-vercel-panel.md)
  - [ADR-0009: Third-Party Cloud Services Setup & Ingestion Architecture](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0009-third-party-cloud-services-setup-and-inbox-architecture.md)

---

## 1. Goal & Non-Goals

### Goals
1. Provide a **reusable GitHub template repository** (`cesarchavezcal/agent-factory`) that any developer or team can clone and start using within 30 seconds.
2. Deliver a **100% Claude-free, zero-API-key** multi-model pipeline running exclusively through authenticated personal accounts in **T3 Code**:
   - **Google Antigravity**: `gemini-4-argon-high` (Planning), `gemini-3.8-flash-high` (Scouting & Runtime Verification).
   - **Cursor**: `composer-2.5` (Standard UI/CRUD Implementation).
   - **Grok**: `grok-4.7-build-fast` (Complex Backend Implementation) and `grok-4.7` (Adversarial Interrogation).
3. Implement the **2-Stage Assembly Line**:
   - **Stage 1 (Macro Planning)**: Driven by `mattpocock/skills` (`wayfinder` $\to$ `grill-me` / `grill-with-docs` $\to$ `to-spec` $\to$ `to-tickets`).
   - **Stage 2 (Micro Execution)**: Driven by Lauren Tan's `pstack` (`poteto-mode` $\to$ `how`/`why` $\to$ `tdd` $\to$ `show-me-your-work` $\to$ `interrogate` $\to$ `unslop`).
4. Support the full **\"The Whole Factory\"** outer-loop topology:
   - **Linear** (and GitHub Issues/Slack) pushes webhooks to **Neon Free Tier** via a $0 **Vercel Hobby** endpoint.
   - Mac runner claims tickets with rolling leases, creates isolated Git worktrees, executes via T3 Code, and opens Pull Requests on GitHub under **`@cesarchavezcal`**.
   - Dual live boards: locally at `http://localhost:4321` and remotely on **Vercel**.

### Non-Goals
1. **No External Paid AI SDKs**: No usage of `@anthropic-ai/sdk`, `openai`, `@google/genai`, or paid API keys.
2. **No Monolithic Working Directory Execution**: No parallel agents editing the same root working tree.
3. **No Unverified Diffs**: No ticket can be merged without an exit-code 0 runtime proof and passing cross-model interrogation.

---

## 2. Target Files & Component Architecture

```
agent-factory/
├── factory.config.json                          # Central project configuration & invariants
├── .env.example                                 # Optional Neon & Webhook configuration
├── docs/
│   ├── adr/                                     # ADR-0001 through ADR-0009
│   ├── planning/plan.md                         # Strategic roadmap
│   └── specs/agent-factory-v1.md                # This formal specification
├── .agents/skills/                              # Complete Matt Pocock + PStack skill catalog
│   ├── wayfinder/, ask-matt/, grill-me/, grill-with-docs/
│   ├── to-spec/, to-tickets/, code-review/, handoff/
│   ├── poteto-mode/, how/, why/, tdd/, show-me-your-work/
│   └── interrogate/, unslop/, no-comments/, blast-radius/, architect/, arena/, swarm/, figure-it-out/
├── .cursor/
│   ├── mcp.json                                 # Repo-relative MCP server registration
│   ├── agents/                                  # builder-composer.md, interrogator-grok.md
│   └── skills/                                  # Mirrored execution skills
├── orchestrator/
│   ├── package.json                             # Package definitions
│   ├── schema/factory.schema.json               # JSON schema for factory.config.json
│   ├── bin/
│   │   ├── orch.mjs                             # CLI (init, doctor, route, demo, ui, setup:cloud)
│   │   └── orch-mcp.mjs                         # stdio MCP server for T3 Code & Cursor
│   ├── src/
│   │   ├── engine/
│   │   │   ├── config.mjs                       # Runtime invariant validation
│   │   │   ├── router.mjs                       # Quota-aware model router
│   │   │   ├── state.mjs                        # Atomic state engine & PStack gatekeeper
│   │   │   └── neon-sync.mjs                    # Scale-to-zero Neon sync adapter
│   │   └── ui/
│   │       └── index.html                       # Live SSE Mission Control UI
│   └── tests/
│       └── factory.test.mjs                     # Automated verification test suite
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md                 # Standardized PR receipt template
    └── workflows/factory-ci.yml                 # GitHub Actions verification workflow
```

---

## 3. Data & State Contracts

### A. State Schema (`.orchestrator/state.json`)
```typescript
interface FactoryState {
  version: "1.0.0";
  githubAccount: "cesarchavezcal";
  sourceTicket: {
    provider: "linear" | "github";
    id: string;
    title: string;
    url: string;
    status: "ready" | "claimed" | "waiting_for_human" | "pr_opened" | "merged";
    pendingQuestion?: string;
  } | null;
  activeFeature: string | null;
  playbook: "feature" | "bugfix" | "refactor" | "prototype" | null;
  activePool: "AGY_FAST" | "AGY_PRO" | "CURSOR_WORK" | "GROK_WORK" | "GROK_AUDIT";
  activePhase: "scout" | "discovery" | "planning" | "execution" | "verification" | "delivery";
  contextBriefPath: ".orchestrator/context-brief.md";
  phases: Record<string, { status: string; provider: string; model: string; artifact: string | null }>;
  tickets: Array<{
    id: string;
    title: string;
    dependsOn: string[];
    files: string[];
    tags: string[];
    verifyCmd: string;
    status: "blocked" | "ready" | "coding" | "verifying" | "interrogating" | "rework" | "done" | "failed_gate";
    assignedPool: string;
    assignedProvider: string;
    assignedModel: string;
    routingReason: string;
    retryCount: number;
    maxRetries: number;
    reworkReason: string | null;
    verifyReceipt: {
      executedBy: "gemini-3.8-flash-high";
      provider: "antigravity";
      exitCode: number;
      stdout: string;
      stderr: string;
      timestamp: string;
    } | null;
    interrogateReceipt: {
      executedBy: "grok-4.7";
      provider: "grok";
      verdict: "PASS" | "FAIL";
      summary: string;
      objections: string[];
      timestamp: string;
    } | null;
  }>;
  handoff: any | null;
}
```

### B. Neon Telemetry Stream (`factory_events` table)
- Appended on every phase change, scout compression, ticket claim, verify receipt, and interrogation verdict.
- Consumed by **Vercel Panel** via stateless HTTP SWR polling or Edge SSE.

---

## 4. Model Routing & Execution Protocols

```
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: MACRO PLANNING (mattpocock/skills on Gemini 4 Argon)         │
│  Linear Ticket ──► /grill-me ──► /to-spec ──► /to-tickets (Tracer DAG) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Publishes DAG via orch_lock_spec_and_dag
┌───────────────────────────────────▼────────────────────────────────────┐
│  STAGE 2: MICRO EXECUTION (pstack on Composer 2.5 + Flash + Grok)      │
│  Unblocked Ticket                                                      │
│    ├─► /poteto-mode + /how + /tdd (Composer 2.5 / Grok 4.7 Fast)       │
│    ├─► show-me-your-work (Gemini 3.8 Flash verifyCmd: exit 0)          │
│    └─► /interrogate + /unslop (Grok 4.7 High: PASS)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Opens PR via link_pull_request
                                    ▼
                          GitHub PR (@cesarchavezcal)
```

1. **Phase 0 (Context Scout)**: `gemini-3.8-flash-high` scans repository and outputs `.orchestrator/context-brief.md` (budget-enforced: $\le 2048$ bytes).
2. **Phase 1 (Discovery & Spec)**: `gemini-4-argon-high` reviews context brief and Linear ticket. If ambiguous, calls `orch_ask_ticket` and yields. Otherwise runs `grill-me` $\to$ `to-spec`.
3. **Phase 2 (Playbook & DAG)**: `gemini-4-argon-high` runs `to-tickets` and calls `orch_lock_spec_and_dag` to register tracer-bullet DAG tickets with `verifyCmd`.
4. **Phase 3 (Implementation)**:
   - UI/React/CRUD tickets $\to$ **Cursor Composer 2.5** (`fastMode: true`).
   - DB/SQL/Concurrency/Algorithmic tickets $\to$ **Grok 4.7 Build-Fast**.
   - Work executes inside `.worktrees/<ticket-id>` with `PORT = BASE_PORT + slotIndex`.
5. **Phase 4a (Runtime Proof)**: **Gemini 3.8 Flash** runs `verifyCmd` and digests terminal output into `verifyReceipt` (`exitCode: 0`).
6. **Phase 4b (Adversarial Interrogation)**: **Grok 4.7** (`reasoningEffort: "high"`) audits diff against `spec.md` with zero tolerance for slop. If `FAIL`, triggers incremental rework and model escalation (up to `maxRetries: 2`).
7. **Phase 5 (Delivery)**: Pushes `feat/<ticket-id>`, creates GitHub PR under `cesarchavezcal`, embeds PStack receipts, and attaches T3 Code `link_pull_request` and `watch_pull_request`.

---

## 5. Mandatory Verification & Acceptance Criteria

```bash
# 1. Preflight Doctor Check
node ./orchestrator/bin/orch.mjs doctor
# Expected: All 5 checks OK (cesarchavezcal locked, Claude-free, 0 API keys, relative MCP, state ready)

# 2. Automated Test Suite
npm test
# Expected: 5 passing test suites (0 failures)

# 3. Live Simulation Demo
node ./orchestrator/bin/orch.mjs demo
# Expected: Traverses all 5 phases live, unlocks dependent DAG tickets, and delivers simulated PR under cesarchavezcal

# 4. Live Board UI Verification
node ./orchestrator/bin/orch.mjs ui
# Expected: Serves http://localhost:4321 with real-time SSE telemetry
```

---

## 6. Third-Party Cloud Services Setup & Ingestion Contract (Neon, Vercel, Linear, GitHub)

Per [ADR-0005](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0005-guided-cli-cloud-setup-and-auto-migration.md) and [ADR-0009](file:///Users/cesaradalbertochavezcalderon/Personal/agent-factory/docs/adr/0009-third-party-cloud-services-setup-and-inbox-architecture.md):

1. **Guided Setup CLI (`orch setup:cloud`)**:
   - Zero external CLI installation required (`vercel`, `neonctl` not needed).
   - Prompts for `NEON_DATABASE_URL` obtained from Neon web console.
   - Generates high-entropy HMAC secrets for `LINEAR_WEBHOOK_SECRET` and `GITHUB_WEBHOOK_SECRET`.
   - Executes idempotent SQL DDL (`neon-sync.mjs`) over Neon HTTP SQL API.
   - Writes verified config to local `.env.local` and exports `.env.production.local` with optional macOS clipboard copy (`pbcopy`) for 1-click paste into Vercel Project Settings.

2. **Vercel Webhook Ingestion API (`/api/webhooks/*`)**:
   - Cryptographic timing-safe HMAC verification on `Linear-Signature` and `X-Hub-Signature-256`.
   - Idempotent deduplication via `ON CONFLICT (delivery_id) DO NOTHING` in Neon `webhook_inbox`.
   - 3-attempt exponential backoff retry (up to 3.5s) to transparently absorb Neon scale-to-zero cold boots without dropping events.

3. **Outbound Feedback Protocol**:
   - **GitHub**: Posts questions directly via authenticated local `gh issue comment <id>` under `@cesarchavezcal` (zero extra keys).
   - **Linear**: If `LINEAR_API_KEY` is present, posts directly via Linear GraphQL API. If unset, pauses ticket state in `state.json` (`status: "waiting_for_human"`) and prompts the developer in terminal/UI with `orch ticket:reply`.
