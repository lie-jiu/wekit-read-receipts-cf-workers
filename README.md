# Read Receipts Server

[English](README.en.md) | 简体中文

基于 **Cloudflare Workers** + **D1** 的消息已读统计服务。在消息中嵌入一个 1x1 透明追踪像素——当收件人打开消息时，服务记录其 IP，并返回去重后的已读次数。

> ⚠️ **隐私声明**：本服务会在对方不知情的情况下记录收件人的 IP 地址与精确打开时间。在中国，这属于《个人信息保护法》（PIPL）的管辖范围——追踪前请告知收件人，并考虑数据最小化（使用后请在后台清空数据）。微信服务条款禁止此类第三方追踪，你的账号可能面临风险。

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

- **多用户** — wxid 即账号，密码登录，数据严格隔离（每个用户只能看到自己的消息）
- **等级配额** — 新注册用户等级 1（保留 1 条消息 × 1 个月），等级 N 可保留 N 条 × N 个月（最大 99）。等级 0 = 拉黑：禁止注册消息，设为 0 时立即清空该账号数据。管理员可在后台调整用户等级（0–99）
- **邀请码** — 可选 `INVITE_CODE` 环境变量，配置后注册需填写邀请码
- **管理员后台** — `ADMIN` 账号可访问 `/admin` 管理用户、调整等级、删除数据
- **确定性 ID** — 消息 ID = `SHA256(wxId + \0 + content + \0 + createTime)`，客户端与服务端独立计算，结果一致
- **IP 去重** — 同一 IP 多次打开只计为 1 次已读（通过存储层的唯一索引强制执行）
- **仪表盘** — 深色主题、响应式界面，支持 i18n（中文/English）、搜索、筛选、可展开的已读详情、修改密码
- **Serverless（无服务器）** — 运行于 Cloudflare Workers 边缘网络，使用 D1 SQLite 数据库
- **零成本** — 免费额度内：每天 10 万次请求、D1 每天 5GB 读取

## API

| 方法 | 路径 | 鉴权 | 说明 |
|--------|------|------|-------------|
| POST | `/register` | — | 注册消息（无需登录，但 wxid 必须是已注册账号），返回 `{id}` |
| GET | `/pixel?wxId=&id=` | — | 追踪像素（1x1 PNG），记录读者 IP（仅对已注册的消息生效） |
| GET | `/count?wxId=&id=` | — | 获取消息的去重已读次数（无需登录，参数携带 wxId） |
| GET | `/messages?q=` | Cookie | 列出本人的全部消息及其已读次数 |
| DELETE | `/messages` | Cookie | 删除本人的全部消息（记录审计日志） |
| GET | `/messages/{wxId}?q=` | Cookie | 按发送者列出消息（仅限本人） |
| DELETE | `/messages/{wxId}` | Cookie | 删除某发送者的全部消息（仅限本人，记录审计日志） |
| GET | `/reads/{id}` | Cookie | 获取本人某条消息的详细已读记录 |
| GET | `/` | Cookie | 仪表盘前端（未登录跳转登录页） |
| GET | `/admin` | Cookie | 管理员后台（仅 `ADMIN` 账号） |
| POST | `/auth/register` | — | 注册账号（wxid + 密码 + 邀请码） |
| POST | `/auth/verify` | — | wxid + 密码登录，设置会话 cookie |
| POST | `/auth/logout` | Cookie | 销毁当前会话 |
| POST | `/auth/password` | Cookie | 修改自己的密码 |
| GET | `/auth/status` | — | 返回 `{auth_required: bool, invite_required: bool}` |
| GET | `/admin/users` | Admin | 列出所有用户 |
| POST | `/admin/level` | Admin | 调整用户等级 |
| POST | `/admin/password` | Admin | 为任意用户设置新密码 |
| DELETE | `/admin/users/{wxId}` | Admin | 删除用户及其全部数据 |
| GET | `/admin/messages` | Admin | 全量消息浏览 |
| DELETE | `/admin/messages?wxId=` | Admin | 删除某用户的全部数据 |
| DELETE | `/admin/messages/{id}` | Admin | 删除单条消息 |

## WeKit 客户端兼容性

本服务同时被 WeKit 客户端模块（第三方，不可修改）调用，它直接使用下面三个**无鉴权**端点，且仅依赖「wxId 已是已注册账号」这一前置条件：

- `POST /register` — 客户端在发送消息时提交消息明文（wxId + content + createTime）
- `GET /count` — 客户端对屏幕上的每条消息每 1–5 秒轮询一次
- `GET /pixel` — 收件人打开消息时加载

请知悉：

- **邀请码只限制账号注册**（`/auth/register`），不参与消息注册。任何知道某用户 wxId 的人都能冒充该账号注册消息
- 等级配额采用「超额删除最旧消息」的惰性清理：向某 wxId 连续注册 N+1 条消息即可触发其全部消息被清除（N ≤ 99）。请仅在受信任的小圈子中使用，并善用 `ADMIN` 管理账号
- 服务端会收到消息明文（用于匹配已读记录），这是该方案的本质

## 身份验证

