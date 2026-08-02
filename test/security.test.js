const fs = require("fs");
const vm = require("vm");

// ── 模拟环境 ──
const cacheStore = new Map();
const fakeCaches = {
  default: {
    async match(url) {
      const hit = cacheStore.get(url);
      if (!hit) return undefined;
      if (Date.now() > hit.exp) {
        cacheStore.delete(url);
        return undefined;
      }
      return { async json() { return { count: hit.count }; } };
    },
    async put(url, resp) {
      const data = await resp.json();
      const m = String(resp.headers.get("Cache-Control")).match(/max-age=(\d+)/);
      cacheStore.set(url, { count: data.count, exp: Date.now() + Number(m[1]) * 1000 });
    },
  },
};

function makeDB(opts = {}) {
  const { registered = true, sessionValid = true, runFail = false } = opts;
  const calls = [];
  const db = {
    calls,
    prepare(sql) {
      return {
        _sql: sql,
        _args: null,
        bind(...args) {
          this._args = args;
          return this;
        },
        async first() {
          calls.push(["first", this._sql, this._args]);
          if (this._sql.includes("sessions WHERE token_hash"))
            return sessionValid ? { expires_at: "2099-01-01 00:00:00" } : null;
          if (this._sql.includes("SELECT 1 FROM messages"))
            return registered ? { "1": 1 } : null;
          if (this._sql.includes("COUNT(DISTINCT ip)")) return { cnt: 2 };
          return null;
        },
        async all() {
          calls.push(["all", this._sql, this._args]);
          return { results: [] };
        },
        async run() {
          calls.push(["run", this._sql, this._args]);
          if (runFail && this._sql.includes("INSERT INTO sessions")) {
            return { success: false, meta: { changes: 0 } };
          }
          return { success: true, meta: { changes: 1 } };
        },
      };
    },
  };
  return db;
}

// ── 加载 worker.js（export default → __worker）──
let src = fs.readFileSync("worker.js", "utf8").replace("export default {", "__worker = {");
const ctx = vm.createContext({
  URL, Headers, Request, Response, FormData, TextEncoder,
  crypto, setTimeout, console,
  Promise, Uint8Array, Array, Date, JSON, Math, String, Number,
  encodeURIComponent, decodeURIComponent, RegExp, Map, Set, Object, Boolean,
  caches: fakeCaches, __worker: null,
});
vm.runInContext(src, ctx);

const worker = ctx.__worker;
const STRONG = "0123456789abcdef0123456789abcdef"; // 32 chars

function req(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("CF-Connecting-IP")) headers.set("CF-Connecting-IP", "203.0.113.7");
  return new Request("https://test.example" + url, { ...opts, headers });
}
async function call(url, env, opts = {}) {
  return worker.fetch(req(url, opts), env);
}
function hasHeader(resp, name) {
  return resp.headers.get(name) !== null;
}

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("  ✓", name); }
  else { fail++; console.log("  ✗ FAIL:", name, extra); }
}

