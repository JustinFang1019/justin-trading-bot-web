# Mobile verification

這個環境目前有兩個瀏覽器限制：

- `file://` 會被 Browser Use 的 URL policy 擋下。
- `localhost` / `127.0.0.1` 目前會回 `net::ERR_BLOCKED_BY_CLIENT`。

所以本機視覺檢查不能只靠 in-app browser。每次改 `index.html` 前端版面，至少要跑下面兩個檢查：

```powershell
node scripts/check-inline-scripts.mjs
node scripts/check-mobile-overflow.mjs
```

`check-inline-scripts` 會解析 `index.html` 裡的 inline script，先擋掉語法錯誤。

`check-mobile-overflow` 是靜態 guard，會確認手機版最容易爆寬的區塊都有保護：

- viewport meta
- `html/body` 水平 overflow guard
- 720px / 540px mobile breakpoint
- `tool-input-row`、`range-line` 在手機版改成單欄
- 首頁分類列與排序列允許橫向捲動，不撐破手機寬度
- `metric-pills`、`decision-metrics`、`rotation-metrics` 的 runtime overflow guard
- `scan-feed`、`etf-ranking`、工具頁、頁面切換後都有呼叫 `checkMobileOverflow`

若 Browser Use local URL 仍被擋，視覺驗證流程改用：

1. 跑上述兩個 Node 檢查。
2. push 後用 GitHub Pages cache-busting URL 檢查，例如 `?mobile-check=YYYYMMDDHHmm`。
3. 回報時明確寫出「local browser 被環境擋住」或「已完成 public page visual check」。

等 Browser Use / app 設定允許 local URL 後，仍要補做 390px、430px、768px 三個寬度的實機或自動截圖檢查。

## ETF 首頁手機版 UI 防呆守則

2026-05-14 的 ETF 首頁破版原因已確認：不是功能卡片本身，而是 `.etf-tools` 是 grid，子元素預設 `min-width: auto`，加上分類列與排序列內部按鈕有固定最小寬度，最後把 grid item 撐到超過手機寬度。修正後的穩定規則如下，之後新增或刪除 ETF 功能入口時必須保留。

- `.etf-tools` 必須保留 `min-width: 0` 與 `max-width: 100%`。
- `.etf-tools > *` 必須保留 `min-width: 0` 與 `max-width: 100%`，避免 grid item 被內容撐寬。
- `.etf-feature-groups`、`.etf-rank-controls`、`.etf-type-tabs`、`.etf-detail-tabs`、`.etf-sort-row` 必須保留 `min-width: 0`。
- ETF 分類列與排序列是「橫向滑動列」，不是自動換行區塊。不要改成滿版 grid，也不要讓每顆按鈕 `flex: 1 0 auto`。
- `.etf-type-tabs button`、`.etf-detail-tabs button`、`.etf-sort-row button` 應維持 `flex: 0 0 auto`，讓按鈕保持自然寬度，超出的部分交給父層橫滑。
- `.etf-type-tabs`、`.etf-detail-tabs`、`.etf-sort-row` 應保留 `overflow-x: auto`、`overflow-y: hidden`、`-webkit-overflow-scrolling: touch`。
- ETF 工具卡片新增或移除時，只改資料/按鈕清單與既有 grid 內容；不要重寫 `.etf-tools`、`.etf-feature-groups`、分類列、排序列的 layout。
- 手機版以 375px 寬度為最低驗收基準。改完至少要跑 `node scripts/check-mobile-overflow.mjs`，確認包含 `etf tool grid children can shrink` 與 `etf tool grid items constrained`。

實務檢查重點：

1. 手機 ETF 首頁的「決策工具 / 查詢與監控」卡片應完整在畫面內，不能右側被切。
2. 「全部 / 主動 / 股票 / 高股息 / 債券」分類列可以左右滑動。
3. 「規模金額 / 近12月殖利率 / 費率 / 折溢價」排序列可以左右滑動。
4. ETF 排名卡片的三個指標 pill 在手機版應維持一列三格，不要被改成單欄。
5. 新增功能入口時，如果手機右側被切，優先檢查 grid/flex item 的 `min-width: auto`，不要先回滾功能或重做 UI。
