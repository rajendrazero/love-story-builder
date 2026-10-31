CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  PRIMARY KEY (rate_key, window_started_at)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window
  ON api_rate_limits (window_started_at);
