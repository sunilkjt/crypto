import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Card, CardHeader, PageHeader } from "../components/ui";
import { FreshnessLabel, LiveBadge } from "../components/LiveBadge";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { useMarkets } from "../market/store";
import { useSignalBatch } from "../analysis/hooks";
import type { Market } from "../market/hyperliquid/types";
import {
  formatChangePct,
  formatPrice,
  formatVolumeNotional,
} from "../lib/format";
import { cn } from "../lib/cn";

type MarketSortKey = "symbol" | "markPrice" | "dayChangePct" | "dayVolumeNotional" | "fundingRate" | "openInterestNotional";
type SignalSortKey = "strength" | "rsi";
type SortKey = MarketSortKey | SignalSortKey;

const PAGE_SIZE = 25;
const MARKET_KEYS: MarketSortKey[] = ["symbol", "markPrice", "dayChangePct", "dayVolumeNotional", "fundingRate", "openInterestNotional"];

function marketValue(m: Market, key: MarketSortKey): number | string {
  switch (key) {
    case "symbol":
      return m.symbol;
    case "markPrice":
      return m.markPrice ?? Number.NEGATIVE_INFINITY;
    case "dayChangePct":
      return m.dayChangePct ?? Number.NEGATIVE_INFINITY;
    case "dayVolumeNotional":
      return m.dayVolumeNotional ?? Number.NEGATIVE_INFINITY;
    case "fundingRate":
      return m.fundingRate ?? Number.NEGATIVE_INFINITY;
    case "openInterestNotional":
      return m.openInterestNotional ?? Number.NEGATIVE_INFINITY;
  }
}

