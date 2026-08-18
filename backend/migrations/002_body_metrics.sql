-- Body metrics: weight tracking over time
CREATE TABLE IF NOT EXISTS body_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  weight_kg NUMERIC,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user ON body_metrics(user_id, logged_at DESC);
