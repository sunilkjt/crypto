import { Card, CardHeader, DemoBadge, PageHeader, TableShell } from "../components/ui";
import { HISTORY_COLUMNS } from "../data/placeholders";

export default function History() {
  return (
    <div>
      <PageHeader
        title="Signal History"
        description="Immutable log for every AI signal. Result and PnL tracking arrives with the live engine."
        right={<DemoBadge label="EMPTY LOG" />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total Signals", "0", "foundation mode"],
          ["Wins", "—", "pending results"],
          ["Losses", "—", "pending results"],
          ["Avg Strength", "—", "pending scoring"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">{k}</p>
            <p className="mt-1 text-lg font-bold text-white">{v}</p>
            <p className="text-xs text-slate-500">{s}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="All Signals"
          subtitle="Date · Coin · Direction · Entry · SL · TP1 · TP2 · Result · PnL · Signal Strength"
        />
        <TableShell columns={HISTORY_COLUMNS} minWidth="960px">
          <tr>
            <td colSpan={HISTORY_COLUMNS.length} className="px-4 py-14 text-center">
              <p className="text-sm font-semibold text-slate-300">No signals recorded yet.</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Closed signals with Entry / SL / TP1 / TP2 / Result / PnL and
                strength score will accumulate here. Nothing is fabricated in
                Phase 1.
              </p>
            </td>
          </tr>
        </TableShell>
      </Card>
    </div>
  );
}
