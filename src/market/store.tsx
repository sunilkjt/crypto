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
import { getMarkets, getAllMids } from "./hyperliquid";
import { mergeLivePrices } from "./hyperliquid/markets";
import { wsManager } from "./ws";
import { isMarketsStale } from "./freshness";
import { loadMarketsSnapshot, saveMarketsSnapshot } from "./persist";
import type { Market, MarketStatus } from "./hyperliquid/types";
import { HyperliquidError } from "./hyperliquid/types";

const POLL_MS = 30_000;
const MID_POLL_MS = 15_000;

interface MarketDataValue {
  markets: Market[];
  status: MarketStatus;
  error: string | null;
  updatedAt: number;
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
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const marketsRef = useRef<Market[]>([]);
  marketsRef.current = markets;

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
      setError(null);
      setStatus("live");
      saveMarketsSnapshot({ markets: fresh, updatedAt: ts });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Keep last good snapshot; surface error only when we have nothing.
      if (marketsRef.current.length === 0) {
        setStatus("error");
        setError(toMessage(err));
      } else {
        setError(toMessage(err));
      }
    }
  }, []);

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

  // Single shared WS for live mids; polling fallback when WS is quiet.
  useEffect(() => {
    let lastWsTick = 0;
    const unsub = wsManager.subscribeAllMids((mids) => {
      lastWsTick = Date.now();
      setMarkets((prev) => (prev.length === 0 ? prev : mergeLivePrices(prev, mids)));
      setUpdatedAt(Date.now());
      setStatus((s) => (s === "error" ? s : "live"));
    });
    const fallback = window.setInterval(async () => {
      if (Date.now() - lastWsTick < MID_POLL_MS) return;
      if (marketsRef.current.length === 0) return;
      try {
        const { mids, updatedAt: ts } = await getAllMids();
        setMarkets((prev) => mergeLivePrices(prev, mids));
        setUpdatedAt(ts);
      } catch {
        // Polling fallback is best-effort; snapshot poll reports errors.
      }
    }, MID_POLL_MS);
    return () => {
      unsub();
      window.clearInterval(fallback);
    };
  }, []);

  const stale = useMemo(
    () => (updatedAt === 0 ? false : isMarketsStale(updatedAt)),
    [updatedAt],
  );

  const value = useMemo<MarketDataValue>(
    () => ({
      markets,
      status: status === "live" && stale ? "stale" : status,
      error,
      updatedAt,
      stale,
      refresh,
    }),
    [markets, status, error, updatedAt, stale, refresh],
  );

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

export function useMarkets(): MarketDataValue {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error("useMarkets must be used inside MarketDataProvider");
  return ctx;
}
