-- WELLTH Team member accounts
-- Run with: wrangler d1 execute wellthteam-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'standard',   -- e.g. 'standard' | 'senior' | 'admin'
  reseller_tag  TEXT,                                 -- short code used in catalog maker attribution footer
  active        INTEGER NOT NULL DEFAULT 1,           -- 1 = can log in, 0 = disabled
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  member_id   INTEGER NOT NULL REFERENCES members(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_member ON sessions(member_id);

-- Masterclass library: topics ("courses") containing ordered video lessons
CREATE TABLE IF NOT EXISTS courses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,              -- e.g. "Facebook Ads Masterclass"
  description TEXT,
  thumbnail   TEXT,                        -- optional image URL for the topic card
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id   INTEGER NOT NULL REFERENCES courses(id),
  title       TEXT NOT NULL,
  youtube_id  TEXT NOT NULL,               -- the 11-char ID from the unlisted YouTube URL
  duration    TEXT,                        -- display only, e.g. "18:42"
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
