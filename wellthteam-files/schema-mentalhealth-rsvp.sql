-- Mental Health Seminar RSVPs (Sept 19, 2026)
-- Run with: wrangler d1 execute wellthteam-db --file=./schema-mentalhealth-rsvp.sql --remote

CREATE TABLE IF NOT EXISTS mentalhealth_rsvps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  contact     TEXT NOT NULL,
  email       TEXT NOT NULL,
  attendees   TEXT NOT NULL,
  source      TEXT,
  message     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mhrsvp_created ON mentalhealth_rsvps(created_at);
