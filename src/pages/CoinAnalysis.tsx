import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardHeader, DemoBadge, DirectionBadge, PageHeader, Stat } from "../components/ui";
import { AiAnalysisCard } from "../components/AiAnalysisCard";
import { NewsList } from "../components/NewsList";
import { buildAiInput } from "../ai/input";
import { useAiAnalysis } from "../ai/useAiAnalysis";
import { useNews } from "../news/useNews";
import { CandleChart } from "../components/CandleChart";
import { FreshnessLabel, LiveBadge } from "../components/LiveBadge";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { useMarkets } from "../market/store";
import { useMtfCandles, useSignal } from "../analysis/hooks";
import { SUPPORTED_TIMEFRAMES } from "../market/hyperliquid/timeframes";
import type { Timeframe } from "../market/hyperliquid/types";
import { lastEma } from "../indicators/ema";
import { lastRsi } from "../indicators/rsi";
import { lastMacd } from "../indicators/macd";
import { lastAtr } from "../indicators/atr";
import { volumeStats } from "../indicators/volume";
import { formatFundingRate } from "../market/hyperliquid/funding";
import { formatOpenInterestNotional } from "../market/hyperliquid/openInterest";
import {
  formatChangePct,
  formatPriceUsd,
  formatVolumeNotional,
} from "../lib/format";
import { cn } from "../lib/cn";

