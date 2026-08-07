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
    timestamp TEXT NOT NULL,
    PRIMARY KEY (id, ip)
);

CREATE TABLE IF NOT EXISTS users (
    wx_id         TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    level         INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS registration_stats (
    wx_id TEXT NOT NULL,
    date   TEXT NOT NULL,
    count  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (wx_id, date)
);

CREATE TABLE IF NOT EXISTS read_stats (
    wx_id TEXT NOT NULL,
    date   TEXT NOT NULL,
    count  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (wx_id, date)
);

CREATE TABLE IF NOT EXISTS message_read_stats (
    id      TEXT NOT NULL,
    wx_id   TEXT NOT NULL,
    content TEXT NOT NULL,
    date    TEXT NOT NULL,
    count   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id, date)
);

CREATE INDEX IF NOT EXISTS idx_reads_id_wxid ON reads (id, wx_id);
CREATE INDEX IF NOT EXISTS idx_reads_wx_ts ON reads (wx_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_wx_id ON messages (wx_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_users_level ON users (level);
CREATE INDEX IF NOT EXISTS idx_regstats_date ON registration_stats (date);
CREATE INDEX IF NOT EXISTS idx_readstats_date ON read_stats (date);
CREATE INDEX IF NOT EXISTS idx_msgreadstats_wx_id ON message_read_stats (wx_id);
CREATE INDEX IF NOT EXISTS idx_msgreadstats_date ON message_read_stats (date);

INSERT OR IGNORE INTO registration_stats (wx_id, date, count)
SELECT wx_id, date(timestamp, '+8 hours'), COUNT(*)
FROM messages
GROUP BY wx_id, date(timestamp, '+8 hours');

INSERT OR IGNORE INTO read_stats (wx_id, date, count)
SELECT wx_id, date(timestamp, '+8 hours'), COUNT(*)
FROM reads
GROUP BY wx_id, date(timestamp, '+8 hours');

INSERT OR IGNORE INTO message_read_stats (id, wx_id, content, date, count)
SELECT r.id, r.wx_id, substr(m.content, 1, 50), date(r.timestamp, '+8 hours'), COUNT(*)
FROM reads r JOIN messages m ON m.id = r.id
GROUP BY r.id, r.wx_id, m.content, date(r.timestamp, '+8 hours');

DELETE FROM reads WHERE rowid NOT IN (SELECT MIN(rowid) FROM reads GROUP BY id, ip);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reads_id_ip ON reads (id, ip);
