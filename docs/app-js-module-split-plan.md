# `app.js` 模組化拆分計劃

C18 已經把 7,368 行的 `index.html` 拆出 `app.js`（3,862 行）。本檔案是「下一步」的設計案——把 `app.js` 進一步切成 ES modules，但**還沒實作**。提案先放這裡是要讓你（或下個接手的 AI）有跡可循、確認方向再動工。

## 為什麼還沒做

切 ES modules 牽涉到：

1. **頂層 `let`/`const`/`function` 從 global 變 module-scoped**。其他 `<script>` 拿不到。需要 `export` 出來。
2. **HTML 內 inline event handler 失效**。例如 `<button onclick="loadCommand('X')">` 找不到 `loadCommand`。
   - 好消息：目前的 `index.html` 全用 `addEventListener`，**沒有 inline handler**（已 grep 確認）。
3. **`<script type="module">` 自動 defer + CORS** — 透過 `file://` 開頁面會被瀏覽器擋；本機開發必須走 `http://`。
4. **Top-level await** 變可用，但要重新檢查 `loadApp()` 的呼叫位置（目前在 `boot()` 內部）。

## 建議拆法

3,862 行的 `app.js` 大致對應這些功能領域，預計切成 ~15 個檔案：

```
.
├── index.html
├── styles.css
├── app.js               ← 變成「entry」，~80 行：import 模組、wire global event listeners、呼叫 boot()
└── js/
    ├── dom.js           ← html(), safeHTML, safeHTML.raw, $()  ← 已準備好 helper
    ├── api.js           ← getJson, postJson, API_BASE, commandFetchOptions
    ├── state.js         ← stocks/selected/filter/statusPayload 等全域可變狀態
    ├── prefs.js         ← PREFS_KEY / loadPrefs / savePrefs + 17 個使用者偏好變數
    ├── theme.js         ← currentTheme, applyTheme
    ├── auth.js          ← LIFF 流程 / authenticateWithLine / clearSession / webSessionToken
    ├── route.js         ← saveAppRoute / restoreAppRoute / activate
    ├── drawer.js        ← openDrawer / closeDrawer / drawerKeydown
    ├── views/
    │   ├── scan.js      ← renderOriginalFeed / renderWebHelp / loadCommand
    │   ├── chart.js     ← chartColors / drawChart (含 C05 / C06 已完成的版本)
    │   ├── warrant.js   ← renderWarrants
    │   ├── status.js    ← renderStatus / loadStatus
    │   └── etf.js       ← loadActiveEtfs / renderActiveEtfRanking / renderActiveEtfDetail
    └── tools/           ← ETF 12 工具，每個工具一檔
        ├── compare.js
        ├── filter.js
        ├── portfolio.js
        ├── position.js
        ├── market-dashboard.js
        ├── flow.js
        ├── institutional.js
        ├── heatmap.js
        ├── calendar.js
        ├── dividend-calc.js
        ├── stock-flow.js
        ├── holding-trend.js
        ├── rebalance-radar.js
        ├── theme-radar.js
        └── natural-query.js
```

## 進行步驟（建議的 PR 順序）

每個 step 都是獨立、可單獨 review 並 deploy 的 PR：

1. **Step 1 — bootstrap modules infrastructure (≈半天)**
   - `app.js` 改成 `<script type="module" src="app.js">`
   - 拆出 `js/dom.js`（`html()` + `safeHTML` 從 app.js 搬過去，export 出來）
   - app.js 內 `import { html, safeHTML } from "./js/dom.js"`
   - 驗證：`<details summary="...">` 全部可開、深色模式 toggle 仍能 redraw chart
   
2. **Step 2 — extract pure helpers (≈1 小時)**
   - `js/api.js`：getJson / postJson / API_BASE
   - `js/prefs.js`：PREFS_KEY / load / save + 17 個變數
   - `js/theme.js`：applyTheme
   - 這幾個檔案沒有對其他模組的依賴，純函式 + 常數，安全
   
3. **Step 3 — view modules (≈半天)**
   - 每個 view 一個 module
   - chart.js / scan.js / warrant.js / status.js 依序拆，每拆一個就 verify 該 view 還能 render
   - PR 可分成 4 個小 PR，或 1 個大 PR
   
4. **Step 4 — ETF view (≈半天)**
   - `views/etf.js` 本體 + 12 個 `tools/*.js`
   - ETF 工具點擊路徑：`document.addEventListener("click", ...)` 改成 import 的 tool functions
   
5. **Step 5 — final clean-up**
   - 把 app.js 縮到剩 ~80 行 entry
   - 全部 export / import 確認沒漏
   - `safeHTML` 在所有 `innerHTML =` 處取代既有的 `${html(...)}`

## 估時

| Step | 工時估算 | 風險 |
|---|---|---|
| 1 bootstrap | 4 hr | 低（小範圍 + 驗證簡單） |
| 2 helpers   | 2 hr | 低 |
| 3 views     | 4 hr | 中（view 間有 selected / kbarById 共享狀態） |
| 4 ETF       | 6 hr | 中（12 個工具各有自己的 state） |
| 5 clean-up  | 2 hr | 低 |
| **合計**    | **~18 hr** | |

## 不做這個的話會怎樣？

目前 `app.js` 3,862 行單檔仍可運作。主要痛點：
- 在編輯器 / AI 接手時不容易跳轉、難搜尋
- 新增功能容易繼續肥大，未來更難拆
- 全域 `let` 容易被誤改 / 遮蔽

如果短期內沒有顯著的功能擴展，**留在現狀也不會壞**。建議在加下一個大功能（例如自選股推播）前先做 Step 1+2，然後新功能就寫在新 module 裡，舊的逐步遷移。
