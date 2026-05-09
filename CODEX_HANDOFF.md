# Codex Handoff

Last updated: 2026-05-09 Asia/Taipei

## Current User Intent

The user wants to continue this project across computers. GitHub should carry both code and concise Codex handoff notes.

The latest clarified product direction: this should become a mobile web version of the existing LINE bot, not a separate dashboard. The existing LINE Flex card UI and information density are important and must stay canonical. The mobile site should let users open a URL and see everything the LINE card provides, plus deeper K-bar, watchlist, warrant, performance, status, and related detail views.

## Required Handoff Rule

At the end of every meaningful Codex session, update this file before committing/pushing if there was any design discussion, implementation decision, code change, blocker, or next-step decision.

Each update should include:

- What was changed or discussed.
- Which files were touched.
- What was intentionally not changed.
- Verification performed or skipped.
- The recommended next prompt for continuing on another computer.

Then commit and push the handoff update to GitHub so another computer can continue by reading this file first.

## Repositories Discussed

- `JustinFang1019/justin-trading-bot-web`: current web prototype repo cloned on this computer at `C:\Users\Siriu\Documents\justin-trading-bot-web`.
- `JustinFang1019/justin-trading-bot`: fuller private LINE trading bot repo. It contains the real LINE webhook, scanner, strategies, Flex card builders, cache, schedules, warrant modules, and Google Sheets persistence.

## Current Project State

`justin-trading-bot-web` is a static/mobile web prototype. It already has:

- `index.html` single-page UI.
- Scan list, warrants, ETF rebalance observation, alerts, admin status, LINE preview, and mobile layout.
- `data/market-snapshot.json` and `data/kbar-snapshot.json` generated from public market sources.
- `.github/workflows/update-market-data.yml` to update snapshots on weekdays.

It is not yet a real backend or LINE/LIFF app.

## Latest Session Notes - 2026-05-09

- ETF usability/data cleanup after user reported confusing ETF home/search, missing fee/yield/flow fields, non-clickable calendar, and fixed heatmap.
  - Web `index.html` now changes the global search placeholder to Web trial-command wording, so it no longer looks like a stale prior command.
  - ETF fund flow home card now reads `/api/web/etfs/flow` instead of deriving from stale ranking scale deltas, labels it as near-month subscription/redemption data, states it is not an intraday jumping buy/sell imbalance, and adds refresh plus optional 5-minute auto refresh.
  - ETF fund flow detail page now supports `1m`, `3m`, and `12m` period buttons, shows subscription/redemption mini bars, and keeps the `申`/`贖` values visible.
  - Heatmap is now hand-selectable: users can add/remove ETF codes, quick-pick popular ETFs, and recompute overlap for up to 6 ETFs.
  - Dividend calendar day/event chips are now clickable and show more ETF codes directly inside the calendar cells.
  - Stock ETF flow UI no longer repeats the cache explanation in the controls. Backend `stock_scanner/web_api.py` now uses ETFInfo public stock-holder pages as a fallback current holding source, while still using cached before/after holding snapshots for true add/reduce deltas.
  - Backend ETFInfo metric enrichment bumped cache versions and increases enrichment coverage. If true total expense ratio is not disclosed yet, backend still derives management fee + custody fee when ETFInfo provides them; UI labels this as `費用率/經保費` instead of over-promising true total expense ratio.
  - Intentionally not changed: monthly fund flow is not intraday buy/sell imbalance; listed-less-than-12-month ETFs can still lack 12-month yield.
  - Verification: web script parsed successfully with Node `new Function(...)`; `git diff --check` passed in both repos. In-app browser local preview confirmed ETF placeholder, hand-select heatmap controls, clickable dividend calendar ETF chips, and updated stock-flow wording. Backend Python compile still could not run because `py -3` reports no installed Python runtime.
  - Recommended next prompt: "Render 部署後再驗 `/api/web/etfs/flow`、`/api/web/etfs/stock-flow/2330`、`/api/web/etfs/source-status`，確認 IFA 月申贖、ETFInfo 個股持有 fallback、費用率快取都有生效。"

- ETF fund-flow correction after user pointed out historical flow should be fetchable.
  - Important data distinction: TWSE ETF e-Fortune product ranking is still a current ETF list/scale source, and TPEx official historical ETF endpoint provides historical trading/turnover data, not true fund inflow/outflow.
  - Backend `stock_scanner/web_api.py` in `justin-trading-bot-main-deploy` now maps known active ETF stock codes to ifa.ai fund IDs and fetches the fund redemption page `__NEXT_DATA__` to read historical monthly subscription/redemption/net-subscription values.
  - `/api/web/etfs/flow` now prioritizes ifa.ai monthly fund flow (`subscription - redemption = net subscription`) and only falls back to old cached scale/flow fields when no ifa flow is available. Returned rows include flow period, flow data date, subscription, redemption, net subscription, ifa fund ID, and source URL.
  - Web `index.html` now labels ETF fund flow as `近1月淨申贖`, shows `申` and `贖` values per row, translates the new IFA source status, and no longer describes this page as a 5-day scale-change proxy.
  - Intentionally not changed: this is not intraday ETF buy/sell imbalance, and unknown ETF-to-ifa mappings are skipped instead of inventing values.
  - Verification: web script parsed successfully with Node `new Function(...)`; `git diff --check` passed in both repos. Backend Python compile could not run because the Windows `py` launcher reported no installed Python runtime.
  - Recommended next prompt: "幫我看 Render 部署後 `/api/web/etfs/flow` 回傳的 IFA 近月淨申贖，哪些 ETF 還缺 ifa fund id 對應就補上。"