function fmt(n: number | null, digits = 4): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function CoinAnalysis() {
  const { symbol = "OP" } = useParams();
  const coin = (symbol ?? "OP").toUpperCase();
  const [tf, setTf] = useState<Timeframe>("15m");

  const { markets, status: mktStatus, updatedAt: mktUpdated, stale: mktStale } = useMarkets();
  const market = useMemo(
    () => markets.find((m) => m.symbol === coin),
    [markets, coin],
  );
  const { data: mtf, loading: candlesLoading, error: candlesError } = useMtfCandles(coin);
  const signal = useSignal(coin, mtf, "15m");

  const chartCandles = mtf[tf] ?? [];
  const chg = formatChangePct(market?.dayChangePct ?? null);

  // Real indicator snapshot for the selected chart timeframe.
  const ind = useMemo(() => {
    if (chartCandles.length === 0) return null;
    const closes = chartCandles.map((c) => c.close);
    const volumes = chartCandles.map((c) => c.volume);
    const macd = lastMacd(closes);
    const vol = volumeStats(volumes, 20);
    return {
      ema20: lastEma(closes, 20),
      ema50: lastEma(closes, 50),
      ema200: lastEma(closes, 200),
      rsi: lastRsi(closes, 14),
      macdLine: macd.line,
      macdSignal: macd.signal,
      macdHist: macd.histogram,
      atr: lastAtr(chartCandles, 14),
      relVol: vol?.relative ?? null,
      spike: vol?.spike ?? false,
      count: chartCandles.length,
    };
  }, [chartCandles]);

  const watchlist = useMemo(() => {
    const preferred = ["BTC", "ETH", "SOL", "OP", "ARB", "AVAX", "LINK", "DOGE"];
    const available = new Set(markets.map((m) => m.symbol));
    const list = preferred.filter((s) => available.has(s));
    if (!available.has(coin)) return [coin, ...list].slice(0, 8);
    return [coin, ...list.filter((s) => s !== coin)].slice(0, 8);
  }, [markets, coin]);

  const showStaleSignal = mktStale && signal !== null;
  const insufficient =
    !candlesLoading && (chartCandles.length > 0 && chartCandles.length < 210);

  // AI input: engine numbers + market snapshot + verified news, copied only.
  const { items: newsItems, loading: newsLoading } = useNews(coin);
  const aiInput = useMemo(() => {
    if (!signal || mktStale) return null;
    try {
      return buildAiInput({ symbol: coin, market, candlesByTf: mtf, signal, news: newsItems });
    } catch {
      return null;
    }
  }, [signal, mktStale, coin, market, mtf, newsItems]);
  const ai = useAiAnalysis(aiInput, "15m", aiInput !== null);

  return (
    <div>
      <PageHeader
        title={`Coin Analysis · ${coin}`}
        description="Deterministic technical analysis on live Hyperliquid candles, explained block by block. The engine decides; the AI only explains."
        right={
          <div className="flex items-center gap-2">
            <FreshnessLabel updatedAt={mktUpdated} />
            <ConnectionBadge />
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
          value={formatPriceUsd(market?.markPrice ?? null, coin)}
          sub={market ? "mark · live" : "—"}
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
          subtitle={`${chartCandles.length} ${tf} candles · computed locally`}
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
          {candlesLoading ? (
            <p className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Loading {coin} candles (4h / 1h / 15m / 5m)…
            </p>
          ) : candlesError ? (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <p className="max-w-md text-sm font-semibold text-rose-300">{candlesError}</p>
              <p className="mt-1 text-xs text-slate-500">Missing-candle state — no fabricated prices.</p>
            </div>
          ) : (
            <>
              <CandleChart candles={chartCandles} />
              <div className="flex flex-wrap items-center gap-2 px-3 pt-1 pb-2 text-[11px] text-slate-500">
                <LiveBadge status={mktStatus} />
                <FreshnessLabel updatedAt={mktUpdated} />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Real indicator values for the selected timeframe */}
      <Card className="mt-4">
        <CardHeader title={`Indicators · ${tf}`} subtitle="EMA · RSI · MACD · ATR · Volume — calculated locally from OHLCV" />
        <div className="grid grid-cols-2 gap-2.5 p-5 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["EMA 20", ind?.ema20 ?? null, 4],
            ["EMA 50", ind?.ema50 ?? null, 4],
            ["EMA 200", ind?.ema200 ?? null, 4],
            ["RSI 14", ind?.rsi ?? null, 1],
            ["ATR 14", ind?.atr ?? null, 4],
            ["Rel. Vol", ind?.relVol ?? null, 2],
          ].map(([label, v, d]) => (
            <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</p>
              <p className="mt-1 font-mono text-[15px] font-bold text-slate-100">
                {fmt(v as number | null, d as number)}
                {label === "Rel. Vol" && (v as number | null) !== null ? "×" : ""}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2.5 px-5 pb-5 text-sm">
          {[
            ["MACD line", ind?.macdLine ?? null],
            ["MACD signal", ind?.macdSignal ?? null],
            ["MACD hist", ind?.macdHist ?? null],
          ].map(([label, v]) => (
            <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</p>
              <p
                className={cn(
                  "mt-1 font-mono text-[15px] font-bold",
                  (v as number | null) !== null && (v as number) > 0 && (label as string).includes("hist")
                    ? "text-emerald-300"
                    : (v as number | null) !== null && (v as number) < 0 && (label as string).includes("hist")
                      ? "text-rose-300"
                      : "text-slate-100",
                )}
              >
                {fmt(v as number | null, 4)}
              </p>
            </div>
          ))}
        </div>
        {ind?.spike && (
          <p className="px-5 pb-4 text-xs font-semibold text-amber-300">Volume spike on the latest {tf} bar.</p>
        )}
      </Card>

      {/* Signal readout */}
      <Card className="mt-4">
        <CardHeader
          title="Signal · 15m setup"
          subtitle="Deterministic scoring — Signal Strength 0–100, never a probability"
          right={
            signal && !showStaleSignal ? (
              <DirectionBadge direction={signal.direction} />
            ) : (
              <DemoBadge label={showStaleSignal ? "DATA STALE" : insufficient ? "INSUFFICIENT DATA" : "COMPUTING"} />
            )
          }
        />
        {signal === null || candlesLoading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Computing signal…</p>
        ) : showStaleSignal ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-semibold text-amber-300">DATA STALE</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Market data is stale — no fresh signal is created from it. Values below are withheld, not guessed.
            </p>
          </div>
        ) : insufficient ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-semibold text-amber-300">INSUFFICIENT DATA</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              {chartCandles.length}/210 {tf} candles — EMA200 and full indicators need more history.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-3xl font-extrabold text-white">{signal.signalStrength}</span>
              <span className="text-sm font-bold text-cyan-300">{signal.classification}</span>
              <span className="ml-auto font-mono text-xs text-slate-500">
                LONG {signal.longScore} · SHORT {signal.shortScore}
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Trend", signal.trend],
                ["Momentum", signal.momentum],
                ["Volume", signal.volume],
                ["Structure", signal.marketStructure],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{k}</p>
                  <p className="mt-1 text-sm font-bold text-slate-100">{v}</p>
                </div>
              ))}
            </div>

            {signal.multiTimeframe && (
              <div className="flex flex-wrap gap-2">
                {signal.multiTimeframe.tfs.map((t) => (
                  <span
                    key={t.timeframe}
                    className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-[11px] text-slate-300"
                  >
                    {t.timeframe}: {t.flavor}
                  </span>
                ))}
                {signal.multiTimeframe.conflict && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                    MTF conflict — score halved
                  </span>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Trade Plan</p>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[13px] sm:grid-cols-4">
                {[
                  ["Entry", signal.entryLow !== null ? `${fmt(signal.entryLow)} – ${fmt(signal.entryHigh)}` : "—"],
                  ["Invalidation", fmt(signal.invalidation)],
                  ["TP1 / TP2 / TP3", signal.tp1 !== null ? `${fmt(signal.tp1)} / ${fmt(signal.tp2)} / ${fmt(signal.tp3)}` : "—"],
                  ["R:R", signal.riskReward !== null ? `1 : ${signal.riskReward}` : "—"],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="font-sans text-[11px] font-bold tracking-widest text-slate-500 uppercase">{k}</p>
                    <p className="mt-1 font-bold text-slate-100">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-bold tracking-widest text-emerald-400/80 uppercase">Reasons</p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-300">
                  {signal.reasons.length === 0 && <li>—</li>}
                  {signal.reasons.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-bold tracking-widest text-amber-400/80 uppercase">Warnings</p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-300">
                  {signal.warnings.length === 0 && <li>—</li>}
                  {signal.warnings.map((w, i) => (
                    <li key={i}>· {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4">
        <AiAnalysisCard
          state={mktStale ? "unavailable" : ai.state === "idle" && aiInput === null && !signal ? "idle" : ai.state}
          analysis={mktStale ? null : ai.analysis}
          provider={ai.provider}
          cached={ai.cached}
          marketDataTimestamp={mktUpdated}
        />
      </div>

      <div className="mt-4">
        <NewsList items={newsItems} loading={newsLoading} />
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Signal History"
          subtitle="Every closed signal for this coin lives on the history page"
          right={
            <Link to="/history" className="text-xs font-semibold text-cyan-300 hover:underline">
              Open history →
            </Link>
          }
        />
        <div className="px-5 py-4 text-xs leading-relaxed text-slate-500">
          Signal logging and backtesting arrive in later phases. The deterministic signal above
          is computed fresh from live candles on every visit — nothing is stored yet.
        </div>
      </Card>
    </div>
  );
}
