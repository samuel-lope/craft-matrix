CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  workspace_id TEXT PRIMARY KEY,
  colors_json TEXT,
  bg_svgs_json TEXT,
  item_svgs_json TEXT,
  updated_at INTEGER NOT NULL
);
