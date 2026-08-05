CREATE TABLE IF NOT EXISTS messages (
    id        TEXT PRIMARY KEY,
    wx_id     TEXT NOT NULL,
    content   TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reads (
    id        TEXT NOT NULL,
    wx_id     TEXT NOT NULL,
    ip        TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    wx_id         TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    level         INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL
);

DROP TABLE IF EXISTS sessions;
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    wx_id      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    action    TEXT NOT NULL,
    detail    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reads_id_wxid ON reads (id, wx_id);
CREATE INDEX IF NOT EXISTS idx_messages_wx_id ON messages (wx_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_users_level ON users (level);

DELETE FROM reads WHERE rowid NOT IN (SELECT MIN(rowid) FROM reads GROUP BY id, ip);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reads_id_ip ON reads (id, ip);