- ETF tools follow-up: user pointed out `ETF 比較` and `進階篩選` were connected to data but not actually adjustable.
  - `index.html` now makes `ETF 比較工具` interactive: selected ETF chips, manual ETF-code input, popular quick-pick chips, remove-by-click, and dynamic compare table width for up to 6 ETFs.
  - `進階篩選器` now has presets (`高股息`, `低費用`, `大型 ETF`, `主動式`, `全部`), search text, range controls for asset size / trailing yield / expense ratio, and a data-completeness checkbox. Results update immediately and still click through to ETF detail.
  - `個股「被加碼/減碼」週報` now has a stock-code search input and quick-pick chips, instead of being fixed to `2330`.
  - `ETF 持股 14 日趨勢` was clarified so it means "choose an ETF, then inspect that ETF's component-stock weight changes"; it now has an ETF-code input and quick-pick chips instead of silently using fixed `00919`.
  - `ETF 資料來源狀態` now translates backend/source health labels into Chinese (`ETF 清單`, `指標快取`, `持股快取`, `正常`, `建立中`, etc.) instead of surfacing raw English API names.
  - `ETF 資金流向` now handles empty/non-trading snapshots explicitly: it shows `待交易日快取` instead of misleading `0 億`, disables unsupported period tabs, explains why true flow is unavailable, and provides a fallback watch list from the ETF ranking.
  - Removed the misleading fake `近 30 日規模趨勢` spark bars from ETF ranking rows. The row now shows a plain scale-change status; this is not buy/sell flow. Holding-trend rows use backend `trend_points` when enough snapshots exist.
  - `配息行事曆` now renders an actual calendar grid from ETFInfo ex-dividend dates, with ETF code/amount chips inside date cells, plus the existing detailed list below.
  - Backend ETF ranking enrichment in `stock_scanner/web_api.py` now prioritizes active ETF codes for ETFInfo metrics and bumps `ACTIVE_ETF_CACHE_VERSION` to `6`, so Render will rebuild ranking cache and active ETFs should no longer be mostly `待資料` on the list page when ETFInfo has data.
  - Verification: frontend script parsed with Node `new Function(...)`; `git diff --check` passed. Local browser check via `http://127.0.0.1:8766/index.html` confirmed the compare input/chips, filter controls, stock-flow search/quick-pick controls, holding-trend ETF selector, Chinese source-status labels, flow empty-state/fallback list, ranking scale-status text, and dividend calendar grid render. Clicking `2454` in `個股 ETF 動向` updated the query to `2454 聯發科`; clicking `00878` in `ETF 持股 14 日趨勢` updated the page to `00878 成分股權重趨勢`.
  - Recommended next prompt: "ETF 比較和進階篩選實機看起來怎樣？要不要再加自訂欄位排序或儲存常用比較組？"

- User asked to formally connect ETF APIs so the production UI is usable, not just preview/mock.
  - Backend repo used for Render/API work: `C:\Users\Siriu\Documents\New project\justin-trading-bot-main-deploy`.
  - Backend changes in `stock_scanner/web_api.py`: added ETFInfo metrics cache for total expense ratio, trailing yield, premium/discount, NAV/market price, AUM, beneficiaries, dividend history; merged those metrics into `/api/web/etfs` and `/api/web/etfs/<code>`.
  - New read-only ETF endpoints added: `/api/web/etfs/flow`, `/api/web/etfs/compare`, `/api/web/etfs/overlap-matrix`, `/api/web/etfs/dividends/calendar`, `/api/web/etfs/stock-flow/<stock_id>`, `/api/web/etfs/holding-trends/<code>`, `/api/web/etfs/source-status`.
  - Frontend changes in `index.html`: removed ETF mock/fallback numbers and wired the ETF second-layer pages to the new endpoints. The home fund-flow summary now uses actual API fields already present in ranking rows instead of hard-coded sample values.
  - Important data caveat: a stable public official net-subscription/net-purchase endpoint has not been found yet. The flow endpoint returns `complete:false` and uses available scale-delta/cache fields, so the UI remains honest while still useful.
  - Verification: frontend script parsed successfully with Node `new Function(...)`; `git diff --check` passed in both web and backend repos. Python compile check could not run locally because Python is not installed/in PATH on this machine.
  - Deployment note: this is now a backend/API change, so Render needs to deploy the bot API after the backend commit is pushed/merged to the deployed branch. The static GitHub Pages web push alone is not enough for these new endpoints.
  - Post-push fix: Render validation showed `/api/web/etfs/flow`, `/compare`, and `/source-status` were initially being captured by the older `/api/web/etfs/<code>` route. Backend commit `d51a46e` added reserved-route dispatch so fixed ETF tool endpoints return their real payloads.
  - Live validation after Render deploy: `/api/web/etfs/source-status` returned ranking 225 ETFs, 9 ETFInfo metric caches, 13 MoneyDJ holding caches; `/api/web/etfs/compare?codes=00878,00919,00940` returned expense/yield/premium/AUM/overlap data; `/api/web/etfs/flow` returned `complete:false` with empty flow rows on the weekend/non-trading snapshot.
  - Recommended next prompt: "幫我看 Render 部署後的 `/api/web/etfs/compare`、`/api/web/etfs/flow` 回傳，再照實際資料修 ETF UI。"

