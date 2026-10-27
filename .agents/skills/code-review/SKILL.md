---
name: code-review
description: High-level architectural and acceptance criteria code review for pull requests.
---
# `/code-review` — Architectural Diff Review

Use this skill to review proposed changes against `docs/specs/<slug>.md` before opening or merging a PR.

## Review Rubric
1. **Spec Alignment**: Does the diff address the requirements stated in the specification without scope creep?
2. **API & Contract Integrity**: Are types, schemas, and exported interfaces clean and minimal?
3. **Test Coverage**: Does the PR include tests for edge cases identified during `/grill-me`?
4. **Anti-Slop Check**: Reject speculative helpers, unnecessary defensive guards, and AI boilerplate.
