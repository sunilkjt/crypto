# CryptoIn AI Signal — Phase 4 (AI Market Analyst + News Intelligence) ✅

Deterministic technical engine + explanatory AI layer. **The engine remains the
source of truth: the AI explains supplied numbers, never calculates or overrides
them. No real trading, no automated orders, no paper trading in this phase.**

Tech: React + TypeScript + Vite + Tailwind CSS v4 + Recharts + React Router + Lucide + Vitest.

## Phase 2 completed

- [x] Hyperliquid connection (public `/info` REST + `wss` WebSocket, no API keys)
- [x] Market list via `getMarkets()` — never hardcoded (main dex + HIP-3 builder dexes, ~360 markets)
- [x] Live prices on Dashboard + Scanner with `LIVE` / `DATA STALE` states
- [x] Candle history via `getCandles(symbol, timeframe, startTime, endTime)` → normalized `Candle`
- [x] Coin Analysis (`/coin/OP`) with real KPIs + full-window SVG candlestick chart + 1m/5m/15m/1h/4h switching (no reload)
- [x] Connection status: `CONNECTING` 🟡 / `ONLINE` 🟢 / `DEGRADED` 🟠 / `OFFLINE` 🔴 — ONLINE requires recently received data, never page load — plus `Last update: X seconds ago` in the topbar and on every market page
- [x] Realtime: WebSocket first, HTTPS polling fallback (`realtime.ts`), single shared socket
- [x] Cache: TTL + concurrent-request coalescing, stale expiry, error recovery (in-memory only, no Redis)
- [x] Offline snapshot: last good markets universe persisted to localStorage, painted instantly (stale-flagged) on reload/offline
- [x] Error handling: network/API/invalid/missing-market/missing-candles/WS-disconnect/rate-limit/timeout → `"Unable to retrieve Hyperliquid market data. Retrying…"` — never fabricated prices
- [x] Freshness: `Last updated: X seconds ago` + `DATA STALE` past threshold (markets 60s, candles 90s)
- [x] Search (client-side, no per-keystroke requests) + sorting (price/24h/volume/funding/OI, client-side) + pagination (25/page)
- [x] Strict TypeScript types: `Market, Candle, Ticker, Funding, OpenInterest, MarketData, Timeframe` — no `any`
- [x] Tests (mocked, 40 passing) + `npm run build` green (Phase 2 baseline)

## Phase 3 completed — deterministic engine (no LLM)

Indicators (`src/indicators/`, all local OHLCV math, null = insufficient data):
- EMA 20/50/200 (SMA-seeded), RSI 14 (Wilder), MACD 12/26/9 + histogram, ATR 14 (Wilder TR), volume avg/relVol/spike (current excluded from average)

Scoring (`src/analysis/`): Trend 25 (EMA-stack 5-point vote + ATR-epsilon) ·
Momentum 20 (RSI recovery, never blind oversold + MACD improvement) ·
Volume 15 (direction-agnostic confirmation) · Structure 20 (HH/HL/LH/LL swings,
close-confirmed breakouts, retests, false-breakout veto) ·
MTF 20 (4H major / 1H structure / 15M setup / 5M entry, conflicts halve it).
`calculateSignalScore()` scores LONG and SHORT independently; mixed or weak
evidence → WAIT (min edge 10, min score 40, plus range + chop-regime guards).

Bands: 0–39 WAIT · 40–59 WATCH · 60–74 SETUP · 75–89 STRONG SETUP · 90–100
HIGH-CONFLUENCE SETUP. Strength categories, never success probabilities.

Trade plans from structure only (no fixed %): entry zone, swing/SR/ATR
invalidation, TP1<TP2<TP3 (LONG, mirrored SHORT) with R floors, R:R to mean TP.

`#/bounce` scans top-25 by volume (bounded concurrency, progress bar, stale
guard) and lists only agreeing bounce setups ≥ SETUP, else
"No high-confluence bounce setups currently detected." `INSUFFICIENT DATA`
below 210 setup candles; `DATA STALE` never mints fresh signals.

- [x] Tests (mocked, 101 passing) + `npm run build` green (Phase 3 baseline)

## Phase 4 completed — AI analyst + news (engine still decides)

AI module (`src/ai/`): `AIProvider` abstraction (`LocalExplainerProvider`
default, clearly badged LOCAL · NOT AN LLM; `HttpAiProvider` active only when
`VITE_AI_ENDPOINT` points at your own key-holding backend). Strict system
prompt (11 duties, WAIT stays WAIT, strength is never probability). Structured
input (engine numbers + market snapshot + verified news, copied never computed)
and 9-block JSON output validated centrally — direction conflicts and invented
numeric fields are rejected, HTML escaped, rendering is text-only.
Cache key `symbol+timeframe+signalTs+dataTs` (15-min TTL); throttle 10s/key,
max 2 concurrent, in-flight dedupe, timeouts; failures resolve to
"AI analysis temporarily unavailable." while technicals keep working.

