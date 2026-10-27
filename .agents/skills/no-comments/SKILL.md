---
name: no-comments
description: PStack diff clean-up. Strips redundant, obvious, or workaround comments to keep PR diffs focused.
---
# `/no-comments` — Comment Pruning & Hygiene

Code should be self-documenting through clear naming and small functions.

## Rules
1. **Delete Obvious Comments**:
   - BAD: `// increment counter` followed by `count++`
   - BAD: `// function to fetch user` followed by `function fetchUser()`
2. **Delete Workaround Notes**: Remove commented-out dead code or temporary debugging markers (`// TODO: fix later`).
3. **Keep Only Rationale Comments**: The only valid comments explain **WHY** an unusual or non-obvious decision was made (e.g., explaining an upstream vendor API quirk).
