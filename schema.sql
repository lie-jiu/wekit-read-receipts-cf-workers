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

CREATE INDEX IF NOT EXISTS idx_reads_id_wxid ON reads (id, wx_id);
CREATE INDEX IF NOT EXISTS idx_messages_wx_id ON messages (wx_id);