- ETF UI plan moved from preview into production `index.html` after user asked to implement every item from two spec previews and push live.
  - Spec sources read and treated as design reference: `C:\Users\Siriu\Downloads\justin-trading-bot-etf-ui-preview.html` and `C:\Users\Siriu\Downloads\justin-trading-bot-etf-extra-preview.html`.
  - Production ETF home now has an ETF fund-flow summary card, an eight-item feature grid (`ETF 比較`, `進階篩選`, `資金流向`, `持股重疊`, `配息行事曆`, `個股 ETF 動向`, `持股 14 日趨勢`, `資料來源狀態`), the existing upcoming ETF entry, and ETF ranking rows.
  - ETF ranking rows now expose ETF-specific decision signals from the spec: `近5日淨流入`, `近12月殖利率`, `總費用率`, `折溢價`, plus a 30-day scale trend sparkline. Missing backend fields fall back to known sample values for common ETFs or explicit `待 API`, instead of pretending the backend has full data.
  - ETF detail hero was changed to the spec direction: white hero with blue top rule, live price/change when available, and six key ETF indicators (`總費用率`, `近12月殖利率`, `折溢價`, `近5日淨流入`, `規模`, `受益人`).
  - Added production second-layer pages for the remaining spec items: `ETF 資金流向`, `ETF 比較工具`, `進階篩選器`, `ETF 持股重疊度熱力圖`, `配息行事曆`, `個股「被加碼/減碼」週報`, `持股 14 日權重變化`, and `ETF 資料來源管理`.
  - `即將上市 ETF` list now displays countdown-style labels and human-readable listing dates.
  - Intentionally not changed: original LINE bot strategy logic, LINE Flex builders, backend scraping/data jobs, and any authenticated write/watchlist behavior. C `我的觀察清單` remains out of scope per spec because it needs user binding.
  - Files touched: `index.html`, `CODEX_HANDOFF.md`. Preview-only files remain untracked and should not be committed unless explicitly requested.
  - Verification: `git diff --check` passed; script parsing via Node `new Function(...)` passed and confirmed all spec labels are present. In-app browser verification via local HTTP was blocked by `net::ERR_BLOCKED_BY_CLIENT`, so no browser screenshot was taken.
  - Recommended next prompt: "把 ETF spec 裡待 API 的欄位接到後端真資料，先從資金流向、費用率/殖利率/折溢價、配息行事曆開始。"

- Clarified that the `1 人` seen inside ETF cards is the ETF beneficiary count, not the web daily-user count. The web UI now displays ETF beneficiary count as `待公布` when the upstream value is missing or clearly unreasonable (`<= 1`).
- Fixed ETF subpages so the top-left page header follows the current ETF view (`ETF 研究`, detail, or overlap) instead of staying on the previous `說明` command.
- Clarified ETF holding-change rows: the right-side `+X萬` number is share count, so the UI now labels it as `股`; the secondary line is the weight change/weight.
- Backend quote enrichment now merges TWSE and TPEX daily close quote sources, so OTC stocks such as `8299` can show close price and daily change in ETF holdings.
- TPEX quote enrichment should use the official daily close CSV (`stk_quote_result.php?l=zh-tw&o=data`) as a fallback because it includes both `收盤` and `漲跌`; the OpenAPI market-value fallback only has close price.
- Added a zero-network disk K-bar fallback for ETF holding quote enrichment. If an OTC quote is still missing from TWSE/TPEX during Render runtime, the web API can fill close/change from `/data/kbar/<stock>.json`.
- ETF ranking now treats weekends as non-trading days for asset-size delta display. Web rows should show `非交易日` instead of implying a true `0 億` change when Taiwan market is closed.
- Taiwan stock industry tags now use official sources for both listed and OTC stocks: TWSE `t187ap03_L` plus TPEX `mopsfin_t187ap03_O` JSON, with MOPS/TPEX `t187ap03_O.csv` as fallback.
- ETF stock amounts in the web UI should display Taiwan stocks in board lots (`張`) and overseas stocks in raw shares (`股`). Rows where shares are unchanged but weight falls should not be presented as true `減碼`; avoid showing misleading `0股`.
- ETF stock row quote badges should show close price plus daily percent when available, e.g. `收盤 454.5 / -3.09%`; if the percent is unavailable, show close price only.
- Anonymous browser visitor IDs are recorded through `/api/web/usage?visitor_id=...` so web usage counts can work even before LINE login. LINE IDs remain preferred for logged-in users.
- Local preview `active-etf-detail-preview.html` was adjusted for the share-count label only; it remains a temporary preview file and is not intended to be committed unless explicitly requested.
- Files touched this round:
  - Web repo: `index.html`, `CODEX_HANDOFF.md`, local preview `active-etf-detail-preview.html`.
  - Bot repo: `stock_scanner/web_api.py`.
- Verification:
  - `git diff --check` passed in both repos.
  - Python compile check could not run because Python is still not installed/in PATH on this computer.
  - Node syntax check could not run because `node.exe` is blocked by local permissions.

## Important Constraint From User

The user's core LINE cards and strategy logic must not change. In particular, preserve behavior from the fuller LINE bot repo:

- `stock_scanner/patterns.py` strategy logic, including START, CONT, KD convergence, RS ranking, pattern classification, thresholds, and scoring behavior.
- `stock_scanner/notify.py` core Flex card builders and strategy card content.
- Existing command meanings and LINE interaction flows unless explicitly approved.

The mobile/web redesign should wrap, preview, filter, and navigate around the existing outputs, not rewrite trading logic.

## Product Direction

Build a mobile-first companion interface for the existing LINE bot:

- Keep LINE as push/summary and keep existing small cards as canonical.
- Add Web/LIFF as a deeper mobile viewer for scan results, strategy details, K charts, warrant details, RS ranking, watchlist, performance tracking, and admin status.
- Prefer a thin API/export layer that reuses existing scan results, K-bar cache, warrant cache, and Google Sheets data.
- Treat the old static web prototype as visual direction, then connect it to real data from `justin-trading-bot`.

## Implemented So Far

In `justin-trading-bot-web`:

- Rewrote `index.html` as a mobile-first companion viewer.
- Added bottom navigation: Today, Detail, Warrants, Status, LINE.
- Added filters for market, START/CONT, RS 90+, score, BOX, and repeat selections.
- Added a mobile detail view with chart, A/B/C entry layers, stop, pressure, and LINE preview.
- Added `docs/mobile-redesign-proposal.md`.
- Added `docs/web-version-integration-plan.md`.
- Fixed LINE preview direction after user feedback: the web app must not invent a different LINE card format. Future work should consume real Flex JSON from the bot instead of recreating cards by hand.
- Started replacing prototype data with live original bot data in `index.html`.
  - `API_BASE` currently points to `https://stock-scanner-bot-f3kt.onrender.com/api/web`.
  - `GET /api/web/scan-results` now populates the main stock list.
  - Selecting a stock loads `/stock/<id>/card`, `/stock/<id>/kbar`, and `/stock/<id>/warrants`.
  - LINE preview now prefers canonical Flex JSON returned by the bot API, with the bot text summary below it.
  - Prototype data remains as fallback if the API is unavailable.
