---
name: why
description: PStack historical archaeology. Investigates git log, commit history, and design rationale behind existing code.
---
# `/why` — Git Archaeology & Design Rationale

Never remove or refactor code until you understand why it was written in the first place (Chesterton's Fence).

## Protocol
1. **Git Blame & History Inspection**: Look at `git log -S` and `git blame` on the target lines.
2. **Identify Historical Context**:
   - What bug or edge case was this code addressing?
   - Is the original constraint still active today, or is it obsolete?
3. **Synthesize Findings**:
   - State the original intent plainly.
   - If proposing to change it, prove why the original problem won't regress under the new design.
