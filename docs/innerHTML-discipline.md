# `innerHTML` 紀律

`index.html` 全檔大量使用 `.innerHTML =` 模板字串組 DOM（~30+ 處）。本文件記錄目前的安全狀況與紀律規則，避免之後加入新人 / AI 接手時出 XSS 漏洞。

## 目前狀況（截至 main 最新）

### 全域 escape helper

`html(value)`（在 index.html 開頭）使用標準 HTML entity escape：

```js
function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
```

✅ 涵蓋了所有 XSS context 需要轉義的 5 個字元。

### 安全的 innerHTML 用法 — 大多數場景

模板字串中，**所有插入的字串**都經過 `html()`：

```js
$("cardFeed").innerHTML = `<div class="message">${html(friendly)}</div>`;
$("warrantList").innerHTML = rows.map(w => `
  <div class="warrant-row">
    <strong>${html(w.code)}</strong>
    <div class="meta"><span>${html(w.delta)}</span></div>
  </div>`).join("");
```

✅ 這類用法是安全的。

### ⚠️ 需要警戒的兩條路徑

#### 1. LINE Flex bubble HTML 直接 render

```js
// renderCommandPayload — 約 line 4317
$("cardFeed").innerHTML = bubbles.map(bubble => {
  const sid = stockIdFromBubble(bubble) || (command.match(/\d{4}/) || [""])[0];
  return flexNode(bubble, sid);
}).join("");
```

`flexNode(bubble, sid)` 把 LINE Flex Message bubble 轉成 HTML 字串。**安全性前提是後端 (`stock-scanner-bot`) 完全控制這份 bubble 的內容**——沒有把使用者 / 群組成員的訊息原樣塞進 bubble。

目前的 bubble 來源都是 `stock_scanner/scanner.py` 自己根據 TWSE / TPEX 資料生成，**沒有引入第三方輸入**，所以 OK。

未來若：
- LINE bot 群組加入投稿功能（讓使用者貼自選股代號 → 自動轉成 bubble）
- 或從第三方 RSS / 新聞 API 把內容直接做進 bubble

→ 必須在 backend 端先過 sanitizer，否則這條路徑會變成 XSS 入口。

#### 2. `text_message` 直接 render

```js
// renderCommandPayload — 約 line 4324
$("actionNotice").innerHTML = data?.text_message
  ? `<div class="message text-summary">${html(data.text_message)}</div>`
  : "";
```

這條已經有 `html()` 包裹 → ✅ 安全。早期版本可能沒包，所以列入監視名單。

```js
// 約 line 4329
$("cardFeed").innerHTML = `<div class="message">${html(data?.text_message || "沒有回傳小卡。")}</div>`;
```

也已包 `html()` → ✅

## 規則 (for future contributors / Claude)

1. **任何來自 API、使用者輸入、URL parameter 的字串**，在拼進 innerHTML 模板字串前**一定**要過 `html()`。
2. 來自後端但 trusted (掃描結果結構化欄位、ETF 持股列表等) 也建議過 `html()`，零成本，避免之後資料源變更引入問題。
3. **絕對不要**繞過 `html()` 用 raw template literal：
   ```js
   // ❌ 危險
   el.innerHTML = `<span>${row.name}</span>`;
   // ✅ 安全
   el.innerHTML = `<span>${html(row.name)}</span>`;
   ```
4. 若要插入 HTML 結構（不是純文字），考慮改用 `textContent` + `appendChild`。
5. **拆檔後 (C18)**：把這些 innerHTML 模板逐步移到 `js/dom.js` 提供統一的 `safeHTML\`...\`` tagged template literal 函式，內建自動 escape。

## 已知例外（不需 escape）

下列場景的字串是 **constant 字面值**或 **已 HTML 結構化過的安全產出**，不需要 `html()`：

- `<div class="message">正在讀取...</div>` — 純常數
- `flexNode(bubble, sid)` — 已是組好的 HTML，假設 backend 信任
- icon SVG 字串

## 後續工作

拆檔 (C18) 後新增的 `js/dom.js` 應該包含：

```js
export function safeHTML(strings, ...values) {
  return strings.reduce((acc, str, i) =>
    acc + str + (i < values.length ? escape(values[i]) : ""), "");
}
```

之後所有 innerHTML 改用 `el.innerHTML = safeHTML\`...\``，預設 escape，不會忘記叫 `html()`。
