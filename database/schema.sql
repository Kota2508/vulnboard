PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  asset TEXT NOT NULL,
  source TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cvss REAL NOT NULL CHECK(cvss >= 0 AND cvss <= 10),
  severity TEXT NOT NULL CHECK(severity IN ('critical','high','medium','low','info')),
  status TEXT NOT NULL CHECK(status IN ('open','triaged','in_progress','resolved','false_positive')),
  assigned_to TEXT NOT NULL DEFAULT '',
  occurrences INTEGER NOT NULL DEFAULT 1 CHECK(occurrences >= 1),
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  due_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_due ON findings(due_at);
CREATE TABLE IF NOT EXISTS finding_events (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  details TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finding_events ON finding_events(finding_id,created_at DESC);
