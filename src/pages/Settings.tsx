import { useState } from "react";
import { Card, CardHeader, PageHeader } from "../components/ui";
import { cn } from "../lib/cn";

function Row({ label, desc, control }: { label: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 px-5 py-4 last:border-0">
      <div className="min-w-[200px] flex-1">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      {control}
    </div>
  );
}

export default function Settings() {
  const [dataSource, setDataSource] = useState("hyperliquid");
  const [currency, setCurrency] = useState("USD");
  const [risk, setRisk] = useState("1%");
  const [demoBanners, setDemoBanners] = useState(true);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Foundation preferences. Persisted locally for now; backend sync lands in a later phase."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Data" subtitle="Market source & display" />
          <Row
            label="Market data source"
            desc="Only Hyperliquid is planned for Phase 2"
            control={
              <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                {["hyperliquid", "demo"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setDataSource(v)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold capitalize",
                      dataSource === v ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            label="Quote currency"
            desc="Display only — no conversion yet"
            control={
              <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                {["USD", "USDT"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCurrency(v)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold",
                      currency === v ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            label="Show demo banners"
            desc="Keep placeholder warnings visible"
            control={
              <button
                onClick={() => setDemoBanners(!demoBanners)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition",
                  demoBanners ? "bg-cyan-500" : "bg-slate-700"
                )}
                aria-label="Toggle demo banners"
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                    demoBanners ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            }
          />
        </Card>

        <Card>
          <CardHeader title="Risk & Trading" subtitle="Paper-only safeguards" />
          <Row
            label="Default risk per trade"
            desc="Used for paper position sizing later"
            control={
              <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                {["0.5%", "1%", "2%"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setRisk(v)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold",
                      risk === v ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            label="Real-money trading"
            desc="Permanently disabled in this UI"
            control={
              <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-[11px] font-bold text-rose-300">
                DISABLED
              </span>
            }
          />
          <Row
            label="Reset paper account"
            desc="Restore $100,000 virtual balance"
            control={
              <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800">
                Reset (Phase 2)
              </button>
            }
          />
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="About" subtitle="Build info & scope" />
        <div className="px-5 py-4 text-xs leading-relaxed text-slate-500">
          <p>
            <span className="font-bold text-slate-300">CryptoIn AI Signal · Phase 1 Foundation.</span>{" "}
            Standalone React + TypeScript + Vite + Tailwind + Recharts build.
          </p>
          <p className="mt-1">
            Scope: layout, navigation and placeholder structures for all 8 pages. No live
            prices, no signals, no orders. Educational demo only — not financial advice.
          </p>
        </div>
      </Card>
    </div>
  );
}
