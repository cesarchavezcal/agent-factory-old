# ADR-0001: Local-First Default with Seamless Cloud Upgrade

## Context
When developers use `cesarchavezcal/agent-factory` as a GitHub template, requiring cloud databases (Neon) and webhooks (Linear) upfront creates friction and prevents immediate local experimentation.

## Decision
The template operates in **Local-First Mode** by default:
1. **Zero Mandatory Env Vars**: A fresh checkout functions 100% offline using `.orchestrator/state.json` and `.orchestrator/events.jsonl`.
2. **Local Ticket Intake**: Tickets can be initiated via CLI (`orch ticket add`), local Markdown files (`.tickets/`), or T3 chat.
3. **Seamless Cloud Upgrade**: As soon as `NEON_DATABASE_URL` is detected in `.env`, the engine activates `neon-sync.mjs` automatically without requiring configuration flags or codebase changes.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: Immediate time-to-first-ticket (<30 seconds); developers can run `npm run demo` or code tickets offline.
- **Trade-off**: Multi-device live boards require providing a Neon URL.
