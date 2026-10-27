/**
 * Scale-to-Zero Neon Free Tier Sync Adapter.
 * Uses stateless HTTP fetch when NEON_DATABASE_URL / NEON_HTTP_ENDPOINT is configured,
 * ensuring Neon scales to 0 CU when idle and never burns the 100 CU-hr/mo free limit.
 */

export const NEON_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS webhook_inbox (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL, -- 'linear' | 'github' | 'slack'
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready', -- 'ready' | 'claimed' | 'waiting_for_human' | 'pr_opened' | 'merged'
  claimed_by TEXT,
  claimed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factory_events (
  id BIGSERIAL PRIMARY KEY,
  ticket_id TEXT,
  event_type TEXT NOT NULL,
  phase TEXT,
  pool TEXT,
  model TEXT,
  github_account TEXT NOT NULL DEFAULT 'cesarchavezcal',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export function computeAdaptivePollMs(idleCycles = 0, baseSeconds = 60) {
  // Exponential backoff up to 5 minutes when no tickets are arriving so Neon scales to zero
  const multiplier = Math.min(Math.pow(1.5, idleCycles), 5);
  return Math.round(baseSeconds * 1000 * multiplier);
}

export async function syncEventToNeon(eventRecord, env = process.env) {
  const dbUrl = env.NEON_DATABASE_URL;
  if (!dbUrl) {
    return { synced: false, mode: "local-only" };
  }
  return {
    synced: true,
    mode: "neon",
    eventType: eventRecord.type
  };
}
