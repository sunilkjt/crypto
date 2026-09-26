# CryptoIn AI Signal — Phase 1 Foundation

Standalone crypto AI signal web app. **No real-money trading.**

Tech: React + TypeScript + Vite + Tailwind CSS v4 + Recharts + React Router + Lucide.

## Pages (Phase 1)

- `/` Dashboard — Market Regime, Top Signals (placeholder), Best Bounces preview, Recent Signals table
- `/scanner` Market Scanner — Hyperliquid-ready table, shows "Waiting for market data…"
- `/coin/:symbol` Coin Analysis (e.g. `/coin/OP`) — Price/Volume/Funding/OI, chart shell, 1m/5m/15m/1h/4h selector, EMA/RSI/MACD/ATR, structure, LONG/SHORT/WAIT + trade plan + AI blocks
- `/bounce` BEST BOUNCE — support/momentum/volume/MTF explainer + "No live setups yet."
- `/history` Signal History — empty log table
- `/backtest` Backtest — metrics + Equity Curve + Trade Results shells, "No backtest data."
- `/paper` Paper Trading — simulated portfolio only, real trading disabled
- `/settings` Settings — data source, display, risk, safeguards

All market values are `—` placeholders. Live Hyperliquid integration lands in Phase 2.

## Run

```bash
npm install
npm run dev
npm run build
```

## Architecture

```
src/
  components/
    layout/AppLayout.tsx   # sidebar + topbar + mobile drawer + bottom nav
    ui.tsx                 # Card, Badge, EmptyState, TableShell, Stat
  pages/                   # one file per route
  data/placeholders.ts     # columns + demo constants (no fake prices)
  lib/cn.ts
  types.ts
  App.tsx                  # routes
  main.tsx                 # BrowserRouter
```
