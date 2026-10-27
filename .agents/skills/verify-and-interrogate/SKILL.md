---
name: verify-and-interrogate
description: Enforces the dual PStack gate (Phase 4a Gemini 3.8 Flash runtime proof + Phase 4b Grok 4.7 adversarial interrogation).
---
# `verify-and-interrogate` — Hard Dual-Model Gate

1. **Phase 4a (Runtime Proof — `gemini-3.8-flash-high`)**:
   - Spawn `invoke_subagent({ Model: "flash" })` to run the ticket's `verifyCmd`.
   - Call `orch_verify_ticket` with `exitCode`, `stdout`, and `stderr`.
2. **Phase 4b (Adversarial Interrogation — `grok-4.7`)**:
   - Call `delegate_task` targeting `providerInstanceId: "grok"`, `model: "grok-4.7"`, `role: "review"`.
   - Grok inspects `git diff`, `docs/specs/<slug>.md`, and `verifyReceipt`, then records `PASS` or `FAIL` via `orch_interrogate_ticket`.
