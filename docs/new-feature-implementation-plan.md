# New Feature Implementation Plan

Last updated: 2026-05-12 Asia/Taipei

This plan turns the current preview features into concrete implementation work. The guiding rule is:

- `justin-trading-bot-web`: UI, LIFF session, view routing, local interactions, read API rendering.
- `justin-trading-bot`: API, Google Sheets writes, LINE push, data cache jobs, external tokens, admin operations.

## Current Foundation

The web frontend already has:

- `API_BASE = https://stock-scanner-bot-f3kt.onrender.com/api/web`
- `getJson`, `postJson`, `commandFetchOptions`
- LIFF login and `webSessionToken`
- `scanView`, `activeEtfView`, drawer/bottom nav routing
- stock card rendering, stock detail calls, ETF ranking/detail/tool pages
- existing ETF APIs for ranking, compare, flow, dividends calendar, overlap matrix, stock flow, holding trends, source admin

The Flask backend already has:

- `/api/web` Blueprint
- scan results, scan cards, stock detail, stock K-bar, stock card, warrants, performance, watchlist, RS top, status
- Google Sheets read/write helpers in `watchlist.py`
- LINE push helpers in `app.py` / `notify.py`
- strategy/backtest logic in `patterns.py`, `scanner.py`, `notify.py`, `backtest.py`

## Official ETF Data Source Upgrade

This is now a required part of the ETF refactor. **Every ETF should use the issuer/fund-company official website as the first-priority source.** Aggregator sites can lag behind the issuer website, especially for new active ETFs, same-day holdings, NAV, and fund-file expenses.

Source priority:

1. Issuer official ETF/fund page.
2. Issuer official downloadable files or JSON endpoints.
3. TWSE / TPEx official market data where issuer data does not cover market price.
4. Aggregators such as MoneyDJ/Yahoo/StockQ only as fallback or cross-check.

The backend should never treat MoneyDJ/Yahoo as the primary ETF research source when an issuer official source exists.

### Issuer registry architecture

Add a registry-driven parser system:

```json
{
  "00403A": {
    "issuer": "ezmoney",
    "issuer_name": "統一投信",
    "official_fund_code": "63YTW",
    "official_url": "https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=63YTW",
    "parser": "ezmoney"
  },
  "00981A": {
    "issuer": "ezmoney",
    "issuer_name": "統一投信",
    "official_fund_code": "49YTW",
    "official_url": "https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW",
    "parser": "ezmoney"
  }
}
```

Implementation files:

- `stock_scanner/official_etf_sources.py`: common orchestrator.
- `stock_scanner/official_sources/ezmoney.py`: Uni-President parser.
- Later parser modules:
  - `yuanta.py`
  - `capital.py`
  - `fubon.py`
  - `cathay.py`
  - `ctbc.py`
  - `fhtrust.py`
  - one parser per issuer when their site structure differs.

Common official source contract:

```python
class OfficialEtfSource:
    def fetch_profile(self, code: str) -> dict: ...
    def fetch_expenses(self, code: str) -> dict: ...
    def fetch_portfolio(self, code: str) -> dict: ...
    def fetch_nav_history(self, code: str) -> dict: ...
```

Unified API output:

```json
{
  "code": "00403A",
  "issuer": "ezmoney",
  "issuer_name": "統一投信",
  "source_priority": "official",
  "source_url": "https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=63YTW",
  "source_updated_at": "2026-05-12T17:40:38",
  "profile": {},
  "expenses": {},
  "portfolio": [],
  "portfolio_diff": {},
  "nav_history": [],
  "fallbacks_used": []
}
```

If official source fails:

- Return stale official cache if available and mark `stale: true`.
- Fill missing fields from TWSE/MoneyDJ/Yahoo with `fallbacks_used`.
- Show a frontend warning: `官網暫時無法更新，顯示備援資料`.

### Confirmed example: Uni-President / EzMoney

User supplied URL:

- `https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW`

Important correction:

- On the official EzMoney page, `fundCode=49YTW` maps to `00981A 主動統一台股增長`.
- `00403A 主動統一升級50` maps to `fundCode=63YTW`.
- We must maintain a `stock_code -> issuer_fund_code` resolver and not assume the pasted URL always matches the ticker.

Confirmed official endpoints / embedded data:

- Fund page: `GET https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=63YTW`
- Embedded fund profile: hidden `#DataFund` JSON.
- Embedded portfolio: hidden `#DataAsset` JSON.
- Embedded portfolio schema: hidden `#DataAssetDetailSchema` JSON.
- Official portfolio xlsx: `GET /ETF/Fund/AssetExcelNPOI?fundCode=63YTW`
  - Confirmed response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Filename pattern: `ETF_Investment_Portfolio_YYYYMMDD.xlsx`
