# Read Receipts Server

[English](README.en.md) | 简体中文

基于 **Cloudflare Workers** + **D1** 的消息已读统计服务。在消息中嵌入一个 1x1 透明追踪像素——当收件人打开消息时，服务记录其 IP，并返回去重后的已读次数。

> ⚠️ **隐私声明**：本服务会在对方不知情的情况下记录收件人的 IP 地址与精确打开时间。在中国，这属于《个人信息保护法》（PIPL）的管辖范围——追踪前请告知收件人，并考虑数据最小化（例如设置 `RETENTION_DAYS`）。微信服务条款禁止此类第三方追踪，你的账号可能面临风险。

## 工作原理

```
Sender                   Server                   Recipient
  |                        |                        |
  |-- POST /register ----->|                        |
  |<-- {id: sha256hex} ---|                        |
  |                        |                        |
  |  Embed pixel in message|                        |
  |                        |<--- Open message -------|
  |                        |   GET /pixel            |
  |                        |   Record reader IP      |
  |                        |                        |
  |-- GET /count --------->|                        |
  |<-- {count: 3} --------|                        |
```

> 图中 Sender = 发件人，Server = 服务器，Recipient = 收件人。

## 功能特性

- **确定性 ID** — 消息 ID = `SHA256(wxId + \0 + content + \0 + createTime)`，客户端与服务端独立计算，结果一致
- **IP 去重** — 同一 IP 多次打开只计为 1 次已读（通过存储层的唯一索引强制执行）
- **仪表盘** — 深色主题、响应式界面，支持 i18n（中文/English）、搜索、筛选、可展开的已读详情
- **Serverless（无服务器）** — 运行于 Cloudflare Workers 边缘网络，使用 D1 SQLite 数据库
- **零成本** — 免费额度内：每天 10 万次请求、D1 每天 5GB 读取

## API

| 方法 | 路径 | 鉴权 | 说明 |
|--------|------|------|-------------|
| POST | `/register` | Bearer | 注册消息，返回 `{id}` |
| GET | `/pixel?wxId=&id=` | — | 追踪像素（1x1 PNG），记录读者 IP（仅对已注册的消息生效） |
| GET | `/count?wxId=&id=` | Bearer | 获取去重后的已读次数 |
| GET | `/messages?q=` | Bearer | 列出所有消息及其已读次数 |
| DELETE | `/messages` | Bearer | 删除所有消息（记录审计日志） |
| GET | `/messages/{wxId}?q=` | Bearer | 按发送者列出消息 |
| DELETE | `/messages/{wxId}` | Bearer | 删除某发送者的全部消息（记录审计日志） |
| GET | `/reads/{id}` | Bearer | 获取某条消息的详细已读记录 |
| GET | `/` | Cookie | 仪表盘前端 |
| POST | `/auth/verify` | — | 提交 token，设置会话 cookie，重定向到 `/` |
| GET | `/auth/status` | — | 返回 `{auth_required: bool, weak_token: bool}` |

## 身份验证

服务端使用静态 token（`AUTH_TOKEN`）访问 API，仪表盘使用短期会话 cookie：

- **未设置** — 无需鉴权（开放访问）
- **已设置（≥ 24 字符）** — 除 `/pixel`、`/auth/verify`、`/auth/status`、`/favicon.ico` 之外的所有端点都需要鉴权
- **已设置（过短）** — 所有管理端点返回 `503`，直到 token 轮换为 ≥ 24 字符

### 登录流程

1. 访问 `/` → 跳转到登录页
2. 输入 token → POST 到 `/auth/verify` → 设置 `__Host-session` cookie（HttpOnly、Secure、SameSite=Lax，30 天）→ 重定向到 `/`
3. 服务端只存储会话 ID 的 SHA-256 哈希；cookie 本身从不包含 `AUTH_TOKEN`

旧版 `auth_token` cookie（其中包含原始 token）在其过期前仍会被接受，以保持向后兼容。

### API 访问

在 `Authorization` 请求头中携带 token：

```
Authorization: Bearer <REDACTED>
```

### 使用 Wrangler 配置