服务端使用 **wxid 即账号 + 密码** 的多用户体系，仪表盘使用短期会话 cookie：

- **注册**：首次使用访问登录页 → 切换到「注册」→ 填写 wxid + 密码（≥8 位）+ 邀请码 → 自动登录
- **登录**：wxid + 密码 → POST 到 `/auth/verify` → 设置 `__Host-session` cookie（HttpOnly、Secure、SameSite=Lax，30 天）→ 重定向到 `/`。管理员需手动访问 `/admin` 进入后台
- **会话**：服务端只存储会话 ID 的 SHA-256 哈希，cookie 本身从不包含密码
- **数据隔离**：所有 `/messages*`、`/reads/*`、`/count`、`/register` 端点强制限定为当前登录账号的 wxid

### 等级配额

新注册用户为 **等级 1**。等级 N 表示：最多可保留 **N 条消息**，每条最多保留 **N 个月**（N 最大 99）。注册新消息时，超出配额的最早消息自动删除，超过 N 个月的旧消息一并清理（均仅在注册时惰性执行）。**等级 0 = 拉黑**：禁止注册消息，且管理员将其设为 0 时立即清空该账号的全部消息与已读记录（账号保留，可随时改回）。管理员可在后台调整用户等级（0–99）。

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `INVITE_CODE` | 否 | 邀请码。配置后注册必须填写；留空则开放注册 |
| `ADMIN` | 否 | 逗号分隔的 wxid 列表，这些账号登录后可访问 `/admin` 管理后台。未配置则无管理员 |

```bash
npx wrangler secret put INVITE_CODE   # 可选
npx wrangler secret put ADMIN         # 可选，如：wxid_a,wxid_b
```

> [!IMPORTANT]
> 请将 `INVITE_CODE`、`ADMIN` 均设置为 **Secret** 而非普通变量。若使用 Workers Builds（Git 集成）部署，每次构建会用仓库中的 `wrangler.toml` 同步覆盖配置，只存在于 dashboard 的普通变量会被删除；Secret 由平台独立管理，不受影响。

## 安全特性

- **速率限制** — `/pixel`：每 IP 每分钟 10 次；`/auth/verify`、`/auth/register`、`/auth/password`：每 IP 每分钟 5 次（fail-closed）
- **密码哈希** — PBKDF2-SHA256，每用户随机 salt，10 万次迭代（Web Crypto，Workers 原生支持）
- **已注册消息校验** — `/pixel` 忽略未注册消息的读取（阻止灌库攻击）
- **存储级去重** — `reads(id, ip)` 唯一索引 + `INSERT OR IGNORE`
- **恒定时间密码比较** — 通过 SHA-256 摘要比较；登录失败附加随机延迟
- **会话 cookie** — 随机 ID、静态哈希、30 天有效期、`__Host-` 前缀、Secure/HttpOnly/SameSite=Lax
- **仅信任客户端 IP** — 只读取 `CF-Connecting-IP`；忽略客户端可控的请求头
- **安全响应头** — 所有响应均携带 CSP、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`
- **输入校验** — 注册字段长度限制、LIKE 通配符转义、畸形 URL 处理、wxid 格式校验
- **审计日志** — 每次批量/按发送者删除都会记录到 `audit_logs` 表（自动保留 30 天后清理）

## 部署

支持两种部署方式，按需选择。两种方式均无需手动配置 D1 数据库 ID：首次部署时自动创建并绑定（Automatic provisioning，需 Wrangler ≥ 4.45.0；ID 仅存于 dashboard，不写回仓库）。

### CLI

```bash
git clone https://github.com/lie-jiu/wekit-read-receipts-cf-workers
cd wekit-read-receipts-cf-workers
npx wrangler login
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
4. `git push` 到 `main` 自动构建部署；首次部署自动创建 D1 数据库
5. 在 D1 数据库 Console 执行一次 `schema.sql`

> [!NOTE]
> 可选配置环境变量：`INVITE_CODE`（邀请码）、`ADMIN`（管理员 wxid 列表），均以 Secret 形式设置（见「环境变量」章节的说明）。

> [!IMPORTANT]
> Workers Builds 以仓库 `wrangler.toml` 为配置唯一来源：dashboard 中手动配置的普通变量会在每次构建时被覆盖删除，因此 `INVITE_CODE`、`ADMIN` 必须存为 Secret。

### 升级现有部署

重新执行一次 `schema.sql`。它是幂等的，会：

- 创建 `users`、`sessions` 和 `audit_logs` 表
- 对现有 `reads` 行去重，并添加 `(id, ip)` 唯一索引
- （已重复打开过消息的现有读者只保留第一条记录）

> [!NOTE]
> 重跑 `schema.sql` 会清空 `sessions` 表（全体用户需重新登录一次）。

> [!IMPORTANT]
> 需要清空数据时请执行 `DELETE FROM messages; DELETE FROM reads; DELETE FROM users; DELETE FROM sessions; DELETE FROM audit_logs;`（或逐表删除），**不要删除 D1 数据库本身**。删除 D1 库会生成新的数据库 ID，worker 的绑定将指向已不存在的旧库而失效（点开绑定时报 Not Found）。

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
