---
name: unslop
description: PStack code hygiene. Strips synthetic AI filler, verbose boilerplate, and defensive fluff from prose and code.
---
# `/unslop` — Anti-Slop Code Hygiene

AI models tend to generate verbose explanations, excessive try/catch wrappers, and boilerplate. This skill cleans that up.

## Principles
1. **No Conversational Filler**: Remove *"Sure! Here is the updated code..."* and conversational padding.
2. **Zero Speculative Abstractions**: Replace generic `BaseAbstractFactoryProvider` with direct, simple functions.
3. **Delete Unnecessary Defensive Code**: If a type guarantees a parameter cannot be null, do not write 5 redundant null checks.
4. **Idiomatic Simplicity**: Prefer built-in language primitives over heavy dependencies.