(async () => {
  console.log("── A. 开放模式（未配置 AUTH_TOKEN）──");
  {
    const env = { DB: makeDB() };
    const r = await call("/messages", env);
    check("GET /messages → 200", r.status === 200);
    const r2 = await call("/auth/status", env);
    check("auth_required=false", (await r2.json()).auth_required === false);
  }

  console.log("── B. 弱 token（<24 字符）──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: "short" };
    const r = await call("/messages", env);
    check("GET /messages → 503", r.status === 503);
    const r2 = await call("/auth/verify", env, { method: "POST", body: new FormData() });
    check("POST /auth/verify → 503", r2.status === 503);
    const r3 = await call("/pixel?wxId=w&id=dummyid1234567890", env);
    check("GET /pixel → 200（公开不受影响）", r3.status === 200);
  }

  console.log("── B2. 数字类型 token（TOML [vars] 整数）──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: 123456 }; // 非字符串弱 token
    const r = await call("/messages", env);
    check("数字 token → 503（不再绕过弱配置防护）", r.status === 503);
    const r2 = await call("/messages", env, { headers: { Authorization: "Bearer 123456" } });
    check("数字 token 带 Bearer → 仍 503", r2.status === 503);
  }

  console.log("── C. Bearer 认证 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    const ok = await call("/messages", env, { headers: { Authorization: "Bearer " + STRONG } });
    check("正确 Bearer → 200", ok.status === 200);
    const bad = await call("/messages", env, { headers: { Authorization: "Bearer wrong" } });
    check("错误 Bearer → 401", bad.status === 401);
    const none = await call("/messages", env);
    check("无凭证 → 401", none.status === 401);
    const h = await call("/count?wxId=w&id=x", env, { headers: { Authorization: "Bearer " + STRONG } });
    check("JSON 响应含 X-Content-Type-Options", hasHeader(h, "X-Content-Type-Options"));
    check("JSON 响应含 Referrer-Policy", hasHeader(h, "Referrer-Policy"));
  }

  console.log("── D. cookie 认证 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    const legacy = await call("/messages", env, { headers: { Cookie: "auth_token=" + STRONG } });
    check("旧格式 cookie → 200", legacy.status === 200);
    const sess = await call("/messages", env, { headers: { Cookie: "__Host-session=sess_abcdef" } });
    check("新会话 cookie（有效）→ 200", sess.status === 200);
    const env2 = { DB: makeDB({ sessionValid: false }), AUTH_TOKEN: STRONG };
    const expired = await call("/messages", env2, { headers: { Cookie: "__Host-session=sess_abcdef" } });
    check("会话已过期 → 401", expired.status === 401);
    const prefix = await call("/messages", env, { headers: { Cookie: "x__Host-session=sess_abcdef" } });
    check("前缀混淆 cookie → 401", prefix.status === 401);
  }

  console.log("── E. /auth/verify 登录流程 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    cacheStore.clear();
    const fd = new FormData();
    fd.set("token", "wrong-token");
    const t0 = Date.now();
    const bad = await call("/auth/verify", env, { method: "POST", body: fd });
    const elapsed = Date.now() - t0;
    check("错误 token → 401", bad.status === 401);
    check("失败延迟 ≥250ms（实测 " + elapsed + "ms）", elapsed >= 250);
    const fd2 = new FormData();
    fd2.set("token", STRONG);
    const ok = await call("/auth/verify", env, { method: "POST", body: fd2 });
    check("正确 token → 302", ok.status === 302);
    const sc = ok.headers.get("Set-Cookie") || "";
    check("Set-Cookie 为 __Host-session 且含 Secure", sc.includes("__Host-session=sess_") && sc.includes("Secure"));
    check("Set-Cookie 含 HttpOnly+SameSite=Lax", sc.includes("HttpOnly") && sc.includes("SameSite=Lax"));
    const insertCall = env.DB.calls.find(([op, sql]) => op === "run" && sql.includes("INSERT INTO sessions"));
    check("sessions 表收到 INSERT（存哈希）", !!insertCall);
    const hashArg = insertCall ? insertCall[2][0] : "";
    check("session 以 SHA-256 哈希存储（64 hex）", /^[0-9a-f]{64}$/.test(hashArg));
  }

  console.log("── E2. 会话持久化失败（不下发无效 cookie）──");
  {
    const env = { DB: makeDB({ runFail: true }), AUTH_TOKEN: STRONG };
    cacheStore.clear();
    const fd = new FormData();
    fd.set("token", STRONG);
    const r = await call("/auth/verify", env, { method: "POST", body: fd });
    check("会话写入失败 → 500", r.status === 500);
    check("不下发 Set-Cookie", (r.headers.get("Set-Cookie") || "").length === 0);
    check("Location 不指向 /（无跳转）", (r.headers.get("Location") || "") === "");
  }

  console.log("── F. /auth/verify 限流 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    cacheStore.clear();
    const fd = new FormData();
    fd.set("token", "wrong");
    let last = null;
    for (let i = 0; i < 6; i++) last = await call("/auth/verify", env, { method: "POST", body: fd });
    check("第 6 次尝试（限 5 次/分）→ 429", last.status === 429);
  }

  console.log("── G. /pixel 注册校验与去重 ──");
  {
    const env = { DB: makeDB({ registered: false }), AUTH_TOKEN: STRONG };
    const r = await call("/pixel?wxId=w&id=someid", env);
    check("未注册消息 → 404", r.status === 404);
    const ins = env.DB.calls.filter(([op, sql]) => op === "run" && sql.includes("INSERT INTO reads"));
    check("未注册消息不写 reads 表", ins.length === 0);
    const env2 = { DB: makeDB({ registered: true }), AUTH_TOKEN: STRONG };
    const r2 = await call("/pixel?wxId=w&id=someid", env2);
    check("已注册消息 → 200 PNG", r2.status === 200 && r2.headers.get("Content-Type") === "image/png");
    const ins2 = env2.DB.calls.find(([op, sql]) => op === "run" && sql.includes("INSERT OR IGNORE INTO reads"));
    check("写入使用 INSERT OR IGNORE（配合唯一索引去重）", !!ins2);
    check("PNG 响应含 no-store 缓存头", (r2.headers.get("Cache-Control") || "").includes("no-store"));
  }

  console.log("── H. /pixel 限流 ──");
  {
    const env = { DB: makeDB({ registered: true }), AUTH_TOKEN: STRONG };
    cacheStore.clear();
    let last = null;
    for (let i = 0; i < 11; i++) last = await call("/pixel?wxId=w&id=someid", env);
    check("第 11 次请求（限 10 次/分）→ 429", last.status === 429);
  }

  console.log("── I. /register 输入校验 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    const long = await call("/register", env, {
      method: "POST",
      headers: { Authorization: "Bearer " + STRONG, "Content-Type": "application/json" },
      body: JSON.stringify({ wxId: "w", content: "x".repeat(4001), createTime: 1 }),
    });
    check("content 超 4000 → 400", long.status === 400);
    const miss = await call("/register", env, {
      method: "POST",
      headers: { Authorization: "Bearer " + STRONG, "Content-Type": "application/json" },
      body: JSON.stringify({ wxId: "w" }),
    });
    check("缺字段 → 400", miss.status === 400);
  }

  console.log("── J. LIKE 通配符转义 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    await call("/messages?q=50%25_off", env, { headers: { Authorization: "Bearer " + STRONG } });
    const all = env.DB.calls.find(([op, sql]) => op === "all");
    check("LIKE 查询带 ESCAPE", all && all[1].includes("ESCAPE"));
    const arg = all ? all[2][0] : "";
    check("绑定参数已转义通配符: " + JSON.stringify(arg), arg === "%50\\%\\_off%");
  }

  console.log("── K. 审计与删除 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    await call("/messages", env, { method: "DELETE", headers: { Authorization: "Bearer " + STRONG } });
    const auditCall = env.DB.calls.find(([op, sql, args]) => op === "run" && sql.includes("audit_logs"));
    check("DELETE /messages 写入审计日志", !!auditCall);
    await call("/messages/" + encodeURIComponent("wx_%2Fid"), env, { method: "DELETE", headers: { Authorization: "Bearer " + STRONG } });
    const audit2 = env.DB.calls.filter(([op, sql]) => op === "run" && sql.includes("audit_logs"));
    check("DELETE /messages/{wxId} 写入审计日志", audit2.length === 2);
  }

  console.log("── L. 路径解码容错 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    const bad = await call("/messages/%zz", env, { headers: { Authorization: "Bearer " + STRONG } });
    check("非法 % 编码 → 400（非 500）", bad.status === 400);
  }

  console.log("── M. Dashboard 与登录页安全头 ──");
  {
    const env = { DB: makeDB(), AUTH_TOKEN: STRONG };
    const dash = await call("/", env, { headers: { Authorization: "Bearer " + STRONG } });
    check("Dashboard 含 CSP", hasHeader(dash, "Content-Security-Policy"));
    check("Dashboard 含 X-Frame-Options: DENY", dash.headers.get("X-Frame-Options") === "DENY");
    const login = await call("/", env);
    check("未认证访问 / → 登录页含 CSP", hasHeader(login, "Content-Security-Policy"));
  }

  console.log("── N. 直接调用辅助函数 ──");
  {
    check("tokenMatches 相等", await ctx.tokenMatches("abc", "abc") === true);
    check("tokenMatches 不等", await ctx.tokenMatches("abc", "abd") === false);
    check("tokenMatches 空串拒绝", await ctx.tokenMatches("", "abc") === false);
    check("escapeLike 转义 % _ \\", ctx.escapeLike("a%b_c\\d") === "a\\%b\\_c\\\\d");
    check("getClientIP 忽略 XFF 伪造", ctx.getClientIP({ headers: new Headers({ "X-Forwarded-For": "1.2.3.4" }) }) === "unknown");
    const withCF = { headers: new Headers({ "CF-Connecting-IP": "9.9.9.9", "X-Forwarded-For": "1.2.3.4" }) };
    check("getClientIP 取 CF-Connecting-IP", ctx.getClientIP(withCF) === "9.9.9.9");
  }

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("测试异常:", e); process.exit(1); });
