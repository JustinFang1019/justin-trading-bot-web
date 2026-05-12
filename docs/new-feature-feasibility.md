# New Feature Feasibility Check

Last updated: 2026-05-12 Asia/Taipei

This document confirms that every proposed feature has an implementable path. The web repo is a static/LIFF frontend, so any secret, Google Sheets write, LINE push, external paid token, or admin operation must stay in the `justin-trading-bot` Flask backend under `/api/web/...`.

## Existing Building Blocks

- Frontend: `index.html` already has `API_BASE`, `getJson`, `postJson`, LIFF login, `webSessionToken`, `webUser`, `scanView`, `activeEtfView`, ETF tool routing, and stock/ETF card rendering.
- Backend: `justin-trading-bot/stock_scanner/web_api.py` already exposes read-only stock, scan, watchlist, performance, RS, status, and ETF APIs.
- Data/write layer: `stock_scanner/watchlist.py` already reads and writes Google Sheets watchlist, scan results, and performance data.
- Push layer: `app.py`, `notify.py`, and `line_quota.py` already contain LINE push and quota infrastructure.
- Strategy layer: `patterns.py`, `scanner.py`, `notify.py`, and `backtest.py` already compute START / CONT / RS-related signals.
- ETF layer: current frontend already calls `/etfs`, `/etfs/compare`, `/etfs/flow`, `/etfs/overlap-matrix`, `/etfs/dividends/calendar`, `/etfs/stock-flow/:stock`, `/etfs/holding-trends/:code`, and source-admin APIs.
- Official issuer source: EzMoney official ETF page is fetchable server-side. For `00403A`, the correct official mapping is `fundCode=63YTW`; the user-provided `fundCode=49YTW` maps to `00981A`. The official page exposes embedded fund profile/portfolio JSON, official portfolio xlsx, and NAV JSON.

## Official Source Priority

For every ETF, official issuer data should be the primary source when available. Aggregators remain fallback sources only.

Source priority:

1. Issuer/fund-company official ETF page and official downloads.
2. TWSE / TPEx official market data for market price fields.
3. MoneyDJ/Yahoo/StockQ only as fallback or cross-check.

Implementation requirement:

- Build an issuer registry and parser system.
- Each ETF maps to an issuer parser and official fund code.
- Frontend consumes one unified `/api/web/etfs/official/<code>` response, regardless of issuer.
- If official data is stale or failed, show fallback source labels explicitly.

Confirmed for EzMoney:

| Need | Official Method | Feasible |
|---|---|---:|
| Fund-file fee total | Parse hidden `DataFund` JSON / `mFundIntro` table. Includes manager fee, custodian fee, benchmark authorization fee, and index authorization fee. | Yes |
| Fund portfolio | Parse hidden `DataAsset` JSON or download `/ETF/Fund/AssetExcelNPOI?fundCode=63YTW`. Includes same-day `TranDate`, holdings, shares, amount, `NavRate`, `EditDate`. | Yes |
| Today increase/decrease table | Cache official portfolio snapshots and diff today vs previous snapshot by code/share/weight. | Yes |
| NAV trend | Call `/ETF/Fund/ValueJson/?fundCode=63YTW`; combine with market price to compute premium/discount. | Yes |
| Premium/discount | Official NAV + latest market price from TWSE/Yahoo/current price API; show timestamps separately. | Yes |

Risk:

- Official pages can change their hidden JSON names or endpoint contracts. Parser should be issuer-specific, tested, cached, and fail gracefully.
- Respect source load: cache results and do not poll too aggressively.

## Feasibility Matrix

