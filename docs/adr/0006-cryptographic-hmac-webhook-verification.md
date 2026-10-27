# ADR-0006: Cryptographic HMAC Webhook Verification

## Context
When exposing public webhook endpoints (`/api/webhooks/linear` and `/api/webhooks/github`) on Vercel Hobby, unauthenticated endpoints can be spammed with forged payloads, polluting the Neon `webhook_inbox` table and triggering rogue Mac agent executions.

## Decision
1. **Cryptographic HMAC Verification**:
   - **Linear**: Verifies the `Linear-Signature` header against the raw request body using HMAC SHA-256 with `LINEAR_WEBHOOK_SECRET`.
   - **GitHub**: Verifies the `X-Hub-Signature-256` header against the raw request body using HMAC SHA-256 with `GITHUB_WEBHOOK_SECRET`.
2. **Strict Rejection**:
   - Any request with a missing or invalid signature returns HTTP `401 Unauthorized` immediately and does not query or insert into Neon.
3. **Idempotency & Replay Defense**:
   - Incoming payloads are deduplicated using their unique external webhook delivery ID (`deliveryId` / `id`) as a primary key constraint in `webhook_inbox`.

## Status
Accepted (2026-10-27)

## Consequences
- **Positive**: Zero risk of rogue or unauthorized ticket injection; protects Neon database compute and local agent runner from spam attacks.
- **Trade-off**: Requires developers to copy the signing secret when configuring the webhook in Linear and GitHub settings.