- Adjusted the web UI direction toward scan-card-first behavior.
  - The Today list now renders scan-style cards instead of a generic dashboard row.
  - Flex/card buttons are clickable in the web UI.
  - `K線` switches to the internal K-bar card drawn from the bot `/kbar` cache, with Yahoo retained only as an external backup link.
  - `權證` switches to the warrant card, `財報` opens the financial page, `即時` and `回測` route to web-side read-only views, and `+自選` is held until authenticated write/LIFF is added.
- Rebuilt `index.html` again after user feedback that old prototype data still appeared.
  - The page is now a mobile-first LINE scan-card browser rather than a dashboard.
  - Removed the built-in fake stock fallback from runtime by resetting `stocks = []` and loading only live `/api/web/scan-results`.
  - If API loading fails, the page shows an API error instead of showing fake 2330/3491/2327 data.
  - Bottom navigation is now 小卡 / K線 / 權證 / 狀態.
  - Backend status view remains because the user liked that feature.
- Updated the design again after user clarified Today must match the original scan card.
  - Added `GET /api/web/scan-cards` in `justin-trading-bot` so the backend returns the whole `notify.py build_flex_message()` carousel in one API call.
  - `justin-trading-bot-web` Today view now renders those original Flex bubbles directly.
  - `/api/web/scan-results` remains for search/filter metadata and extended detail pages, but it is no longer the source used to reconstruct the Today cards.
  - PR #4 (`Expose scan flex cards API`) was opened and merged into `justin-trading-bot` main.
  - Render was still returning 404 for `/api/web/scan-cards` shortly after merge, so Render likely needs `Manual Deploy -> Deploy latest commit` or more time for auto deploy.
- Rebuilt the web direction again after the user asked to restart from the original LINE version.
  - `index.html` now treats `/api/web/scan-cards` as required, not optional.
  - The Today feed no longer falls back to hand-built/reconstructed web cards when original Flex cards are unavailable.
  - The first selected stock now follows the first original Flex bubble returned by the LINE card carousel.
  - The outer rendered Flex card now carries `data-id`, so tapping a card or its buttons can select the matching stock.
  - Search remains available: it filters the original Flex cards by stock id/name using `/scan-results` metadata.
  - The status tab remains because the user wanted to keep backend/deploy visibility.
  - Intentionally not changed: original `justin-trading-bot` strategy logic, LINE card builder, Google Sheets writes, webhook behavior, and existing LINE users.
- Refined the web direction after the user reported the card format was broken and clarified access should be narrower.
  - The web page is now a single-card lookup instead of a full scan feed.
  - Users must type a stock id/name; the page renders only one matching original LINE Flex card.
  - Filters and bottom navigation are hidden from the public UI.
  - The renderer now maps LINE `flex: 0` to CSS `flex: 0 0 auto`, honors width/height, avoids `overflow-wrap:anywhere`, and preserves button colors to prevent stock ids from breaking into vertical digits.
  - LINE URI buttons open their original URLs. LINE message buttons show the command text for copying, instead of exposing extra web-only actions.
  - This keeps the public web surface aligned with functions already exposed in the LINE group.
- Updated the web direction again after the user clarified button clicks should render web cards directly.
  - A new original bot endpoint was added and merged via PR #6 in `JustinFang1019/justin-trading-bot`: `GET /api/web/command?text=...`.
  - That endpoint reuses `stock_scanner.query.handle_group_query()` and is restricted to stock lookup plus `即時`, `回測`, `權證`, and `查` commands.
  - `index.html` now calls `/api/web/command?text=2330` for user input, so non-scan stocks like `2330` should work after Render deploys the bot main branch.
  - Flex message buttons with LINE `message` actions now call `/api/web/command` and render the returned web Flex card directly, instead of showing a copy-only command box.
  - Render initially returned 404 immediately after PR #6 merge, then later deployed successfully.
  - Confirmed `/api/web/command?text=2330` and `/api/web/command?text=即時%202330` both return 200 with Flex card payloads.
- Added navigation and access-control follow-up after the user asked about a previous-page button and FinMind traffic risk.
  - Web `index.html` now includes a `上一頁` button backed by command history.
  - Web `index.html` now includes an optional Web 通行碼 field stored in `sessionStorage`.
  - Original bot PR pending/merged in this session adds optional `WEB_COMMAND_ACCESS_TOKEN` enforcement to `/api/web/command`.
  - When `WEB_COMMAND_ACCESS_TOKEN` is set in Render, requests must send `X-Web-Access-Token`; otherwise the endpoint returns 401 before calling LINE group command handlers or any FinMind-heavy logic.
  - Important: GitHub Pages cannot securely enforce a whitelist by itself. Real protection must stay on Render/backend. LIFF + LINE user id verification would be the stronger long-term whitelist design.
- Implemented the formal LIFF + LINE whitelist direction.
  - Original bot PR #8 (`Add LIFF web session auth`) was merged into `JustinFang1019/justin-trading-bot` on 2026-05-08.
  - The original bot now has `POST /api/web/auth/line` and `GET /api/web/auth/session`.
  - `/auth/line` verifies LIFF `id_token` through LINE Login v2.1 verify endpoint, extracts LINE user id from `sub`, checks admin or `stock_scanner.watchlist.is_whitelisted(user_id)`, then returns a signed web session token.
  - `/api/web/command` now accepts `Authorization: Bearer <session>` and passes the session user id to `handle_group_query()`.
  - Web `index.html` loads LIFF SDK, supports `?liffId=<LIFF_ID>` once to save the LIFF ID locally, logs in with LIFF, stores `webSessionToken` and `webUser` in `localStorage`, and reuses that token automatically for later queries.
  - User provided LIFF ID `2010007393-mkhkmHp3`; `index.html` now uses it as `DEFAULT_LIFF_ID`, so the public URL can be `https://justinfang1019.github.io/justin-trading-bot-web/` without a query string.
  - Legacy `WEB_COMMAND_ACCESS_TOKEN` remains as a fallback during transition. For formal whitelist mode, set `WEB_REQUIRE_LIFF_AUTH=true` in Render.
