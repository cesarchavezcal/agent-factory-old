---
name: to-tickets
description: Decomposes docs/specs/<slug>.md into dependency-ordered tracer-bullet DAG tickets with routing tags.
---
# `to-tickets` — Tracer-Bullet DAG Decomposition

Break `docs/specs/<slug>.md` into vertical tickets and call `orch_lock_spec_and_dag`:
- Tag UI/React/CRUD tickets with `["ui", "crud"]` so `router.mjs` routes them to **Cursor Composer 2.5**.
- Tag DB/SQL/Concurrency/Algorithmic tickets with `["db", "concurrency", "algorithm"]` so `router.mjs` routes them to **Grok 4.7 Build-Fast**.
- Every ticket must specify an executable `verifyCmd`.
