# Codex Handoff

Last updated: 2026-05-06 Asia/Taipei

## Current user intent

The user wants to continue this project across computers. GitHub should carry both code and concise Codex handoff notes.

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

Create a concrete phase-1 implementation plan:

1. Define read-only JSON endpoints or snapshot files exported by `justin-trading-bot`.
2. Map existing scan result fields to the mobile UI without changing strategy fields.
3. Redesign `justin-trading-bot-web/index.html` into a cleaner mobile-first PWA-style viewer.
4. Add a `View details` URL action from LINE cards only if it can be added without changing card meaning.

## Next prompt suggestion

Ask Codex:

`請根據 CODEX_HANDOFF.md，幫我把手機版改版提案整理成 docs/mobile-redesign-proposal.md，並列出第一階段要改哪些檔案。`
