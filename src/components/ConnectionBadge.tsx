import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import {
  CONNECTION_META,
  formatLastUpdate,
  type ConnectionState,
} from "../market/connection";
import { useMarkets } from "../market/store";

/**
 * Real connection badge: 🟢 Online / 🟡 Connecting… / 🟠 Degraded / 🔴 Offline
 * plus "Last update: X seconds ago". Driven by received data — never by page load.
 * Refreshes its own label on a 5s timer so the provider subtree is not
 * re-rendered every second.
 */
export function ConnectionBadge({ showLabel = true }: { showLabel?: boolean }) {
  const { connection, lastSuccessAt } = useMarkets();
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const meta = CONNECTION_META[connection];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] font-bold text-slate-300"
      title={formatLastUpdate(lastSuccessAt)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      <span aria-hidden="true">{meta.emoji}</span>
      {showLabel ? meta.label : null}
    </span>
  );
}

export function ConnectionLine() {
  const { connection, lastSuccessAt } = useMarkets();
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const meta = CONNECTION_META[connection];
  return (
    <span className="text-[11px] text-slate-500">
      {meta.emoji} {meta.label} · {formatLastUpdate(lastSuccessAt)}
    </span>
  );
}

/** Map the 4-state connection onto the legacy LiveBadge status vocabulary. */
export function connectionToLegacyStatus(state: ConnectionState): "loading" | "live" | "stale" | "error" {
  switch (state) {
    case "ONLINE":
      return "live";
    case "CONNECTING":
      return "loading";
    case "DEGRADED":
      return "stale";
    case "OFFLINE":
      return "error";
  }
}