- Official NAV trend JSON: `GET /ETF/Fund/ValueJson/?fundCode=63YTW`
- Official NAV table/download endpoints visible in page JS:
  - `POST /ETF/Fund/fundNav`
  - `POST /ETF/Fund/GetNavHistory`
  - `POST /ETF/Fund/GetHistory`
- Official intraday/estimated NAV detail endpoint visible in page JS:
  - `POST /ETF/Fund/ETFNavDetail`

Data we can extract for 00403A:

- Fund file expenses:
  - Manager fee: 1.2% under/equal 200B; 1.0% for the portion above 200B.
  - Custodian fee: 0.035%.
  - Performance benchmark authorization fee: 0.01% of average NAV.
  - Index authorization fee: none.
  - Derived display field: total explicit annual expense = manager fee tier + custodian fee + benchmark authorization fee.
- Fund portfolio:
  - `DataAsset` contains same-day `TranDate`, `EditDate`, asset groups, holdings details, shares, amount, and `NavRate`.
  - This is enough for a fast "today added/reduced" table if we keep the previous official snapshot and diff `Share` / `NavRate`.
- NAV trend:
  - `ValueJson` returns date/value pairs for the NAV chart.
  - Combine official NAV with TWSE/Yahoo/market price to compute premium/discount.

Backend implementation:

- Add module in `justin-trading-bot`: `stock_scanner/official_etf_sources.py`.
- Add source registry for every ETF we support:
  - `00403A -> issuer: ezmoney, fundCode: 63YTW`
  - `00981A -> issuer: ezmoney, fundCode: 49YTW`
  - add all existing ETF ranking tickers over time.
- Add cache files under Render disk, e.g. `/data/official_etf/00403A/YYYY-MM-DD.json`.
- Add endpoint:
  - `GET /api/web/etfs/official/<code>`
  - returns `profile`, `expenses`, `portfolio`, `nav_history`, `source`, `source_updated_at`, `fetched_at`.
- Add endpoint:
  - `GET /api/web/etfs/<code>/official-diff?days=2`
  - returns today vs previous official portfolio diff.
- Official portfolio update flow:
  1. Resolve ticker to official source, e.g. `00403A -> ezmoney / 63YTW`.
  2. Fetch official page `Info?fundCode=63YTW`.
  3. Parse hidden `DataAsset`.
  4. Flatten stock holdings where `AssetCode == "ST"` and details exist.
  5. Save normalized snapshot keyed by official `TranDate` and `EditDate`.
  6. Find the latest prior snapshot for the same ETF.
  7. Diff by `DetailCode`.
  8. Expose added / removed / increased / decreased / unchanged counts.
- Fetch schedule:
  - active ETF official refresh: every 15-30 minutes during 16:00-19:00 Taiwan time.
  - fallback refresh: daily after 20:00.
  - user-triggered admin refresh for one ETF.

Normalized official holding row:

```json
{
  "code": "2330",
  "name": "台積電",
  "shares": 1234567,
  "amount": 1234567890,
  "weight": 29.5,
  "asset_code": "ST",
  "currency": "NTD",
  "source_tran_date": "2026-05-12",
  "source_edit_time": "2026-05-12T17:40:38"
}
```

Diff output:

```json
{
  "code": "00403A",
  "source": "ezmoney",
  "current_date": "2026-05-12",
  "previous_date": "2026-05-11",
  "current_edit_time": "2026-05-12T17:40:38",
  "rows": [
    {
      "code": "2330",
      "name": "台積電",
      "status": "increased",
      "share_delta": 100000,
      "weight_delta": 0.42,
      "current_shares": 1200000,
      "previous_shares": 1100000,
      "current_weight": 29.5,
      "previous_weight": 29.08
    }
  ],
  "summary": {
    "added": 2,
    "removed": 1,
    "increased": 18,
    "decreased": 22,
    "unchanged": 7
  }
}
```

How to update when 00403A changes today:

- Run backend refresh for `00403A`.
- If official `EditDate` is newer than cached snapshot, save a new snapshot immediately.
- Recompute diff against previous official snapshot.
- `GET /api/web/etfs/official/00403A` returns the latest holdings.
- `GET /api/web/etfs/00403A/official-diff` returns today’s additions/reductions.
- Frontend `renderActiveEtfDetail()` shows a visible official update banner and the diff table.

Admin/manual refresh:

