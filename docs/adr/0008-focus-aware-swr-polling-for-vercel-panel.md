# ADR-0008: Focus-Aware SWR Polling for Vercel Live Panel

## Context
Vercel Hobby has a 100,000 serverless invocation per month limit and short 10-15s function timeouts, making persistent WebSocket or long-lived Server-Sent Events (SSE) connections reconnect frequently and consume function invocations rapidly.

## Decision
1. **Focus-Aware Polling**:
   - The React Live Panel (`App.tsx`) queries `/api/events?since=<lastEventId>` every 3 seconds **only when the browser tab is focused and visible**.
   - When the tab is minimized or blurred, polling stops immediately.
2. **HTTP 304 Not Modified Caching**:
   - The `/api/events` endpoint checks the latest `factory_events` ID against the request's `since` parameter or `If-None-Match` header.
   - If no new events have occurred, it returns `304 Not Modified` with empty body, minimizing bandwidth and latency (<50ms).
3. **Local Development Fallback**:
   - When running locally at `http://localhost:4321`, the engine uses zero-latency Node SSE (`res.writeHead(200, { 'Content-Type': 'text/event-stream' })`), providing instant UI updates on disk changes.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: Guarantees zero bill on Vercel Hobby ($0); sub-50ms event updates during active dashboard viewing; automatically stops burning invocations when the developer looks away.
- **Trade-off**: Event latency on the remote Vercel board is ~1-3s compared to instantaneous local Node SSE.