```bash
npx wrangler secret put AUTH_TOKEN   # 生成强 token：openssl rand -hex 32
```

## 安全特性

- **速率限制** — `/pixel`：每 IP 每分钟 10 次；`/auth/verify`：每 IP 每分钟 5 次（登录端点失败即拒绝，fail-closed）
- **已注册消息校验** — `/pixel` 忽略未注册消息的读取（阻止灌库攻击）
- **存储级去重** — `reads(id, ip)` 唯一索引 + `INSERT OR IGNORE`
- **恒定时间 token 比较** — 通过 SHA-256 摘要比较；登录失败附加随机延迟
- **会话 cookie** — 随机 ID、静态哈希、30 天有效期、`__Host-` 前缀、Secure/HttpOnly/SameSite=Lax
- **仅信任客户端 IP** — 只读取 `CF-Connecting-IP`；忽略客户端可控的请求头
- **安全响应头** — 所有响应均携带 CSP、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`
- **输入校验** — register 字段长度限制、LIKE 通配符转义、畸形 URL 处理
- **审计日志** — 每次批量/按发送者删除都会记录到 `audit_logs` 表
- **可选保留策略** — 设置 `RETENTION_DAYS` 可自动清理超过 N 天的消息/已读记录（每日 cron，默认 03:00 UTC）

## 部署

支持两种部署方式，按需选择。两种方式均无需手动配置 D1 数据库 ID：首次部署时自动创建并绑定（Automatic provisioning，需 Wrangler ≥ 4.45.0；ID 仅存于 dashboard，不写回仓库）。

### CLI

```bash
git clone https://github.com/lie-jiu/wekit-read-receipts-cf-workers
cd wekit-read-receipts-cf-workers
npx wrangler login
npx wrangler secret put AUTH_TOKEN   # openssl rand -hex 32
npx wrangler deploy                  # 首次部署自动创建 D1 数据库
```

部署完成后初始化数据库：

```bash
npx wrangler d1 execute read-receipts --file=./schema.sql --remote
```

> [!IMPORTANT]
> `schema.sql` 必须在首次部署后执行一次，否则所有接口都会因缺少数据表而报错。它是幂等的，升级时重跑即可。

> [!NOTE]
> 本地开发：`npx wrangler dev` 会自动创建本地 D1；本地密钥写在 `.dev.vars`（已被 `.gitignore` 排除）。

### Workers Builds（Git 集成）

1. fork 本仓库（或使用自己的仓库）
2. Cloudflare Dashboard → **Workers & Pages → Create → Worker**，选择 **Workers Builds**
3. **Connect to GitHub**，选择你的仓库；生产分支 `main`，构建命令留空
4. 创建后设置密钥：Worker → **Settings → Variables and Secrets** → 添加 `AUTH_TOKEN`（≥ 24 字符）
5. `git push` 到 `main` 自动构建部署；首次部署自动创建 D1 数据库
6. 在 D1 数据库 Console 执行一次 `schema.sql`

> [!NOTE]
> 可选 `RETENTION_DAYS` 变量，按天数自动清理过期数据。

### 升级现有部署

重新执行一次 `schema.sql`。它是幂等的，会：

- 创建 `sessions` 和 `audit_logs` 表
- 对现有 `reads` 行去重，并添加 `(id, ip)` 唯一索引
- （已重复打开过消息的现有读者只保留第一条记录）

现有 `auth_token` cookie 在其过期前保持可用；下次登录会签发会话 cookie。

## 项目结构

```
├── schema.sql          # D1 表定义 + 幂等迁移
├── worker.js           # Worker 源码（API 路由 + 仪表盘前端）
├── wrangler.toml       # Cloudflare Workers 配置（D1 绑定 + cron）
├── package.json
└── LICENSE
```

## 技术栈

- **运行时：** Cloudflare Workers（V8 isolates，全球边缘网络）
- **数据库：** Cloudflare D1（兼容 SQLite）
- **前端：** 原生 HTML/CSS/JS，无构建步骤，无依赖
- **哈希：** Web Crypto API（SHA-256）
- **速率限制：** Workers Cache API（固定窗口）

## 许可证

Apache-2.0
