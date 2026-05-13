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
