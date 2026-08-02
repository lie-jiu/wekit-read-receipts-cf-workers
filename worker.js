const html = `<!doctype html>
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
      .controls .field-group {
        display: flex;
        gap: 0.35rem;
        align-items: center;
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
        min-width: 180px;
      }
      .controls input:focus {
        border-color: #3b82f6;
      }
      .controls input::placeholder {
        color: #475569;
      }
      .controls .sep {
        color: #475569;
        font-size: 0.8rem;
        padding: 0 0.15rem;
      }
      .field-label {
        font-size: 0.78rem;
        color: #94a3b8;
        white-space: nowrap;
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

      .uuid-col {
        font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace;
        font-size: 0.78rem;
        color: #60a5fa;
      }
      .ip-col {
        font-family: ui-monospace, "Cascadia Code", "JetBrains Mono", monospace;
        font-size: 0.78rem;
        color: #a78bfa;
      }
      .ip-region {
        color: #34d399;
        font-size: 0.7rem;
        font-weight: 400;
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
        .controls .field-group {
          flex: 1;
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
        <div class="field-group">
          <label for="wxidInput" class="field-label" data-i18n="wxidLabel">微信号</label>
          <input
            id="wxidInput"
            type="text"
            data-i18n="filterWxid"
            data-i18n-placeholder
            placeholder="Filter by wxId..."
          />
          <button
            class="btn btn-secondary"
            onclick="loadByWxid()"
            data-i18n="query"
          >
            Query
          </button>
          <button
            class="btn btn-outline btn-sm"
            onclick="clearByWxid()"
            data-i18n="delete"
            data-i18n-title="deleteTitle"
            title="Delete messages for this wxId"
          >
            Delete
          </button>
        </div>
        <span class="sep">|</span>
        <div class="field-group">
          <input
            id="msgFilter"
            type="text"
            data-i18n="filterMsg"
            data-i18n-placeholder
            placeholder="Filter by message text..."
          />
        </div>
      </div>

      <div class="table-wrapper">
        <div class="stats">
          <span
            ><span class="count" id="recordCount">0</span
            ><span data-i18n="records"> records</span></span
          >
          <span id="filterHint"></span>
        </div>
        <table>
          <thead>
            <tr>
              <th data-i18n="wxid">wxId</th>
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

    <script>
      const tbody = document.getElementById("tbody");
      const recordCount = document.getElementById("recordCount");
      const filterHint = document.getElementById("filterHint");
      const toastContainer = document.getElementById("toastContainer");
      const modalOverlay = document.getElementById("modalOverlay");
      const modalTitle = document.getElementById("modalTitle");
      const modalBody = document.getElementById("modalBody");
      const modalCancel = document.getElementById("modalCancel");
      const modalConfirm = document.getElementById("modalConfirm");
      const detailPanel = document.getElementById("detailPanel");
      const detailFor = document.getElementById("detailFor");
      const detailTbody = document.getElementById("detailTbody");

      let currentFilterUrl = "";

      /* ── i18n ── */
      let lang = localStorage.getItem("lang") || "zh-CN";

      const translations = {
        "zh-CN": {
          title: "已读追踪",
          subtitle: "已发送消息的已读人数",
          refresh: "刷新",
          clearAll: "清除",
          filterUuid: "按 wxId 过滤...",
          query: "查询",
          delete: "删除",
          deleteTitle: "删除此 wxId 的所有消息",
          filterMsg: "按消息内容过滤...",
          wxid: "wxId",
          wxidLabel: "微信号",
          message: "消息",
          reads: "已读人数",
          timestamp: "时间",
          records: " 条消息",
          confirm: "确认",
          cancel: "取消",
          clearAllTitle: "清除所有记录？",
          clearAllBody: "这将永久删除数据库中的所有已读追踪消息及其读取记录。",
          clearUuidTitle: "清除此 wxId 的记录？",
          clearUuidBody: '这将删除 wxId "{0}" 的所有消息及其读取记录。',
          loading: "加载中...",
          noRecords: "暂无消息",
          networkError: "网络错误",
          clearingAll: "正在清除所有记录…",
          clearedAll: "已清除所有记录",
          failedClear: "清除记录失败",
          enterUuid: "请输入 wxId",
          enterUuidDel: "请输入要删除的 wxId",
          clearingUuid: "正在清除 {0} 的记录…",
          clearedUuid: "已清除 {0} 的记录",
          failedClearUuid: "清除 wxId 记录失败",
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
          clearAll: "Clear All",
          filterUuid: "Filter by wxId...",
          query: "Query",
          delete: "Delete",
          deleteTitle: "Delete messages for this wxId",
          filterMsg: "Filter by message text...",
          wxid: "wxId",
          wxidLabel: "Sender",
          message: "Message",
          reads: "Reads",
          timestamp: "Timestamp",
          records: " messages",
          confirm: "Confirm",
          cancel: "Cancel",
          clearAllTitle: "Clear all records?",
          clearAllBody:
            "This will permanently delete every tracked message and its reads from the database.",
          clearUuidTitle: "Clear records for this wxId?",
          clearUuidBody: 'This will delete all messages for wxId "{0}".',
          loading: "Loading...",
          noRecords: "No messages found",
          networkError: "Network error",
          clearingAll: "Clearing all records…",
          clearedAll: "All records cleared",
          failedClear: "Failed to clear records",
          enterUuid: "Please enter a wxId",
          enterUuidDel: "Enter a wxId to delete",
          clearingUuid: "Clearing records for {0}…",
          clearedUuid: "Records for {0} cleared",
          failedClearUuid: "Failed to clear wxId records",
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
        document.querySelectorAll("[data-i18n-title]").forEach((el) => {
          el.title = t(el.dataset.i18nTitle);
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
        // close on overlay click
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

      function showClearWxidModal(wxId) {
        showModal(t("clearUuidTitle"), t("clearUuidBody", wxId), () => {
          deleteByWxid(wxId);
        });
      }

      /* ── fetch helpers ── */
      function buildUrl(base) {
        const q = document.getElementById("msgFilter").value.trim();
        let url = base;
        const params = [];
        if (q) params.push("q=" + encodeURIComponent(q));
        if (params.length) url += "?" + params.join("&");
        return url;
      }

      async function loadAll() {
        currentFilterUrl = buildUrl("/messages");
        await fetchData(currentFilterUrl);
      }

      async function loadByWxid() {
        const wxId = document.getElementById("wxidInput").value.trim();
        if (!wxId) {
          toast(t("enterUuid"), "error");
          return;
        }
        currentFilterUrl = buildUrl("/messages/" + encodeURIComponent(wxId));
        await fetchData(currentFilterUrl);
      }

      async function fetchData(url) {
        closeDetail();
        tbody.innerHTML =
          '<tr class="empty-row"><td colspan="4">' +
          esc(t("loading")) +
          "</td></tr>";
        recordCount.textContent = "…";
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const text = await res.text();
            tbody.innerHTML = \`<tr class="empty-row"><td colspan="4">HTTP \${res.status}: \${esc(text)}</td></tr>\`;
            recordCount.textContent = "0";
            toast(\`HTTP \${res.status}: \${text}\`, "error");
            return;
          }
          const data = await res.json();
          recordCount.textContent = data.length;
          if (!data.length) {
            tbody.innerHTML =
              '<tr class="empty-row"><td colspan="4">' +
              esc(t("noRecords")) +
              "</td></tr>";
            return;
          }

          tbody.innerHTML = data
            .map(
              (r) => \`<tr class="clickable-row" data-id="\${escAttr(r.id)}" data-content="\${escAttr(r.content)}" onclick="toggleDetail(this)">
      <td class="uuid-col">\${esc(r.wxId)}</td>
      <td class="msg-col">\${esc(r.content)}</td>
      <td class="reads-col">\${esc(r.reads)}</td>
      <td class="ts-col">\${esc(r.timestamp)}</td>
    </tr>\`,
            )
            .join("");
        } catch (e) {
          tbody.innerHTML =
            '<tr class="empty-row"><td colspan="4">' +
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

      function clearByWxid() {
        const wxId = document.getElementById("wxidInput").value.trim();
        if (!wxId) {
          toast(t("enterUuidDel"), "error");
          return;
        }
        showClearWxidModal(wxId);
      }

      async function deleteByWxid(wxId) {
        toast(t("clearingUuid", wxId), "info");
        try {
          const res = await fetch("/messages/" + encodeURIComponent(wxId), {
            method: "DELETE",
          });
          if (!res.ok) {
            toast(t("failedClearUuid"), "error");
            return;
          }
          toast(t("clearedUuid", wxId), "success");
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
      document.getElementById("wxidInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") loadByWxid();
      });
      document.getElementById("msgFilter").addEventListener("input", () => {
        loadAll();
      });

      /* ── init ── */
      applyI18n();
      loadAll();
    </script>
  </body>
</html>
`;

