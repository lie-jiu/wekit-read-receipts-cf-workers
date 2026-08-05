function htmlPage(session) { return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title data-i18n="title">Read Receipts</title>
    <style>
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        background: #0f172a;
        color: #e2e8f0;
        min-height: 100vh;
        padding: 2rem 1rem;
      }
      .container {
        max-width: 960px;
        margin: 0 auto;
      }

      /* header */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f1f5f9;
      }
      .header .subtitle {
        font-size: 0.85rem;
        color: #64748b;
      }
      .user-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace;
        color: #94a3b8;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
      }

      /* controls bar */
      .controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 0.75rem 1rem;
      }
      .controls input {
        padding: 0.45rem 0.7rem;
        border: 1px solid #475569;
        border-radius: 6px;
        font-size: 0.85rem;
        background: #0f172a;
        color: #e2e8f0;
        outline: none;
        transition: border-color 0.15s;
        min-width: 220px;
      }
      .controls input:focus {
        border-color: #3b82f6;
      }
      .controls input::placeholder {
        color: #475569;
      }

      /* buttons */
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 0.85rem;
        border: none;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        text-decoration: none;
        transition:
          background 0.15s,
          box-shadow 0.15s;
      }
      .btn:active {
        transform: scale(0.97);
      }
      .btn-primary {
        background: #2563eb;
        color: #fff;
      }
      .btn-primary:hover {
        background: #1d4ed8;
      }
      .btn-secondary {
        background: #475569;
        color: #e2e8f0;
      }
      .btn-secondary:hover {
        background: #64748b;
      }
      .btn-danger {
        background: #b91c1c;
        color: #fff;
      }
      .btn-danger:hover {
        background: #991b1b;
      }
      .btn-outline {
        background: transparent;
        color: #94a3b8;
        border: 1px solid #475569;
      }
      .btn-outline:hover {
        background: #1e293b;
        color: #e2e8f0;
      }
      .btn-sm {
        padding: 0.3rem 0.6rem;
        font-size: 0.75rem;
      }
      .lang-toggle {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.2rem 0.45rem;
        border-radius: 4px;
        background: transparent;
        color: #64748b;
        border: 1px solid #475569;
        cursor: pointer;
        transition:
          color 0.15s,
          border-color 0.15s;
        letter-spacing: 0.03em;
      }
      .lang-toggle:hover {
        color: #e2e8f0;
        border-color: #94a3b8;
      }

      /* table card */
      .table-wrapper {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        overflow: hidden;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 0.65rem 1rem;
        font-size: 0.825rem;
      }
      th {
        background: #0f172a;
        font-weight: 600;
        color: #94a3b8;
        border-bottom: 1px solid #334155;
      }
      td {
        border-bottom: 1px solid #1e293b;
        color: #cbd5e1;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tr:hover td {
        background: #0f172a80;
      }

      .ip-col {
        font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace;
        font-size: 0.78rem;
        color: #a78bfa;
      }
      .msg-col {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ts-col {
        color: #94a3b8;
        white-space: nowrap;
      }

      .empty-row td {
        text-align: center;
        padding: 2.5rem 1rem;
        color: #475569;
        font-size: 0.85rem;
      }

      /* clickable rows */
      .clickable-row {
        cursor: pointer;
      }
      .row-selected td {
        background: #1a3050 !important;
      }

      /* detail panel */
      .detail-panel {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 1rem;
      }
      .detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.65rem 1rem;
        background: #0f172a;
        border-bottom: 1px solid #334155;
        gap: 0.75rem;
      }
      .detail-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
      }
      .detail-subtitle {
        font-size: 0.78rem;
        color: #60a5fa;
        margin-left: 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 500px;
      }

      /* stats bar */
      .stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        background: #0f172a;
        border-bottom: 1px solid #334155;
        font-size: 0.78rem;
        color: #64748b;
      }
      .stats .count {
        color: #94a3b8;
        font-weight: 600;
      }

      /* toast */
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        animation: toast-in 0.25s ease-out;
        max-width: 360px;
      }
      .toast-success {
        background: #065f46;
        color: #a7f3d0;
        border: 1px solid #059669;
      }
      .toast-error {
        background: #7f1d1d;
        color: #fecaca;
        border: 1px solid #dc2626;
      }
      .toast-info {
        background: #1e3a5f;
        color: #bfdbfe;
        border: 1px solid #2563eb;
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          translate: 0 -0.5rem;
        }
        to {
          opacity: 1;
          translate: 0;
        }
      }
      .toast-out {
        animation: toast-out 0.2s ease-in forwards;
      }
      @keyframes toast-out {
        to {
          opacity: 0;
          translate: 0 -0.5rem;
        }
      }

      /* modal overlay */
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fade-in 0.15s ease-out;
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .modal {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }
      .modal h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      .modal p {
        font-size: 0.875rem;
        color: #94a3b8;
        margin-bottom: 1.25rem;
        line-height: 1.5;
      }
      .modal .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .modal-form input {
        width: 100%;
        padding: 0.55rem 0.7rem;
        border: 1px solid #475569;
        border-radius: 6px;
        font-size: 0.9rem;
        background: #0f172a;
        color: #e2e8f0;
        outline: none;
        margin-bottom: 0.6rem;
        transition: border-color 0.15s;
      }
      .modal-form input:focus {
        border-color: #3b82f6;
      }

      /* utility */
      .hidden {
        display: none !important;
      }
      .flex {
        display: flex;
        gap: 0.5rem;
      }

      @media (max-width: 640px) {
        body {
          padding: 1rem 0.5rem;
        }
        .controls {
          flex-direction: column;
          align-items: stretch;
        }
        .controls input {
          min-width: 0;
          width: 100%;
        }
        .stats {
          flex-direction: column;
          gap: 0.3rem;
          text-align: center;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div>
          <h1 data-i18n="title">Read Receipts</h1>
          <div class="subtitle" data-i18n="subtitle">Tracking pixel hits</div>
        </div>
        <div class="flex">
          <span class="user-chip" id="userChip"></span>
          <button
            class="btn btn-outline btn-sm"
            onclick="openPasswordModal()"
            data-i18n="changePassword"
          >
            Change Password
          </button>
          <button class="btn btn-outline btn-sm" onclick="logout()" data-i18n="logout">
            Logout
          </button>
          <button class="lang-toggle" onclick="toggleLang()">中 / EN</button>
          <button
            class="btn btn-outline btn-sm"
            onclick="loadAll()"
            data-i18n="refresh"
          >
            Refresh
          </button>
          <button
            class="btn btn-danger btn-sm"
            onclick="showClearAllModal()"
            data-i18n="clearAll"
          >
            Clear All
          </button>
        </div>
      </div>

      <div class="controls">
        <input
          id="msgFilter"
          type="text"
          data-i18n="filterMsg"
          data-i18n-placeholder
          placeholder="Filter by message text..."
        />
      </div>

      <div class="table-wrapper">
        <div class="stats">
          <span
            ><span class="count" id="recordCount">0</span
            ><span data-i18n="records"> records</span></span
          >
        </div>
        <table>
          <thead>
            <tr>
              <th data-i18n="message">Message</th>
              <th data-i18n="reads">Reads</th>
              <th data-i18n="timestamp">Timestamp</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>

      <div id="detailPanel" class="detail-panel hidden">
        <div class="detail-header">
          <div>
            <span class="detail-title" data-i18n="readDetails">Read Details</span>
            <span class="detail-subtitle" id="detailFor"></span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="closeDetail()" data-i18n="close">Close</button>
        </div>
        <table>
          <thead>
            <tr>
              <th data-i18n="ipAddress">IP Address</th>
              <th data-i18n="readAt">Read At</th>
            </tr>
          </thead>
          <tbody id="detailTbody"></tbody>
        </table>
      </div>
    </div>

    <div id="toastContainer" class="toast-container"></div>
    <div id="modalOverlay" class="modal-overlay hidden">
      <div class="modal">
        <h3 id="modalTitle" data-i18n="confirm">Confirm</h3>
        <p id="modalBody"></p>
        <div class="actions">
          <button class="btn btn-secondary" id="modalCancel" data-i18n="cancel">
            Cancel
          </button>
          <button class="btn btn-danger" id="modalConfirm" data-i18n="delete">
            Delete
          </button>
        </div>
      </div>
    </div>
    <div id="passOverlay" class="modal-overlay hidden">
      <div class="modal">
        <h3 data-i18n="changePassword">Change Password</h3>
        <div class="modal-form">
          <input id="oldPass" type="password" data-i18n-placeholder data-i18n="currentPassword" placeholder="Current password" />
          <input id="newPass" type="password" data-i18n-placeholder data-i18n="newPassword" placeholder="New password" />
          <input id="newPass2" type="password" data-i18n-placeholder data-i18n="confirmPassword" placeholder="Confirm new password" />
        </div>
        <div class="actions">
          <button class="btn btn-secondary" id="passCancel" data-i18n="cancel">Cancel</button>
          <button class="btn btn-primary" id="passSave" data-i18n="save">Save</button>
        </div>
      </div>
    </div>

    <script>
      const ME = ${JSON.stringify({ wxId: session.wxId, level: session.level })};
      const tbody = document.getElementById("tbody");
      const recordCount = document.getElementById("recordCount");
      const toastContainer = document.getElementById("toastContainer");
      const modalOverlay = document.getElementById("modalOverlay");
      const modalTitle = document.getElementById("modalTitle");
      const modalBody = document.getElementById("modalBody");
      const modalCancel = document.getElementById("modalCancel");
      const modalConfirm = document.getElementById("modalConfirm");
      const passOverlay = document.getElementById("passOverlay");
      const oldPass = document.getElementById("oldPass");
      const newPass = document.getElementById("newPass");
      const newPass2 = document.getElementById("newPass2");
      const detailPanel = document.getElementById("detailPanel");
      const detailFor = document.getElementById("detailFor");
      const detailTbody = document.getElementById("detailTbody");

      /* ── i18n ── */
      let lang = localStorage.getItem("lang") || "zh-CN";

      const translations = {
        "zh-CN": {
          title: "已读追踪",
          subtitle: "已发送消息的已读人数",
          refresh: "刷新",
          clearAll: "清除我的",
          changePassword: "修改密码",
          logout: "退出登录",
          filterMsg: "按消息内容过滤...",
          message: "消息",
          reads: "已读人数",
          timestamp: "时间",
          records: " 条消息",
          confirm: "确认",
          cancel: "取消",
          delete: "删除",
          save: "保存",
          currentPassword: "当前密码",
          newPassword: "新密码（至少 8 位）",
          confirmPassword: "确认新密码",
          passTooShort: "密码至少 8 位",
          passMismatch: "两次输入的新密码不一致",
          passChanged: "密码已修改",
          passFailed: "修改密码失败",
          clearAllTitle: "清除我的所有记录？",
          clearAllBody: "这将永久删除你账号下的所有消息及其读取记录。",
          loading: "加载中...",
          noRecords: "暂无消息",
          networkError: "网络错误",
          clearingAll: "正在清除我的记录…",
          clearedAll: "已清除我的所有记录",
          failedClear: "清除记录失败",
          readDetails: "已读详情",
          ipAddress: "IP 地址",
          readAt: "读取时间",
          noReads: "暂无读取记录",
          close: "关闭",
          readsFor: "「{0}」的已读记录",
        },
        en: {
          title: "Read Receipts",
          subtitle: "Read counts of sent messages",
          refresh: "Refresh",
          clearAll: "Clear Mine",
          changePassword: "Change Password",
          logout: "Logout",
          filterMsg: "Filter by message text...",
          message: "Message",
          reads: "Reads",
          timestamp: "Timestamp",
          records: " messages",
          confirm: "Confirm",
          cancel: "Cancel",
          delete: "Delete",
          save: "Save",
          currentPassword: "Current password",
          newPassword: "New password (min 8 chars)",
          confirmPassword: "Confirm new password",
          passTooShort: "Password must be at least 8 characters",
          passMismatch: "New passwords do not match",
          passChanged: "Password updated",
          passFailed: "Failed to update password",
          clearAllTitle: "Clear all my records?",
          clearAllBody:
            "This will permanently delete all your messages and their reads.",
          loading: "Loading...",
          noRecords: "No messages found",
          networkError: "Network error",
          clearingAll: "Clearing my records…",
          clearedAll: "All my records cleared",
          failedClear: "Failed to clear records",
          readDetails: "Read Details",
          ipAddress: "IP Address",
          readAt: "Read At",
          noReads: "No reads yet",
          close: "Close",
          readsFor: 'Reads for: "{0}"',
        },
      };

      function t(key, ...args) {
        let s = translations[lang][key];
        if (!s) return key;
        args.forEach((a, i) => {
          s = s.split("{" + i + "}").join(a);
        });
        return s;
      }

      function applyI18n() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
          const key = el.dataset.i18n;
          if (el.tagName === "TITLE") {
            document.title = t(key);
          } else if ("i18nPlaceholder" in el.dataset) {
            el.placeholder = t(key);
          } else {
            el.textContent = t(key);
          }
        });
      }

      function toggleLang() {
        lang = lang === "zh-CN" ? "en" : "zh-CN";
        localStorage.setItem("lang", lang);
        applyI18n();
      }

      /* ── toast ── */
      function toast(message, type = "info") {
        const el = document.createElement("div");
        el.className = \`toast toast-\${type}\`;
        el.textContent = message;
        toastContainer.appendChild(el);
        setTimeout(() => {
          el.classList.add("toast-out");
        }, 2800);
        setTimeout(() => el.remove(), 3100);
      }

      /* ── modal ── */
      function showModal(title, body, onConfirm) {
        modalTitle.textContent = title;
        modalBody.textContent = body;
        modalOverlay.classList.remove("hidden");

        const cleanup = () => {
          modalOverlay.classList.add("hidden");
          modalConfirm.onclick = null;
        };
        modalCancel.onclick = cleanup;
        modalOverlay.onclick = (e) => {
          if (e.target === modalOverlay) cleanup();
        };
        modalConfirm.onclick = () => {
          cleanup();
          onConfirm();
        };
      }

      function showClearAllModal() {
        showModal(t("clearAllTitle"), t("clearAllBody"), () => {
          deleteAll();
        });
      }

      /* ── password ── */
      function openPasswordModal() {
        oldPass.value = "";
        newPass.value = "";
        newPass2.value = "";
        passOverlay.classList.remove("hidden");
        oldPass.focus();
      }
      function closePasswordModal() {
        passOverlay.classList.add("hidden");
      }
      document.getElementById("passCancel").onclick = closePasswordModal;
      passOverlay.onclick = (e) => {
        if (e.target === passOverlay) closePasswordModal();
      };
      async function savePassword() {
        const n1 = newPass.value;
        const n2 = newPass2.value;
        if (n1.length < 8) {
          toast(t("passTooShort"), "error");
          return;
        }
        if (n1 !== n2) {
          toast(t("passMismatch"), "error");
          return;
        }
        try {
          const res = await fetch("/auth/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword: oldPass.value, newPassword: n1 }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            toast(err.error || t("passFailed"), "error");
            return;
          }
          toast(t("passChanged"), "success");
          closePasswordModal();
        } catch (e) {
          toast(t("networkError"), "error");
        }
      }
      document.getElementById("passSave").onclick = savePassword;
      [oldPass, newPass, newPass2].forEach((el) => {
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter") savePassword();
        });
      });

      /* ── logout ── */
      async function logout() {
        try {
          await fetch("/auth/logout", { method: "POST" });
        } catch {}
        location.href = "/";
      }

      /* ── fetch helpers ── */
      async function loadAll() {
        const q = document.getElementById("msgFilter").value.trim();
        currentFilterUrl = "/messages" + (q ? "?q=" + encodeURIComponent(q) : "");
        await fetchData(currentFilterUrl);
      }

      async function fetchData(url) {
        closeDetail();
        tbody.innerHTML =
          '<tr class="empty-row"><td colspan="3">' +
          esc(t("loading")) +
          "</td></tr>";
        recordCount.textContent = "…";
        try {
          const res = await fetch(url);
          if (res.status === 401) {
            location.href = "/";
            return;
          }
          if (!res.ok) {
            let detail = "";
            try {
              const err = await res.json();
              detail = err.error || JSON.stringify(err);
            } catch {
              detail = await res.text();
            }
            if (detail.length > 300) detail = detail.slice(0, 300) + "…";
            tbody.innerHTML = \`<tr class="empty-row"><td colspan="3">HTTP \${res.status}: \${esc(detail)}</td></tr>\`;
            recordCount.textContent = "0";
            toast(\`HTTP \${res.status}: \${detail}\`, "error");
            return;
          }
          const data = await res.json();
          recordCount.textContent = data.length;
          if (!data.length) {
            tbody.innerHTML =
              '<tr class="empty-row"><td colspan="3">' +
              esc(t("noRecords")) +
              "</td></tr>";
            return;
          }

          tbody.innerHTML = data
            .map(
              (r) => \`<tr class="clickable-row" data-id="\${escAttr(r.id)}" data-content="\${escAttr(r.content)}" onclick="toggleDetail(this)">
      <td class="msg-col">\${esc(r.content)}</td>
      <td class="reads-col">\${esc(r.reads)}</td>
      <td class="ts-col">\${esc(r.timestamp)}</td>
    </tr>\`,
            )
            .join("");
        } catch (e) {
          tbody.innerHTML =
            '<tr class="empty-row"><td colspan="3">' +
            esc(t("networkError")) +
            "</td></tr>";
          toast(t("networkError") + ": " + e.message, "error");
        }
      }

      /* ── delete ── */
      async function deleteAll() {
        toast(t("clearingAll"), "info");
        try {
          const res = await fetch("/messages", { method: "DELETE" });
          if (!res.ok) {
            toast(t("failedClear"), "error");
            return;
          }
          toast(t("clearedAll"), "success");
          await loadAll();
        } catch (e) {
          toast(t("networkError") + ": " + e.message, "error");
        }
      }

      /* ── utils ── */
      function esc(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      function escAttr(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      /* ── detail panel ── */
      let selectedRow = null;

      function toggleDetail(row) {
        if (selectedRow === row) {
          closeDetail();
          return;
        }
        if (selectedRow) selectedRow.classList.remove("row-selected");
        selectedRow = row;
        row.classList.add("row-selected");
        openDetail(row.dataset.id, row.dataset.content);
      }

      function closeDetail() {
        detailPanel.classList.add("hidden");
        if (selectedRow) {
          selectedRow.classList.remove("row-selected");
          selectedRow = null;
        }
      }

      async function openDetail(id, content) {
        detailFor.textContent = t("readsFor", content);
        detailTbody.innerHTML =
          '<tr class="empty-row"><td colspan="2">' + esc(t("loading")) + "</td></tr>";
        detailPanel.classList.remove("hidden");
        try {
          const res = await fetch("/reads/" + encodeURIComponent(id));
          if (res.status === 401) {
            location.href = "/";
            return;
          }
          if (!res.ok) {
            detailTbody.innerHTML = \`<tr class="empty-row"><td colspan="2">HTTP \${res.status}</td></tr>\`;
            return;
          }
          const reads = await res.json();
          if (!reads.length) {
            detailTbody.innerHTML =
              '<tr class="empty-row"><td colspan="2">' + esc(t("noReads")) + "</td></tr>";
            return;
          }
          detailTbody.innerHTML = reads
            .map(
              (r) => \`<tr>
      <td class="ip-col">\${esc(r.ip)}</td>
      <td class="ts-col">\${esc(r.timestamp)}</td>
    </tr>\`,
            )
            .join("");
        } catch (e) {
          detailTbody.innerHTML =
            '<tr class="empty-row"><td colspan="2">' + esc(t("networkError")) + "</td></tr>";
        }
      }

      /* ── keyboard ── */
      document.getElementById("msgFilter").addEventListener("input", () => {
        loadAll();
      });

      /* ── init ── */
      document.getElementById("userChip").textContent =
        ME.wxId + " · Lv" + ME.level;
      applyI18n();
      loadAll();
    </script>
  </body>
</html>
`; }

