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

-- Dashboard 登录会话：cookie 中只存随机 ID，服务端仅保存其 SHA-256 哈希
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- 管理操作审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    action    TEXT NOT NULL,
    detail    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reads_id_wxid ON reads (id, wx_id);
CREATE INDEX IF NOT EXISTS idx_messages_wx_id ON messages (wx_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- 迁移（可重复执行）：清理历史重复读取后建立唯一约束，防止存储被同 IP 重复写入撑爆
DELETE FROM reads WHERE rowid NOT IN (SELECT MIN(rowid) FROM reads GROUP BY id, ip);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reads_id_ip ON reads (id, ip);
