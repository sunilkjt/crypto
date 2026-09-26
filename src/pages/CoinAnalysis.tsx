import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardHeader,
  DemoBadge,
  DirectionBadge,
  PageHeader,
  Stat,
} from "../components/ui";
import { COIN_WATCHLIST, TIMEFRAMES } from "../data/placeholders";
import { cn } from "../lib/cn";

export default function CoinAnalysis() {
  const { symbol = "OP" } = useParams();
  const coin = (symbol ?? "OP").toUpperCase();
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("15m");

  return (
    <div>
      <PageHeader
        title={`Coin Analysis · ${coin}`}
        description="Reusable coin-analysis layout. Route example: /coin/OP. Live market analysis will be connected in Phase 2."
        right={<DemoBadge label="PHASE 2 PENDING" />}
      />

      {/* watchlist */}
      <div className="mb-4 flex flex-wrap gap-2">
        {COIN_WATCHLIST.map((c) => (
          <Link
            key={c}
            to={`/coin/${c}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold",
              c === coin
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Price" value="—" sub="Live feed pending" />
        <Stat label="24h Change" value="—" sub="—" />
        <Stat label="Volume" value="—" sub="—" />
        <Stat label="Funding" value="—" sub="—" />
        <Stat label="Open Interest" value="—" sub="—" />
      </div>

      {/* Chart + timeframe */}
      <Card className="mt-4">
        <CardHeader
          title={`Price Chart · ${coin} / USD`}
          subtitle="EMA 20 · EMA 50 · EMA 200 overlays planned"
          right={
            <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-bold",
                    tf === t
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <div className="relative h-[280px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[]} margin={{ left: 8, right: 16, top: 12, bottom: 8 }}>
              <defs>
                <linearGradient id="coinFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area type="monotone" dataKey="price" stroke="#22d3ee" fill="url(#coinFill)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-5 py-4 text-center shadow-xl">
              <p className="text-sm font-semibold text-slate-200">
                Live market analysis will be connected in Phase 2.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Timeframe selected: {tf} · No candles loaded · No invented prices
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Indicators */}
        <Card>
          <CardHeader title="Indicators" subtitle="EMA · RSI · MACD · ATR" />
          <div className="space-y-2.5 p-5 text-sm">
            {["EMA 20", "EMA 50", "EMA 200", "RSI", "MACD", "ATR"].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-dashed border-slate-800/70 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-400">{k}</span>
                <span className="font-mono text-slate-500">—</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Market structure */}
        <Card>
          <CardHeader title="Market Structure" subtitle="Trend · S/R · Breakout · Retest" />
          <div className="space-y-2.5 p-5 text-sm">
            {["Trend", "Support", "Resistance", "Breakout", "Retest"].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-dashed border-slate-800/70 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-400">{k}</span>
                <span className="font-mono text-slate-500">—</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Signal + trade plan */}
        <Card>
          <CardHeader
            title="Signal"
            subtitle="LONG / SHORT / WAIT"
            right={<DirectionBadge direction="WAIT" />}
          />
          <div className="space-y-2.5 p-5 text-sm">
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Trade Plan</p>
            {["Entry", "Invalidation", "TP1", "TP2", "TP3", "Risk/Reward"].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-dashed border-slate-800/70 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-400">{k}</span>
                <span className="font-mono text-slate-500">—</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI analysis */}
      <Card className="mt-4">
        <CardHeader
          title="AI Analysis"
          subtitle="Market Structure · Setup · Confirmations · Risks · Invalidation · Trade Plan"
          right={<DemoBadge />}
        />
        <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
          {["Market Structure", "Setup", "Confirmations", "Risks", "Invalidation", "Trade Plan"].map(
            (k) => (
              <div key={k} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{k}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  AI output for {coin} will appear here once Phase 2 analysis is connected.
                </p>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