- Add admin endpoint:
  - `POST /api/web/etfs/official-refresh`
  - body: `{ "code": "00403A" }`
  - requires web admin token.
- Use this when the issuer site has updated but scheduled refresh has not run yet.

Frontend implementation:

- ETF detail should show official-source badges:
  - `官網更新 2026-05-12 17:40`
  - `資料源：統一投信`
- Add "official portfolio updated today" section:
  - top additions/reductions by share and weight.
  - show raw source date and previous comparison date.
- If official diff exists, the ETF detail tabs should prioritize:
  - `今日新增`
  - `加碼`
  - `減碼`
  - `完整持股`
  using official issuer data before aggregator holdings.
- Add official expense summary:
  - fund-file total explicit annual expense.
  - break down manager/custodian/authorization fees in a bottom sheet or detail row.
- Add NAV trend / premium panel:
  - official NAV line.
  - market price line if available.
  - latest premium/discount.

Cannot do / risk:

- This is scraping/official-page parsing, so selectors and embedded JSON names can change. The parser must be isolated per issuer with tests and graceful fallback.
- Some endpoints may require anti-forgery token/session in the future. The current page exposes enough data and downloads without login, but backend should keep a fallback path.
- Data terms and robots policy need to be respected. Cache and attribute source; do not hammer the issuer site.
- NAV and price timestamps differ. Premium/discount must show timestamp labels.

MVP:

- Implement EzMoney parser for 00403A and 00981A only.
- Parse `DataFund`, `DataAsset`, `DataAssetDetailSchema`, and `ValueJson`.
- Show expenses, same-day portfolio, portfolio diff, NAV trend, and premium/discount in ETF detail.
- Use the same official-source contract so the next issuers can be added without changing frontend.
- Keep MoneyDJ/Yahoo/TWSE as fallback only when official data is absent.

## A-Series ETF UI Refactor

### A01 ETF first-screen density

Implementation:

- Frontend only in `index.html`.
- Reduce ETF header copy, move badge into title line, shorten search placeholder.
- Merge type tabs and sort row into one compact filter area.
- Keep existing state variables: `activeEtfFilter`, `activeEtfSortKey`, `activeEtfSortDir`.

Cannot do / risk:

- If future data has long issuer/category labels, row height may grow. Use fixed line clamps.

MVP:

- CSS + DOM restructure only. No API change.

### A02 ETF tool grid hierarchy

Implementation:

- Replace `#activeEtfFeatureGrid` markup with `.etf-tools`.
- Keep existing `data-etf-tool` dispatcher.
- Move `data-upcoming-list` into the secondary grid card.
- Remove standalone `#upcomingEtfSection` display logic.

Cannot do / risk:

- Admin-only `sourceAdminTool` must remain hidden for non-admin. Do not move it into visible markup unless the hidden behavior is kept.

MVP:

- Frontend only.

### A03 ETF ranking row

Implementation:

- Update `renderActiveEtfRanking()` row template.
- Use existing fields from ETF payload where available: `close_price`, `change_rate`, `asset_size_billion`, metrics from `etfDecisionMetrics(row)`.
- Add labeled asset delta bar with `asset_delta_pct` or fallback to existing asset delta state.
- Keep beneficiaries because the row has enough room. Display it as a fourth compact pill or a quiet inline meta item, instead of removing it.

Cannot do / risk:

- If API lacks latest price/change for some ETF, show `--` and keep layout stable.

MVP:

- Render price/change when present; no backend change.

### A04 ETF detail hero

Implementation:

- Update `renderActiveEtfDetail()`.
- Keep the existing light card visual style from the current app / user reference image:
  - white or near-white card
  - thin blue top border
  - dark title text
  - muted metadata line
  - price large on left, percent change on right
- Do not use the blue gradient hero from the earlier mockup.
- Promote yield, expense, premium into three large decision pills.
- Move size, holders, next dividend date into compact inline meta.
- Add space for future watchlist CTA, but do not implement B01 behavior in this batch.
- Add official-source content when available:
  - expense total from official fund file
  - same-day official portfolio update
  - NAV/premium panel

Cannot do / risk:

- `next dividend date` may be unavailable for some ETF. Fallback to `--`.
- For official NAV vs market price, timestamps can differ; always display both timestamps.

MVP:

- Frontend layout first, official data panel after backend parser exists.

## B-Series New Features

### B01 Watchlist + custom push

Implementation:

- Do not implement in the first execution batch. Reserve UI space only.
- Frontend:
  - Add star icon to stock `.line-card`, ETF `.etf-row`, and ETF detail hero.
  - Add `#watchlistView`.
  - Add push rule toggles: START hit, RS90, below 20MA, ETF dividend D-3, ETF premium > 1%, upcoming ETF countdown.
