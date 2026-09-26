import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Card, CardHeader, PageHeader } from "../components/ui";
import { FreshnessLabel, LiveBadge } from "../components/LiveBadge";
import { useMarkets } from "../market/store";
import type { Market } from "../market/hyperliquid/types";
import {
  formatChangePct,
  formatOiCoins,
  formatPrice,
  formatVolumeNotional,
} from "../lib/format";
import { formatFundingRate } from "../market/hyperliquid/funding";
import { formatOpenInterestNotional } from "../market/hyperliquid/openInterest";
import { cn } from "../lib/cn";

type SortKey = "symbol" | "markPrice" | "dayChangePct" | "dayVolumeNotional" | "fundingRate" | "openInterestNotional";

const PAGE_SIZE = 25;

function sortValue(m: Market, key: SortKey): number | string {
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
  const { markets, status, error, updatedAt, refresh } = useMarkets();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dayVolumeNotional");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  // Client-side filter + sort: zero extra network requests per keystroke.
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    const base = q ? markets.filter((m) => m.symbol.includes(q)) : markets;
    const sorted = [...base].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      let cmp: number;
      if (typeof av === "string" && typeof bv === "string") cmp = av.localeCompare(bv);
      else cmp = (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [markets, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

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

  const headers: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "symbol", label: "Coin" },
    { key: "markPrice", label: "Price", align: "right" },
    { key: "dayChangePct", label: "24h", align: "right" },
    { key: "dayVolumeNotional", label: "Volume", align: "right" },
    { key: "fundingRate", label: "Funding", align: "right" },
    { key: "openInterestNotional", label: "Open Interest", align: "right" },
  ];

  return (
    <div>
      <PageHeader
        title="Market Scanner"
        description="Live Hyperliquid perpetuals. Search and sorting are client-side — no extra API calls."
        right={
          <div className="flex items-center gap-2">
            <FreshnessLabel updatedAt={updatedAt} />
            <LiveBadge status={status} />
          </div>
        }
      />

      <Card>
        <CardHeader
          title={`Hyperliquid Universe · ${filtered.length} markets`}
          subtitle="Coin · Price · 24h · Volume · Funding · OI — live public data"
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
          <span className="text-[11px] text-slate-500">
            {filtered.length} of {markets.length} · page {safePage + 1}/{pageCount}
          </span>
        </div>

        {loading ? (
          <p className="px-4 py-14 text-center text-sm text-slate-400">
            Loading live Hyperliquid markets…
          </p>
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
            <table className="w-full border-collapse text-left text-sm" style={{ minWidth: 760 }}>
              <thead>
                <tr className="border-b border-slate-800 text-[11px] tracking-widest text-slate-500 uppercase">
                  {headers.map((h) => (
                    <th
                      key={h.key}
                      className={cn("px-4 py-3 font-semibold whitespace-nowrap", h.align === "right" && "text-right")}
                    >
                      <button
                        onClick={() => toggleSort(h.key)}
                        className="inline-flex items-center gap-1 hover:text-slate-200"
                        title={`Sort by ${h.label}`}
                      >
                        {h.label}
                        {sortKey === h.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-cyan-300" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-cyan-300" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Chart</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const chg = formatChangePct(m.dayChangePct);
                  return (
                    <tr key={m.symbol} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/50">
                      <td className="px-4 py-2.5">
                        <Link to={`/coin/${m.symbol}`} className="font-bold text-white hover:text-cyan-300">
                          {m.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                        {m.markPrice !== null ? `$${formatPrice(m.markPrice, m.symbol)}` : "—"}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right font-mono",
                          chg.positive === true && "text-emerald-300",
                          chg.positive === false && "text-rose-300",
                          chg.positive === null && "text-slate-500",
                        )}
                      >
                        {chg.text}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                        {formatVolumeNotional(m.dayVolumeNotional)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                        {formatFundingRate(m.fundingRate)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300" title={m.openInterestCoins !== null ? `${formatOiCoins(m.openInterestCoins)} ${m.symbol}` : undefined}>
                        {formatOpenInterestNotional(m.openInterestNotional)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link to={`/coin/${m.symbol}`} className="text-xs font-semibold text-cyan-300 hover:underline">
                          Open →
                        </Link>
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
            Source: Hyperliquid public API · <FreshnessLabel updatedAt={updatedAt} /> ·{" "}
            {status === "live" ? "LIVE" : status === "stale" ? "DATA STALE" : status.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-800 px-3 py-1.5 font-bold text-slate-300 disabled:opacity-40 hover:bg-slate-900"
            >
              Prev
            </button>
            <span>
              {safePage + 1} / {pageCount}
            </span>
            <button
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-slate-800 px-3 py-1.5 font-bold text-slate-300 disabled:opacity-40 hover:bg-slate-900"
            >
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
