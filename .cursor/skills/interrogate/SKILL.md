---
name: interrogate
description: PStack adversarial review panel. Audits diffs against spec.md with zero tolerance for scope creep or weak tests.
---
# `/interrogate` — Adversarial Code Audit (Grok 4.7)

Audits git diff and Flash verifyReceipt against spec.md:
- Reject scope creep, dead code, and weakened assertions.
- Record PASS or FAIL via `orch_interrogate_ticket`.
