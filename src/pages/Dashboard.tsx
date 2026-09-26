import { Link } from "react-router-dom";
import { Bitcoin } from "lucide-react";
import {
  Card,
  CardHeader,
  DemoBadge,
  DirectionBadge,
  EmptyState,
  PageHeader,
  TableShell,
} from "../components/ui";
import { FreshnessLabel, LiveBadge } from "../components/LiveBadge";
import { useMarkets } from "../market/store";
import {
  formatChangePct,
  formatOiCoins,
  formatPriceUsd,
  formatVolumeNotional,
} from "../lib/format";
import { formatFundingRate } from "../market/hyperliquid/funding";
import {
  RECENT_SIGNAL_COLUMNS,
  TOP_PLACEHOLDER_SIGNALS,
} from "../data/placeholders";
import { cn } from "../lib/cn";

const MAJORS = ["BTC", "ETH", "SOL", "HYPE", "DOGE", "LINK", "AVAX", "ARB"];

function RegimeCard({
  title,
  value,
  sub,
  tone,
}: {
  title: string;
  value: string;
  sub: string;
  tone?: "up" | "down" | null;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
        {title}
      </p>
      <p
        className={cn(
          "mt-1.5 font-mono text-xl font-bold",
          tone === "up" ? "text-emerald-300" : tone === "down" ? "text-rose-300" : "text-white",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { markets, status, error, updatedAt, refresh } = useMarkets();
  const bySymbol = new Map(markets.map((m) => [m.symbol, m]));
  const btc = bySymbol.get("BTC");
  const eth = bySymbol.get("ETH");

  const majors = MAJORS.map((s) => bySymbol.get(s)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m),
  );

  const loading = status === "loading" && markets.length === 0;
  const failed = status === "error" && markets.length === 0;

  const btcChg = formatChangePct(btc?.dayChangePct ?? null);
  const ethChg = formatChangePct(eth?.dayChangePct ?? null);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live Hyperliquid perpetual market overview. Signals remain disabled until Phase 3+."
        right={
          <div className="flex items-center gap-2">
            <FreshnessLabel updatedAt={updatedAt} />
            <LiveBadge status={status} />
          </div>
        }
      />

      {/* MARKET REGIME — live */}
      <Card>
        <CardHeader
          title="Market Regime"
          subtitle="BTC · ETH · majors — live Hyperliquid mark prices"
          right={<LiveBadge status={status} />}
        />
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Loading live Hyperliquid markets…
          </p>
        ) : failed ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-semibold text-rose-300">
              {error ?? "Unable to retrieve Hyperliquid market data. Retrying…"}
            </p>
            <button
              onClick={refresh}
              className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
              <RegimeCard
                title="BTC"
                value={formatPriceUsd(btc?.markPrice ?? null, "BTC")}
                sub={`${btcChg.text} · 24h · Vol ${formatVolumeNotional(btc?.dayVolumeNotional ?? null)}`}
                tone={btcChg.positive === null ? null : btcChg.positive ? "up" : "down"}
              />
              <RegimeCard
                title="ETH"
                value={formatPriceUsd(eth?.markPrice ?? null, "ETH")}
                sub={`${ethChg.text} · 24h · Vol ${formatVolumeNotional(eth?.dayVolumeNotional ?? null)}`}
                tone={ethChg.positive === null ? null : ethChg.positive ? "up" : "down"}
              />
              <RegimeCard
                title="BTC Funding"
                value={formatFundingRate(btc?.fundingRate ?? null)}
                sub={`ETH ${formatFundingRate(eth?.fundingRate ?? null)} · hourly rate`}
              />
              <RegimeCard
                title="Universe"
                value={markets.length > 0 ? String(markets.length) : "—"}
                sub="Hyperliquid perp markets tracked"
              />
            </div>
            {majors.length > 0 && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-800/70 px-4 py-3 sm:grid-cols-4">
                {majors.slice(0, 8).map((m) => {
                  const chg = formatChangePct(m.dayChangePct);
                  return (
                    <Link
                      key={m.symbol}
                      to={`/coin/${m.symbol}`}
                      className="rounded-lg border border-slate-800/70 bg-slate-950/50 px-3 py-2 hover:border-slate-700"
                    >
                      <span className="flex items-center justify-between text-xs font-bold text-slate-200">
                        {m.symbol}
                        <span
                          className={cn(
                            "font-mono",
                            chg.positive === true && "text-emerald-300",
                            chg.positive === false && "text-rose-300",
                            chg.positive === null && "text-slate-400",
                          )}
                        >
                          {chg.text}
                        </span>
                      </span>
                      <span className="mt-0.5 block font-mono text-[13px] text-slate-300">
                        {formatPriceUsd(m.markPrice, m.symbol)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 px-5 py-3 text-xs text-slate-500">
          <Bitcoin className="h-3.5 w-3.5" />
          <span>Source: Hyperliquid public API (metaAndAssetCtxs + allMids WS).</span>
          <span className="ml-auto">
            <FreshnessLabel updatedAt={updatedAt} />
          </span>
        </div>
      </Card>

      {/* TOP SIGNALS — still Phase 3+, keep honest placeholder */}
      <div className="mt-5 flex items-end justify-between">
        <h2 className="text-sm font-bold tracking-widest text-slate-300 uppercase">
          Top Signals
        </h2>
        <Link
          to="/history"
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
        >
          View history →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {TOP_PLACEHOLDER_SIGNALS.map((s) => (
          <Card key={s.coin} className="p-5 opacity-80">
            <div className="flex items-center justify-between">
              <p className="text-lg font-extrabold text-white">{s.coin}</p>
              <DirectionBadge direction={s.direction} />
            </div>
            <div className="mt-4 space-y-2 text-[13px]">
              {[
                ["Entry", s.entry],
                ["SL", s.sl],
                ["TP1", s.tp1],
                ["TP2", s.tp2],
                ["Signal Strength", s.strength],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between border-b border-dashed border-slate-800/80 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="text-slate-500">{k}</span>
                  <span className="font-mono font-semibold text-slate-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <DemoBadge label="PHASE 3+" />
              <Link
                to={`/coin/${s.coin}`}
                className="text-xs font-semibold text-cyan-300 hover:underline"
              >
                Open live analysis →
              </Link>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-600">
        Signal generation is NOT implemented in Phase 2. Live prices above are real;
        signal cards stay placeholders until Phase 3+.
      </p>

      {/* Market snapshot + signals note */}
      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Market Snapshot" subtitle="Top volume movers (live)" />
          {loading ? (
            <p className="px-5 py-8 text-center text-xs text-slate-500">Loading…</p>
          ) : (
            <div className="space-y-2 p-4">
              {[...markets]
                .filter((m) => m.dayVolumeNotional !== null)
                .sort((a, b) => (b.dayVolumeNotional ?? 0) - (a.dayVolumeNotional ?? 0))
                .slice(0, 5)
                .map((m) => (
                  <Link
                    key={m.symbol}
                    to={`/coin/${m.symbol}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800/70 px-3 py-2 hover:border-slate-700"
                  >
                    <span className="text-xs font-bold text-white">{m.symbol}</span>
                    <span className="font-mono text-xs text-slate-300">
                      {formatPriceUsd(m.markPrice, m.symbol)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      OI {formatOiCoins(m.openInterestCoins)}
                    </span>
                  </Link>
                ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent Signals"
            subtitle="Signal engine arrives in Phase 3+"
            right={<DemoBadge label="NOT LIVE" />}
          />
          <TableShell columns={RECENT_SIGNAL_COLUMNS}>
            <tr>
              <td
                colSpan={RECENT_SIGNAL_COLUMNS.length}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                No signals yet — the Phase 2 build ships market data only.
              </td>
            </tr>
          </TableShell>
        </Card>
      </div>

      {error && markets.length > 0 && (
        <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-2.5 text-xs text-amber-200">
          {error} Showing last good snapshot.
        </p>
      )}

      <Card className="mt-5 lg:hidden">
        <EmptyState
          title="Bounce scanner preview"
          message="Best-bounce scoring lands after signals (Phase 4+). Market data above is live."
        />
      </Card>
    </div>
  );
}
