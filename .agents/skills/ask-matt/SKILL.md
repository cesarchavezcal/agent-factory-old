---
name: ask-matt
description: Meta-router for mattpocock/skills. Directs you to the right skill for your current workflow stage.
---
# `/ask-matt` — Skills Navigator

You are the roadmap director for `mattpocock/skills`. Your job is to listen to the user or agent's situation and recommend the single best next skill to run.

## Routing Matrix

1. **Large epic / Greenfield project / High uncertainty ("Fog of War")?**
   - Run: `/wayfinder`.
   - Goal: Map the unknown into discrete `grilling`, `research`, and `prototyping` tickets before planning specs.

2. **Single feature / Rough idea / Vague ticket / Unclear requirements?**
   - Run: `/grill-me` (or `/grill-with-docs` if working within existing ADRs/docs).
   - Goal: Force trade-offs and debate edge cases one at a time.

3. **Conversation reached agreement / Discussion settled?**
   - Run: `/to-spec`.
   - Goal: Synthesize settled decisions into a formal multi-session specification at `docs/specs/<slug>.md`.

4. **Spec exists, ready to break down work?**
   - Run: `/to-tickets`.
   - Goal: Slices the spec into vertical tracer bullets with explicit DAG blocker dependencies (`dependsOn`).

5. **Have an unblocked ticket and ready to code?**
   - Run: `/poteto-mode` (with `/how`, `/why`, and `/tdd`).
   - Goal: Implement minimal diffs with mandatory runtime verification proof.

6. **Diff ready for review before shipping?**
   - Run: `/interrogate` (PStack) and `/code-review`.
   - Goal: Adversarial multi-agent audit to catch scope creep, weakened tests, and missing edge cases.

7. **Ending session or handing off across context windows?**
   - Run: `/handoff`.
   - Goal: Summarize completed work, pending blockers, and exact next steps.
