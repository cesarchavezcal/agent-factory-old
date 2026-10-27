# ADR-0002: Worktree Isolation and Deterministic Port Offsets

## Context
When running parallel tickets (`maxConcurrentThreads > 1`), multiple agent sessions modifying the root checkout cause Git merge conflicts and dirty states. Furthermore, if verification commands start local test servers or dev environments, hardcoded ports (e.g., 3000, 5173) collide.

## Decision
1. **Isolated Worktree Allocation**: Every claimed ticket provisions a dedicated Git worktree at `.worktrees/<ticket-id>` on branch `feat/<ticket-id>`.
2. **Deterministic Port Offsets**: The runner assigns each active thread a concurrency slot index (`0..maxConcurrentThreads-1`) and injects:
   - `PORT = BASE_PORT + slotIndex` (e.g. `3100`, `3101`)
   - `VITE_PORT = 5173 + slotIndex`
3. **Automated Cleanup**: Upon ticket completion or failure after retry exhaustion, the runner prunes the worktree directory (`git worktree remove --force .worktrees/<ticket-id>`).

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: Zero Git status pollution across parallel tickets; parallel verification servers run safely without socket bind conflicts.
- **Trade-off**: Requires disk space for worktree checkouts during active execution.
