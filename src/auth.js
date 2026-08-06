import { sha256Hex, randomHex, nowTimestamp } from "./utils.js";
import { SESSION_TTL_MS, LEVEL_MAX } from "./config.js";

// ── 会话与权限 ──────────────────────────────────────────

// 从 Cookie 解析会话并绑定用户；JOIN users 保证已删除账号的会话立即失效，
// 且每次请求都能拿到最新的 level
export async function extractSession(request, env) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed.startsWith("__Host-session=")) continue;
    const value = trimmed.slice("__Host-session=".length);
    if (!value.startsWith("sess_")) continue;
    try {
      const row = await env.DB.prepare(
        "SELECT s.wx_id AS wx_id, s.expires_at AS expires_at, u.level AS level " +
          "FROM sessions s JOIN users u ON u.wx_id = s.wx_id WHERE s.token_hash = ?"
      )
        .bind(await sha256Hex(value.slice(5)))
        .first();
      if (row && row.expires_at > nowTimestamp()) {
        const rawLevel = Number(row.level);
        // 等级 0 = 拉黑，必须原样保留；仅对无效值兜底为 1
        const level =
          row.level != null && Number.isInteger(rawLevel)
            ? Math.max(0, Math.min(rawLevel, LEVEL_MAX))
            : 1;
        return { wxId: row.wx_id, level };
      }
    } catch {}
  }
  return null;
}

export function isAdminUser(wxId, env) {
  if (!wxId || !env.ADMIN) return false;
  return String(env.ADMIN)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(wxId);
}

export async function createSessionCookie(db, wxId) {
  const sessionId = await randomHex(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  try {
    await db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(nowTimestamp()).run();
  } catch {}
  const res = await db
    .prepare("INSERT INTO sessions (token_hash, wx_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256Hex(sessionId), wxId, nowTimestamp(), expiresAt)
    .run();
  if (!res || !res.success) return null;
  return `__Host-session=sess_${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

export async function destroySession(request, db) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return;
  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (trimmed.startsWith("__Host-session=")) {
      const value = trimmed.slice("__Host-session=".length);
      if (value.startsWith("sess_")) {
        try {
          await db
            .prepare("DELETE FROM sessions WHERE token_hash = ?")
            .bind(await sha256Hex(value.slice(5)))
            .run();
        } catch {}
      }
    }
  }
}

// ── 等级配额：惰性清理（注册新消息 / 查看消息时触发）────
// 等级 N = 保留 N 条消息 × N 个月；超量时删除最早的消息，过期时删除整批
export async function enforceQuota(db, wxId, level) {
  const n = Math.max(0, Math.min(Number(level) || 0, LEVEL_MAX));
  const cutoff = new Date(Date.now() - n * 30 * 24 * 3600 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  try {
    await db.prepare("DELETE FROM reads WHERE wx_id = ? AND timestamp < ?").bind(wxId, cutoff).run();
    await db.prepare("DELETE FROM messages WHERE wx_id = ? AND timestamp < ?").bind(wxId, cutoff).run();
    const { results } = await db
      .prepare("SELECT id FROM messages WHERE wx_id = ? ORDER BY timestamp DESC, rowid DESC LIMIT -1 OFFSET ?")
      .bind(wxId, n)
      .all();
    for (const r of results || []) {
      await db.prepare("DELETE FROM reads WHERE id = ?").bind(r.id).run();
      await db.prepare("DELETE FROM messages WHERE id = ?").bind(r.id).run();
    }
  } catch (e) {
    console.error("enforceQuota failed:", e);
  }
}
