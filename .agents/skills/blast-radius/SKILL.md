---
name: blast-radius
description: PStack change impact assessment. Evaluates consumers, ripple effects, and potential breakage before modifying shared code.
---
# `/blast-radius` — Impact & Consumer Analysis

Before editing any shared module, database schema, or exported interface, quantify the blast radius.

## Protocol
1. **Find All Call Sites & Consumers**: Grep for imports, exported symbols, and database table references.
2. **Classify Breaking Changes**:
   - Are signatures changed?
   - Are return types widened or narrowed?
   - Are optional fields made required?
3. **Migration & Deprecation Plan**:
   - If blast radius is large, formulate a phased migration rather than an in-place breaking change.
   - Summarize the affected files before proceeding with edits.