| Feature | Feasible | Implementation Method | Backend/Data Needed | MVP Path |
|---|---:|---|---|---|
| 01 Watchlist + custom push | Yes | Add star buttons on stock/ETF cards, add `watchlistView`, POST authenticated changes to backend. Run scheduled backend job after scans to evaluate user push rules and send LINE push. | Extend Sheets or DB schema: `user_watchlist`, `push_rules`; add `POST /api/web/user/watchlist`, `POST /api/web/user/push-rules`, `GET /api/web/user/watchlist`. | Start with add/remove watchlist and local rule UI, then enable one rule: START hit. |
| 02 Market dashboard | Yes | Add `#dashboardSection` above `scanView`, aggregate existing scan results and ETF dividend calendar. | No new core data required; can use `/scan-results`, `/scan-cards`, `/rs/top`, `/etfs/dividends/calendar`. Optional backend endpoint `/dashboard` for pre-aggregation. | Frontend-only aggregation from existing APIs. |
| 03 Strategy hit-rate review | Yes | Add strategy review view with filter pills and stats. Use existing scan/performance history and backtest logic. | Add `GET /api/web/strategy/backtest?strategy=START&days=30`; derive from Sheets scan history/performance or create `strategy_history` sheet/cache. | Use current performance sheet for historical pushed symbols, calculate 5-day return from cached K-bars. |
| 04 Portfolio simulator | Yes | Add ETF allocation editor, slider weights, result cards, overlap warning. | Add `POST /api/web/portfolio/simulate`; use existing ETF ranking metrics and holdings cache to compute weighted yield, fee, and overlap. | Frontend computes using loaded ETF payload for 2-3 demo ETFs, backend endpoint later. |
| 05 Institutional flow | Yes | Add panel under stock detail showing foreign/investment trust/dealer net buy/sell. | Add TWSE institutional fetch/cache job and `GET /api/web/stock/:code/institutional?days=5`. | Read TWSE after 17:00 and cache daily JSON; show recent 5 days. |
| 06 ETF rebalance radar | Yes | Add ETF detail tool page with countdown, include/exclude chips, probability levels. | Add rules module for 0050/0056/00878 and `GET /api/web/etf/:code/rebalance-forecast`. Data from market cap/liquidity/ETF rule mapping. | Start with static rule templates plus current holdings/ranking data for 0050. |
| 07 Dividend calculator + fill history | Yes | Add input for shares and fill-history table in ETF detail. | Add `GET /api/web/etf/:code/dividend-history`; use TWSE/MOPS/issuer data or maintained dividend cache. | Use existing `/etfs/dividends/calendar` for upcoming payout, add simple manual/cached history for major ETFs. |
| 08 Card one-click share | Yes | Add share icon to `.line-card`, open bottom sheet, create image and link actions. | For full version add `POST /api/web/share/card` to persist image and short URL. No secret in frontend. | MVP: Web Share API + copy URL; later add html2canvas and backend upload. |
| 09 Watchlist groups | Yes | Extend watchlist UI with group pills and per-group rules. | Extend `user_watchlist.group` and add `user_groups`; endpoints share B01 auth. | Store group in Sheets columns first: uid, code, type, group, rules_json. |
| 10 Dark mode | Yes | Add `[data-theme="dark"]` CSS variables, drawer toggle, `localStorage` persistence, `prefers-color-scheme`. | No backend needed. | Pure frontend CSS/JS change. |
| 11 Position calculator | Yes | Add calculator panel on stock detail, auto-fill START entry, ATR stop, suggested shares. | Add `GET /api/web/stock/:code/atr?days=20` or derive from existing K-bar endpoint. | Frontend computes ATR from `/stock/:code/kbar?limit=30` first. |
| 12 Natural language query | Yes | Add AI query entry for ETF filter, render parsed chips and results. | Add `POST /api/web/nlq/etf`; backend calls LLM with JSON Schema and maps to existing ETF filter params. | Rule-based parser for 10 common Chinese ETF queries first; LLM later. |
| 13 Theme rotation radar | Yes | Add theme rotation view with period filters and ranking list. | Add maintained ETF/theme mapping and `GET /api/web/themes/rotation?days=5`; compute average returns from ETF price cache. | Manual `theme_mapping.json` plus existing ETF ranking/price change fields. |

## Recommended Build Order

1. **Frontend-only / low backend risk:** 10 dark mode, A-series ETF UI, 02 dashboard MVP, 11 position calculator via existing K-bar API.
2. **Uses existing backend patterns:** 01 watchlist push, 09 groups, 03 hit-rate review, 08 share MVP.
3. **Needs new data cache jobs:** 05 institutional flow, 07 dividend history, 13 theme rotation.
4. **Highest modeling complexity:** 04 portfolio simulator full overlap, 06 rebalance radar, 12 LLM natural language query.

## Key Constraint

All write and push features are feasible only when implemented through authenticated backend endpoints. GitHub Pages must not directly access Google Sheets credentials, LINE tokens, FinMind tokens, or OpenAI/Claude API keys.
