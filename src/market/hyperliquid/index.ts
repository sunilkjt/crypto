import { postInfo } from "./client";
import { normalizeAllMids, normalizeMetaAndAssetCtxs, normalizePerpDexs, mergeDexMarkets } from "./markets";
import type { Market, Timeframe } from "./types";
import { cached, CACHE_TTL } from "../cache";
import { getCandles } from "./candles";
import type { Candle } from "./types";
import { HyperliquidError } from "./types";

/** Dex list changes rarely — cached much longer than market snapshots. */
const DEX_LIST_TTL_MS = 10 * 60 * 1000;

/**
 * getMarkets(): full perpetual universe with mark/oracle, 24h volume,
 * 24h change, funding and open interest. Never hardcoded.
 * Covers the main dex plus HIP-3 builder dexes (e.g. xyz:*) via the
 * dex list + one metaAndAssetCtxs call per dex. A dex that fails is
 * skipped; if every dex fails the first error is surfaced.
 * Note: live WS mids cover the main dex — HIP-3 rows refresh on the
 * snapshot poll instead.
 */
export async function getMarkets(opts?: {
  timeoutMs?: number;
  signal?: AbortSignal;
  bypassCache?: boolean;
}): Promise<{ markets: Market[]; updatedAt: number }> {
  const run = async () => {
    let dexes: string[];
    try {
      dexes = await cached("hl:perpDexs", DEX_LIST_TTL_MS, async () => {
        const payload = await postInfo({ type: "perpDexs" }, opts);
        return normalizePerpDexs(payload);
      });
    } catch (err) {
      if (err instanceof HyperliquidError && !err.retryable) throw err;
      dexes = [""];
    }

    const settled = await Promise.allSettled(
      dexes.map((dex) =>
        postInfo(
          dex === "" ? { type: "metaAndAssetCtxs" } : { type: "metaAndAssetCtxs", dex },
          opts,
        ).then(normalizeMetaAndAssetCtxs),
      ),
    );
    const lists: Market[][] = [];
    let firstError: unknown = null;
    for (const s of settled) {
      if (s.status === "fulfilled") lists.push(s.value);
      else if (firstError === null) firstError = s.reason;
    }
    if (lists.length === 0) {
      if (firstError instanceof HyperliquidError) throw firstError;
      throw new HyperliquidError(
        "api",
        "Unable to retrieve Hyperliquid market data. Retrying…",
        true,
      );
    }
    return {
      markets: mergeDexMarkets(lists),
      updatedAt: Date.now(),
    };
  };
  if (opts?.bypassCache) return run();
  return cached("hl:markets", CACHE_TTL.marketsMs, run);
}

/** Lightweight mid-price refresh (merged into the snapshot by the store). */
export async function getAllMids(opts?: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<{ mids: Record<string, number>; updatedAt: number }> {
  const payload = await postInfo({ type: "allMids" }, opts);
  return { mids: normalizeAllMids(payload), updatedAt: Date.now() };
}

/** Cached candle fetch used by charts (key includes window). */
export async function getCachedCandles(
  symbol: string,
  timeframe: Timeframe,
  startTime: number,
  endTime: number,
): Promise<{ candles: Candle[]; updatedAt: number }> {
  const key = `hl:candles:${symbol.toUpperCase()}:${timeframe}:${startTime}:${endTime}`;
  return cached(key, CACHE_TTL.candlesMs, async () => ({
    candles: await getCandles(symbol, timeframe, startTime, endTime),
    updatedAt: Date.now(),
  }));
}
