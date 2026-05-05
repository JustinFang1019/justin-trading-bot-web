# Trading Bot 參考筆記

來源參考：`C:/Users/cselden/Downloads/justin-trading-bot-v8.4.zip`

這份筆記不是原專案 README 的整理版，而是我讀過 zip 內主要程式後，先建立的一份討論用架構筆記。之後我們可以用它來決定要複製哪些概念、哪些地方重新設計，以及要不要做成自己的版本。

## 一句話理解

這個案子是一個台股選股與 LINE 推播機器人：

- 用 Flask 接 LINE webhook。
- 用 FinMind、TWSE、TPEX 等資料源抓台股行情與 K 棒。
- 用 Google Sheets 保存掃描結果、自選股、白名單、群組權限與績效紀錄。
- 用 APScheduler / GitHub Actions / Render 類型的排程環境做每日掃描、推播、K 棒快取與權證快取。
- 核心策略偏向「創高後回檔整理、KD 即將轉強、RS 排序」。
- 額外包含權證查詢、權證篩選、回測、教學卡片、LINE quota 監控、群組權限控管。

## 專案結構觀察

```text
app.py                         Flask + LINE webhook 主服務
main.py                        排程入口：scan / notify / both / force
requirements.txt               Python 依賴
PATTERNS.md                    大型策略與版本紀錄文件
mockup.html                    LINE Flex / UI mockup 類文件
static/richmenu.png            LINE rich menu 圖片

stock_scanner/
  scanner.py                   全市場掃描、預篩、K 棒讀取、RS baseline
  patterns.py                  KD 與型態判斷核心
  query.py                     使用者查詢路由、個股/大盤/績效/回測 Flex
  notify.py                    LINE Flex 推播卡與策略卡
  watchlist.py                 Google Sheets 儲存層與名單/績效管理
  warrant.py                   權證 master、價格、槓桿、delta、標的推估
  twse_warrant.py              TWSE/TPEX 權證資料抓取
  warrant_iv.py                Black-Scholes IV / Greeks 粗估
  warrant_greeks.py            HiStock 驗證用 greeks 抓取
  warrant_mis.py               權證盤中 MIS 資料
  backtest.py                  回測與回測 Flex
  education.py                 LINE 教學 Flex
  continuous_refresh.py        K 棒與權證背景持續刷新
  group_config.py              群組/好友可用指令設定
  line_quota.py                LINE quota 監控
  realtime_cache.py            即時報價快取
  richmenu.py                  LINE rich menu 建立
```

## 主要執行流程

### 1. LINE Bot 互動流程

`app.py` 是線上服務入口：

1. `/webhook` 接 LINE 事件。
2. 判斷事件類型：follow、unfollow、join、leave、message。
3. message 進來後依身分分流：
   - 管理員。
   - 已核准群組。
   - 非管理員好友。
4. 指令再交給 `stock_scanner.query.handle_query()` 或 `handle_group_query()`。
5. 回覆通常是 LINE Flex Message，也有純文字訊息。

已看到的指令方向包含：

- 個股查詢：代號或中文名。
- 即時查詢。
- 回測。
- 權證。
- RS 排名。
- 教學。
- 說明。
- 自選股加減。
- 管理員更新/掃描類指令。

### 2. 每日掃描與推播流程

`main.py` 是排程型入口，靠 `RUN_MODE` 控制：

- `scan`：只掃描，結果存 Google Sheets，不推播。
- `notify`：只讀 Sheets 今日結果並推播。
- `both`：若 Sheets 已有今日資料就直接推播，沒有才掃描。
- `force`：強制重掃、推播，並順便刷新權證 cache。

大致流程：

```text
run_scan()
  -> get_today_all_stocks()
  -> pre_filter()
  -> get_price_history()
  -> detect_pattern()
  -> sort by RS / score
  -> save_scan_results()
  -> notify()
```

### 3. 掃描邏輯

`scanner.py` 負責全市場資料與初步過濾：

- 從 TWSE/TPEX 取得今日股票清單與成交資料。
- 先用價格與成交金額做 pre-filter。
- 優先使用 disk K 棒快取，避免重打 API。
- 若資料 stale，嘗試補抓。
- 有 quota 與資料新鮮度保護。
- 對通過股票呼叫 `patterns.detect_pattern()`。

值得注意：

- 這個案子很重視 API quota 與快取。
- 掃描器有 stale 資料統計，並會把過舊資料踢出。
- RS 從分數中獨立出來，改成排序優先因子。

### 4. 策略核心

`patterns.py` 是策略判斷核心。

主要概念：

- 計算 KD。
- 判斷 KD 是否「真收斂」、「假收斂」、「發散」、「無訊號」。
- 找創高後回檔整理。
- 分類型態：
  - `TREND_PULLBACK`：直接回踩 MA10 / MA20。
  - `BOX_AFTER_PULLBACK`：回檔後橫盤整理。
  - `EARLY_REVERSAL`：回檔不深即轉強。
- BOX 判斷同時看 5 日與 10 日視角：
  - 短期：近 5 日不破前 5 日低，且波動小於指定門檻。
  - 中期：近 10 日不破前 10 日低，且波動小於指定門檻。

策略精神比較像：

```text
強勢股創高
  -> 回檔但未破壞結構
  -> KD 動能收斂或準備轉強
  -> 再用 RS 排序，把相對強的放前面
```

### 5. LINE 推播卡

