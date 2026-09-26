import { Card, CardHeader, DemoBadge, PageHeader, TableShell } from "../components/ui";
import { SCANNER_COLUMNS } from "../data/placeholders";

export default function Scanner() {
  return (
    <div>
      <PageHeader
        title="Market Scanner"
        description="Scanner table ready for live Hyperliquid data. No prices are invented in this foundation build."
        right={<DemoBadge label="WAITING FOR DATA" />}
      />

      <Card>
        <CardHeader
          title="Hyperliquid Universe"
          subtitle="Coin · Price · 24h · Volume · Funding · OI · Trend · RSI · Signal · Strength"
          right={
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Waiting for market data…
            </span>
          }
        />
        <TableShell columns={SCANNER_COLUMNS} minWidth="900px">
          <tr>
            <td
              colSpan={SCANNER_COLUMNS.length}
              className="px-4 py-14 text-center"
            >
              <p className="text-sm font-semibold text-slate-300">
                Waiting for market data…
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                This table will stream Price, 24h change, Volume, Funding, Open
                Interest, Trend, RSI, Signal and Strength from Hyperliquid in
                Phase 2. No fake live data is shown.
              </p>
            </td>
          </tr>
        </TableShell>
        <div className="border-t border-slate-800/80 px-5 py-3 text-[11px] text-slate-600">
          Data source (planned): Hyperliquid API · Refresh: — · Universe: — coins
        </div>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Filters", "Trend / RSI / Funding presets land here"],
          ["Watchlist", "Pin coins for Coin Analysis deep-dive"],
          ["Alerts", "Signal-strength thresholds (Phase 2+)"],
        ].map(([t, d]) => (
          <div
            key={t}
            className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4"
          >
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{t}</p>
            <p className="mt-1 text-xs text-slate-500">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
