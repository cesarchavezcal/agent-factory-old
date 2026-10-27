---
name: how
description: PStack deep execution tracer. Traces runtime call stacks, control flows, and module boundaries before editing.
---
# `/how` — Runtime Flow & Mechanism Tracing

> *"If you want to go fast, go deep first."*

Before modifying code, you must understand the exact runtime execution path.

## Protocol
1. **Entry Point Identification**: Find where the request, event, or function begins.
2. **Follow Call Graph Step-by-Step**: Trace each layer down to data access, external calls, or state mutations.
3. **Document Boundaries**: Identify where assumptions are made and where side effects occur.
4. **Produce Execution Map**:
   - Provide a concise text or mermaid diagram of the call flow.
   - Do NOT edit any files until the flow is confirmed.
