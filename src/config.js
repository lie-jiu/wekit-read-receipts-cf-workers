// ── 常量 ────────────────────────────────────────────────
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 会话 30 天
export const PIXEL_RATE_LIMIT = 10; // /pixel：每 IP 每分钟最多 10 次
export const AUTH_RATE_LIMIT = 5; // 注册/登录/改密：每 IP 每分钟最多 5 次
export const REGISTER_RATE_LIMIT = 30; // 消息注册 /register：每 IP 每分钟最多 30 次
export const MESSAGE_CONTENT_MAX = 10000; // 单条消息内容最大长度（字符）
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PBKDF2_ITERATIONS = 100000; // 密码哈希迭代次数
export const LEVEL_MAX = 99;
export const AUDIT_LOG_RETENTION_DAYS = 30; // 审计日志保留天数
export const WXID_RE = /^wxid_[a-z0-9]{14}$/;

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

export const DASHBOARD_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

export const LOGIN_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data:",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");
