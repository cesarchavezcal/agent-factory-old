---
name: poteto-mode
description: Master T3 Code Multi-Model Factory Router (Gemini + Cursor Composer + Grok). Enforces pstack receipts and zero-cost quota routing.
---
# `/poteto-mode` — T3 Code Multi-Model Orchestrator (`cesarchavezcal`)

## Hard Invariants
1. **GitHub Account**: Always operate and open PRs under `cesarchavezcal`.
2. **100% Claude-Free & Zero Paid API Keys**: Use only `antigravity` (`gemini-4-argon-high`, `gemini-3.8-flash-high`), `cursor` (`composer-2.5`), and `grok` (`grok-4.7`, `grok-4.7-build-fast`).
3. **Dual PStack Gate**: No ticket transitions to `done` without both a passing `verifyReceipt` (`exitCode === 0` from Flash) and `interrogateReceipt` (`verdict === "PASS"` from Grok 4.7).

## Execution Protocol
1. **Capabilities Check**: Call `orchestrator_capabilities` once per thread.
2. **Phase 0 (Flash Context Scout)**: Spawn `invoke_subagent({ Model: "flash" })` to inspect candidate files and call `orch_save_scout_brief` (`<2KB`).
3. **Phase 1 & 2 (Spec & DAG — Gemini 4 Argon)**: Read `.orchestrator/context-brief.md`. If unclear, call `orch_ask_ticket`. Otherwise write `docs/specs/<slug>.md` and lock the DAG via `orch_lock_spec_and_dag`.
4. **Phase 3 (Implementation — Cursor Composer 2.5 / Grok 4.7 Fast)**: Use `delegate_task` with the target returned by `router.mjs` (`composer-2.5` for UI/CRUD; `grok-4.7-build-fast` for DB/algorithms/rework).
5. **Phase 4a & 4b (Verify & Interrogate)**:
   - Run `invoke_subagent({ Model: "flash" })` to execute `verifyCmd` and record `orch_verify_ticket`.
   - Run `delegate_task` (`grok-4.7`, `role: "review"`) to audit the diff and record `orch_interrogate_ticket`.
6. **Phase 5 (Delivery)**: Push the worktree branch under `cesarchavezcal`, open the PR, and call `link_pull_request` + `watch_pull_request`.
