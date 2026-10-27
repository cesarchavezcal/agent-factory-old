---
name: wayfinder
description: Greenfield planning engine by Matt Pocock. Maps ambiguous, large-scale problems into a dependency graph of discrete investigation, grilling, and prototype tickets before writing specs.
---
# `/wayfinder` — Greenfield Discovery & Fog of War Mapping

> *"Plan, Don't Build."*

Use `/wayfinder` when starting a project, greenfield feature, or epic that is too large or too ambiguous for a single agent session to hold.

## The Wayfinder Workflow

1. **Assess the Fog of War**:
   - What decisions are unsettled?
   - What architectural unknowns or feasibility questions exist?
   - What UI/UX patterns need proof-of-concept validation?

2. **Chart the Map (Ticket Taxonomy)**:
   Break the initiative into 3 distinct investigation ticket types:
   - **`grilling`**: Clarifies business logic, constraints, edge cases, and user expectations (`/grill-me`).
   - **`research`**: Investigates external libraries, benchmark performance, API compatibility, or data models.
   - **`prototyping`**: Quick disposable spikes to prove technical viability without production code.

3. **Establish Dependency Ordering**:
   - Order tickets so that foundational questions are answered before dependent tickets are scheduled.
   - Store tickets in the issue tracker (Linear, GitHub Issues) or `.orchestrator/wayfinder-map.md`.

4. **Sequential Execution Across Clean Sessions**:
   - Run each investigation ticket in a fresh context session.
   - Record findings directly into ADRs or `docs/`.

5. **Handoff to Specification**:
   - Once all grilling and research tickets are resolved, hand off cleanly to `/to-spec` $\to$ `/to-tickets`.
