# Trading Bot Discussion Project

這個 project 是用來討論並設計「自己的台股選股 / LINE 推播 / 權證工具」。

主要參考案：

- `C:/Users/cselden/Downloads/justin-trading-bot-v8.4.zip`

目前已整理的討論筆記：

- `trading-bot-reference-notes.md`
- `ui-comparison-notes.md`
- `web-prototype-notes.md`

目前已建立的 Web 原型：

- `index.html`
- `data/market-snapshot.json`：TWSE / TPEX 官方公開行情快照
- `data/kbar-snapshot.json`：watchlist 真實日 K 快照
- `scripts/fetch-real-market-data.ps1`：行情快照更新腳本
- `scripts/fetch-kbar-snapshot.ps1`：K 線快照更新腳本

## 新對話快速接續方式

如果在這個 project 開新的 Codex 對話，可以先請 Codex 讀：

```text
請先閱讀 README.md 和 trading-bot-reference-notes.md，我們要繼續討論這個 trading bot 案子。
```

## 目前討論焦點

我們不是要直接照搬原專案，而是先理解原案的架構與功能，再決定自己的版本要怎麼做。

原案重點：

- Flask + LINE Bot webhook
- 台股掃描與每日推播
- FinMind / TWSE / TPEX 資料源
- Google Sheets 儲存掃描結果、自選股、白名單、績效
- KD / 回檔 / BOX / RS 排序策略
- 權證查詢與篩選
- 回測、教學卡、群組權限、LINE quota 監控

初步建議路線：

- 先做輕量 MVP：每日掃描、策略核心、LINE 推播、結果儲存。
- 權證、回測、教學卡、複雜權限可第二階段再加。
- LINE 不硬塞完整 App 功能；深入互動用 Web / LIFF 承接。
- GitHub Actions 會在平日台灣時間 17:45 更新官方行情與 K 線快照。