- User confirmed there is a Google Sheet available for the whitelist: `https://docs.google.com/spreadsheets/d/1z_D0yUe1Cmxv4Wg7oMyxl9zsouzdB1sqZvPzuHVIkxg/edit?gid=461801463#gid=461801463`.
  - The existing original bot already reads whitelist data from worksheet `白名單` through `stock_scanner.watchlist.is_whitelisted(user_id)`.
  - To use this sheet, Render should have `GOOGLE_SHEET_ID=1z_D0yUe1Cmxv4Wg7oMyxl9zsouzdB1sqZvPzuHVIkxg`, and the service account from `GOOGLE_CREDENTIALS` must be shared into that Google Sheet.
  - The `白名單` worksheet should keep LINE user id in the first column. Existing helper functions expect rows like `user_id`, `display_name`, `date`; header names are less important than the first column containing the LINE user id.
- User reported the Google Sheet and Render sheet sharing/setup are done. Next verification order:
  - Create/configure LIFF app first. Since `DEFAULT_LIFF_ID` is now embedded, the clean GitHub Pages URL should work directly after deploy.
  - Set Render `LINE_LOGIN_CHANNEL_ID`, `WEB_SESSION_SECRET`, and `WEB_SESSION_TTL_DAYS=7`; keep `WEB_REQUIRE_LIFF_AUTH` off until LIFF login is confirmed.
  - Verify whitelisted LINE account can log in and query `2330`.
  - Only after that, set `WEB_REQUIRE_LIFF_AUTH=true`, redeploy, and confirm direct `/api/web/command?text=2330` returns 401 while the logged-in whitelisted web app still works.
- User reported a web Flex renderer bug: tapping RS ranking rows sent `/api/web/command?text=2026` because the renderer ignored `box.action` and treated the RS card date (`2026-...`) as a stock id.
  - Web `index.html` now supports action attributes on Flex `box` nodes, extracts stock id from action text/URI when available, and ignores year-like `20xx` matches when deriving fallback stock ids from text.
  - This should make RS ranking rows open their intended Yahoo K-line URI instead of querying stock `2026`.
- User requested the default first screen be `說明`, but with a Web-specific help card because Web queries do not need `/`.
  - Web `index.html` now renders a local Web help card when the input is empty or `說明`/`help`, instead of calling the original LINE `說明` command.
  - The help card includes allowed Web commands and no bottom quick buttons, after the user asked to remove `查 2330`, `RS排名`, and `即時範例`.
- User asked whether adding today active-user count is expensive. Backend implementation is intentionally light:
  - Original bot `stock_scanner/web_api.py` records unique signed-in Web users per Taiwan date in `/data/web_usage.json` using a hash of LINE user id, not the raw id.
  - It updates only on LIFF auth/session/command requests and does not call FinMind, Sheets, scanner, or Kbar logic.
  - `/api/web/status` now includes `web_usage.active_users_today`, `web_usage.online_users`, and `web_usage.online_window_minutes`; Web displays today/online counts in the top-right status and status page.
  - `online_users` means unique signed-in users seen within the last `WEB_ONLINE_WINDOW_MINUTES` minutes, default 10.
