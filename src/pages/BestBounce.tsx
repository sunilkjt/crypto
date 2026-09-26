import { Card, CardHeader, DemoBadge, EmptyState, PageHeader } from "../components/ui";

const PILLARS = [
  { title: "Support", desc: "Demand zones, prior lows, S/R flips" },
  { title: "Momentum", desc: "RSI reclaim, MACD turn, candle confirmation" },
  { title: "Volume", desc: "Absorption + expansion vs average" },
  { title: "MTF Confirmation", desc: "1m → 5m → 15m → 1h → 4h alignment" },
];

export default function BestBounce() {
  return (
    <div>
      <PageHeader
        title="BEST BOUNCE"
        description="Scanning for potential crypto bounce setups using support, momentum, volume and multi-timeframe confirmation."
        right={<DemoBadge label="SCANNER OFFLINE" />}
      />

      <Card>
        <CardHeader
          title="How the bounce scanner will work"
          subtitle="Phase 1 explains logic — Phase 2 connects live scoring"
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-[11px] font-bold text-cyan-300">0{i + 1}</p>
              <p className="mt-1 text-sm font-bold text-white">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Live Setups" subtitle="Ranked bounce candidates" />
        <EmptyState
          title="No live setups yet."
          message="Once support holds, momentum turns, volume confirms and higher timeframes agree, ranked LONG bounce setups will list here. No invented setups in foundation mode."
          hint="Engine status: offline · Phase 2 planned"
        />
      </Card>
    </div>
  );
}
