import { PBKDF2_ITERATIONS, SECURITY_HEADERS } from "./config.js";

// ── 基础工具 ────────────────────────────────────────────

export const enc = new TextEncoder();

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

export function jsonWithCookie(data, cookie, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
      ...SECURITY_HEADERS,
    },
  });
}

export function getClientIP(request) {
  // 只信任 Cloudflare 注入的真实客户端 IP；不接受客户端可控的 X-Forwarded-For
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export function nowTimestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export async function sha256Hex(input) {
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function randomHex(bytes) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// PBKDF2-SHA256 密码哈希：pbkdf2$<iterations>$<salt_hex>$<hash_hex>
export async function pbkdf2Hash(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
    key,
    256
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password) {
  const saltHex = await randomHex(16);
  const hash = await pbkdf2Hash(password, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hash}`;
}

// 常量时间比较：先做 SHA-256 摘要再比较，避免逐字符比较的时序侧信道
export async function safeEquals(input, expected) {
  const a = await sha256Hex(String(input));
  const b = await sha256Hex(String(expected));
  return a === b;
}

export async function passwordMatches(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;
  const a = await pbkdf2Hash(password, parts[2], iterations);
  const b = await sha256Hex(parts[3]);
  return (await sha256Hex(a)) === b;
}

export async function computeId(wxId, content, createTime) {
  const raw = wxId + "\0" + content + "\0" + String(createTime);
  return sha256Hex(raw);
}

// LIKE 通配符转义：将 % _ \ 作为字面量搜索
export function escapeLike(s) {
  return String(s).replace(/[\\%_]/g, (m) => "\\" + m);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 基于 Cache API 的固定窗口限流（近似计数：并发请求存在微小 TOCTOU 偏差，
// 对登录限流仅弱化不失效，可接受）。failClosed=true：故障时拒绝；false：放行。
export async function rateLimit(key, limit, windowSec, failClosed = false) {
  const url = `https://internal.ratelimit.local/${encodeURIComponent(key)}`;
  try {
    const cache = caches.default;
    const cached = await cache.match(url);
    let count = 0;
    if (cached) {
      const data = await cached.json();
      count = Number(data.count) || 0;
    }
    if (count >= limit) return false;
    await cache.put(
      url,
      new Response(JSON.stringify({ count: count + 1 }), {
        headers: { "Cache-Control": `max-age=${windowSec}` },
      })
    );
    return true;
  } catch {
    return !failClosed;
  }
}

// 管理操作审计日志
export async function audit(db, action, detail) {
  try {
    await db
      .prepare("INSERT INTO audit_logs (timestamp, action, detail) VALUES (?, ?, ?)")
      .bind(nowTimestamp(), action, String(detail).slice(0, 500))
      .run();
  } catch {}
}

// 中国时区（UTC+8）当日日期 YYYY-MM-DD（日榜按中国自然日划分）
export function chinaDate() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

// 中国时区（UTC+8）当日 0 点对应的 UTC 时间戳，格式与 timestamp 列一致（YYYY-MM-DD HH:MM:SS），可直接比较
export function chinaDayStartTimestamp() {
  const nowCn = new Date(Date.now() + 8 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  const ms = Date.UTC(nowCn.getUTCFullYear(), nowCn.getUTCMonth(), nowCn.getUTCDate()) - 8 * 3600 * 1000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

// 用户名脱敏：wxid 开头保留 "wxid_" + 前 1 位 + 后 3 位，中间用星号掩盖（仅服务端调用，避免完整 wxid 暴露到前端）
export function maskWxId(wxId) {
  const s = String(wxId || "");
  if (!/^wxid_/i.test(s)) return s;
  return s.slice(0, 7) + "***" + s.slice(-3);
}
