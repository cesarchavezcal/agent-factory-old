# ADR-0003: Incremental Rework with Model Escalation

## Context
When Phase 4b adversarial interrogation (`grok-4.7`) rejects a proposed diff (for scope creep, dead code, or missing edge cases), discarding the entire worktree loses the ~90% of correct code that was already written. Conversely, naive retries with the same builder model often loop into the same reasoning failure.

## Decision
1. **Preserve Worktree State**: The Git worktree is kept intact with the current diff.
2. **Structured Rework Brief**: The engine generates `.orchestrator/rework-<ticket-id>.md` containing:
   - The original ticket requirements and `spec.md` excerpt.
   - Grok's exact rejection summary and itemized objections.
   - The current `git diff`.
3. **Model Escalation Protocol**:
   - Attempt 1: Standard builder (**Cursor Composer 2.5**).
   - Attempt 2 (First Rework): Escalates automatically to **Grok 4.7** (`reasoningEffort: "high"`), taking advantage of Grok's deep first-principles reasoning to resolve the subtle logical defect.
   - Attempt 3 (Failure Capped): If attempt 2 still fails, execution halts (`status: "failed_gate"`), and the failure report is posted back to the source Linear/GitHub ticket.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: High recovery rate from minor review rejections without losing work; escalates to higher-reasoning model when standard builder gets stuck.
- **Trade-off**: Requires strict `maxRetries: 2` ceiling to prevent endless loops.
