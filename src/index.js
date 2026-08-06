import { LOGIN_HTML } from "./pages/login.js";
import { htmlPage } from "./pages/dashboard.js";
import { adminPage } from "./pages/admin.js";
import { PNG_1x1 } from "./png.js";
import {
  json,
  jsonWithCookie,
  getClientIP,
  nowTimestamp,
  safeEquals,
  sleep,
  rateLimit,
  hashPassword,
  passwordMatches,
  computeId,
  escapeLike,
  audit,
  chinaDayStartTimestamp,
  maskWxId,
} from "./utils.js";
import {
  extractSession,
  isAdminUser,
  createSessionCookie,
  destroySession,
  revokeOtherSessions,
  enforceQuota,
} from "./auth.js";
import {
  PASSWORD_MIN,
  PASSWORD_MAX,
  LEVEL_MAX,
  WXID_RE,
  PIXEL_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  REGISTER_RATE_LIMIT,
  MESSAGE_CONTENT_MAX,
  AUDIT_LOG_RETENTION_DAYS,
  SECURITY_HEADERS,
  DASHBOARD_CSP,
  LOGIN_CSP,
} from "./config.js";
// ── 路由 ────────────────────────────────────────────────

// /pixel 参数容错解析：收件端微信可能原样保留 CDATA 中的 &amp; 或将其转义，
// 逐级兜底，保证只要 URL 带完整 id 就能识别
function pixelParams(url) {
  const raw = url.search.replace(/&amp;/g, "&");
  const p = new URLSearchParams(raw);
  // URLSearchParams 会解码 %26 等转义，可能把后续参数并进值里，截断处理
  let wxId = (p.get("wxId") || "").split("&")[0];
  let id = p.get("id") || "";
  if (!/^[0-9a-fA-F]{64}$/.test(id)) id = "";
  if (!wxId || !id) {
    let decoded = "";
    try {
      decoded = decodeURIComponent(raw).replace(/&amp;/g, "&");
    } catch {}
    if (!wxId) {
      const m = /(?:^|[?&])wxId=([^&"<\s]+)/.exec(decoded);
      if (m) wxId = m[1];
    }
    if (!id) {
      const m = /(?:^|[?&])id=([0-9a-fA-F]{64})(?:&|$)/.exec(decoded);
      if (m) id = m[1];
    }
  }
  return { wxId, id };
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const params = url.searchParams;

  const session = await extractSession(request, env);
  const isAdmin = session ? isAdminUser(session.wxId, env) : false;

  // ── 公开端点（无需会话）──

  // GET /auth/status
  if (path === "/auth/status" && request.method === "GET") {
    return json({
      auth_required: true,
      invite_required: !!env.INVITE_CODE,
    });
  }

  // GET /pixel：追踪像素（对已注册的消息才记录读取）
  if (path === "/pixel" && request.method === "GET") {
    const { wxId, id } = pixelParams(url);
    if (!wxId || !id || wxId.length > 64 || id.length > 64) {
      return new Response("Bad Request", { status: 400, headers: { ...SECURITY_HEADERS } });
    }
    const ip = getClientIP(request);
    if (ip === "unknown") {
      return new Response("Bad Request", { status: 400, headers: { ...SECURITY_HEADERS } });
    }
    if (!(await rateLimit("pixel:" + ip, PIXEL_RATE_LIMIT, 60, false))) {
      return new Response("Too Many Requests", { status: 429, headers: { ...SECURITY_HEADERS } });
    }
    const msg = await env.DB.prepare("SELECT 1 FROM messages WHERE id = ? AND wx_id = ?")
      .bind(id, wxId)
      .first();
    if (!msg) {
      return new Response("Not Found", { status: 404, headers: { ...SECURITY_HEADERS } });
    }
    const ts = nowTimestamp();
    await env.DB.prepare(
      "INSERT OR IGNORE INTO reads (id, wx_id, ip, timestamp) VALUES (?, ?, ?, ?)"
    )
      .bind(id, wxId, ip, ts)
      .run();
    return new Response(PNG_1x1, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": "67",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        ...SECURITY_HEADERS,
      },
    });
  }

  // POST /auth/register：自助注册（wxid 即账号）
  if (path === "/auth/register" && request.method === "POST") {
    const ip = getClientIP(request);
    if (!(await rateLimit("register:" + ip, AUTH_RATE_LIMIT, 60, true))) {
      return json({ error: "Too many attempts. Try again later." }, 429);
    }
    const formData = await request.formData();
    const wxId = String(formData.get("wxId") || "").trim();
    const password = String(formData.get("password") || "");
    const password2 = String(formData.get("password2") || "");
    const invite = String(formData.get("invite") || "").trim();
    if (!WXID_RE.test(wxId)) {
      return json({ error: "wxId must match pattern: wxid_ followed by 14 lowercase letters/digits (e.g. wxid_abc123def4567g)" }, 400);
    }
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      return json({ error: `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters` }, 400);
    }
    if (password === wxId) {
      return json({ error: "Password cannot be the same as wxId" }, 400);
    }
    if (password !== password2) {
      return json({ error: "Passwords do not match" }, 400);
    }
    if (env.INVITE_CODE) {
      if (!(await safeEquals(invite, env.INVITE_CODE))) {
        await sleep(250 + Math.random() * 500);
        return json({ error: "Invalid invite code" }, 403);
      }
    }
    const existing = await env.DB.prepare("SELECT 1 FROM users WHERE wx_id = ?").bind(wxId).first();
    if (existing) {
      return json({ error: "This wxId is already registered" }, 409);
    }
    const stored = await hashPassword(password);
    const res = await env.DB
      .prepare("INSERT INTO users (wx_id, password_hash, level, created_at) VALUES (?, ?, 1, ?)")
      .bind(wxId, stored, nowTimestamp())
      .run();
    if (!res || !res.success) {
      return json({ error: "Registration failed" }, 500);
    }
    await audit(env.DB, "user_register", wxId);
    const cookie = await createSessionCookie(env.DB, wxId);
    if (!cookie) return json({ error: "Session creation failed" }, 500);
    return jsonWithCookie({ ok: true, redirect: "/" }, cookie);
  }

  // POST /auth/verify：wxid + 密码登录
  if (path === "/auth/verify" && request.method === "POST") {
    const ip = getClientIP(request);
    if (!(await rateLimit("verify:" + ip, AUTH_RATE_LIMIT, 60, true))) {
      return json({ error: "Too Many Requests" }, 429);
    }
    const formData = await request.formData();
    const wxId = String(formData.get("wxId") || "").trim();
    const password = String(formData.get("password") || "");
    const user = await env.DB.prepare("SELECT wx_id, password_hash FROM users WHERE wx_id = ?")
      .bind(wxId)
      .first();
    const ok = user && (await passwordMatches(password, user.password_hash));
    if (!ok) {
      // 失败延迟：进一步抬高暴力破解成本
      await sleep(250 + Math.random() * 500);
      return json({ error: "Invalid wxId or password" }, 401);
    }
    const cookie = await createSessionCookie(env.DB, wxId);
    if (!cookie) return json({ error: "Session creation failed" }, 500);
    return jsonWithCookie({ ok: true, redirect: "/" }, cookie);
  }

  // POST /auth/logout：销毁会话
  if (path === "/auth/logout" && request.method === "POST") {
    await destroySession(request, env.DB);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "__Host-session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        ...SECURITY_HEADERS,
      },
    });
  }

  // ── 客户端 API（公开，无需登录，通过 wxId 指定账号）──
  // 兼容无登录流程的客户端（如 WeKit）：请求体 / 参数中显式携带 wxId

  // POST /register：注册消息（wxid 必须是已注册账号）
  if (path === "/register" && request.method === "POST") {
    const ip = getClientIP(request);
    // fail-open：客户端注册失败只是静默丢一条，不应因限流故障断送功能
    if (!(await rateLimit("regmsg:" + ip, REGISTER_RATE_LIMIT, 60, false))) {
      return json({ error: "Too Many Requests" }, 429);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const { wxId, content, createTime } = body;
    if (!wxId || !content || createTime == null) {
      return json({ error: "Missing fields: wxId, content, createTime" }, 400);
    }
    if (
      typeof wxId !== "string" ||
      wxId.length > 64 ||
      typeof content !== "string" ||
      content.length > MESSAGE_CONTENT_MAX
    ) {
      return json(
        {
          error: `Invalid fields: wxId (string ≤64 chars), content (string ≤${MESSAGE_CONTENT_MAX} chars)`,
        },
        400
      );
    }
    // 仅允许已注册账号注册消息
    const user = await env.DB.prepare("SELECT level FROM users WHERE wx_id = ?").bind(wxId).first();
    if (!user) {
      return json({ error: "Forbidden: wxId is not registered" }, 403);
    }
    // 等级为 0 等同于拉黑，禁止注册消息
    if (user.level === 0) {
      return json({ error: "Forbidden: account is blocked (level 0)" }, 403);
    }
    const id = await computeId(wxId, content, createTime);
    const ts = nowTimestamp();
    const res = await env.DB.prepare(
      "INSERT OR IGNORE INTO messages (id, wx_id, content, timestamp) VALUES (?, ?, ?, ?)"
    )
      .bind(id, wxId, content, ts)
      .run();
    // 仅新插入时执行等级配额清理（重复注册同一消息不触发，避免误删数据）
    if (res?.meta?.changes > 0) {
      await enforceQuota(env.DB, wxId, user.level);
    }
    return json({ id });
  }

  // GET /count：获取消息的去重已读次数
  if (path === "/count" && request.method === "GET") {
    const wxId = params.get("wxId") || "";
    const id = params.get("id") || "";
    if (!wxId || !id) return json({ error: "Missing wxId or id" }, 400);
    // 查看即惰性清理（等级配额 / 过期消息）
    const user = await env.DB.prepare("SELECT level FROM users WHERE wx_id = ?").bind(wxId).first();
    if (user) {
      await enforceQuota(env.DB, wxId, user.level);
    }
    const msg = await env.DB.prepare("SELECT 1 FROM messages WHERE id = ? AND wx_id = ?")
      .bind(id, wxId)
      .first();
    if (!msg) return json({ error: "Not Found" }, 404);
    const result = await env.DB.prepare(
      "SELECT COUNT(DISTINCT ip) AS cnt FROM reads WHERE id = ? AND wx_id = ?"
    )
      .bind(id, wxId)
      .first();
    return json({ count: result?.cnt || 0 });
  }

  // ── 需要会话的端点 ──
  if (!session) {
    if (path === "/") {
      return new Response(LOGIN_HTML, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": LOGIN_CSP,
          ...SECURITY_HEADERS,
        },
      });
    }
    return new Response("Unauthorized", { status: 401, headers: { ...SECURITY_HEADERS } });
  }

  // POST /auth/password：修改自己的密码
  if (path === "/auth/password" && request.method === "POST") {
    const ip = getClientIP(request);
    if (!(await rateLimit("passwd:" + ip, AUTH_RATE_LIMIT, 60, true))) {
      return json({ error: "Too Many Requests" }, 429);
    }
    const body = await request.json();
    const oldP = String(body.oldPassword || "");
    const newP = String(body.newPassword || "");
    const user = await env.DB.prepare("SELECT password_hash FROM users WHERE wx_id = ?")
      .bind(session.wxId)
      .first();
    if (!user || !(await passwordMatches(oldP, user.password_hash))) {
      return json({ error: "Current password is incorrect" }, 403);
    }
    if (
      newP.length < PASSWORD_MIN ||
      newP.length > PASSWORD_MAX ||
      newP === session.wxId
    ) {
      return json(
        { error: `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters and different from wxId` },
        400
      );
    }
    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE wx_id = ?")
      .bind(await hashPassword(newP), session.wxId)
      .run();
    await audit(env.DB, "password_change", session.wxId);
    await revokeOtherSessions(request, env.DB, session.wxId);
    return json({ ok: true });
  }

  // GET /leaderboard：注册消息数排行榜（日榜/总榜，仅前十，wxid 服务端脱敏，me 标记本人行）
  if (path === "/leaderboard" && request.method === "GET") {
    const scope = params.get("scope") || "total";
    if (scope !== "day" && scope !== "total") {
      return json({ error: "Invalid scope: must be day or total" }, 400);
    }
    let query = "SELECT wx_id, COUNT(*) AS cnt FROM messages";
    const bind = [];
    if (scope === "day") {
      // 日榜按中国时区（UTC+8）自然日划分
      query += " WHERE timestamp >= ?";
      bind.push(chinaDayStartTimestamp());
    }
    query += " GROUP BY wx_id ORDER BY cnt DESC, wx_id ASC LIMIT 10";
    const result = await env.DB.prepare(query).bind(...bind).all();
    const rows = result.results || [];
    return json(
      rows.map((r) => ({
        wxId: maskWxId(r.wx_id),
        count: r.cnt,
        me: r.wx_id === session.wxId,
      }))
    );
  }

  // ── 管理员端点 ──
  if (isAdmin) {
    // GET /admin：管理后台页面
    if (path === "/admin" && request.method === "GET") {
      return new Response(adminPage(session), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": DASHBOARD_CSP,
          ...SECURITY_HEADERS,
        },
      });
    }

    // GET /admin/users：用户列表
    if (path === "/admin/users" && request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT wx_id AS wxId, level, created_at AS createdAt FROM users ORDER BY created_at DESC"
      ).all();
      return json(result.results || []);
    }

    // POST /admin/level：调整用户等级
    if (path === "/admin/level" && request.method === "POST") {
      const body = await request.json();
      const wxId = String(body.wxId || "");
      const level = Number(body.level);
      if (!wxId || !Number.isInteger(level) || level < 0 || level > LEVEL_MAX) {
        return json({ error: `Invalid wxId or level (must be integer 0-${LEVEL_MAX})` }, 400);
      }
      const res = await env.DB.prepare("UPDATE users SET level = ? WHERE wx_id = ?")
        .bind(level, wxId)
        .run();
      if (!res?.success || (res.meta?.changes ?? 0) === 0) {
        return json({ error: "User not found" }, 404);
      }
      // 等级 0 = 拉黑：立即清空其全部消息与已读记录（账号保留）
      if (level === 0) {
        await env.DB.prepare("DELETE FROM reads WHERE wx_id = ?").bind(wxId).run();
        await env.DB.prepare("DELETE FROM messages WHERE wx_id = ?").bind(wxId).run();
      }
      await audit(env.DB, "set_level", level === 0 ? `${wxId} -> 0 (data wiped)` : `${wxId} -> ${level}`);
      return json({ ok: true });
    }

    // POST /admin/password：为任意用户设置新密码
    if (path === "/admin/password" && request.method === "POST") {
      const body = await request.json();
      const wxId = String(body.wxId || "");
      const password = String(body.password || "");
      if (!wxId) return json({ error: "Missing wxId" }, 400);
      if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX || password === wxId) {
        return json(
          { error: `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters and different from wxId` },
          400
        );
      }
      const exists = await env.DB.prepare("SELECT 1 FROM users WHERE wx_id = ?").bind(wxId).first();
      if (!exists) return json({ error: "User not found" }, 404);
      await env.DB.prepare("UPDATE users SET password_hash = ? WHERE wx_id = ?")
        .bind(await hashPassword(password), wxId)
        .run();
      await audit(env.DB, "admin_set_password", wxId);
      await revokeOtherSessions(request, env.DB, wxId);
      return json({ ok: true });
    }

    // DELETE /admin/users/{wxId}：删除用户及其全部数据
    const adminUserMatch = path.match(/^\/admin\/users\/([^/]+)$/);
    if (adminUserMatch && request.method === "DELETE") {
      let wxId;
      try {
        wxId = decodeURIComponent(adminUserMatch[1]);
      } catch {
        return json({ error: "Invalid wxId encoding" }, 400);
      }
      if (wxId === session.wxId) {
        return json({ error: "You cannot delete your own account" }, 400);
      }
      if (isAdminUser(wxId, env)) {
        return json(
          { error: "This wxId is in the ADMIN list; remove it from the ADMIN variable first" },
          400
        );
      }
      await env.DB.prepare("DELETE FROM reads WHERE wx_id = ?").bind(wxId).run();
      await env.DB.prepare("DELETE FROM messages WHERE wx_id = ?").bind(wxId).run();
      await env.DB.prepare("DELETE FROM sessions WHERE wx_id = ?").bind(wxId).run();
      await env.DB.prepare("DELETE FROM users WHERE wx_id = ?").bind(wxId).run();
      await audit(env.DB, "user_delete", wxId);
      return json({ ok: true });
    }

    // GET /admin/messages：全量消息（可按 wxId / 内容过滤）
    if (path === "/admin/messages" && request.method === "GET") {
      const q = (params.get("q") || "").slice(0, 200);
      const fwx = (params.get("wxId") || "").slice(0, 64);
      const result = await env.DB.prepare(
        `SELECT m.id, m.wx_id AS wxId, m.content, m.timestamp, COUNT(DISTINCT r.ip) AS reads
         FROM messages m LEFT JOIN reads r ON m.id = r.id
         WHERE (? = '' OR m.wx_id = ?) AND (? = '' OR m.content LIKE ? ESCAPE '\\')
         GROUP BY m.id ORDER BY m.timestamp DESC`
      )
        .bind(fwx, fwx, q, `%${escapeLike(q)}%`)
        .all();
      return json(result.results || []);
    }

    // DELETE /admin/messages?wxId=xxx：删除某用户的全部数据
    if (path === "/admin/messages" && request.method === "DELETE") {
      const wxId = (params.get("wxId") || "").slice(0, 64);
      if (!wxId) return json({ error: "Missing wxId param" }, 400);
      await env.DB.prepare("DELETE FROM reads WHERE wx_id = ?").bind(wxId).run();
      await env.DB.prepare("DELETE FROM messages WHERE wx_id = ?").bind(wxId).run();
      await audit(env.DB, "admin_delete_wxid", wxId);
      return json({ ok: true });
    }

    // DELETE /admin/messages/{id}：删除单条消息及其读取记录
    const adminMsgMatch = path.match(/^\/admin\/messages\/([^/]+)$/);
    if (adminMsgMatch && request.method === "DELETE") {
      let id;
      try {
        id = decodeURIComponent(adminMsgMatch[1]);
      } catch {
        return json({ error: "Invalid id encoding" }, 400);
      }
      await env.DB.prepare("DELETE FROM reads WHERE id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
      await audit(env.DB, "admin_delete_message", id);
      return json({ ok: true });
    }

    // GET /admin/reads/{id}：查看任意消息的读取详情
    const adminReadsMatch = path.match(/^\/admin\/reads\/([^/]+)$/);
    if (adminReadsMatch && request.method === "GET") {
      let id;
      try {
        id = decodeURIComponent(adminReadsMatch[1]);
      } catch {
        return json({ error: "Invalid id encoding" }, 400);
      }
      const result = await env.DB.prepare(
        "SELECT ip, timestamp FROM reads WHERE id = ? ORDER BY timestamp DESC"
      )
        .bind(id)
        .all();
      return json(result.results || []);
    }
  }

  // ── 普通用户数据端点（强制限定本人 wxid）──
  // 注意：/register（注册消息）和 /count 已移至上方公开端点，供无登录流程的客户端使用

  // GET/DELETE /messages：本人全部消息
  if (path === "/messages" && request.method === "GET") {
    await enforceQuota(env.DB, session.wxId, session.level);
    const q = (params.get("q") || "").slice(0, 200);
    let query = `SELECT m.id, m.wx_id AS wxId, m.content, m.timestamp, COUNT(DISTINCT r.ip) AS reads
      FROM messages m LEFT JOIN reads r ON m.id = r.id
      WHERE m.wx_id = ?`;
    const bindParams = [session.wxId];
    if (q) {
      query += " AND m.content LIKE ? ESCAPE '\\'";
      bindParams.push(`%${escapeLike(q)}%`);
    }
    query += " GROUP BY m.id ORDER BY m.timestamp DESC";
    const result = await env.DB.prepare(query).bind(...bindParams).all();
    return json(result.results || []);
  }

  if (path === "/messages" && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM reads WHERE wx_id = ?").bind(session.wxId).run();
    await env.DB.prepare("DELETE FROM messages WHERE wx_id = ?").bind(session.wxId).run();
    await audit(env.DB, "delete_all", session.wxId);
    return json({ status: "ok" });
  }

  // GET/DELETE /messages/{wxId}：本人指定发送者（必须等于自己）
  const wxIdMatch = path.match(/^\/messages\/([^/]+)$/);
  if (wxIdMatch && (request.method === "GET" || request.method === "DELETE")) {
    let wxId;
    try {
      wxId = decodeURIComponent(wxIdMatch[1]);
    } catch {
      return json({ error: "Invalid wxId encoding" }, 400);
    }
    if (wxId !== session.wxId) {
      return json({ error: "Forbidden: wxId must match your account" }, 403);
    }
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM reads WHERE wx_id = ?").bind(wxId).run();
      await env.DB.prepare("DELETE FROM messages WHERE wx_id = ?").bind(wxId).run();
      await audit(env.DB, "delete_wxid", wxId);
      return json({ status: "ok" });
    }
    await enforceQuota(env.DB, wxId, session.level);
    const q = (params.get("q") || "").slice(0, 200);
    let query = `SELECT m.id, m.wx_id AS wxId, m.content, m.timestamp, COUNT(DISTINCT r.ip) AS reads
      FROM messages m LEFT JOIN reads r ON m.id = r.id
      WHERE m.wx_id = ?`;
    const bindParams = [wxId];
    if (q) {
      query += " AND m.content LIKE ? ESCAPE '\\'";
      bindParams.push(`%${escapeLike(q)}%`);
    }
    query += " GROUP BY m.id ORDER BY m.timestamp DESC";
    const result = await env.DB.prepare(query).bind(...bindParams).all();
    return json(result.results || []);
  }

  // GET /reads/{id}：本人消息的读取详情（先校验归属）
  const readsMatch = path.match(/^\/reads\/([^/]+)$/);
  if (readsMatch && request.method === "GET") {
    let id;
    try {
      id = decodeURIComponent(readsMatch[1]);
    } catch {
      return json({ error: "Invalid id encoding" }, 400);
    }
    const msg = await env.DB.prepare("SELECT wx_id FROM messages WHERE id = ?").bind(id).first();
    if (!msg || msg.wx_id !== session.wxId) {
      return json({ error: "Not Found" }, 404);
    }
    await enforceQuota(env.DB, session.wxId, session.level);
    const result = await env.DB.prepare(
      "SELECT ip, timestamp FROM reads WHERE id = ? ORDER BY timestamp DESC"
    )
      .bind(id)
      .all();
    return json(result.results || []);
  }

  // GET /：仪表盘（已登录）
  if (path === "/" && request.method === "GET") {
    return new Response(htmlPage(session), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": DASHBOARD_CSP,
        ...SECURITY_HEADERS,
      },
    });
  }

  // /admin 被非管理员访问
  if (path === "/admin") {
    return new Response("Forbidden", { status: 403, headers: { ...SECURITY_HEADERS } });
  }

  // ── favicon.ico (no-op) ──
  if (path === "/favicon.ico") {
    return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS } });
  }

  return new Response("Not Found", { status: 404, headers: { ...SECURITY_HEADERS } });
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (e) {
      console.error("Unhandled error:", e);
      return json({ error: e?.message || "Internal Server Error" }, 500);
    }
  },

  // 定时清理：过期会话、审计日志、孤儿已读记录
  async scheduled(event, env) {
    try {
      await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?")
        .bind(nowTimestamp())
        .run();
      const auditCutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_DAYS * 86400000)
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);
      await env.DB.prepare("DELETE FROM audit_logs WHERE timestamp < ?").bind(auditCutoff).run();
      await env.DB.prepare("DELETE FROM reads WHERE id NOT IN (SELECT id FROM messages)").run();
    } catch {}
  },
};
