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
  - Render had not yet deployed PR #6 when checked; `/api/web/command?text=2330` still returned 404 immediately after merge. Manual Deploy may be required.

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
- Confirmed immediately after PR #6 merge that Render still returned 404 for `/api/web/command?text=2330`, so the web change depends on a later Render deployment.

## Recommended Next Implementation Step

1. In Render, confirm the original bot service deployed the latest main containing PR #6. If `/api/web/command?text=2330` returns 404, run Manual Deploy -> Deploy latest commit.
2. Open the GitHub Pages URL and enter `2330`; it should render the same stock lookup card as LINE group input `2330`.
3. Click `即時` on a rendered card; it should call `/api/web/command?text=即時 <sid>` and replace the page with the web version of the LINE realtime card.
4. Add funnel and stale-data endpoints later if needed; they were not added in this first conservative API pass.
5. Add LIFF or authenticated write actions only after read-only mobile pages are correct.

## Next Prompt Suggestion

Ask Codex:

`請先閱讀 CODEX_HANDOFF.md，打開 GitHub Pages 檢查 justin-trading-bot-web 是否已顯示原 LINE bot 的 scan-results；如果小卡渲染和 LINE 還有落差，請優先改善 Flex JSON renderer，不要改原 bot 策略。`