- User requested a new expandable `≡` feature menu and a Web-only active ETF module.
  - This should live in the Web version; LINE should only get a light entry/summary later because full ETF holdings/change lists are too dense for Flex.
  - Original bot backend now adds read-only active ETF endpoints: `GET /api/web/active-etfs` and `GET /api/web/active-etfs/<code>`.
  - Ranking source was upgraded after the user reported content was too little/wrong. It now uses TWSE ETF e添富 投資篩選器 AJAX with `managerType=Active`, which returns the full active ETF list instead of only the home-page top ranking table.
  - The active ETF list is sorted by `totalAv` asset size and includes code/name, issuer, listing date, close price, holders, YTD trade value, and asset size. The old home-page `今日資產規模(元)` parser remains as a fallback.
  - Active ETF ranking cache now has `schema_version=2`, so Render will refetch the new full-list format instead of reusing the earlier same-day 1-stock cache.
  - Each active ETF row now also includes TWSE, MoneyDJ, and ETFInfo URLs for external drill-down/fallback.
  - Holding source is MoneyDJ ETF holdings page, parsed for data date, stock id/name, holding weight, and shares. Detail snapshots are cached under `/data/active_etf/holdings_<ETF>.json`.
  - If MoneyDJ holdings are not available for a newer ETF yet, `/api/web/active-etfs/<code>` now still returns ranking metadata with `detail_unavailable=true` instead of failing the whole card.
  - Holding changes compare current and previous cached holding snapshots, so the first day may show little/no change until a second data date is cached.
  - Web `index.html` now adds `≡` drawer navigation and an `activeEtfView` with ranking, changes, and holdings tabs. Ranking cards now show scale, close price, holders, listing date, issuer, and YTD trade value.
  - The active ETF view now has its own search box and category filters (`全部`, `股票型`, `債券/入息`), plus detail-page summary pills and external source buttons.
  - Fixed MoneyDJ holdings mojibake by forcing UTF-8 response decoding and bumping holdings cache schema to `2`, so Render refetches corrupted same-day holding caches.
  - ETF detail pages now include an in-card `上一頁` button that returns to the ETF ranking/filter list.
  - Web stock commands no longer force LIFF login before the first request. They call `/api/web/command` directly and only trigger LINE login if the backend returns `401`, so public read-only mode and future strict whitelist mode both work.
  - Active ETF daily changes now prefer ETFInfo `latestDiff` from the ETF active tracking page. MoneyDJ remains the full holdings source/fallback. This fixes cases like `00981A` where public daily changes exist but local snapshot comparison had no previous cache.
  - Removed the `規模 / 異動 / 持股` tabs. ETF ranking stays as the list view; after tapping an ETF, the detail page shows summary, daily changes, and top holdings together.
  - Removed the active ETF category filter buttons (`全部`, `股票型`, `債券/入息`) and the duplicate in-card ETF `上一頁` button. The existing top `上一頁` button now returns from ETF detail to the active ETF list.
  - Fixed a likely LINE web login 500: backend now accepts a full LIFF id such as `2010007393-mkhkmHp3` in Render env and normalizes it to the numeric LINE Login channel id (`2010007393`) for id-token verification. LINE verification failures now return a clear auth error instead of generic 500.
  - Follow-up LINE login 401 fix: Web now posts the actual `LIFF_ID` with the id token to `/api/web/auth/line`; backend tries all configured channel ids plus that LIFF id prefix, so a stale/wrong Render env channel id no longer blocks a previously working LIFF login. Web fetch helpers now surface backend `error` text instead of only `401 Unauthorized`.
  - Follow-up LINE login 400 fix attempt for non-owner users: Web `liff.login()` now uses a clean canonical redirect URI (`location.origin + location.pathname`) instead of the current URL with cache-busting query params. If non-owner users still get LINE 400, check LINE Developers: LINE Login channel must be Published, LIFF endpoint URL should match `https://justinfang1019.github.io/justin-trading-bot-web/`, and scopes should include `profile` and `openid`.
  - Important active ETF data rule from user: every ETF detail must list the complete holding changes for that ETF. Do not truncate or omit any added/increased/decreased/removed stock; missing even one stock makes the page not useful as a reference. If the public source is incomplete or unavailable, show an explicit incomplete-data warning instead of presenting a partial list as complete.
  - Pending local UI fixes not pushed yet: rename Web menu/header from `小卡查詢` to `個股查詢`; command pages now set their own titles (`教學`, `RS 排名`, `說明`); status view renders status rows when opened; clicking the drawer `個股查詢` item clears the command input and returns to the Web help/card query page.
  - 2026-05-09 implementation batch: user approved pushing to GitHub after completion. Web now uses `/api/web/usage` for the public top-right 今日/線上人數, while `/api/web/status` is intended for admin only. Status page should show Kbar/warrant/ETF cache counts plus FinMind hourly quota and LINE monthly push quota for admin users.
  - ETF section is being promoted from preview to production UI as `ETF 研究`: all ETF ranking/search, category chips, ETF detail tabs (`新增`, `加碼`, `減碼`, `持股`), hierarchical `上一層`, stock-to-ETF overlap view sorted by weight, and an explicit incomplete-data warning when overlap is based only on cached holdings.
  - Important ETF overlap caveat: until the backend has warmed/cached holdings for every ETF, stock overlap lists must be marked incomplete. Do not present cached-only overlap as full-market truth.
- Latest access rule: `個股查詢` and original LINE command cards must require LINE whitelist login; `ETF 研究` and `教學` should remain available without login. `RS 排名` was removed from the main menu because users can reach related ranking/K-line flows from the individual stock card buttons.
- User-facing auth errors should stay short. Do not show raw LINE verify JSON such as `IdToken expired`; display `LINE 登入逾時，請重新按「登入」後再試一次。` and keep raw details only in console/backend logs.
- 2026-05-09 ETF final polish requested by user:
  - ETF category chips and ETF detail tabs must be visible in production; the generic hidden `.filters` rule previously hid them.
  - Backend ETF ranking now enriches TWSE ETF rows with `STOCK_DAY_ALL` close price / price change / computed change rate, and bumps ETF cache schemas so Render refetches.
  - Backend ETF holding/change rows now enrich Taiwan stock rows with close price, change rate, market, and TWSE listed-company industry code mapping when available.
  - MoneyDJ ETF holding parser must include overseas holdings such as `SNDK.US`, `009150.KS`, and `6787.JP`; do not restrict holdings to TW/TWO four-digit stocks.
  - After changing the holdings parser, bump `ACTIVE_ETF_HOLDINGS_CACHE_VERSION` so Render does not reuse same-day partial caches.
  - ETF ranking scale delta is computed from the previous cached snapshot when available. If there is no previous snapshot yet, the UI should show a clear pending state instead of pretending there is a value.
  - ETF stock rows should match the agreed final layout: code/name, `台股・產業` style tag, standardized note such as `持有 176.1萬股`, `收盤 價格 / 漲跌%`, weight/action block on the right, and different color accents for 新增 / 加碼 / 減碼 / 持股.
  - User clarified `RS排名` should remain listed inside the Web help card under 教學, but not as a main menu item.
  - ETF detail tabs need distinct colors: 新增=blue, 加碼=green, 減碼=red, 持股=purple. Non-active ETFs should show only the 持股 tab/list; 新增/加碼/減碼 are only useful for actively managed ETFs.
  - ETF detail helper copy above the stock list should use the short text `點個股可看有哪些 ETF 持有`; do not append longer wording like `異動清單完整列出，不截斷。`.

Backend follow-up on 2026-05-09:

- Cached ETF detail must enrich current/previous holdings with quotes before computing fallback holding diffs. Otherwise cached OTC rows can keep null close/change values in `changes`.
- Public ETFInfo change rows should also get a direct quote fallback during merge. This covers OTC rows if the public change payload lacks close/change fields or the holding cache match misses.

In `justin-trading-bot`:

- Added a conservative read-only API layer on branch `codex/web-readonly-api` and pushed it to GitHub.
- Branch URL: `https://github.com/JustinFang1019/justin-trading-bot/tree/codex/web-readonly-api`
- Commit: `18bf59c Add read-only web API endpoints`
- Files touched there: `app.py`, `stock_scanner/web_api.py`
- Existing LINE webhook, schedulers, strategy logic, push/reply commands, and Google Sheets write flows were intentionally not changed.

Read-only API endpoints now available on that branch:

- `GET /api/web/health`
- `GET /api/web/scan-results`
- `GET /api/web/scan-cards`
- `GET /api/web/stock/<stock_id>`
- `GET /api/web/stock/<stock_id>/kbar?limit=180`
- `GET /api/web/stock/<stock_id>/card`
- `GET /api/web/stock/<stock_id>/warrants`
- `GET /api/web/performance`
- `GET /api/web/watchlist`
- `GET /api/web/rs/top?limit=20`
- `GET /api/web/status`

Important implementation notes:

- `/api/web/stock/<stock_id>/card` calls the original `stock_scanner.notify.build_flex_message()` and `build_message()`, so the web version can consume canonical LINE card output instead of hand-recreating the small card.
- `/api/web/stock/<stock_id>/kbar` reads existing `/data/kbar` disk cache through the bot's existing loader.
- `/api/web/stock/<stock_id>/warrants` reads existing Top 3 warrant disk cache and does not trigger a fresh warrant calculation.
- `WEB_API_ALLOWED_ORIGIN` can restrict CORS; if unset, the read-only API currently returns `Access-Control-Allow-Origin: *`.

## Verification

- Reviewed diffs and route wiring in the original bot repo.
- Confirmed `app.py` only registers the new blueprint and does not change existing LINE bot behavior.
- Python syntax execution was skipped because this computer has only `py.exe` launcher and no installed Python interpreter available in PATH.
- Confirmed live Render API health returns OK.
- Confirmed live `scan-results` returns 30 records from the original bot.
- Confirmed live `/api/web/stock/6933/card` returns canonical Flex JSON and text summary.
- JavaScript syntax check with local `node` was attempted but blocked by Windows access denied in this environment.
- JavaScript syntax check was attempted through the Node REPL after the latest web rewrite but local Node execution is blocked by Windows access denied in this environment.
- Confirmed live Render API still returns `Access-Control-Allow-Origin: *`, so GitHub Pages should be allowed to call it from the browser.
- Confirmed live Render `/api/web/scan-cards` is deployed and returns `ok=True`, `count=30`, `generated_at=2026-05-08T00:28:12+08:00`.
- Browser verification was not completed in this Codex environment. After GitHub Pages deploys, refresh the URL and confirm the visible cards match the LINE scan card order/content.
- Browser verification was still not completed after the single-card lookup rewrite because this environment has no working Node/browser automation. Manually check GitHub Pages on desktop and mobile: initial page should show only an input prompt, and entering `3504` should render one LINE-style card without vertical digits.
- Confirmed after Render deployment that `/api/web/command?text=2330` and `/api/web/command?text=即時%202330` both return 200 with one Flex message.
- Python syntax check passed for the LIFF session backend with Python 3.12.
- Confirmed on 2026-05-08 that Render has the LIFF session endpoints deployed: `/api/web/health` returns 200 and `/api/web/auth/session` returns 401 without a session token.
- Confirmed on 2026-05-08 that `/api/web/command?text=2330` still returns 200 without login. This means strict protection is not active yet; set `WEB_REQUIRE_LIFF_AUTH=true` only after the LIFF app and web login flow are ready.

## Recommended Next Implementation Step

1. Create/configure a LIFF app in LINE Developers and set its endpoint URL to the GitHub Pages URL.
2. Confirm Render has `GOOGLE_SHEET_ID=1z_D0yUe1Cmxv4Wg7oMyxl9zsouzdB1sqZvPzuHVIkxg`, and share that sheet with the service account email inside `GOOGLE_CREDENTIALS`.
3. In the sheet, create/confirm worksheet `白名單` and put allowed LINE user ids in the first column.
4. In Render set `LINE_LOGIN_CHANNEL_ID` (LINE Login channel id), `WEB_SESSION_SECRET` (random long secret), and `WEB_REQUIRE_LIFF_AUTH=true`, then redeploy.
5. Open the GitHub Pages URL. After login, entering `2330` should work without typing any passcode, and only LINE users in the original bot whitelist should pass.
6. Add funnel and stale-data endpoints later if needed; they were not added in this first conservative API pass.
7. Add LIFF or authenticated write actions only after read-only mobile pages are correct.

## 2026-05-09 ETF Nested View Final Polish

- ETF detail, upcoming ETF detail, upcoming ETF list, and shared-holding ETF pages are treated as second-layer views. In these pages the global search input, ETF inner search input, and duplicated ETF panel heading are hidden; the black ETF hero card becomes the visible title area.
- The auth panel is placed before the `上一層` button, so the hierarchy button stays on the right side. The `上一層` label remains the standard wording for returning one app layer, not browser history.
- Source links (`TWSE`, `MoneyDJ`, `ETFInfo`) were toned down to white buttons with a thin border so they read as auxiliary references instead of primary actions.
- ETF holding/change rows now make the stock name beside the stock code darker and heavier. Badges such as `3/3 檔` must stay on one line.
- Preview convention: when the user says `預覽`, use the existing local HTML preview style and size, especially `C:/Users/Siriu/Documents/justin-trading-bot-web/active-etf-detail-preview.html`. Keep it as a narrow mobile mockup around 430px wide, with compact font sizes, white cards, 8px radius, and the Codex in-app browser on the right. Do not switch to a wide desktop mockup unless explicitly requested.

## Next Prompt Suggestion

Ask Codex:

`請先閱讀 CODEX_HANDOFF.md，打開 GitHub Pages 檢查 justin-trading-bot-web 是否已顯示原 LINE bot 的 scan-results；如果小卡渲染和 LINE 還有落差，請優先改善 Flex JSON renderer，不要改原 bot 策略。`

## 2026-05-09 未上市 ETF 與說明小卡更新