export default function Scanner() {
  const { markets, status, error, updatedAt, refresh, stale } = useMarkets();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dayVolumeNotional");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  // Universe-level filter + market-field sorts (no network per keystroke).
  const universe = useMemo(() => {
    const q = query.trim().toUpperCase();
    const base = q ? markets.filter((m) => m.symbol.includes(q)) : markets;
    if (!MARKET_KEYS.includes(sortKey as MarketSortKey)) return base;
    const key = sortKey as MarketSortKey;
    return [...base].sort((a, b) => {
      const av = marketValue(a, key);
      const bv = marketValue(b, key);
      const cmp =
        typeof av === "string" && typeof bv === "string"
          ? av.localeCompare(bv)
          : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [markets, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(universe.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = universe.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Deterministic 15m-setup signals for the visible page only (bounded,
  // cached requests). Strength/RSI sorts rank these computed rows.
  const { entries, loading: signalsLoading } = useSignalBatch(
    useMemo(() => pageRows.map((m) => m.symbol), [pageRows]),
  );
  const bySymbol = useMemo(() => new Map(entries.map((e) => [e.symbol, e])), [entries]);

  const rows = useMemo(() => {
    if (sortKey === "strength" || sortKey === "rsi") {
      const scored = pageRows.map((m) => {
        const sig = bySymbol.get(m.symbol)?.signal ?? null;
        const rank = sortKey === "strength" ? (sig?.signalStrength ?? -1) : (sig?.rsi ?? -1);
        return { m, sig, rank };
      });
      scored.sort((a, b) => (sortDir === "asc" ? a.rank - b.rank : b.rank - a.rank));
      return scored;
    }
    return pageRows.map((m) => ({ m, sig: bySymbol.get(m.symbol)?.signal ?? null, rank: 0 }));
  }, [pageRows, bySymbol, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    setPage(0);
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  };

  const loading = status === "loading" && markets.length === 0;
  const failed = status === "error" && markets.length === 0;

  const headers: { key: SortKey; label: string; align?: "right"; title: string }[] = [
    { key: "symbol", label: "Coin", title: "Sort by coin" },
    { key: "markPrice", label: "Price", align: "right", title: "Sort by price" },
    { key: "dayChangePct", label: "24h%", align: "right", title: "Sort by 24h change" },
    { key: "dayVolumeNotional", label: "Volume", align: "right", title: "Sort by volume" },
    { key: "strength", label: "Signal", align: "right", title: "Sort this page by signal strength" },
  ];

  return (
    <div>
      <PageHeader
        title="Market Scanner"
        description="Live Hyperliquid perpetuals with deterministic 15m signals per visible row. Market sorts rank the universe; Signal/RSI sorts rank this page."
        right={
          <div className="flex items-center gap-2">
            <FreshnessLabel updatedAt={updatedAt} />
            <ConnectionBadge />
          </div>
        }
      />

      <Card>
        <CardHeader
          title={`Scanner · ${universe.length} markets`}
          subtitle="Coin · Price · 24h% · Trend · RSI · Volume · Structure · MTF · Signal · Strength"
          right={<LiveBadge status={status} />}
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/70 px-4 py-3">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search: OP, ETH…"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
            />
          </label>
          <button
            onClick={() => toggleSort("strength")}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-bold",
              sortKey === "strength"
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                : "border-slate-800 text-slate-400 hover:border-slate-700",
            )}
          >
            Sort: Strength
          </button>
          <button
            onClick={() => toggleSort("rsi")}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-bold",
              sortKey === "rsi"
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                : "border-slate-800 text-slate-400 hover:border-slate-700",
            )}
          >
            Sort: RSI
          </button>
          <span className="text-[11px] text-slate-500">
            page {safePage + 1}/{pageCount}
          </span>
        </div>

        {loading ? (
          <p className="px-4 py-14 text-center text-sm text-slate-400">Loading live markets…</p>
        ) : failed ? (
          <div className="px-4 py-12 text-center">
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
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500">
            {query ? `No markets match "${query.trim().toUpperCase()}".` : "No markets available."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm" style={{ minWidth: 980 }}>
              <thead>
                <tr className="border-b border-slate-800 text-[11px] tracking-widest text-slate-500 uppercase">
                  {headers.map((h) => (
                    <th
                      key={h.key}
                      className={cn("px-3 py-3 font-semibold whitespace-nowrap", h.align === "right" && "text-right")}
                    >
                      <button onClick={() => toggleSort(h.key)} className="inline-flex items-center gap-1 hover:text-slate-200" title={h.title}>
                        {h.label}
                        {sortKey === h.key ? (
                          sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-cyan-300" /> : <ArrowDown className="h-3 w-3 text-cyan-300" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Trend</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">RSI</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Structure</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">MTF</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Strength</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ m, sig }) => {
                  const chg = formatChangePct(m.dayChangePct);
                  const entry = bySymbol.get(m.symbol);
                  const pending = signalsLoading && !sig && !entry?.error;
                  return (
                    <tr key={m.symbol} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/50">
                      <td className="px-3 py-2.5">
                        <Link to={`/coin/${m.symbol}`} className="font-bold text-white hover:text-cyan-300">
                          {m.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-200">
                        {m.markPrice !== null ? `$${formatPrice(m.markPrice, m.symbol)}` : "—"}
                      </td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", chg.positive === true && "text-emerald-300", chg.positive === false && "text-rose-300", chg.positive === null && "text-slate-500")}>
                        {chg.text}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                        {formatVolumeNotional(m.dayVolumeNotional)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {pending ? (
                          <span className="text-xs text-slate-600">…</span>
                        ) : sig ? (
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold",
                              sig.direction === "LONG" && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                              sig.direction === "SHORT" && "border-rose-400/30 bg-rose-400/10 text-rose-300",
                              sig.direction === "WAIT" && "border-slate-700 bg-slate-800 text-slate-400",
                            )}
                          >
                            {sig.direction}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600" title={entry?.error ?? "No signal"}>
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-300">
                        {sig && sig.trend !== "INSUFFICIENT" ? sig.trend : pending ? "…" : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                        {sig?.rsi !== null && sig?.rsi !== undefined
                          ? sig.rsi.toFixed(1)
                          : pending ? "…" : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-300">
                        {sig && sig.marketStructure !== "INSUFFICIENT" ? sig.marketStructure : pending ? "…" : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400">
                        {sig?.multiTimeframe
                          ? sig.multiTimeframe.tfs.map((t) => `${t.timeframe}:${shortFlavor(t.flavor)}`).join(" ")
                          : pending ? "…" : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-100">
                        {sig ? sig.signalStrength : pending ? "…" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 px-4 py-3 text-xs text-slate-500">
          <span>
            <FreshnessLabel updatedAt={updatedAt} /> · {stale ? "DATA STALE — signals paused" : "signals live"}
          </span>
          <div className="flex items-center gap-2">
            <button disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-slate-800 px-3 py-1.5 font-bold text-slate-300 disabled:opacity-40 hover:bg-slate-900">
              Prev
            </button>
            <span>{safePage + 1} / {pageCount}</span>
            <button disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} className="rounded-lg border border-slate-800 px-3 py-1.5 font-bold text-slate-300 disabled:opacity-40 hover:bg-slate-900">
              Next
            </button>
          </div>
        </div>
      </Card>

      {error && markets.length > 0 && (
        <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-2.5 text-xs text-amber-200">
          {error} Showing last good snapshot.
        </p>
      )}
    </div>
  );
}

function shortFlavor(flavor: string): string {
  return flavor
    .replace("BULLISH_REVERSAL", "B-REV")
    .replace("BEARISH_REVERSAL", "S-REV");
}
