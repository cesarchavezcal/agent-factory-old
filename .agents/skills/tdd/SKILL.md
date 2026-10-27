---
name: tdd
description: PStack Test-Driven Development workflow. Reproduces failures with red tests before writing production fixes.
---
# `/tdd` — Test-Driven Implementation Loop

Never write implementation code without a failing test first.

## Red-Green-Refactor Protocol
1. **Red (Failing Test)**:
   - Write a minimal automated test reproducing the bug or asserting the new feature's expected contract.
   - Run the test. Confirm it fails for the **expected reason** (not due to syntax or test harness misconfiguration).
2. **Green (Minimal Fix)**:
   - Write the smallest possible diff to make the test pass.
   - Avoid premature optimization or speculative helpers.
3. **Refactor & Verify**:
   - Clean up code following `/unslop` and `/no-comments`.
   - Run full test suite and capture runtime verification output (`exitCode === 0`).