- 使用者要求 ETF 研究加入「即將上市 / 未上市 ETF」區塊，放在 ETF 研究主頁搜尋欄下方、已上市 ETF 排名上方。
- 主頁只顯示精簡卡片：掛牌日、代號名稱、投信、募集期間、類型標籤、狀態；點卡片後才進完整資訊。
- 完整資訊至少需保留：代號 / 名稱、投信、預購日、募集期間、預計掛牌日、狀態、ETF 類型、投資市場/主題、發行價、最低申購金額、配息/收益平準金說明、保管銀行、資料來源連結。
- 預購與募集需在 UI 裡說明清楚：預購是券商或平台先登記意願；募集是基金正式公開申購期間，仍以投信公告與公開說明書為準。
- 目前 web 版先以靜態資料放入 00403A、00405A、00402A，正式後續若要長期維護，建議改成每日盤後由後端抓取 LINE Bank / 投信 / 公開說明書或 TWSE 來源快照。
- ETF 搜尋欄輸入未上市 ETF 代號時，要能直接跳到該檔即將上市 ETF 詳情。
- 「上一層」在未上市 ETF 詳情頁應回到 ETF 研究主頁，不是瀏覽器上一頁。
- 說明小卡可點擊修正也已納入本次前端：說明卡項目要像示範按鈕，點 2330 / 台積電可帶入查詢，點 RS 排名可查排名；左上頁面標題仍維持「個股查詢」，不要變成「說明」。
- 使用者後續調整：ETF 主頁不要直接塞三張即將上市 ETF 卡，只留一顆醒目的「即將上市 ETF」入口按鈕；點進去才顯示清單與詳情。主題更新提示卡先不要做。
- 後續預覽頁尺寸與字級偏好：用手機窄版約 430px 內容寬；整體字體比目前正式頁再小一點，主標題約 25-26px、區塊標題 18px、卡片主標 16-17px、內文 12-14px、標籤 11px。不要做成桌面滿版大字預覽。
- 全站返回按鈕名稱統一用「上一層」，包含個股查詢與教學；它代表回上一張小卡或上一層 ETF 畫面，不是瀏覽器上一頁。
- 2026-05-09 後續 UI 修正：ETF 分類篩選列只在 ETF 主排名頁顯示；即將上市清單、即將上市詳情、一般 ETF 詳情與共同持有頁都不要顯示分類列。一般 ETF 詳情中也不要夾「即將上市 ETF」入口。即將上市黑底標頭需避免怪異換行，代號與名稱分開排，名稱要夠明顯。

## 2026-05-09 Line Bot Web Implementation 2

- Correct repo for this session is `JustinFang1019/justin-trading-bot-web`, cloned at `C:\Users\Siriu\Documents\New project\justin-trading-bot-web`.
- Branch opened for this work: `codex/line-bot-web-impl2`.
- Fixed ETF navigation state in `index.html`: when users enter a stock overlap / shared-holding page from an upcoming ETF detail page, the global `上一層` button now returns to that upcoming ETF detail page instead of falling back to the listed ETF ranking page.
- Follow-up correction: from the upcoming ETF detail page itself, `上一層` now returns to the upcoming ETF list, not the ETF ranking home.
- Fixed stale cross-feature search text in `index.html`: entering `ETF 研究` now clears the top stock-command search input, so old commands such as `即時 2330` do not remain visible above the ETF module.
- Intentionally not changed: original LINE bot strategy logic, backend command behavior, ETF data sources, and public/auth access rules.
- Verification: `git diff --check` passed with only the existing Windows LF/CRLF warning; inline scripts in `index.html` parsed successfully through the Node REPL.
- Next prompt suggestion: `請先讀 CODEX_HANDOFF.md，檢查 ETF 研究裡「即將上市 ETF 詳情 → 個股共同持有 → 上一層」是否回到即將上市詳情，並確認切換功能時搜尋欄不會殘留上一個主題的指令。`

## 2026-05-09 Demo Stock Access Gate

- User requested `個股查詢` become a trial surface: only the help-card `2330` example should be publicly usable; trying other stocks should show a LINE bot join prompt.
- Implemented in `index.html` on branch `codex/demo-stock-gate`.
- Clarified follow-up: unauthenticated users should be able to use the commands shown on the Web help card, and those stock examples should all be based on `2330`.
- Public Web trial commands are now limited to `2330`, `台積電`, `即時 2330`, `回測 2330`, `權證 2330`, `RS排名`, plus `說明/help` and `教學`. Other stock ids/names and copied strategy commands render a join-LINE-bot prompt instead of calling `/api/web/command` or auto-triggering LIFF login.
- Updated the Web help card and search/header copy so the UI says help-card demo commands are available and other stock features belong in LINE bot. User explicitly confirmed `RS排名` can stay in the unauthenticated help-card list.
- Intentionally not changed: backend `/api/web/command`, LIFF session endpoints, ETF research, tutorial command behavior, and original LINE bot strategy/card logic.
- Verification to run before push/merge: `git diff --check`, inline script parse through Node REPL, and if possible manual GitHub Pages/mobile check after deploy.

## 2026-05-09 Topic Home Button

- User approved adding a Home button on the same toolbar row as `上一層`, placed immediately to the left of `上一層`, while keeping the original UI styling.
- Implemented in `index.html` on branch `codex/topic-home-button`.
- The new `⌂` button returns to the current topic's home state:
  - `個股查詢`: clears the command input/history and shows the Web help card.
  - `ETF 研究`: clears ETF search/filter and returns to the ETF ranking home.
  - Other tabs currently have no deeper home state, so the button reactivates the current tab and scrolls to top.
- Preview artifacts created during discussion but not intended for production unless explicitly requested: `today-broadcast-preview.html`, `home-button-preview.png`.
- Intentionally not changed: LINE command access rules, backend APIs, ETF data behavior, and original LINE bot card/strategy logic.

## 2026-05-09 Solid Home Icon Tweak

- User said the Home icon looked too simple and asked for a larger solid house.
- Updated `index.html` on branch `codex/solid-home-icon`: the toolbar Home button now uses a larger solid blue CSS house mark instead of the text glyph `⌂`.
- Behavior is unchanged from the previous Home button implementation.

## 2026-05-09 Refined Home Icon

- User felt the solid CSS house was too large.
- Updated `index.html` on branch `codex/refine-home-icon`: replaced the oversized CSS-composed house with a smaller 21px solid SVG house icon using `currentColor`.
- Home button placement and behavior remain unchanged.
