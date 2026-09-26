import { Card, CardHeader, DemoBadge, EmptyState, PageHeader, TableShell } from "../components/ui";

export default function PaperTrading() {
  return (
    <div>
      <PageHeader
        title="Paper Trading"
        description="Simulated portfolio only. No real-money trading is implemented or planned in this UI."
        right={<DemoBadge label="PAPER ONLY" />}
      />

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] px-5 py-4 text-[13px] leading-relaxed text-emerald-100/90">
        <span className="font-bold">Safety guarantee: </span>
        this app never places real orders. Paper Trading tracks hypothetical fills
        for education and strategy validation only — not financial advice.
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Paper Balance", "$100,000.00", "virtual · resettable"],
          ["Equity", "—", "pending positions"],
          ["Open PnL", "—", "no open positions"],
          ["Win Rate (paper)", "—", "no closed trades"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">{k}</p>
            <p className="mt-1 font-mono text-lg font-bold text-white">{v}</p>
            <p className="text-xs text-slate-500">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Open Positions" subtitle="Simulated fills only" />
          <TableShell columns={["Coin", "Side", "Size", "Entry", "Mark", "PnL"] as const}>
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                No open paper positions.
              </td>
            </tr>
          </TableShell>
        </Card>
        <Card>
          <CardHeader title="Order Ticket (paper)" subtitle="Market / limit simulation — disabled until Phase 2" />
          <div className="space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold tracking-widest text-slate-500 uppercase">Coin</span>
                <input disabled placeholder="OP" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-600 disabled:opacity-70" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold tracking-widest text-slate-500 uppercase">Side</span>
                <input disabled placeholder="LONG / SHORT" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-600 disabled:opacity-70" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold tracking-widest text-slate-500 uppercase">Size (paper USD)</span>
              <input disabled placeholder="e.g. 100" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-600 disabled:opacity-70" />
            </label>
            <button disabled className="w-full cursor-not-allowed rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-500">
              Place paper order — enables in Phase 2
            </button>
            <EmptyState
              title="Paper engine offline"
              message="Execution, SL/TP linkage and journaling will be wired without any real-exchange keys."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