- Backend:
  - Add authenticated endpoints:
    - `GET /api/web/user/watchlist`
    - `POST /api/web/user/watchlist`
    - `DELETE /api/web/user/watchlist`
    - `POST /api/web/user/push-rules`
  - Verify `Authorization: Bearer <webSessionToken>`.
  - Store in Google Sheets first: `uid, code, type, group, rules_json, created_at, updated_at`.
  - Add scheduled evaluator after scan/ETF cache refresh. Send LINE push when a rule matches.

Cannot do / risk:

- Static GitHub Pages cannot write Google Sheets or push LINE directly.
- Needs clear duplicate push prevention, e.g. `uid + code + rule + date`.

MVP:

- Placeholder only in current redesign.
- Later MVP: add/remove watchlist and one rule, START hit.

### B02 Market dashboard

Implementation:

- Frontend:
  - Add `#dashboardSection` above `scanView`.
  - Aggregate `/scan-results`, `/rs/top`, `/etfs/dividends/calendar`.
  - Compute sentiment score client-side first.
- Backend optional:
  - `GET /api/web/dashboard` for precomputed score and faster load.

Cannot do / risk:

- If `/rs/top` returns only Flex payload, frontend may need a structured endpoint later.

MVP:

- Use `/scan-results` only: count START, CONT, RS90+, top score/RS rows.

### B03 Strategy hit-rate review

Implementation:

- Frontend:
  - Add `strategyReviewView` or an ETF/stock tool page.
  - Strategy pills: START / CONT / RS90+.
  - Render hits, win rate, average 5-day return, rows sorted by return.
- Backend:
  - Add `GET /api/web/strategy/backtest?strategy=START&days=30`.
  - Read historical scan/performance sheet.
  - Use cached K-bars to compute `t5_return`, `t20_return`.

Cannot do / risk:

- Existing `backtest.py` is per-stock historical signal replay; this feature is portfolio-level signal outcome review. Reuse logic, but build a separate aggregation endpoint.

MVP:

- 30-day START only, 5-day return only.

### B04 Portfolio simulator

Implementation:

- Frontend:
  - Add ETF tool `portfolio`.
  - Weight sliders constrained to 100%.
  - Result hero: weighted yield, weighted expense, overlap.
- Backend:
  - Add `POST /api/web/portfolio/simulate`.
  - Input `{ etfs:[{code, weight}] }`.
  - Use ETF metrics + holdings cache.

Cannot do / risk:

- True overlap needs reliable holdings for every ETF. Some ETFs may have missing holdings.

MVP:

- Support 2-3 ETFs with available holdings; show warning for missing holdings.

### B05 Institutional flow

Implementation:

- Frontend:
  - Add stock detail panel under card/K-bar.
  - Show foreign, investment trust, dealer net buy/sell and consecutive days.
- Backend:
  - Add daily cache job after TWSE publication.
  - Add `GET /api/web/stock/<code>/institutional?days=5`.
  - Data source: TWSE/TPEX institutional trading public data.

Cannot do / risk:

- Publication is after market close; intraday data should show stale/last update.

MVP:

- TWSE listed stocks first, 5 days, no TPEX until source format is confirmed.

### B06 ETF rebalance radar

Implementation:

- Frontend:
  - Add ETF tool/detail tab `rebalance`.
  - Countdown card + include/exclude candidate chips.
- Backend:
  - Add `GET /api/web/etf/<code>/rebalance-forecast`.
  - Create rule module per ETF family.
  - Use market cap, liquidity, current constituents, and ETF rules.

Cannot do / risk:

- This is a forecast, not official data. UI must label it as simulated probability.
- ETF rules vary; do not overclaim precision.

MVP:

- Start with 0050 only, static rules + current market cap ranking.

### B07 Dividend calculator + fill history

Implementation:

- Frontend:
  - Add calculator panel in ETF detail.
  - Input shares, estimated payout, fill-history table.
- Backend:
  - Add `GET /api/web/etf/<code>/dividend-history`.
  - Cache ex-dividend date, payout, fill date, fill days.

Cannot do / risk:

- Fill date calculation needs adjusted close and careful ex-dividend price handling.

MVP:

- Major ETFs only: 0050, 0056, 00878, 00919. Manual/cached history acceptable first.

### B08 Card one-click share

Implementation:

- Frontend:
  - Add share button to `.line-card`.
  - Open bottom sheet.
  - MVP actions: copy link, native Web Share API.
  - Full action: html2canvas screenshot.