`notify.py` 負責把掃描結果包成 LINE Flex：

- 推播掃描結果。
- 做個股策略卡。
- 標籤化顯示動能、位置、趨勢、KD、BOX、MA、RS。
- 支援 RS Top 排名卡。
- 有去重機制，避免近期重複推播。
- 推播後記錄績效資料。

這一層的價值不只是「通知」，也在把交易訊號轉成使用者看得懂的卡片語言。

### 6. Google Sheets 儲存層

`watchlist.py` 負責大部分持久化資料：

- 掃描結果。
- 掃描歷史。
- 自選股。
- 白名單。
- 已核准群組。
- 股票名稱對照。
- 績效紀錄。

討論時要注意：Google Sheets 很適合快速產品化，但如果之後要擴大多人使用或高頻查詢，可能需要換成資料庫。

### 7. 權證模組

權證是本案很大的一塊：

- `warrant.py`：權證 master、價格、快取、槓桿、delta、到期日、標的推估。
- `twse_warrant.py`：TWSE/TPEX 權證資料整合。
- `warrant_iv.py`：Black-Scholes call price、delta、IV 求解。
- `warrant_mis.py`：盤中資料補充。
- `warrant_greeks.py`：外部 greeks 驗證。

這裡可拆成兩層來想：

- 資料層：權證清單、價格、標的、到期、履約價。
- 決策層：實質槓桿、價內外、delta、流動性、造市品質、剩餘天數。

## 外部服務與環境變數

程式中明確看到或可推定需要：

- `LINE_TOKEN`
- `LINE_SECRET`
- `LINE_USER_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `FINMIND_TOKEN`
- `GOOGLE_CREDENTIALS`
- `RUN_MODE`
- `PORT`

外部服務：

- LINE Messaging API
- FinMind API
- TWSE / TPEX 官方資料
- Google Sheets API
- 可能部署在 Render / GitHub Actions 類環境

## 這個案子的優點

- 功能完整，已經接近實戰工具，不只是策略範例。
- 對台股資料源、LINE Bot、Google Sheets 的整合很完整。
- 有快取、quota、防 stale 資料、背景刷新等營運細節。
- 推播卡片做得細，使用者不是只看到代號，而是能看到理由。
- 策略有版本演進紀錄，方便追蹤決策邏輯。
- 權證模組有一定深度，包含槓桿、delta、IV、盤中資料。

## 可能的風險與重構方向

### 架構風險

- `app.py`、`query.py`、`notify.py` 都很大，責任偏多。
- LINE UI、策略、資料存取、權限控管有些耦合。
- Google Sheets 當資料庫會快速方便，但長期可維護性有限。
- 版本註解散在程式碼中，歷史包袱會越來越重。
- 策略參數若寫死在程式裡，後續調參與 A/B 測試會辛苦。

### 技術債方向

- 將策略、資料源、通知、儲存、權限拆成更清楚的 service。
- 建立設定檔，例如 `strategy.yaml` 或資料庫 table 管理門檻。
- 把掃描結果定義成明確 schema。
- 對策略核心加單元測試。
- 對資料源加 adapter，避免 FinMind / TWSE / TPEX 邏輯散落。
- 將權證模組獨立成可測試的 domain layer。
- 將 Flex Message builder 拆成 template / component。

## 如果我們要做自己的版本

我會建議先決定產品方向，而不是直接搬整包：

### 路線 A：輕量版選股推播

目標：先快速做出可用 MVP。

保留：

- 每日掃描。
- Google Sheets 儲存。
- LINE 推播。
- KD / 回檔 / RS 三個核心策略。

先不做：

- 權證。
- 回測。
- 教學卡。
- 複雜群組權限。
- 大量背景 refresh。

### 路線 B：完整實戰版

目標：接近原案能力，但架構重做。

保留：

- 掃描 / 推播 / 查詢 / 回測 / 權證。
- LINE Flex 體驗。
- 快取與 quota 管控。

重做：

- 模組分層。
- 設定管理。
- 資料庫。
- 測試。
- 策略版本化。

### 路線 C：策略研究平台

目標：重點不是 LINE Bot，而是策略迭代。

保留：

- K 棒資料。
- 策略判斷。
- 回測。
- 績效紀錄。

先不做：

- LINE Bot。
- Rich menu。
- 權限控管。
- 複雜 Flex UI。

## 後續討論問題

1. 我們想做的是「LINE 推播產品」還是「策略研究工具」？
2. 權證是不是第一版必要功能？
3. 使用者是你自己、少數好友，還是公開社群？
4. 資料儲存要先用 Google Sheets，還是一開始就上資料庫？
5. 策略要沿用原案的 KD / 回檔 / RS，還是加入自己的條件？
6. 每日掃描即可，還是需要盤中即時刷新？
7. 最終部署環境要用 Render、GitHub Actions、VPS，還是本機？

## 我目前的初步判斷

若目標是快速做出自己的可用版本，我會先做「路線 A」：

- 一個乾淨的 Python 專案。
- 先只支援每日掃描與 LINE 推播。
- 策略核心獨立成 `strategy/`。
- 資料源獨立成 `data_sources/`。
- 通知獨立成 `notifiers/line.py`。
- 結果先存 Google Sheets 或 SQLite。
- 等掃描結果穩定，再加入權證與回測。

這樣比較容易把原案的實戰經驗留下，同時避免一開始就背上整包複雜度。
