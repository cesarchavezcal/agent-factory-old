---
name: swarm
description: PStack parallel subagent fan-out. Manages parallel worker agents across partitioned tasks.
---
# `/swarm` — Parallel Subagent Dispatch

Use this skill when a spec contains independent, non-overlapping tickets in the DAG that can be executed in parallel worktrees.

## Protocol
1. **Verify Independence**: Ensure candidate tickets have no shared file paths and no unresolved `dependsOn` blockers.
2. **Spawn Isolated Worktrees**: Allocate isolated Git worktrees and dynamic ports per ticket.
3. **Collect & Integrate**: Wait for all worker agents to report passing `verifyReceipt` before triggering serial cross-model interrogation.
