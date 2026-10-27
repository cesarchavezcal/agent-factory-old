# Agent Factory Template (`@cesarchavezcal`)

A **zero-API-key, zero-cost multi-model software factory template** orchestrated natively by **T3 Code** using **Google Antigravity (Gemini 4 Argon + Gemini 3.8 Flash)**, **Cursor (Composer 2.5)**, and **Grok (Grok 4.7 + Grok 4.7 Build-Fast)** with **Neon Free Tier** + **Vercel Hobby** live observability.

---

## Complete Skill Catalogs Included

### 1. `mattpocock/skills` (Discovery & Specification — Gemini 4 Argon)
- [`/wayfinder`](file:///.agents/skills/wayfinder/SKILL.md): Greenfield discovery engine mapping high-uncertainty initiatives into discrete `grilling`, `research`, and `prototyping` tickets before formal specification.
- [`/ask-matt`](file:///.agents/skills/ask-matt/SKILL.md): Meta-router advising which skill to run for your current task.
- [`/grill-me`](file:///.agents/skills/grill-me/SKILL.md): 1-by-1 interrogator forcing trade-offs and edge-case resolution before code is touched.
- [`/grill-with-docs`](file:///.agents/skills/grill-with-docs/SKILL.md): Architectural interrogation recording decisions directly into ADRs and project documentation.
- [`/to-spec`](file:///.agents/skills/to-spec/SKILL.md): Synthesizes discussion into formal specifications at `docs/specs/<slug>.md`.
- [`/to-tickets`](file:///.agents/skills/to-tickets/SKILL.md): Slices specifications into atomic, vertical tracer-bullet DAG tickets with `verifyCmd`.
- [`/code-review`](file:///.agents/skills/code-review/SKILL.md): High-level architectural acceptance review.
- [`/handoff`](file:///.agents/skills/handoff/SKILL.md): Formats session state into clean handoff documents across context windows.

### 2. Lauren Tan's `pstack` (`cursor/plugins/pstack` — Composer 2.5 + Flash + Grok)
- [`/poteto-mode`](file:///.agents/skills/poteto-mode/SKILL.md): Central task router selecting playbooks (`feature`, `bugfix`, `refactor`, `prototype`).
- [`/how`](file:///.agents/skills/how/SKILL.md): Deep runtime flow, call stack, and boundary tracing before modifying code.
- [`/why`](file:///.agents/skills/why/SKILL.md): Git archaeology and design rationale analysis (Chesterton's fence).
- [`/tdd`](file:///.agents/skills/tdd/SKILL.md): Red-green-refactor loop requiring reproducing red tests before fixes.
- [`/show-me-your-work`](file:///.agents/skills/show-me-your-work/SKILL.md): Mandatory runtime proof requirement (`verifyReceipt.exitCode === 0`).
- [`/interrogate`](file:///.agents/skills/interrogate/SKILL.md): Adversarial cross-model audit on **Grok 4.7** rejecting scope creep, dead code, and weak tests.
- [`/unslop`](file:///.agents/skills/unslop/SKILL.md): Anti-slop code hygiene stripping AI conversational filler and boilerplate.
- [`/no-comments`](file:///.agents/skills/no-comments/SKILL.md): Prunes obvious and workaround comments, preserving only rationale comments.
- [`/blast-radius`](file:///.agents/skills/blast-radius/SKILL.md): Change impact assessment mapping call sites before editing shared code.
- [`/architect`](file:///.agents/skills/architect/SKILL.md): Parallel design space exploration comparing type signatures.
- [`/arena`](file:///.agents/skills/arena/SKILL.md): Multi-model implementation contest grafting the best parts of competing designs.
- [`/swarm`](file:///.agents/skills/swarm/SKILL.md): Parallel subagent dispatch across independent Git worktrees.
- [`/figure-it-out`](file:///.agents/skills/figure-it-out/SKILL.md): Autonomous failure diagnostics and hypothesis verification.
- [`/verify-and-interrogate`](file:///.agents/skills/verify-and-interrogate/SKILL.md): Enforces the dual PStack gate (Flash 3.8 proof + Grok 4.7 audit).

---

## Quick Start (Use This Template)

```bash
# 1. Initialize portable MCP & local state
npm run setup

# 2. Verify invariants (cesarchavezcal GitHub account, 100% Claude-free, 0 API keys)
npm run doctor

# 3. Run automated verification suite
npm test

# 4. Launch the Live Mission Control Board (http://localhost:4321)
npm run ui

# 5. Run a live multi-model simulation
npm run demo
```
