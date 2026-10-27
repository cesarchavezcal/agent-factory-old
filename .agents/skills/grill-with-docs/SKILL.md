---
name: grill-with-docs
description: State-aware architectural interrogation that records decisions into project documentation (ADRs and docs).
---
# `/grill-with-docs` — Documented Architecture Interrogation

Use this skill when developing architectural features inside an established repository with existing documentation or Architectural Decision Records (ADRs).

## Protocol
1. **Read Existing Context First**: Inspect `docs/` and relevant ADRs to understand current design decisions.
2. **Relentless 1-by-1 Questions**:
   - Ask only ONE question at a time.
   - Present concrete trade-offs, options, and recommended default.
   - Do not accept vague answers; challenge ambiguities on data contracts, failure modes, and performance limits.
3. **Record As You Go**:
   - As decisions are finalized, write or update `docs/specs/<slug>.md` and ADRs.
   - Do not generate implementation code during this phase.