- Backend:
  - Full version endpoint `POST /api/web/share/card`.
  - Persist image, generate short URL.

Cannot do / risk:

- Browser screenshot consistency can vary. Use server-side render or strict card dimensions if quality matters.

MVP:

- Copy current card URL + LINE share URL scheme, no image upload.

### B09 Watchlist groups

Implementation:

- Do not implement in the first execution batch. Reserve UI space only.
- Frontend:
  - Add group pills in `watchlistView`.
  - Add edit group bottom sheet.
  - Reuse B01 star/watchlist endpoints.
- Backend:
  - Extend B01 storage with `group`.
  - Optional `GET/POST /api/web/user/groups`.

Cannot do / risk:

- Group rename must update references or use stable group IDs.

MVP:

- Placeholder only in current redesign.
- Later MVP: fixed groups: short, long, watch. Custom group names later.

### B10 Dark mode

Implementation:

- Frontend only:
  - Add `[data-theme="dark"]` CSS variables.
  - Add drawer toggle.
  - Store in `localStorage`.
  - Initialize from `prefers-color-scheme`.

Cannot do / risk:

- Some inline colors currently exist in templates; they need audit so dark mode is complete.

MVP:

- Core variables + scan/ETF views first.

### B11 Position calculator

Implementation:

- Frontend:
  - Add panel on stock detail.
  - Inputs: capital, risk %, entry, stop.
  - Compute shares/lots and max loss live.
  - Auto-fill entry from START/CONT strategy card.
- Backend optional:
  - `GET /api/web/stock/<code>/atr?days=20`.

Cannot do / risk:

- Taiwan board lot display must be explicit: shares vs lots.

MVP:

- Compute ATR from existing `/stock/<code>/kbar?limit=30` on frontend.

### B12 Natural language query

Implementation:

- Frontend:
  - Add AI ETF filter entry.
  - Show parsed condition chips and result list.
- Backend:
  - Add `POST /api/web/nlq/etf`.
  - First version can be rule-based parser.
  - Full version calls LLM server-side with JSON Schema.

Cannot do / risk:

- LLM API key cannot be in static frontend.
- User queries may be ambiguous; endpoint must return `needs_clarification`.

MVP:

- Rule parser for common Chinese ETF conditions: yield, expense, premium, category, flow, dividend frequency.

### B13 Theme rotation radar

Implementation:

- Frontend:
  - Add theme radar view under ETF tools.
  - Period filter: 5 / 20 / 60 days.
  - Strongest theme hero + ranking list.
- Backend:
  - Add `GET /api/web/themes/rotation?days=5`.
  - Maintain `theme_mapping.json`.
  - Compute average return and flow by ETF theme.

Cannot do / risk:

- Theme mapping is editorial and may need maintenance.

MVP:

- Manual mapping for AI, semiconductor, high dividend, financial, ESG.

## Suggested Execution Batches

### Batch 1: UI and retention foundation

1. A01-A04 ETF UI refactor.
2. B10 dark mode.
3. Official ETF source architecture, with EzMoney 00403A / 00981A as the first parser.
4. B02 dashboard MVP.
5. B11 position calculator MVP.

Reason: mostly frontend, low backend risk, immediately improves perceived product quality.

### Batch 2: login-based personalization

1. Reserve B01/B09 UI space in ETF/detail layout.
2. B08 share MVP.
3. Later: B01 watchlist add/remove.
4. Later: B09 fixed watchlist groups.
5. Later: B01 push rules, START-only first.

Reason: starts the retention loop but limits backend write complexity.

### Batch 3: proof and research depth

1. B03 strategy hit-rate.
2. B05 institutional flow.
3. B07 dividend calculator.
4. B13 theme rotation MVP.

Reason: requires data jobs/cache but gives strong product differentiation.

### Batch 4: advanced / higher uncertainty

1. B04 portfolio simulator full overlap.
2. B06 ETF rebalance radar.
3. B12 natural language query.

Reason: feasible, but rules/modeling quality matters more than UI.

## Decisions Needed Before Implementation

1. Official source rollout: build registry architecture now; start with EzMoney 00403A / 00981A parser; then add issuers one by one.
2. Official refresh frequency: 15 minutes or 30 minutes during issuer update window.
3. Dark mode scope: all views at once, or scan/ETF first.
4. Share feature: copy/Web Share MVP, or full PNG upload immediately.
5. AI query: rule-based parser first, or LLM endpoint first.
6. Watchlist storage for later B01/B09: keep Google Sheets first, or introduce SQLite/Postgres.