News module (`src/news/`): provider abstraction (empty default → honest
"No significant verified recent catalyst found."; HTTP backend optional),
https-only URLs required, relevance maps (OP→Optimism/Superchain…),
sentiment POSITIVE/NEGATIVE/NEUTRAL/UNCERTAIN (informational, never rescored),
dedupe + newest-first. Coin page shows headline/source/age/summary/sentiment
with safe external links; bounce rows show Catalyst: None/positive/negative.
Dashboard gains a deterministic AI MARKET REGIME (BTC/ETH/breadth/chop).

Security: no keys/tokens/secrets in code, `VITE_*`, `public/`, or history —
only endpoint URLs (see `.env.example`); audit grep clean.

- [x] Tests (mocked, 126 passing) + `npm run build` green

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
    realtime.ts       # startMarketRealtime() — WS first, HTTPS polling fallback
    __tests__/       # markets/candles/timeframes/client (mocked fetch)
  cache.ts            # cached(key, ttl, fetcher) — dedupe, TTL, failure recovery
  persist.ts          # localStorage last-good snapshot — instant stale paint offline
  connection.ts       # CONNECTING/ONLINE/DEGRADED/OFFLINE machine + last-update labels
  freshness.ts        # FRESHNESS thresholds, isStale, formatLastUpdated
  ws.ts               # singleton WsManager — 1 socket, multiplexed subs, backoff, heartbeat
  store.tsx           # MarketDataProvider + useMarkets() — snapshot poll 30s, mids fallback 15s
  useCandles.ts       # useCandles(symbol, tf) — REST + WS merge + 30s fallback
  __tests__/          # freshness, cache, persist, connection
src/components/
  LiveBadge.tsx       # legacy data-availability badges (kept for page headers)
  ConnectionBadge.tsx # 🟢/🟡/🟠/🔴 badge + last-update line (topbar, Bounce)
  CandleChart.tsx     # lightweight SVG candlesticks (full 300-candle window)
src/indicators/       # local OHLCV math: ema, rsi, macd, atr, volume (+ index)
  __tests__/          # hand-checked known values (EMA seed, Wilder RSI, TR, relVol)
src/analysis/         # deterministic engine: trend, momentum, volumeProfile,
                      # swings, levels, structure (+efficiencyRatio), mtf,
                      # bounce, scoring, tradeplan, signal, describe, hooks
  __tests__/          # scenario generators (bull/bear/chop/V-recovery/
                      # false-breakout/wick-rejection/dead-floor/insufficient)
src/ai/                # analyst: types, prompts, validate, input, cache,
                      # ratelimit, analyst (orchestrator), regime,
                      # providers/{localExplainer,httpProvider}, useAiAnalysis
  __tests__/          # input gen, response validation, override rejection,
                      # cache, throttle/dedupe, fallback, regime
src/news/             # types, relevance maps, provider (empty/http),
                      # aggregator, useNews/useNewsBatch
  __tests__/          # normalization, relevance, sentiment, ordering
```

Rules: UI never touches `fetch` or raw shapes — only `useMarkets()`, `useCandles()`, `getMarkets()`, `getCandles()`, formatters.

## Development

```bash
npm install
npm test        # vitest run — 126 mocked unit tests
npm run build   # tsc -b && vite build
npm run dev     # http://localhost:5173
```

Verify: Dashboard (regime card) → Scanner → `/coin/OP` (AI blocks populated LOCAL, news empty-state honest) → `#/bounce` (Catalyst column) → kill network (technicals live, AI unavailable) → stale data (no fresh AI calls).

## Pages

- `/` Dashboard — live BTC/ETH/majors + snapshot + deterministic AI MARKET REGIME; signal cards stay `PHASE 5+` placeholders
- `/scanner` — live table + deterministic 15m signals per row: Coin/Price/24h%/Trend/RSI/Volume/Structure/MTF/Signal/Strength
- `/coin/:symbol` — live KPIs + candles + real EMA/RSI/MACD/ATR + trend/structure/levels + LONG/SHORT/WAIT signal with entry/invalidation/TPs/R:R + AI MARKET ANALYSIS (9 blocks, timestamps) + RECENT VERIFIED NEWS + history link
- `/bounce` — top-25 volume scan with full MTF scoring; honest empty state when nothing qualifies
- `/history`, `/backtest`, `/paper`, `/settings` — unchanged shells (out of scope)

## Known limitations

- Chunk-size warning (>500kB, Recharts) — pre-existing, no code-split in this phase.
- WS `allMids` streams main-dex mids; HIP-3 rows refresh on the 30s snapshot poll.
- `allPerpMetas` intentionally unused: live shape carries no asset contexts — per-dex `metaAndAssetCtxs` is the reliable source.
- GitHub Pages edge caching can serve the previous bundle for a few minutes after a deploy; the Actions run status is the source of truth.