const LOGIN_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Login — Read Receipts</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14' font-size='14'%3E%E2%9C%89%EF%B8%8F%3C/text%3E%3C/svg%3E" />
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:2rem;max-width:380px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.5)}
h1{font-size:1.25rem;font-weight:700;margin-bottom:.5rem}
p{font-size:.85rem;color:#94a3b8;margin-bottom:1.25rem}
.tabs{display:flex;gap:.4rem;margin-bottom:1.25rem}
.tab{flex:1;padding:.5rem;border:1px solid #475569;border-radius:6px;background:transparent;color:#94a3b8;font-size:.85rem;font-weight:600;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.tab.active{background:#2563eb;border-color:#2563eb;color:#fff}
input{width:100%;padding:.6rem .8rem;border:1px solid #475569;border-radius:6px;font-size:.9rem;background:#0f172a;color:#e2e8f0;outline:none;margin-bottom:.6rem;transition:border-color .15s}
input:focus{border-color:#3b82f6}
button[type=submit]{width:100%;margin-top:.4rem;padding:.6rem;border:none;border-radius:6px;font-size:.9rem;font-weight:600;cursor:pointer;background:#2563eb;color:#fff;transition:background .15s}
button[type=submit]:hover{background:#1d4ed8}
button[type=submit]:disabled{opacity:.6;cursor:not-allowed}
.msg{margin-top:.9rem;font-size:.8rem;color:#fca5a5;min-height:1.2em;text-align:center}
.hint{font-size:.72rem;color:#64748b;margin:-.2rem 0 .6rem}
.hidden{display:none}
</style>
</head>
<body>
<div class="card">
<h1>&#128274; Read Receipts</h1>
<p>Log in with your wxId account, or register a new one.</p>
<div class="tabs">
  <button type="button" id="tabLogin" class="tab active" onclick="switchTab('login')">Login</button>
  <button type="button" id="tabRegister" class="tab" onclick="switchTab('register')">Register</button>
</div>
<form id="loginForm" autocomplete="on">
  <input id="loginWxid" placeholder="wxId" autocomplete="username"/>
  <input id="loginPass" type="password" placeholder="Password" autocomplete="current-password"/>
  <button type="submit" id="loginBtn">Unlock</button>
</form>
<form id="registerForm" class="hidden" autocomplete="on">
  <input id="regWxid" placeholder="wxId (3-64 letters / digits / _ -)" autocomplete="username"/>
  <input id="regPass" type="password" placeholder="Password (min 8 chars)" autocomplete="new-password"/>
  <input id="regPass2" type="password" placeholder="Confirm password" autocomplete="new-password"/>
  <div id="inviteWrap" class="hidden"><input id="regInvite" placeholder="Invite code"/></div>
  <p class="hint">Level 1 accounts keep 1 message for 1 month. Registering more auto-removes the oldest.</p>
  <button type="submit" id="regBtn">Create account</button>
</form>
<div id="msg" class="msg"></div>
</div>
<script>
const $ = (id) => document.getElementById(id);
function switchTab(name){
  $("tabLogin").classList.toggle("active", name === "login");
  $("tabRegister").classList.toggle("active", name === "register");
  $("loginForm").classList.toggle("hidden", name !== "login");
  $("registerForm").classList.toggle("hidden", name !== "register");
  $("msg").textContent = "";
}
function showMsg(s){ $("msg").textContent = s; }
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("loginBtn"); btn.disabled = true;
  try {
    const res = await fetch("/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ wxId: $("loginWxid").value.trim(), password: $("loginPass").value })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { location.href = data.redirect || "/"; return; }
    showMsg(data.error || "Login failed");
  } catch { showMsg("Network error"); }
  btn.disabled = false;
});
$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("regBtn"); btn.disabled = true;
  const p1 = $("regPass").value, p2 = $("regPass2").value;
  if (p1 !== p2) { showMsg("Passwords do not match"); btn.disabled = false; return; }
  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ wxId: $("regWxid").value.trim(), password: p1, password2: p2, invite: $("regInvite").value.trim() })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { location.href = data.redirect || "/"; return; }
    showMsg(data.error || "Registration failed");
  } catch { showMsg("Network error"); }
  btn.disabled = false;
});
fetch("/auth/status").then(r => r.json()).then(s => { if (s.invite_required) $("inviteWrap").classList.remove("hidden"); }).catch(() => {});
</script>
</body>
</html>`;

function adminPage(session) { return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admin — Read Receipts</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:2rem 1rem}
.container{max-width:1000px;margin:0 auto}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem}
.header h1{font-size:1.5rem;font-weight:700;color:#f1f5f9}
.header .subtitle{font-size:.85rem;color:#64748b}
.flex{display:flex;gap:.5rem;align-items:center}
.btn{display:inline-flex;align-items:center;gap:.35rem;padding:.45rem .85rem;border:none;border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;white-space:nowrap;text-decoration:none;transition:background .15s}
.btn:active{transform:scale(.97)}
.btn-primary{background:#2563eb;color:#fff}.btn-primary:hover{background:#1d4ed8}
.btn-secondary{background:#475569;color:#e2e8f0}.btn-secondary:hover{background:#64748b}
.btn-danger{background:#b91c1c;color:#fff}.btn-danger:hover{background:#991b1b}
.btn-outline{background:transparent;color:#94a3b8;border:1px solid #475569}
.btn-outline:hover{background:#1e293b;color:#e2e8f0}
.btn-sm{padding:.3rem .6rem;font-size:.75rem}
.tabs{display:flex;gap:.4rem;margin-bottom:1rem}
.tab{padding:.5rem 1rem;border:1px solid #475569;border-radius:6px;background:transparent;color:#94a3b8;font-size:.85rem;font-weight:600;cursor:pointer;transition:background .15s,color .15s}
.tab.active{background:#2563eb;border-color:#2563eb;color:#fff}
.controls{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:.75rem 1rem}
.controls input{padding:.45rem .7rem;border:1px solid #475569;border-radius:6px;font-size:.85rem;background:#0f172a;color:#e2e8f0;outline:none;transition:border-color .15s;min-width:180px}
.controls input:focus{border-color:#3b82f6}
.controls .sep{color:#475569;font-size:.8rem;padding:0 .15rem}
.table-wrapper{background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:.65rem 1rem;font-size:.825rem}
th{background:#0f172a;font-weight:600;color:#94a3b8;border-bottom:1px solid #334155}
td{border-bottom:1px solid #1e293b;color:#cbd5e1}
tr:last-child td{border-bottom:none}
tr:hover td{background:#0f172a80}
.uuid-col{font-family:ui-monospace,"Cascadia Code","JetBrains Mono",monospace;font-size:.78rem;color:#60a5fa}
.msg-col{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ts-col{color:#94a3b8;white-space:nowrap}
.empty-row td{text-align:center;padding:2.5rem 1rem;color:#475569;font-size:.85rem}
.stats{display:flex;align-items:center;justify-content:space-between;padding:.5rem 1rem;background:#0f172a;border-bottom:1px solid #334155;font-size:.78rem;color:#64748b}
.stats .count{color:#94a3b8;font-weight:600}
.level-editor{display:inline-flex;align-items:center;gap:.25rem}
.level-editor .btn{padding:.2rem .55rem;line-height:1;font-size:.85rem}
.level-input{width:3.2rem;text-align:center;padding:.25rem .3rem;border:1px solid #475569;border-radius:6px;background:#0f172a;color:#e2e8f0;font-size:.8rem;outline:none;-moz-appearance:textfield}
.level-input::-webkit-outer-spin-button,.level-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.level-input:focus{border-color:#3b82f6}
.toast-container{position:fixed;top:1rem;right:1rem;z-index:1000;display:flex;flex-direction:column;gap:.5rem}
.toast{display:flex;align-items:center;gap:.5rem;padding:.65rem 1rem;border-radius:8px;font-size:.85rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.4);animation:toast-in .25s ease-out;max-width:360px}
.toast-success{background:#065f46;color:#a7f3d0;border:1px solid #059669}
.toast-error{background:#7f1d1d;color:#fecaca;border:1px solid #dc2626}
.toast-info{background:#1e3a5f;color:#bfdbfe;border:1px solid #2563eb}
@keyframes toast-in{from{opacity:0;translate:0 -.5rem}to{opacity:1;translate:0}}
.toast-out{animation:toast-out .2s ease-in forwards}
@keyframes toast-out{to{opacity:0;translate:0 -.5rem}}
.modal-overlay{position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;animation:fade-in .15s ease-out}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.modal{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.5rem;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.5)}
.modal h3{font-size:1.1rem;font-weight:600;margin-bottom:.5rem}
.modal p{font-size:.875rem;color:#94a3b8;margin-bottom:1.25rem;line-height:1.5}
.modal .actions{display:flex;gap:.5rem;justify-content:flex-end}
.modal-form input{width:100%;padding:.55rem .7rem;border:1px solid #475569;border-radius:6px;font-size:.9rem;background:#0f172a;color:#e2e8f0;outline:none;margin-bottom:.6rem;transition:border-color .15s}
.modal-form input:focus{border-color:#3b82f6}
.hidden{display:none !important}
@media (max-width:640px){body{padding:1rem .5rem}.controls{flex-direction:column;align-items:stretch}.controls input{min-width:0;width:100%}}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>&#128737;&#65039; Admin Console</h1>
      <div class="subtitle" id="adminName"></div>
    </div>
    <div class="flex">
      <a class="btn btn-outline btn-sm" href="/">Dashboard</a>
      <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
    </div>
  </div>
  <div class="tabs">
    <button id="tabUsers" class="tab active" onclick="showTab('users')">Users</button>
    <button id="tabMsgs" class="tab" onclick="showTab('msgs')">Messages</button>
  </div>

  <div id="secUsers">
    <div class="table-wrapper">
      <div class="stats"><span><span class="count" id="userCount">0</span> users</span></div>
      <table>
        <thead><tr><th>wxId</th><th>Level</th><th>Registered</th><th>Actions</th></tr></thead>
        <tbody id="userTbody"></tbody>
      </table>
    </div>
  </div>

  <div id="secMsgs" class="hidden">
    <div class="controls">
      <input id="fWxid" placeholder="Filter by wxId..." oninput="loadMsgs()"/>
      <input id="fContent" placeholder="Filter by message text..." oninput="loadMsgs()"/>
      <span class="sep">|</span>
      <input id="fDelWxid" placeholder="wxId to wipe all its data"/>
      <button class="btn btn-danger btn-sm" onclick="askClearUser()">Wipe user data</button>
    </div>
    <div class="table-wrapper">
      <div class="stats"><span><span class="count" id="msgCount">0</span> messages</span></div>
      <table>
        <thead><tr><th>wxId</th><th>Message</th><th>Reads</th><th>Timestamp</th><th></th></tr></thead>
        <tbody id="msgTbody"></tbody>
      </table>
    </div>
  </div>
</div>

<div id="toastContainer" class="toast-container"></div>
<div id="modalOverlay" class="modal-overlay hidden">
  <div class="modal">
    <h3 id="modalTitle">Confirm</h3>
    <p id="modalBody"></p>
    <div class="actions">
      <button class="btn btn-secondary" id="modalCancel">Cancel</button>
      <button class="btn btn-danger" id="modalConfirm">Confirm</button>
    </div>
  </div>
</div>
<div id="passOverlay" class="modal-overlay hidden">
  <div class="modal">
    <h3>Set Password</h3>
    <div class="modal-form">
      <input type="password" id="newUserPass" placeholder="New password (min 8 chars)"/>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" id="passCancel">Cancel</button>
      <button class="btn btn-primary" id="passSave">Save</button>
    </div>
  </div>
</div>

<script>
const ME = ${JSON.stringify({ wxId: session.wxId })};
const $ = (id) => document.getElementById(id);
const toastContainer = $("toastContainer");
const modalOverlay = $("modalOverlay"), modalTitle = $("modalTitle"), modalBody = $("modalBody"), modalCancel = $("modalCancel"), modalConfirm = $("modalConfirm");
const passOverlay = $("passOverlay"), newUserPass = $("newUserPass"), passCancel = $("passCancel"), passSave = $("passSave");
let targetWxId = "";

$("adminName").textContent = ME.wxId;

function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escAttr(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function toast(message, type = "info"){
  const el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.classList.add("toast-out"), 2800);
  setTimeout(() => el.remove(), 3100);
}
function showModal(title, body, onConfirm){
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalOverlay.classList.remove("hidden");
  const cleanup = () => { modalOverlay.classList.add("hidden"); modalConfirm.onclick = null; };
  modalCancel.onclick = cleanup;
  modalOverlay.onclick = (e) => { if (e.target === modalOverlay) cleanup(); };
  modalConfirm.onclick = () => { cleanup(); onConfirm(); };
}
function showTab(name){
  $("tabUsers").classList.toggle("active", name === "users");
  $("tabMsgs").classList.toggle("active", name === "msgs");
  $("secUsers").classList.toggle("hidden", name !== "users");
  $("secMsgs").classList.toggle("hidden", name !== "msgs");
  if (name === "users") loadUsers(); else loadMsgs();
}
async function loadUsers() {
  try {
    const res = await fetch("/admin/users");
    if (res.status === 401) { location.href = "/"; return; }
    if (!res.ok) { toast("Failed to load users", "error"); return; }
    const data = await res.json();
    $("userCount").textContent = data.length;
    $("userTbody").innerHTML = data
      .map((u) => {
        return (
          "<tr>" +
          '<td class="uuid-col">' + esc(u.wxId) + "</td>" +
          '<td><span class="level-editor" data-wxid="' + escAttr(u.wxId) + '">' +
          '<button type="button" class="btn btn-outline btn-sm level-minus" aria-label="Decrease level">−</button>' +
          '<input class="level-input" type="number" min="0" max="99" value="' + u.level + '" />' +
          '<button type="button" class="btn btn-outline btn-sm level-plus" aria-label="Increase level">+</button>' +
          "</span></td>" +
          '<td class="ts-col">' + esc(u.createdAt) + "</td>" +
          '<td class="flex">' +
          '<button class="btn btn-outline btn-sm act-setpass" data-wxid="' + escAttr(u.wxId) + '">Set password</button>' +
          '<button class="btn btn-danger btn-sm act-del-user" data-wxid="' + escAttr(u.wxId) + '">Delete</button>' +
          "</td></tr>"
        );
      })
      .join("");
  } catch (e) { toast("Network error: " + e.message, "error"); }
}
async function saveLevel(wxId, level) {
  try {
    const res = await fetch("/admin/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wxId, level: Number(level) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || "Failed to update level", "error"); return; }
    toast("Level updated", "success");
  } catch (e) { toast("Network error", "error"); }
}
function openSetPass(wxId) {
  targetWxId = wxId;
  newUserPass.value = "";
  passOverlay.classList.remove("hidden");
  newUserPass.focus();
}
function closePass() { passOverlay.classList.add("hidden"); }
passCancel.onclick = closePass;
passOverlay.onclick = (e) => { if (e.target === passOverlay) closePass(); };
passSave.onclick = async () => {
  const password = newUserPass.value;
  if (password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
  try {
    const res = await fetch("/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wxId: targetWxId, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || "Failed to set password", "error"); return; }
    toast("Password set for " + targetWxId, "success");
    closePass();
  } catch (e) { toast("Network error", "error"); }
};
function askDeleteUser(wxId) {
  showModal("Delete user?", 'Delete user "' + wxId + '" and all their messages and reads? This cannot be undone.', () => doDeleteUser(wxId));
}
async function doDeleteUser(wxId) {
  try {
    const res = await fetch("/admin/users/" + encodeURIComponent(wxId), { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || "Failed to delete user", "error"); return; }
    toast("User deleted", "success");
    loadUsers();
  } catch (e) { toast("Network error", "error"); }
}
async function loadMsgs() {
  try {
    const params = new URLSearchParams();
    const fwx = $("fWxid").value.trim(), fq = $("fContent").value.trim();
    if (fwx) params.set("wxId", fwx);
    if (fq) params.set("q", fq);
    const qs = params.toString();
    const res = await fetch("/admin/messages" + (qs ? "?" + qs : ""));
    if (res.status === 401) { location.href = "/"; return; }
    if (!res.ok) { toast("Failed to load messages", "error"); return; }
    const data = await res.json();
    $("msgCount").textContent = data.length;
    $("msgTbody").innerHTML = data.length
      ? data
          .map(
            (r) =>
              "<tr>" +
              '<td class="uuid-col">' + esc(r.wxId) + "</td>" +
              '<td class="msg-col" title="' + escAttr(r.content) + '">' + esc(r.content) + "</td>" +
              "<td>" + esc(r.reads) + "</td>" +
              '<td class="ts-col">' + esc(r.timestamp) + "</td>" +
              '<td><button class="btn btn-danger btn-sm act-del-msg" data-id="' + escAttr(r.id) + '">Delete</button></td>' +
              "</tr>"
          )
          .join("")
      : '<tr class="empty-row"><td colspan="5">No messages</td></tr>';
  } catch (e) { toast("Network error", "error"); }
}
function askDeleteMsg(id) {
  showModal("Delete message?", "Delete this message and its read records?", () => doDeleteMsg(id));
}
async function doDeleteMsg(id) {
  try {
    const res = await fetch("/admin/messages/" + encodeURIComponent(id), { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || "Failed to delete message", "error"); return; }
    toast("Message deleted", "success");
    loadMsgs();
  } catch (e) { toast("Network error", "error"); }
}
function askClearUser() {
  const wxId = $("fDelWxid").value.trim();
  if (!wxId) { toast("Enter a wxId first", "error"); return; }
  showModal("Wipe user data?", 'Delete all messages and reads for "' + wxId + '"?', () => doClearUser(wxId));
}
async function doClearUser(wxId) {
  try {
    const res = await fetch("/admin/messages?wxId=" + encodeURIComponent(wxId), { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || "Failed", "error"); return; }
    toast("Data wiped", "success");
    loadMsgs();
  } catch (e) { toast("Network error", "error"); }
}
async function logout() {
  try { await fetch("/auth/logout", { method: "POST" }); } catch {}
  location.href = "/";
}
function initAdminHandlers() {
  const ut = $("userTbody");
  ut.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const editor = btn.closest(".level-editor");
    if (editor) {
      const input = editor.querySelector(".level-input");
      let v = parseInt(input.value, 10);
      if (Number.isNaN(v)) v = 0;
      v = btn.classList.contains("level-plus") ? Math.min(99, v + 1) : Math.max(0, v - 1);
      input.value = v;
      saveLevel(editor.dataset.wxid, v);
      return;
    }
    const wxid = btn.dataset.wxid;
    if (btn.classList.contains("act-setpass")) openSetPass(wxid);
    else if (btn.classList.contains("act-del-user")) askDeleteUser(wxid);
  });
  ut.addEventListener("change", (e) => {
    const input = e.target.closest(".level-input");
    if (!input) return;
    const editor = input.closest(".level-editor");
    let v = parseInt(input.value, 10);
    if (Number.isNaN(v)) v = 0;
    v = Math.max(0, Math.min(99, v));
    input.value = v;
    saveLevel(editor.dataset.wxid, v);
  });
  const mt = $("msgTbody");
  mt.addEventListener("click", (e) => {
    const btn = e.target.closest(".act-del-msg");
    if (!btn) return;
    askDeleteMsg(btn.dataset.id);
  });
}
showTab("users");
initAdminHandlers();
</script>
</body>
</html>`; }

const PNG_1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

// ── 常量 ────────────────────────────────────────────────
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 会话 30 天
const PIXEL_RATE_LIMIT = 10; // /pixel：每 IP 每分钟最多 10 次
const AUTH_RATE_LIMIT = 5; // 注册/登录/改密：每 IP 每分钟最多 5 次
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const PBKDF2_ITERATIONS = 100000; // 密码哈希迭代次数
const LEVEL_MAX = 99;
const WXID_RE = /^wxid_[a-z0-9]{14}$/;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

const DASHBOARD_CSP = [
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

const LOGIN_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data:",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

// ── 基础工具 ────────────────────────────────────────────

const enc = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

function jsonWithCookie(data, cookie, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
      ...SECURITY_HEADERS,
    },
  });
}

