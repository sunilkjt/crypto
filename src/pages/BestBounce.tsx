import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, EmptyState, PageHeader } from "../components/ui";
import { ConnectionBadge, ConnectionLine } from "../components/ConnectionBadge";
import { FreshnessLabel } from "../components/LiveBadge";
import { useMarkets } from "../market/store";
import { isListableBounce, type Signal } from "../analysis/signal";
import { useSignalBatch } from "../analysis/hooks";
import { formatPriceUsd } from "../lib/format";
import { cn } from "../lib/cn";

const SCAN_UNIVERSE = 25;

function fmt(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default function BestBounce() {
  const { markets, error, stale, updatedAt, refresh } = useMarkets();
  const [scanOn, setScanOn] = useState(true);

  // Scan universe: top N by 24h notional volume. No hardcoded coin list.
  const universe = useMemo(
    () =>
      [...markets]
        .filter((m) => (m.dayVolumeNotional ?? 0) > 0)
        .sort((a, b) => (b.dayVolumeNotional ?? 0) - (a.dayVolumeNotional ?? 0))
        .slice(0, SCAN_UNIVERSE)
        .map((m) => m.symbol),
    [markets],
  );

  const { entries, loading, done, total } = useSignalBatch(scanOn && !stale ? universe : []);

  const setups: { signal: Signal; price: number | null }[] = useMemo(() => {
    const prices = new Map(markets.map((m) => [m.symbol, m.markPrice]));
    return entries
      .filter((e) => e.signal !== null && isListableBounce(e.signal))
      .map((e) => ({ signal: e.signal as Signal, price: prices.get(e.symbol) ?? null }))
      .sort((a, b) => b.signal.signalStrength - a.signal.signalStrength);
  }, [entries, markets]);

  const failed = entries.filter((e) => e.error !== null).length;

  return (
    <div>
      <PageHeader
        title="BEST BOUNCE"
        description="Scanning for potential crypto bounce setups using support, momentum, volume and multi-timeframe confirmation."
        right={
          <div className="flex items-center gap-2">
            <ConnectionBadge />
          </div>
        }
      />

      <Card>
        <CardHeader
          title={`Bounce Scan · top ${SCAN_UNIVERSE} by volume`}
          subtitle="Full 4-timeframe deterministic scoring per market — no invented setups"
          right={<ConnectionLine />}
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/70 px-4 py-3 text-xs text-slate-400">
          {stale ? (
            <span className="font-bold text-amber-300">DATA STALE — scanning paused until the feed recovers.</span>
          ) : loading ? (
            <span>
              Scoring {done}/{total} markets…
              <span className="ml-2 inline-block h-3 w-40 overflow-hidden rounded-full bg-slate-800 align-middle">
                <span
                  className="block h-full bg-cyan-400 transition-all"
                  style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
                />
              </span>
            </span>
          ) : (
            <span>
              Scored {done}/{total} · {setups.length} listable setup{setups.length === 1 ? "" : "s"} ·{" "}
              {failed > 0 ? `${failed} failed (skipped, never guessed)` : "no failures"}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <FreshnessLabel updatedAt={updatedAt} />
            <button
              onClick={() => {
                setScanOn(false);
                refresh();
                window.setTimeout(() => setScanOn(true), 50);
              }}
              className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold text-slate-200 hover:bg-slate-800"
            >
              Rescan
            </button>
            <button
              onClick={() => setScanOn((s) => !s)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold text-slate-200 hover:bg-slate-800"
            >
              {scanOn ? "Pause" : "Resume"}
            </button>
          </span>
        </div>

        {stale ? (
          <EmptyState
            title="DATA STALE"
            message="Market data is stale, so no fresh scan is produced. Last results are withheld rather than presented as live."
            hint="Wait for the feed or press Rescan"
          />
        ) : loading && setups.length === 0 ? (
          <EmptyState
            title="Scanning markets…"
            message="Fetching 4h/1h/15m/5m candles and scoring each market deterministically."
          />
        ) : setups.length === 0 ? (
          <EmptyState
            title="No high-confluence bounce setups currently detected."
            message="Scored markets lack the multi-confirmation agreement a bounce requires (level + recovery + momentum + volume + timeframe alignment). Nothing is invented to fill this table."
            hint={`Scanned ${done} markets · all below bar`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm" style={{ minWidth: 1020 }}>
              <thead>
                <tr className="border-b border-slate-800 text-[11px] tracking-widest text-slate-500 uppercase">
                  {["Coin", "Price", "Score", "Dir", "Entry", "Invalidation", "TP1", "TP2", "TP3", "R:R", "Top reasons"].map((c) => (
                    <th key={c} className="px-3 py-3 font-semibold whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {setups.map(({ signal: s, price }) => (
                  <tr key={s.symbol} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/50">
                    <td className="px-3 py-2.5">
                      <Link to={`/coin/${s.symbol}`} className="font-bold text-white hover:text-cyan-300">
                        {s.symbol}
                      </Link>
                      <span className="ml-2 rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                        {s.classification}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-200">{formatPriceUsd(price, s.symbol)}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-100">{s.signalStrength}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold",
                          s.direction === "LONG" && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                          s.direction === "SHORT" && "border-rose-400/30 bg-rose-400/10 text-rose-300",
                        )}
                      >
                        {s.direction}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">
                      {s.entryLow !== null ? `${fmt(s.entryLow)}–${fmt(s.entryHigh)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{fmt(s.invalidation)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{fmt(s.tp1)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{fmt(s.tp2)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{fmt(s.tp3)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-200">
                      {s.riskReward !== null ? `1:${s.riskReward}` : "—"}
                    </td>
                    <td className="max-w-[280px] px-3 py-2.5 text-[11px] leading-snug text-slate-400">
                      {s.reasons.slice(0, 3).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {error && (
        <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-2.5 text-xs text-amber-200">
          {error}
        </p>
      )}

      <Card className="mt-4">
        <CardHeader title="How scoring works" subtitle="Transparent checklist — Signal Strength 0–100, never a probability" />
        <div className="grid gap-3 p-5 text-xs leading-relaxed text-slate-400 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Trend · 25", "EMA20/50/200 stack + price position on 15m and higher frames."],
            ["Momentum · 20", "RSI recovery (never blind oversold) + MACD histogram improvement."],
            ["Volume · 15", "Relative volume confirmation + spike detection."],
            ["Structure · 20", "HH/HL/LH/LL swings, close-confirmed breakouts, retests."],
            ["Multi-TF · 20", "4H major / 1H structure / 15M setup / 5M entry. Conflicts halve it."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="font-bold text-slate-200">{t}</p>
              <p className="mt-1">{d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
