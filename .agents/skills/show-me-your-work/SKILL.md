---
name: show-me-your-work
description: PStack runtime proof rule. Requires immutable terminal execution evidence before marking any task complete.
---
# `show-me-your-work` — Mandatory Runtime Verification

> *"Never trust, always verify."*

An agent must never report that a change works simply because the code looks plausible or compiles.

## The Proof Requirement
A ticket cannot transition to `done` without:
1. **Executable Command**: The exact command executed (`npm test`, `pytest`, `go test`, etc.).
2. **Exit Code 0**: Proof of zero exit status.
3. **Verifiable Stdout**: Terminal output showing passing test assertions and zero unhandled rejections or warnings.
4. **Receipt Recording**: Captured via `orch_verify_ticket` into `.orchestrator/state.json`.