function getClientIP(request) {
  // 只信任 Cloudflare 注入的真实客户端 IP；不接受客户端可控的 X-Forwarded-For
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function nowTimestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function sha256Hex(input) {
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function randomHex(bytes) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// PBKDF2-SHA256 密码哈希：pbkdf2$<iterations>$<salt_hex>$<hash_hex>
async function pbkdf2Hash(password, saltHex, iterations) {
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

async function hashPassword(password) {
  const saltHex = await randomHex(16);
  const hash = await pbkdf2Hash(password, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hash}`;
}

// 常量时间比较：先做 SHA-256 摘要再比较，避免逐字符比较的时序侧信道
async function safeEquals(input, expected) {
  const a = await sha256Hex(String(input));
  const b = await sha256Hex(String(expected));
  return a === b;
}

async function passwordMatches(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;
  const a = await pbkdf2Hash(password, parts[2], iterations);
  const b = await sha256Hex(parts[3]);
  return (await sha256Hex(a)) === b;
}

async function computeId(wxId, content, createTime) {
  const raw = wxId + "\0" + content + "\0" + String(createTime);
  return sha256Hex(raw);
}

// LIKE 通配符转义：将 % _ \ 作为字面量搜索
function escapeLike(s) {
  return String(s).replace(/[\\%_]/g, (m) => "\\" + m);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 基于 Cache API 的固定窗口限流（近似计数：并发请求存在微小 TOCTOU 偏差，
// 对登录限流仅弱化不失效，可接受）。failClosed=true：故障时拒绝；false：放行。
async function rateLimit(key, limit, windowSec, failClosed = false) {
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
async function audit(db, action, detail) {
  try {
    await db
      .prepare("INSERT INTO audit_logs (timestamp, action, detail) VALUES (?, ?, ?)")
      .bind(nowTimestamp(), action, String(detail).slice(0, 500))
      .run();
  } catch {}
}

// ── 会话与权限 ──────────────────────────────────────────

// 从 Cookie 解析会话并绑定用户；JOIN users 保证已删除账号的会话立即失效，
// 且每次请求都能拿到最新的 level
async function extractSession(request, env) {
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
        return { wxId: row.wx_id, level: Math.max(1, Number(row.level) || 1) };
      }
    } catch {}
  }
  return null;
}

function isAdminUser(wxId, env) {
  if (!wxId || !env.ADMIN) return false;
  return String(env.ADMIN)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(wxId);
}

async function createSessionCookie(db, wxId) {
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

async function destroySession(request, db) {
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

// ── 等级配额：仅在被注册新消息时惰性清理 ────────────────
// 等级 N = 保留 N 条消息 × N 个月；超量时删除最早的消息，过期时删除整批
async function enforceQuota(db, wxId, level) {
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

// ── 路由 ────────────────────────────────────────────────

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
    const wxId = params.get("wxId") || "";
    const id = params.get("id") || "";
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
    const body = await request.json();
    const { wxId, content, createTime } = body;
    if (!wxId || !content || createTime == null) {
      return json({ error: "Missing fields: wxId, content, createTime" }, 400);
    }
    if (
      typeof wxId !== "string" ||
      wxId.length > 64 ||
      typeof content !== "string" ||
      content.length > 4000
    ) {
      return json(
        { error: "Invalid fields: wxId (string ≤64 chars), content (string ≤4000 chars)" },
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
    return json({ ok: true });
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
      await audit(env.DB, "set_level", `${wxId} -> ${level}`);
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

  // 定时清理：过期会话；可选 RETENTION_DAYS 数据保留策略
  async scheduled(event, env) {
    try {
      await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?")
        .bind(nowTimestamp())
        .run();
      if (env.RETENTION_DAYS) {
        const cutoff = new Date(Date.now() - Number(env.RETENTION_DAYS) * 86400000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19);
        await env.DB.prepare("DELETE FROM reads WHERE timestamp < ?").bind(cutoff).run();
        await env.DB.prepare("DELETE FROM messages WHERE timestamp < ?").bind(cutoff).run();
      }
    } catch {}
  },
};
