# Codex Handoff

Last updated: 2026-05-08 Asia/Taipei

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

## Next Prompt Suggestion

Ask Codex:

`請先閱讀 CODEX_HANDOFF.md，打開 GitHub Pages 檢查 justin-trading-bot-web 是否已顯示原 LINE bot 的 scan-results；如果小卡渲染和 LINE 還有落差，請優先改善 Flex JSON renderer，不要改原 bot 策略。`