const PNG_1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

async function sha256Hex(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("");
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

function getClientIP(request) {
  // 只信任 Cloudflare 注入的真实客户端 IP；不接受客户端可控的 X-Forwarded-For
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function nowTimestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function computeId(wxId, content, createTime) {
  const raw = wxId + "\0" + content + "\0" + String(createTime);
  return sha256Hex(raw);
}

// 常量时间比较：先做 SHA-256 摘要再比较，避免字符串逐字符比较的时序侧信道
async function tokenMatches(input, expected) {
  if (typeof input !== "string" || input.length === 0) return false;
  const a = await sha256Hex(input);
  const b = await sha256Hex(String(expected)); // 防御非字符串 env 配置（如 TOML 数字）
  return a === b;
}

async function extractAuthToken(request, env) {
  if (!env.AUTH_TOKEN) return true; // 未配置 AUTH_TOKEN → 开放模式（README 已说明）
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    if (await tokenMatches(authHeader.slice(7), env.AUTH_TOKEN)) return true;
  }
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    for (const pair of cookieHeader.split(";")) {
      const trimmed = pair.trim();
      if (trimmed.startsWith("__Host-session=")) {
        // 新会话 cookie：值 = sess_<随机hex>，服务端仅存哈希
        const value = trimmed.slice("__Host-session=".length);
        if (value.startsWith("sess_")) {
          try {
            const row = await env.DB.prepare(
              "SELECT expires_at FROM sessions WHERE token_hash = ?"
            )
              .bind(await sha256Hex(value.slice(5)))
              .first();
            if (row && row.expires_at > nowTimestamp()) return true;
          } catch {}
        }
      } else if (trimmed.startsWith("auth_token=")) {
        // 兼容旧版 cookie（直接携带 AUTH_TOKEN）
        if (await tokenMatches(trimmed.slice("auth_token=".length), env.AUTH_TOKEN)) {
          return true;
        }
      }
    }
  }
  return false;
}

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
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:2rem;max-width:360px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.5)}
h1{font-size:1.25rem;font-weight:700;margin-bottom:.5rem}
p{font-size:.85rem;color:#94a3b8;margin-bottom:1.5rem}
input{width:100%;padding:.6rem .8rem;border:1px solid #475569;border-radius:6px;font-size:.9rem;background:#0f172a;color:#e2e8f0;outline:none;transition:border-color .15s}
input:focus{border-color:#3b82f6}
button{width:100%;margin-top:1rem;padding:.6rem;border:none;border-radius:6px;font-size:.9rem;font-weight:600;cursor:pointer;background:#2563eb;color:#fff;transition:background .15s}
button:hover{background:#1d4ed8}
</style>
</head>
<body>
<div class="card">
<h1>&#128274; Read Receipts</h1>
<p>Enter access token to view the dashboard.</p>
<form method="POST" action="/auth/verify">
<input type="password" name="token" placeholder="Access Token" autofocus/>
<button type="submit">Unlock</button>
</form>
</div>
</body>
</html>`;

// ── 安全辅助函数 ────────────────────────────────────────────

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 会话 30 天
const PIXEL_RATE_LIMIT = 10; // /pixel：每 IP 每分钟最多 10 次
const VERIFY_RATE_LIMIT = 5; // /auth/verify：每 IP 每分钟最多 5 次

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
  "style-src 'unsafe-inline'",
  "img-src data:", // 登录页 favicon 为 data: URI
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function randomHex(bytes) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// LIKE 通配符转义：将 % _ \ 作为字面量搜索
function escapeLike(s) {
  return String(s).replace(/[\\%_]/g, (m) => "\\" + m);
}

// 基于 Cache API 的固定窗口限流（近似计数：并发请求存在微小 TOCTOU 偏差，
// 对登录限流仅弱化不失效，可接受；如需精确计数可改用 D1 原子 UPDATE）。
// failClosed=true：限流系统故障时拒绝请求（登录场景）；false：放行（像素场景，保证追踪可用性）。
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;

    const authConfigured = !!env.AUTH_TOKEN;
    const weakAuth =
      authConfigured && (typeof env.AUTH_TOKEN !== "string" || env.AUTH_TOKEN.length < 24);
    const isPublicPath =
      path === "/pixel" ||
      path === "/auth/verify" ||
      path === "/auth/status" ||
      path === "/favicon.ico";

    // ── 认证（公开端点除外）──
    const authed = isPublicPath || (await extractAuthToken(request, env));

    // 弱 token 配置：拒绝一切管理端点，防止弱口令被爆破
    if (weakAuth && !isPublicPath) {
      return new Response(
        "Server misconfigured: AUTH_TOKEN must be at least 24 characters. Rotate it with: npx wrangler secret put AUTH_TOKEN",
        {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS },
        }
      );
    }
    if (!authed) {
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

    // ── POST /auth/verify ──
    if (path === "/auth/verify" && request.method === "POST") {
      if (weakAuth) {
        return new Response(
          "Server misconfigured: AUTH_TOKEN must be at least 24 characters",
          { status: 503, headers: { ...SECURITY_HEADERS } }
        );
      }
      const ip = getClientIP(request);
      if (!(await rateLimit("verify:" + ip, VERIFY_RATE_LIMIT, 60, true))) {
        return new Response("Too Many Requests", { status: 429, headers: { ...SECURITY_HEADERS } });
      }
      const formData = await request.formData();
      const token = String(formData.get("token") || "");
      if (!(await tokenMatches(token, env.AUTH_TOKEN))) {
        // 失败延迟：进一步抬高暴力破解成本
        await sleep(250 + Math.random() * 500);
        return new Response("Unauthorized", { status: 401, headers: { ...SECURITY_HEADERS } });
      }
      // 顺带清理过期会话
      await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?")
        .bind(nowTimestamp())
        .run()
        .catch(() => {});
      const sessionId = await randomHex(32);
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);
      // 会话必须持久化成功才下发 cookie，避免"登录后立即失效"的死循环
      let sessRes;
      try {
        sessRes = await env.DB.prepare(
          "INSERT INTO sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)"
        )
          .bind(await sha256Hex(sessionId), nowTimestamp(), expiresAt)
          .run();
      } catch {
        sessRes = null;
      }
      if (!sessRes || !sessRes.success) {
        return new Response("Session creation failed", {
          status: 500,
          headers: { ...SECURITY_HEADERS },
        });
      }
      return new Response(null, {
        status: 302,
        headers: {
          "Set-Cookie": `__Host-session=sess_${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
          "Location": "/",
          ...SECURITY_HEADERS,
        },
      });
    }

    // ── GET /auth/status ──
    if (path === "/auth/status" && request.method === "GET") {
      return json({ auth_required: authConfigured, weak_token: weakAuth });
    }

    // ── POST /register ──
    if (path === "/register" && request.method === "POST") {
      try {
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
        const id = await computeId(wxId, content, createTime);
        const ts = nowTimestamp();
        await env.DB.prepare(
          "INSERT OR IGNORE INTO messages (id, wx_id, content, timestamp) VALUES (?, ?, ?, ?)"
        )
          .bind(id, wxId, content, ts)
          .run();
        return json({ id });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // ── GET /pixel ──
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
      // 每 IP 限流，防存储耗尽 DoS（故障时放行，保证追踪可用性）
      if (!(await rateLimit("pixel:" + ip, PIXEL_RATE_LIMIT, 60, false))) {
        return new Response("Too Many Requests", { status: 429, headers: { ...SECURITY_HEADERS } });
      }
      // 只记录已注册消息的读取，拒绝任意 id/wxId 组合的填充攻击
      const msg = await env.DB.prepare("SELECT 1 FROM messages WHERE id = ? AND wx_id = ?")
        .bind(id, wxId)
        .first();
      if (!msg) {
        return new Response("Not Found", { status: 404, headers: { ...SECURITY_HEADERS } });
      }
      const ts = nowTimestamp();
      // INSERT OR IGNORE 依赖 schema.sql 的 UNIQUE(id, ip) 索引实现存储级去重；
      // 升级时必须重放 schema.sql（见 README「Upgrading an existing deployment」）
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

    // ── GET /count ──
    if (path === "/count" && request.method === "GET") {
      const wxId = params.get("wxId") || "";
      const id = params.get("id") || "";
      if (!wxId || !id) {
        return json({ error: "Missing wxId or id" }, 400);
      }
      const result = await env.DB.prepare(
        "SELECT COUNT(DISTINCT ip) AS cnt FROM reads WHERE id = ? AND wx_id = ?"
      )
        .bind(id, wxId)
        .first();
      return json({ count: result?.cnt || 0 });
    }

    // ── GET /messages ──
    if (path === "/messages" && request.method === "GET") {
      const q = (params.get("q") || "").slice(0, 200);
      let query = `SELECT m.id, m.wx_id AS wxId, m.content, m.timestamp, COUNT(DISTINCT r.ip) AS reads
        FROM messages m LEFT JOIN reads r ON m.id = r.id`;
      const bindParams = [];
      if (q) {
        query += " WHERE m.content LIKE ? ESCAPE '\\'";
        bindParams.push(`%${escapeLike(q)}%`);
      }
      query += " GROUP BY m.id ORDER BY m.timestamp DESC";
      const result = await env.DB.prepare(query)
        .bind(...bindParams)
        .all();
      return json(result.results || []);
    }

    // ── DELETE /messages ──
    if (path === "/messages" && request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM reads").run();
      await env.DB.prepare("DELETE FROM messages").run();
      await audit(env.DB, "delete_all", "");
      return json({ status: "ok" });
    }

    // ── GET /messages/{wxId} 与 DELETE /messages/{wxId} ──
    const wxIdMatch = path.match(/^\/messages\/([^/]+)$/);
    if (wxIdMatch && (request.method === "GET" || request.method === "DELETE")) {
      let wxId;
      try {
        wxId = decodeURIComponent(wxIdMatch[1]);
      } catch {
        return json({ error: "Invalid wxId encoding" }, 400);
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
      const result = await env.DB.prepare(query)
        .bind(...bindParams)
        .all();
      return json(result.results || []);
    }

    // ── GET /reads/{id} ──
    const readsMatch = path.match(/^\/reads\/([^/]+)$/);
    if (readsMatch && request.method === "GET") {
      let id;
      try {
        id = decodeURIComponent(readsMatch[1]);
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

    // ── GET / (Dashboard) ──
    if (path === "/" && request.method === "GET") {
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": DASHBOARD_CSP,
          ...SECURITY_HEADERS,
        },
      });
    }

    // ── favicon.ico (no-op) ──
    if (path === "/favicon.ico") {
      return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS } });
    }

    return new Response("Not Found", { status: 404, headers: { ...SECURITY_HEADERS } });
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
