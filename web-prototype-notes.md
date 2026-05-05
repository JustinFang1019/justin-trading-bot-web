# Web Prototype Notes

入口檔：

- `index.html`

這是一版純前端 Web 原型，用來測試「LINE Bot + Web / LIFF」融合方向。

## 定位

LINE 不適合承載所有互動，所以這版 Web 的定位是：

- LINE：推播摘要、警示、Top 3 權證、快捷入口。
- Web / LIFF：K 線視覺化、完整掃描清單、權證篩選、即時警示管理、系統狀態。

## 目前是模擬資料

這版尚未接真 API，資料寫在 `index.html` 的 JavaScript 裡：

- `stocks`
- `warrants`
- `alerts`
- `statuses`
- `jobs`

未來可以改接：

- Google Sheets 掃描結果。
- `/data/kbar/*.json` K 棒快取。
- 權證 master / top3 cache。
- LINE quota API。
- FinMind / TWSE / TPEX 資料源。

## 已放入的功能

- 總覽 dashboard。
- 掃描清單，可搜尋、切換上市 / 上櫃。
- 點選股票更新策略詳情。
- Canvas 模擬 K 線圖。
- 權證推薦清單。
- 即時警示清單。
- 管理員系統狀態。
- LINE Flex 卡片預覽。
- Rich Menu 模擬。

## 後續可接真功能

第一階段：

1. 把 `stocks` 改成讀後端 `/api/scan-results`。
2. 把 Canvas K 線改成真 K 棒資料。
3. 權證清單改成讀 `/api/warrants?stock_id=2330`。
4. LINE 卡片預覽與原本 Flex JSON builder 對齊。

第二階段：

1. 做 LIFF 登入與 userId 綁定。
2. 自選股管理。
3. 即時警示條件編輯。
4. 回測結果圖表化。
5. 管理員操作：重掃、重推、刷新權證 cache。

## 設計原則

不要把 LINE 當完整 App。LINE 做通知與決策摘要；Web 做深入查看與操作。
