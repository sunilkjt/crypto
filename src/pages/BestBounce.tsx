import { Card, CardHeader, EmptyState, PageHeader } from "../components/ui";
import { ConnectionBadge, ConnectionLine } from "../components/ConnectionBadge";
import { useMarkets } from "../market/store";

const PILLARS = [
  { title: "Support", desc: "Demand zones, prior lows, S/R flips" },
  { title: "Momentum", desc: "RSI reclaim, MACD turn, candle confirmation" },
  { title: "Volume", desc: "Absorption + expansion vs average" },
  { title: "MTF Confirmation", desc: "1m → 5m → 15m → 1h → 4h alignment" },
];

export default function BestBounce() {
  const { error } = useMarkets();
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
          title="How the bounce scanner will work"
          subtitle="Live market data is connected — ranked scoring arrives in a later phase"
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
        <CardHeader
          title="Live Setups"
          subtitle="Ranked bounce candidates"
          right={<ConnectionLine />}
        />
        <EmptyState
          title="No ranked setups yet."
          message="Bounce ranking needs support, momentum, volume and multi-timeframe scoring, which is not built yet (no AI signals in this phase). The market feed above is live — browse the Scanner and Coin Analysis pages. Nothing is invented here."
          hint="Scoring engine: not built · market data: see status"
        />
        {error && (
          <p className="border-t border-slate-800/70 px-5 py-3 text-xs text-amber-200">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}
