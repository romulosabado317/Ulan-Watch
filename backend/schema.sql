CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('resident', 'coordinator')),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  street TEXT NOT NULL,
  water_level TEXT NOT NULL CHECK (water_level IN ('ankle', 'knee', 'waist', 'chest')),
  note TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  reporter TEXT NOT NULL,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  created_at BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'flagged'))
);

CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;