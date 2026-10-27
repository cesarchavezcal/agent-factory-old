---
name: architect
description: PStack design explorer. Sketches parallel module signatures, types, and trade-offs before writing code.
---
# `/architect` — Parallel Design Space Exploration

Explore alternative designs before committing to an implementation path.

## Protocol
1. **Define 2–3 Competing Approaches**:
   - Option A: Minimal change / conservative.
   - Option B: Idiomatic redesign / clean separation.
   - Option C: Extensible / future-proof.
2. **Draft Type Signatures & Interfaces**: Write only TypeScript interfaces or function signatures for each option without bodies.
3. **Compare Trade-offs**:
   - Performance, maintainability, cognitive load, migration cost.
4. **Select Winner**: Pick the approach that maximizes simplicity and provable correctness.
