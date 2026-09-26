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
import { getMarkets } from "./hyperliquid";
import { startMarketRealtime } from "./hyperliquid/realtime";
import { mergeLivePrices } from "./hyperliquid/markets";
import { isMarketsStale } from "./freshness";
import { deriveConnection, type ConnectionState } from "./connection";
import { loadMarketsSnapshot, saveMarketsSnapshot } from "./persist";
import type { Market, MarketStatus } from "./hyperliquid/types";
import { HyperliquidError } from "./hyperliquid/types";

const POLL_MS = 30_000;

interface MarketDataValue {
  markets: Market[];
  /** Legacy data-availability flag kept for existing pages. */
  status: MarketStatus;
  /** Real connection state: earned by received data, never by page load. */
  connection: ConnectionState;
  error: string | null;
  updatedAt: number;
  lastSuccessAt: number;
  consecutiveFailures: number;
  stale: boolean;
  refresh: () => void;
}

const MarketDataContext = createContext<MarketDataValue | null>(null);

const FRIENDLY_ERROR = "Unable to retrieve Hyperliquid market data. Retrying…";

function toMessage(err: unknown): string {
  if (err instanceof HyperliquidError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return FRIENDLY_ERROR;
}

/** Cancellations (refresh supersede / unmount) are not connection failures. */
function isCancellation(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  return (
    err instanceof HyperliquidError &&
    err.kind === "network" &&
    /cancel/i.test(err.message)
  );
}

function initialSnapshot(): { markets: Market[]; updatedAt: number } {
  try {
    return loadMarketsSnapshot() ?? { markets: [], updatedAt: 0 };
  } catch {
    return { markets: [], updatedAt: 0 };
  }
}

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(initialSnapshot);
  const [markets, setMarkets] = useState<Market[]>(boot.markets);
  // A restored snapshot is shown instantly but flagged stale until refreshed.
  const [status, setStatus] = useState<MarketStatus>(boot.markets.length > 0 ? "stale" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(boot.updatedAt);
  const [lastSuccessAt, setLastSuccessAt] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [tick, setTick] = useState(0);
  const startedAtRef = useRef(Date.now());
  const abortRef = useRef<AbortController | null>(null);
  const marketsRef = useRef<Market[]>([]);
  marketsRef.current = markets;

  const recordSuccess = useCallback((at: number) => {
    setLastSuccessAt(at);
    setConsecutiveFailures(0);
    setError(null);
  }, []);

  const recordFailure = useCallback((err: unknown) => {
    if (isCancellation(err)) return;
    setConsecutiveFailures((f) => f + 1);
    setError(toMessage(err));
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!isRefresh && marketsRef.current.length === 0) setStatus("loading");
    try {
      const { markets: fresh, updatedAt: ts } = await getMarkets({
        signal: ctrl.signal,
        bypassCache: isRefresh,
      });
      setMarkets(fresh);
      setUpdatedAt(ts);
      setStatus("live");
      recordSuccess(ts);
      saveMarketsSnapshot({ markets: fresh, updatedAt: ts });
    } catch (err) {
      if (isCancellation(err)) return;
      recordFailure(err);
      // Keep last good snapshot; surface error only when we have nothing.
      if (marketsRef.current.length === 0) {
        setStatus("error");
      }
    }
  }, [recordSuccess, recordFailure]);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
    void load(true);
  }, [load]);

  // Initial load + slow poll for full snapshot (funding/OI/volume).
  useEffect(() => {
    void load(false);
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // Realtime ticks: WebSocket first, HTTPS polling fallback (see realtime.ts).
  useEffect(() => {
    const stop = startMarketRealtime(
      {
        onTick: (mids, _source, at) => {
          setMarkets((prev) => (prev.length === 0 ? prev : mergeLivePrices(prev, mids)));
          setUpdatedAt(at);
          setStatus((s) => (s === "error" ? s : "live"));
          recordSuccess(at);
        },
        onPollError: (message) => {
          recordFailure(new Error(message));
        },
      },
    );
    return stop;
  }, [recordSuccess, recordFailure]);

  const stale = useMemo(
    () => (updatedAt === 0 ? false : isMarketsStale(updatedAt)),
    [updatedAt],
  );

  const connection = useMemo<ConnectionState>(
    () =>
      deriveConnection({
        lastSuccessAt,
        startedAt: startedAtRef.current,
        consecutiveFailures,
        hasData: markets.length > 0,
      }),
    [lastSuccessAt, consecutiveFailures, markets.length],
  );

  const value = useMemo<MarketDataValue>(
    () => ({
      markets,
      status: status === "live" && stale ? "stale" : status,
      connection,
      error,
      updatedAt,
      lastSuccessAt,
      consecutiveFailures,
      stale,
      refresh,
    }),
    [markets, status, connection, error, updatedAt, lastSuccessAt, consecutiveFailures, stale, refresh],
  );

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

export function useMarkets(): MarketDataValue {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error("useMarkets must be used inside MarketDataProvider");
  return ctx;
}
