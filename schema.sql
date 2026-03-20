CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
