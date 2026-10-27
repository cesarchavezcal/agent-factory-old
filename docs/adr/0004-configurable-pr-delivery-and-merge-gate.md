# ADR-0004: Configurable PR Delivery and Merge Gate

## Context
In "The Whole Factory", Step 6 pushes the branch and opens a Pull Request on GitHub under `cesarchavezcal`. Fully autonomous auto-merges can introduce unexpected changes to `main`, while forcing manual steps can slow down high-velocity teams.

## Decision
1. **Configurable Policy in `factory.config.json`**:
   Add a `delivery` block to `factory.config.json`:
   ```json
   "delivery": {
     "autoMerge": false,
     "mergeMethod": "squash",
     "deleteBranchOnMerge": true,
     "requireChecksPass": true
   }
   ```
2. **Default Human Gate**:
   By default, `autoMerge` is `false`. The factory:
   - Pushes `feat/<ticket-id>` to `origin`.
   - Opens the Pull Request on GitHub using `gh pr create`.
   - Embeds the full markdown table of **Gemini 3.8 Flash runtime receipts** and **Grok 4.7 interrogation verdicts** in the PR description.
   - Calls `link_pull_request` and `watch_pull_request` so T3 Code monitors review state and CI.
3. **Optional Autonomous Merge**:
   If a team explicitly sets `"delivery": { "autoMerge": true }`, the runner executes `gh pr merge --squash --auto` once GitHub Actions CI completes successfully.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: Safe by default; provides total transparency with embedded PStack receipts; supports 100% autonomous delivery when explicitly opted-in.
- **Trade-off**: Requires human interaction on default configurations.
