# CryptoIn AI Signal — Phase 2 (Live Hyperliquid Market Data) ✅

Standalone crypto AI signal web app. **Public market data only. No real-money trading.
No signals, no backtesting, no paper trading in this phase.**

Tech: React + TypeScript + Vite + Tailwind CSS v4 + Recharts + React Router + Lucide + Vitest.

## Phase 2 completed

- [x] Hyperliquid connection (public `/info` REST + `wss` WebSocket, no API keys)
- [x] Market list via `getMarkets()` — never hardcoded (main dex + HIP-3 builder dexes, ~360 markets)
- [x] Live prices on Dashboard + Scanner with `LIVE` / `DATA STALE` states
- [x] Candle history via `getCandles(symbol, timeframe, startTime, endTime)` → normalized `Candle`
- [x] Coin Analysis (`/coin/OP`) with real KPIs + full-window SVG candlestick chart + 1m/5m/15m/1h/4h switching (no reload)
- [x] Real-time updates: single shared WS (`allMids` + `candle` subs) with reconnect/backoff/heartbeat, polling fallback, cleanup on unmount, no duplicate sockets
- [x] Cache: TTL + concurrent-request coalescing, stale expiry, error recovery (in-memory only, no Redis)
- [x] Offline snapshot: last good markets universe persisted to localStorage, painted instantly (stale-flagged) on reload/offline
- [x] Error handling: network/API/invalid/missing-market/missing-candles/WS-disconnect/rate-limit/timeout → `"Unable to retrieve Hyperliquid market data. Retrying…"` — never fabricated prices
- [x] Freshness: `Last updated: X seconds ago` + `DATA STALE` past threshold (markets 60s, candles 90s)
- [x] Search (client-side, no per-keystroke requests) + sorting (price/24h/volume/funding/OI, client-side) + pagination (25/page)
- [x] Strict TypeScript types: `Market, Candle, Ticker, Funding, OpenInterest, MarketData, Timeframe` — no `any`
- [x] Tests (mocked, 40 passing) + `npm run build` green

## Hyperliquid data sources (public only)

REST `POST https://api.hyperliquid.xyz/info`:

| Use | Request | Response fields used |
|---|---|---|
| Dex list | `{ type: "perpDexs" }` | `[null, {name}, …]` → main + HIP-3 dexes (cached 10 min) |
| Universe + context (per dex) | `{ type: "metaAndAssetCtxs" [, dex] }` | `universe[].name`, `markPx, oraclePx, midPx, prevDayPx, dayNtlVlm, funding, openInterest` |
| Mid refresh | `{ type: "allMids" }` | `Record<symbol, midString>` (main dex) |
| Candles | `{ type: "candleSnapshot", req: { coin, interval, startTime, endTime } }` | `t,T,s,i,o,h,l,c,v,n` (HIP-3 coins use `dex:COIN`) |

WebSocket `wss://api.hyperliquid.xyz/ws`:

| Subscription | Channel | Purpose |
|---|---|---|
| `{ type: "allMids" }` | `allMids` → `{ mids }` | live mid ticks merged into snapshot |
| `{ type: "candle", coin, interval }` | `candle` → `Candle[]` | live forming-candle merges (coin page only) |

## Supported timeframes

`1m, 5m, 15m, 1h, 4h` — mapped 1:1 to Hyperliquid intervals. History window: last 300 candles.

## Market-data architecture

```
src/market/
  hyperliquid/
    types.ts          # Market/Candle/Ticker/Funding/OpenInterest/MarketData/Timeframe + raw shapes + HyperliquidError
    client.ts         # postInfo() — timeout, rate-limit, network/invalid-response mapping
    timeframes.ts     # SUPPORTED_TIMEFRAMES, toHyperliquidInterval, timeframeToMs, getCandleWindow
    markets.ts        # normalizeMetaAndAssetCtxs, normalizePerpDexs, mergeDexMarkets, normalizeAllMids, mergeLivePrices, findMarket
    candles.ts        # normalizeCandle(s), getCandles(), getRecentCandles(), getCachedCandles()
    funding.ts        # toFunding, formatFundingRate
    openInterest.ts   # toOpenInterest, formatOpenInterestNotional
    index.ts          # getMarkets() (all dexes), getAllMids(), getCachedCandles()
    __tests__/       # markets/candles/timeframes/client (mocked fetch)
  cache.ts            # cached(key, ttl, fetcher) — dedupe, TTL, failure recovery
  persist.ts          # localStorage last-good snapshot — instant stale paint offline
  freshness.ts        # FRESHNESS thresholds, isStale, formatLastUpdated
  ws.ts               # singleton WsManager — 1 socket, multiplexed subs, backoff, heartbeat
  store.tsx           # MarketDataProvider + useMarkets() — snapshot poll 30s, mids fallback 15s
  useCandles.ts       # useCandles(symbol, tf) — REST + WS merge + 30s fallback
  __tests__/          # freshness, cache, persist
src/components/
  LiveBadge.tsx       # LiveBadge + FreshnessLabel + StatusPill
  CandleChart.tsx     # lightweight SVG candlesticks (full 300-candle window)
```

Rules: UI never touches `fetch` or raw shapes — only `useMarkets()`, `useCandles()`, `getMarkets()`, `getCandles()`, formatters.

## Development

```bash
npm install
npm test        # vitest run — 40 mocked unit tests
npm run build   # tsc -b && vite build
npm run dev     # http://localhost:5173
```

Verify: Dashboard (BTC/ETH live) → Scanner (search `OP`, `ETH`; sort by Volume/Funding/OI; paginate) → `/coin/OP`, `/coin/ETH` (KPIs live, switch 1m→4h without reload, candles update) → kill network to see error state → wait 60s+ to see DATA STALE.

## Pages

- `/` Dashboard — live BTC/ETH/majors + snapshot; signal cards stay honest `PHASE 3+` placeholders
- `/scanner` — live universe table: Coin/Price/24h/Volume/Funding/OI + search/sort/paginate
- `/coin/:symbol` — live KPIs + real candles; indicators/AI blocks marked Phase 3+
- `/bounce`, `/history`, `/backtest`, `/paper`, `/settings` — unchanged Phase 1 shells (out of scope)

## Known limitations

- Chunk-size warning (>500kB, Recharts) — pre-existing, no code-split in this phase.
- WS `allMids` streams main-dex mids; HIP-3 rows refresh on the 30s snapshot poll.
- `allPerpMetas` intentionally unused: live shape carries no asset contexts — per-dex `metaAndAssetCtxs` is the reliable source.
