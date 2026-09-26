import { HyperliquidError } from "./types";

export const INFO_URL = "https://api.hyperliquid.xyz/info";
export const WS_URL = "wss://api.hyperliquid.xyz/ws";

const DEFAULT_TIMEOUT_MS = 12_000;

function isRateLimitStatus(status: number): boolean {
  return status === 429;
}

function errorMessageForStatus(status: number, bodyText: string): string {
  if (status === 429)
    return "Hyperliquid rate limit hit. Retrying with backoff…";
  if (status >= 500)
    return "Unable to retrieve Hyperliquid market data. Retrying…";
  return `Hyperliquid request failed (HTTP ${status}). ${bodyText.slice(0, 160)}`;
}

/**
 * Single POST helper for the public /info endpoint.
 * No API keys. Timeout + typed errors. No raw responses leak —
 * callers parse/validate the unknown payload themselves.
 */
export async function postInfo<TBody extends Record<string, unknown>>(
  body: TBody,
  opts?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<unknown> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Link caller cancellation to our controller.
  const onAbort = () => controller.abort();
  opts?.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    let res: Response;
    try {
      res = await fetch(INFO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (opts?.signal?.aborted) {
          throw new HyperliquidError("network", "Request cancelled.", false);
        }
        throw new HyperliquidError(
          "timeout",
          "Unable to retrieve Hyperliquid market data (timeout). Retrying…",
          true,
        );
      }
      throw new HyperliquidError(
        "network",
        "Unable to retrieve Hyperliquid market data (network). Retrying…",
        true,
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (isRateLimitStatus(res.status)) {
        throw new HyperliquidError("rate-limited", errorMessageForStatus(res.status, text), true);
      }
      throw new HyperliquidError("api", errorMessageForStatus(res.status, text), res.status >= 500);
    }

    try {
      return (await res.json()) as unknown;
    } catch {
      throw new HyperliquidError(
        "invalid-response",
        "Unable to retrieve Hyperliquid market data (invalid JSON). Retrying…",
        true,
      );
    }
  } finally {
    clearTimeout(timer);
    opts?.signal?.removeEventListener("abort", onAbort);
  }
}
