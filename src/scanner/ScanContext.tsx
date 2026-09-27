import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Timeframe } from "../market/hyperliquid/types";
import { useMarkets } from "../market/store";
import { runFullScan, type ScanSummary } from "./engine";
import { DEFAULT_ELIGIBILITY } from "./eligibility";
import {
  emitNotification,
  isNoteworthyTransition,
  loadJournal,
  nextLifecycleState,
  upsertJournalSignal,
  type SignalLifecycleState,
} from "../signals";

/**
 * Shared scan context: ONE full-market scan feeds Scanner, Bounce,
 * Dashboard and History. Refresh OFF/30s/1m/5m, manual rescan, bounded
 * concurrency, per-coin isolation. Journal + lifecycle + notifications
 * update here; outcomes refresh on the History page (bounded).
 * Stale market data pauses new scans — never mint signals from stale data.
 */

export const REFRESH_OPTIONS = [
  { label: "OFF", ms: 0 },
  { label: "30s", ms: 30_000 },
  { label: "1m", ms: 60_000 },
  { label: "5m", ms: 300_000 },
] as const;

export const UNIVERSE_OPTIONS = [20, 40, 60] as const;

interface ScanContextValue {
  summary: ScanSummary | null;
  scanning: boolean;
  progress: { done: number; total: number };
  setupTimeframe: Timeframe;
  setSetupTimeframe: (tf: Timeframe) => void;
  universeSize: number;
  setUniverseSize: (n: number) => void;
  refreshMs: number;
  setRefreshMs: (ms: number) => void;
  refresh: () => void;
  pausedStale: boolean;
}

const ScanContext = createContext<ScanContextValue | null>(null);

const NOTIFY_MIN_STRENGTH = 75; // STRONG SETUP and above

export function ScanProvider({ children }: { children: ReactNode }) {
  const { markets, stale } = useMarkets();
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [setupTimeframe, setSetupTimeframe] = useState<Timeframe>("15m");
  const [universeSize, setUniverseSize] = useState<number>(40);
  const [refreshMs, setRefreshMs] = useState<number>(60_000);
  const [runId, setRunId] = useState(0);
  const [pausedStale, setPausedStale] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevIdsRef = useRef<Map<string, { status: string; strength: number }>>(new Map());
  const marketsRef = useRef(markets);
  marketsRef.current = markets;

  const runScan = useCallback(async () => {
    const snapshot = marketsRef.current;
    if (snapshot.length === 0) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setScanning(true);
    setProgress({ done: 0, total: 0 });
    try {
      const result = await runFullScan(snapshot, {
        eligibility: { ...DEFAULT_ELIGIBILITY, universeSize },
        setupTimeframe,
        concurrency: 8,
        onProgress: (done, total) => setProgress({ done, total }),
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      setSummary(result);

      // Lifecycle + journal + notifications (prices from the same snapshot).
      const prices = new Map(snapshot.map((m) => [m.symbol, m.markPrice]));
      const seen = new Map<string, { status: string; strength: number }>();
      for (const r of result.results) {
        if (!r.id || r.signal.direction === "WAIT") continue;
        const prevEntries = loadJournal();
        const prev = prevEntries.find((e) => e.id === r.id);
        const price = prices.get(r.symbol) ?? null;
        const prevState =
          (prev?.status ?? prevIdsRef.current.get(r.id)?.status ?? null) as SignalLifecycleState | null;
        const prevStrength = prev?.strength ?? prevIdsRef.current.get(r.id)?.strength ?? null;
        const status = nextLifecycleState({
          previous: prevState,
          previousStrength: prevStrength,
          strength: r.signal.signalStrength,
          price,
          invalidation: r.signal.invalidation,
          tp3: r.signal.tp3,
          direction: r.signal.direction,
        });
        upsertJournalSignal({
          id: r.id,
          symbol: r.symbol,
          direction: r.signal.direction,
          setupType: r.setupType,
          timeframe: r.signal.timeframe,
          entryLow: r.signal.entryLow,
          entryHigh: r.signal.entryHigh,
          invalidation: r.signal.invalidation,
          tp1: r.signal.tp1,
          tp2: r.signal.tp2,
          tp3: r.signal.tp3,
          riskReward: r.signal.riskReward,
          strength: r.signal.signalStrength,
          quality: r.quality,
          status,
          outcome: prev?.outcome ?? null,
          newsHeadlines: [],
          dataTimestamp: r.signal.dataTimestamp,
        });
        const before = prevIdsRef.current.get(r.id);
        if (!before && r.signal.signalStrength >= NOTIFY_MIN_STRENGTH) {
          emitNotification({
            kind: "NEW_SETUP",
            symbol: r.symbol,
            direction: r.signal.direction,
            strength: r.signal.signalStrength,
            message: `${r.symbol} ${r.signal.direction} NEW — strength ${r.signal.signalStrength} (${r.setupType}).`,
          });
        } else if (before && isNoteworthyTransition(before.status as SignalLifecycleState, status)) {
          emitNotification({
            kind: "STATE_CHANGE",
            symbol: r.symbol,
            direction: r.signal.direction,
            strength: r.signal.signalStrength,
            message: `${r.symbol} ${r.signal.direction}: ${before.status} → ${status} (${r.signal.signalStrength}).`,
          });
        }
        seen.set(r.id, { status, strength: r.signal.signalStrength });
      }
      prevIdsRef.current = seen;
    } catch {
      // runFullScan isolates per-coin errors; a throw here is fatal only.
      setSummary((prev) =>
        prev === null
          ? {
              status: "ERROR",
              startedAt: Date.now(),
              completedAt: Date.now(),
              setupTimeframe,
              results: [],
              scanned: 0,
              excluded: [],
              error: "Market-data failure — scanner reports the outage, app stays up.",
              breadth: { bullishPct: 0, bearishPct: 0, neutralPct: 0, counted: 0 },
            }
          : prev,
      );
    } finally {
      if (!ctrl.signal.aborted) setScanning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universeSize, setupTimeframe]);

  const refresh = useCallback(() => {
    setRunId((n) => n + 1);
  }, []);

  // Trigger: manual, config change, interval — skipped while stale.
  useEffect(() => {
    if (markets.length === 0) return;
    if (stale) {
      setPausedStale(true);
      return;
    }
    setPausedStale(false);
    void runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, setupTimeframe, universeSize, markets.length, stale]);

  useEffect(() => {
    if (refreshMs <= 0 || markets.length === 0) return;
    const id = window.setInterval(() => setRunId((n) => n + 1), refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs, markets.length]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const value = useMemo<ScanContextValue>(
    () => ({
      summary,
      scanning,
      progress,
      setupTimeframe,
      setSetupTimeframe,
      universeSize,
      setUniverseSize,
      refreshMs,
      setRefreshMs,
      refresh,
      pausedStale,
    }),
    [summary, scanning, progress, setupTimeframe, universeSize, refreshMs, refresh, pausedStale],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan(): ScanContextValue {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used inside ScanProvider");
  return ctx;
}
