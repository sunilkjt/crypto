/**
 * Real connection-status system for the Hyperliquid public feed.
 *
 * ONLINE is earned: it requires valid market data received recently —
 * never merely that the website loaded. Pure + fully unit-tested with
 * mocked clocks; no network access here.
 */

export type ConnectionState = "CONNECTING" | "ONLINE" | "DEGRADED" | "OFFLINE";

export interface ConnectionInput {
  /** Epoch ms of the last successfully received payload (0 = never). */
  lastSuccessAt: number;
  /** Epoch ms the session started (first attempt). */
  startedAt: number;
  /** Consecutive failed attempts since the last success. */
  consecutiveFailures: number;
  /** Whether we hold any usable (possibly aged) snapshot. */
  hasData: boolean;
}

export const CONNECTION_THRESHOLDS = {
  /** Data this fresh (after a success) counts as ONLINE. */
  onlineWithinMs: 60_000,
  /** Still CONNECTING (not yet OFFLINE) while boot is this young. */
  connectingGraceMs: 45_000,
  /** Aged data beyond this is OFFLINE, not DEGRADED. */
  offlineAfterMs: 180_000,
  /** This many consecutive failures downgrades fresh data to DEGRADED. */
  degradedAfterFailures: 2,
  /** At this many consecutive failures we call it OFFLINE outright. */
  offlineAfterFailures: 5,
} as const;

export function deriveConnection(
  input: ConnectionInput,
  now = Date.now(),
): ConnectionState {
  const { lastSuccessAt, startedAt, consecutiveFailures, hasData } = input;
  const t = CONNECTION_THRESHOLDS;

  if (consecutiveFailures >= t.offlineAfterFailures) return "OFFLINE";

  if (lastSuccessAt > 0) {
    const age = now - lastSuccessAt;
    if (age <= t.onlineWithinMs && consecutiveFailures < t.degradedAfterFailures) {
      return "ONLINE";
    }
    if (age <= t.offlineAfterMs) return "DEGRADED";
    return "OFFLINE";
  }

  // Never received valid data.
  if (!hasData && now - startedAt <= t.connectingGraceMs) return "CONNECTING";
  return "OFFLINE";
}

export function formatLastUpdate(lastSuccessAt: number, now = Date.now()): string {
  if (!Number.isFinite(lastSuccessAt) || lastSuccessAt <= 0) {
    return "Last update: never";
  }
  const s = Math.max(0, Math.floor((now - lastSuccessAt) / 1000));
  if (s < 5) return "Last update: just now";
  if (s === 1) return "Last update: 1 second ago";
  if (s < 60) return `Last update: ${s} seconds ago`;
  const m = Math.floor(s / 60);
  return m === 1 ? "Last update: 1 minute ago" : `Last update: ${m} minutes ago`;
}

export const CONNECTION_META: Record<
  ConnectionState,
  { dot: string; label: string; emoji: string }
> = {
  ONLINE: { dot: "bg-emerald-400", label: "Online", emoji: "🟢" },
  CONNECTING: { dot: "bg-amber-300", label: "Connecting…", emoji: "🟡" },
  DEGRADED: { dot: "bg-orange-400", label: "Degraded", emoji: "🟠" },
  OFFLINE: { dot: "bg-rose-500", label: "Offline", emoji: "🔴" },
};
