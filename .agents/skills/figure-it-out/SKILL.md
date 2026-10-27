---
name: figure-it-out
description: PStack autonomous debugging and diagnostic tracing when facing ambiguous failures or dead-ends.
---
# `/figure-it-out` — Autonomous Failure Diagnostics

Use this skill when a test is failing with a confusing error message, an intermittent race condition, or an unhandled edge case.

## Protocol
1. **Isolate the Failure**: Strip away unrelated code and create a reproduction script with minimal dependencies.
2. **Log State Invariants**: Add temporary debug logging at every boundary to check inputs and outputs.
3. **Form & Test Hypotheses**:
   - Hypothesis 1: State mutation timing / async race.
   - Hypothesis 2: Null/undefined or schema mismatch.
   - Hypothesis 3: Environment or dependency discrepancy.
4. **Verify Root Cause**: Prove the hypothesis by asserting the exact mechanism before applying the fix.
