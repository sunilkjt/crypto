import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardHeader, DemoBadge, DirectionBadge, PageHeader, Stat } from "../components/ui";
import { CandleChart } from "../components/CandleChart";
import { FreshnessLabel, LiveBadge } from "../components/LiveBadge";
import { useMarkets } from "../market/store";
import { useCandles } from "../market/useCandles";
import { SUPPORTED_TIMEFRAMES } from "../market/hyperliquid/timeframes";
import type { Timeframe } from "../market/hyperliquid/types";
import { formatFundingRate } from "../market/hyperliquid/funding";
import { formatOpenInterestNotional } from "../market/hyperliquid/openInterest";
import {
  formatChangePct,
  formatPriceUsd,
  formatVolumeNotional,
} from "../lib/format";
import { cn } from "../lib/cn";

export default function CoinAnalysis() {
  const { symbol = "OP" } = useParams();
  const coin = (symbol ?? "OP").toUpperCase();
  const [tf, setTf] = useState<Timeframe>("15m");

  const { markets, status: mktStatus, updatedAt: mktUpdated } = useMarkets();
  const market = useMemo(
    () => markets.find((m) => m.symbol === coin),
    [markets, coin],
  );
  const { candles, status: cStatus, error: cError, updatedAt: cUpdated } = useCandles(coin, tf);

  const chg = formatChangePct(market?.dayChangePct ?? null);
  const lastClose = candles.length > 0 ? candles[candles.length - 1].close : null;

  const watchlist = useMemo(() => {
    const preferred = ["BTC", "ETH", "SOL", "OP", "ARB", "AVAX", "LINK", "DOGE"];
    const available = new Set(markets.map((m) => m.symbol));
    const list = preferred.filter((s) => available.has(s));
    if (!available.has(coin)) return [coin, ...list].slice(0, 8);
    return [coin, ...list.filter((s) => s !== coin)].slice(0, 8);
  }, [markets, coin]);

  return (
    <div>
      <PageHeader
        title={`Coin Analysis · ${coin}`}
        description="Live Hyperliquid perpetual data with real candlesticks. Indicators and AI analysis arrive in later phases."
        right={
          <div className="flex items-center gap-2">
            <FreshnessLabel updatedAt={cUpdated || mktUpdated} />
            <LiveBadge status={market ? mktStatus : cStatus} />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {watchlist.map((c) => (
          <Link
            key={c}
            to={`/coin/${c}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold",
              c === coin
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200",
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {!market && mktStatus !== "loading" ? (
        <Card className="mb-4">
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-semibold text-amber-300">
              {coin} is not listed on Hyperliquid perps.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Missing-market state handled without invented prices. Try BTC, ETH, SOL or OP.
            </p>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Price"
          value={formatPriceUsd(market?.markPrice ?? lastClose, coin)}
          sub={market ? "mark · live" : "last close · live"}
        />
        <Stat
          label="24h Change"
          value={chg.text}
          sub={`prev ${formatPriceUsd(market?.prevDayPrice ?? null, coin)}`}
        />
        <Stat label="Volume" value={formatVolumeNotional(market?.dayVolumeNotional ?? null)} sub="24h notional" />
        <Stat label="Funding" value={formatFundingRate(market?.fundingRate ?? null)} sub="hourly rate" />
        <Stat
          label="Open Interest"
          value={formatOpenInterestNotional(market?.openInterestNotional ?? null)}
          sub="coins × mark"
        />
      </div>

      <Card className="mt-4">
        <CardHeader
          title={`Price Chart · ${coin} / USD`}
          subtitle={`${candles.length} candles · live forming candle via WS`}
          right={
            <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
              {SUPPORTED_TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-bold",
                    tf === t ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-2">
          {cStatus === "loading" ? (
            <p className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Loading {coin} {tf} candles…
            </p>
          ) : cStatus === "error" ? (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <p className="max-w-md text-sm font-semibold text-rose-300">
                {cError ?? "Unable to retrieve Hyperliquid market data. Retrying…"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Missing-candle state handled without fabricated prices.
              </p>
            </div>
          ) : (
            <>
              <CandleChart candles={candles} />
              <div className="flex flex-wrap items-center gap-2 px-3 pt-1 pb-2 text-[11px] text-slate-500">
                <LiveBadge status={cStatus} />
                <FreshnessLabel updatedAt={cUpdated} />
                <span className="ml-auto font-mono">
                  O {candles.length ? candles[candles.length - 1].open.toFixed(4) : "—"} · H{" "}
                  {candles.length ? candles[candles.length - 1].high.toFixed(4) : "—"} · L{" "}
                  {candles.length ? candles[candles.length - 1].low.toFixed(4) : "—"} · C{" "}
                  {candles.length ? candles[candles.length - 1].close.toFixed(4) : "—"}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Indicators" subtitle="Phase 3+ — not computed from live data yet" />
          <div className="space-y-2.5 p-5 text-sm">
            {["EMA 20", "EMA 50", "EMA 200", "RSI", "MACD", "ATR"].map((k) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-dashed border-slate-800/70 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-slate-400">{k}</span>
                <span className="font-mono text-slate-600">Phase 3+</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Market Structure" subtitle="Phase 3+ — manual read for now" />
          <div className="space-y-2.5 p-5 text-sm">
            {["Trend", "Support", "Resistance", "Breakout", "Retest"].map((k) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-dashed border-slate-800/70 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-slate-400">{k}</span>
                <span className="font-mono text-slate-600">—</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Signal" subtitle="Disabled in Phase 2" right={<DirectionBadge direction="WAIT" />} />
          <div className="space-y-2.5 p-5 text-sm">
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Trade Plan</p>
            {["Entry", "Invalidation", "TP1", "TP2", "TP3", "Risk/Reward"].map((k) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-dashed border-slate-800/70 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-slate-400">{k}</span>
                <span className="font-mono text-slate-600">—</span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-slate-600">
              No LONG/SHORT recommendations are generated from market data in this phase.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="AI Analysis"
          subtitle="Phase 3+ — market data only in this build"
          right={<DemoBadge label="PHASE 3+" />}
        />
        <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
          {["Market Structure", "Setup", "Confirmations", "Risks", "Invalidation", "Trade Plan"].map((k) => (
            <div key={k} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{k}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                AI output for {coin} is out of scope for Phase 2 (market data only).
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
