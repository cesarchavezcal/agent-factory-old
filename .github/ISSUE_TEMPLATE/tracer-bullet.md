---
name: Tracer-Bullet Ticket
description: Vertical tracer-bullet ticket mapped to an architectural specification.
title: "[T-X]: <title>"
labels: ["tracer-bullet", "pstack"]
---

## Summary
<!-- Concise 1-2 sentence description of the vertical slice -->

## Seams & Target Files
<!-- List exact target files touched by this ticket -->
- `...`

## Metadata & Routing
- **Specification**: [`docs/specs/agent-factory-v1.md`](docs/specs/agent-factory-v1.md)
- **Ticket ID**: `T-X`
- **Depends On**: `[]`
- **Assigned Quota Pool**: `GROK_WORK` | `CURSOR_WORK`
- **Assigned Model**: `grok-4.7-build-fast` | `composer-2.5`
- **Builder Skill**: `poteto-mode`

## Acceptance & Verification Command
```bash
# Executable verification assertion
npm test
```

## Mandatory PStack Proof Gates
- [ ] Phase 4a: Gemini 3.8 Flash runtime proof (`verifyReceipt.exitCode === 0`)
- [ ] Phase 4b: Grok 4.7 adversarial interrogation (`interrogateReceipt.verdict === "PASS"`)
