# ADR-0007: Neon Scale-to-Zero Adaptive Polling Strategy

## Context
Neon's Free Tier includes **100 compute-hours / month** (autosuspending to 0 Compute Units after 5 minutes of inactivity).
Continuous 2-second or 15-second polling 24/7 prevents autosuspension, consuming ~720 compute-hours/month and exceeding the free tier around day 13-14.

## Decision
1. **Adaptive 2-Tier Polling Schedule**:
   - **Active Window**: When a ticket is active or completed within the last 15 minutes, the runner polls every 15 seconds.
   - **Idle Backoff**: If no new tickets or updates arrive for 15 minutes, polling intervals back off exponentially: 30s $\to$ 1m $\to$ 2.5m $\to$ **5 minutes**.
2. **Autosuspension Window**:
   At 5-minute intervals, Neon's cold-suspend timer (5m) allows compute to scale to 0 CU between poll cycles, reducing monthly compute burn from ~720 CU-hrs down to **< 18 CU-hrs / month** (well within the 100 CU-hr free tier).
3. **Screen Wake Event**:
   On macOS, the runner listens to system wake events and immediately runs one instant poll to check for new tickets without waiting for the backoff timer.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: 100% free tier compliance on Neon ($0 bill guaranteed); fast 15-second pickup during active work sessions.
- **Trade-off**: When your machine has been idle for hours, an incoming Linear ticket may take up to 5 minutes to be claimed unless the runner is woken manually.
