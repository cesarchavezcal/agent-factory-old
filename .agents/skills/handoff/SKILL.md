---
name: handoff
description: Formats current session state into a clean handoff document for the next agent or session.
---
# `/handoff` — Context Continuity Handoff

Use this skill when ending a session, switching between IDEs (AGY ↔ Cursor), or hitting context limits.

## Output Format
Create or update `.orchestrator/handoff.md` with:

```markdown
# Session Handoff

## 1. Current State
- **Active Feature / Linear Ticket**: [ID & Title]
- **Current Phase**: [Discovery | Planning | Implementation | Verification]
- **Active Host**: [AGY (Gemini) | Cursor (Composer/Grok)]

## 2. Completed Work Units
- [List completed tickets with verifyReceipt & interrogateReceipt status]

## 3. Active Blockers or Failures
- [Any failing test, rework reason, or unaddressed interrogation objection]

## 4. Exact Next Action for Incoming Agent
- Copy-paste prompt or CLI command: `...`
```
