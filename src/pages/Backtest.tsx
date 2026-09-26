import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardHeader, DemoBadge, EmptyState, PageHeader } from "../components/ui";
import { BACKTEST_METRICS } from "../data/placeholders";

export default function Backtest() {
  return (
    <div>
      <PageHeader
        title="Backtest"
        description="Backtesting dashboard layout. Strategy runs and metrics plug in after Phase 2."
        right={<DemoBadge label="NO DATA" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BACKTEST_METRICS.map((m) => (
          <div
            key={m}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
              {m}
            </p>
            <p className="mt-1.5 font-mono text-lg font-bold text-slate-300">—</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Equity Curve" subtitle="Portfolio value over backtest period" />
          <div className="relative h-[260px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[]} margin={{ left: 8, right: 16, top: 12, bottom: 8 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="equity" stroke="#22d3ee" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-slate-800 bg-slate-950/90 px-4 py-1.5 text-xs text-slate-400">
                No backtest data.
              </span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Trade Results" subtitle="R distribution per closed trade" />
          <div className="relative h-[260px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} margin={{ left: 8, right: 16, top: 12, bottom: 8 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="r" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-slate-800 bg-slate-950/90 px-4 py-1.5 text-xs text-slate-400">
                No backtest data.
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <EmptyState
          title="No backtest data."
          message="Upload or run a strategy in a later phase to populate Total Trades, Win Rate, Average R, Profit Factor, Max Drawdown and TP hit rates with equity + distribution charts."
          hint="Recharts wired · awaiting dataset"
        />
      </Card>
    </div>
  );
}
