import { Link } from "react-router-dom";
import { ArrowUpRight, Bitcoin } from "lucide-react";
import {
  Card,
  CardHeader,
  DemoBadge,
  DirectionBadge,
  EmptyState,
  PageHeader,
  TableShell,
} from "../components/ui";
import {
  RECENT_SIGNAL_COLUMNS,
  TOP_PLACEHOLDER_SIGNALS,
} from "../data/placeholders";

function RegimeCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
        {title}
      </p>
      <p className="mt-1.5 text-xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Professional crypto analytics overview. All values are placeholders until Phase 2 live Hyperliquid integration."
        right={<DemoBadge label="PLACEHOLDER DATA" />}
      />

      {/* MARKET REGIME */}
      <Card>
        <CardHeader
          title="Market Regime"
          subtitle="BTC · ETH · Trend · Volatility — connects live in Phase 2"
          right={<DemoBadge />}
        />
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
          <RegimeCard title="BTC" value="—" sub="Price pending live feed" />
          <RegimeCard title="ETH" value="—" sub="Price pending live feed" />
          <RegimeCard title="Market Trend" value="—" sub="Regime engine not connected" />
          <RegimeCard title="Volatility" value="—" sub="ATR / regime pending" />
        </div>
        <div className="flex items-center gap-2 border-t border-slate-800/80 px-5 py-3 text-xs text-slate-500">
          <Bitcoin className="h-3.5 w-3.5" />
          Regime source: Hyperliquid (planned) · Status: waiting for market data…
        </div>
      </Card>

      {/* TOP SIGNALS */}
      <div className="mt-5 flex items-end justify-between">
        <h2 className="text-sm font-bold tracking-widest text-slate-300 uppercase">
          Top Signals
        </h2>
        <Link
          to="/history"
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
        >
          View history <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {TOP_PLACEHOLDER_SIGNALS.map((s) => (
          <Card key={s.coin} className="p-5">
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
              <DemoBadge />
              <Link
                to={`/coin/${s.coin}`}
                className="text-xs font-semibold text-cyan-300 hover:underline"
              >
                Open analysis →
              </Link>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-600">
        Example layout per spec (OP / LONG / Entry — / SL — / TP1 — / TP2 —).
        Do not treat as live signals.
      </p>

      {/* BEST BOUNCES + RECENT */}
      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Best Bounces"
            subtitle="Bounce scanner slots reserved"
            right={
              <Link
                to="/bounce"
                className="text-xs font-semibold text-cyan-300 hover:underline"
              >
                Open →
              </Link>
            }
          />
          <EmptyState
            title="No live setups yet"
            message="Support, momentum, volume and multi-timeframe confirmation will populate this section in Phase 2."
          />
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent Signals"
            subtitle="Table structure ready for signal engine"
            right={<DemoBadge />}
          />
          <TableShell columns={RECENT_SIGNAL_COLUMNS}>
            <tr>
              <td
                colSpan={RECENT_SIGNAL_COLUMNS.length}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                No signals yet — placeholder rows will appear once the engine is
                connected.
              </td>
            </tr>
          </TableShell>
        </Card>
      </div>
    </div>
  );
}
