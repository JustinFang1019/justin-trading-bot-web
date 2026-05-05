# Codex Handoff

Last updated: 2026-05-06 Asia/Taipei

## Current user intent

The user wants to continue this project across computers. GitHub should carry both code and concise Codex handoff notes.

The latest clarified product direction: this should become a mobile web version of the existing LINE bot, not a separate dashboard. The existing LINE Flex card UI and information density are important and must stay canonical. The mobile site should let users open a URL and see everything the LINE card provides, plus deeper K-bar, watchlist, warrant, performance, status, and related detail views.

## Required handoff rule

At the end of every meaningful Codex session, update this file before committing/pushing if there was any design discussion, implementation decision, code change, blocker, or next-step decision.

Each update should include:

- What was changed or discussed.
- Which files were touched.
- What was intentionally not changed.
- Verification performed or skipped.
- The recommended next prompt for continuing on another computer.

Then commit and push the handoff update to GitHub so another computer can continue by reading this file first.

## Repositories discussed

- `JustinFang1019/justin-trading-bot-web`: current web prototype repo cloned on this computer at `C:\Users\Siriu\Documents\justin-trading-bot-web`.
- `JustinFang1019/justin-trading-bot`: fuller private LINE trading bot repo. It contains the real LINE webhook, scanner, strategies, Flex card builders, cache, schedules, warrant modules, and Google Sheets persistence.

## Current project state

`justin-trading-bot-web` is a static/mobile web prototype. It already has:

- `index.html` single-page UI.
- Scan list, warrants, ETF rebalance observation, alerts, admin status, LINE preview, and mobile layout.
- `data/market-snapshot.json` and `data/kbar-snapshot.json` generated from public market sources.
- `.github/workflows/update-market-data.yml` to update snapshots on weekdays.

It is not yet a real backend or LINE/LIFF app.

## Important constraint from user

The user's core LINE cards and strategy logic must not change. In particular, preserve behavior from the fuller LINE bot repo:

- `stock_scanner/patterns.py` strategy logic, including START, CONT, KD convergence, RS ranking, pattern classification, thresholds, and scoring behavior.
- `stock_scanner/notify.py` core Flex card builders and strategy card content.
- Existing command meanings and LINE interaction flows unless explicitly approved.

The mobile/web redesign should wrap, preview, filter, and navigate around the existing outputs, not rewrite trading logic.

## Proposal direction from this conversation

Build a mobile-first companion interface for the existing LINE bot:

- Keep LINE as push/summary and keep existing small cards as canonical.
- Add Web/LIFF as a deeper mobile viewer for scan results, strategy details, K charts, warrant details, RS ranking, watchlist, performance tracking, and admin status.
- Prefer a thin API/export layer that reuses existing scan results, K-bar cache, warrant cache, and Google Sheets data.
- Treat the old static web prototype as visual direction, then connect it to real data from `justin-trading-bot`.

## Recommended next implementation step

Current implemented step:

- Rewrote `index.html` as a mobile-first companion viewer.
- Added bottom navigation: Today, Detail, Warrants, Status, LINE.
- Added filters for market, START/CONT, RS 90+, score, BOX, and repeat selections.
- Added a mobile detail view with chart, A/B/C entry layers, stop, pressure, and LINE preview.
- Added `docs/mobile-redesign-proposal.md`.
- Fixed LINE preview direction after user feedback: the web app must not invent a different LINE card format. The preview now follows the known `notify.py` structure more closely with entry/risk/RS pills and the original text summary shape. Future work should consume real Flex JSON from the bot instead of recreating cards by hand.

Recommended next implementation step:

1. Stop treating `justin-trading-bot-web` as only a static GitHub Pages prototype.
2. Decide backend architecture for the web version:
   - Preferred: add read-only web/API routes to the existing `justin-trading-bot` backend and keep all secrets/server logic there.
   - Alternative: create a separate backend service that imports/copies the bot modules.
3. Export real Flex JSON or canonical card payloads from `stock_scanner/notify.py`; the web app should render from that, not recreate card content manually.
4. Expose read-only APIs for K-bars, Google Sheets scan results, watchlist, warrants, performance, funnel stats, and system status.
5. Only after real data APIs exist, replace prototype arrays in `index.html`.
6. Add `View details` URL action from LINE cards only if it can be added without changing card meaning.

## Next prompt suggestion

Ask Codex:

`請根據 CODEX_HANDOFF.md，幫我把手機版改版提案整理成 docs/mobile-redesign-proposal.md，並列出第一階段要改哪些檔案。`
