/**
 * lib/priceImpact — the impact of supply/demand on the price.
 *
 * If there is net buying (more BUY than SELL), the price goes up; if there is net
 * selling, the price goes down. The size of the move depends on the instrument's
 * "liquidity" (how much capital is needed to move it). PURE, tested functions.
 */

export interface Flow {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

/** The net notional (BUY positive, SELL negative) for each symbol. */
export function netNotionalBySymbol(flows: readonly Flow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of flows) {
    const signed = (f.side === 'BUY' ? 1 : -1) * f.quantity * f.price;
    out[f.symbol] = (out[f.symbol] ?? 0) + signed;
  }
  return out;
}

/**
 * The fraction of price movement from the net notional traded.
 * impact = k * netNotional / liquidity, capped at ±maxMove.
 * `liquidity` > 0 = how much net capital moves the price by ~k * 100%.
 */
export function priceImpact(
  netNotional: number,
  liquidity: number,
  k = 1,
  maxMove = 0.12,
): number {
  if (!Number.isFinite(liquidity) || liquidity <= 0) return 0;
  const raw = (k * netNotional) / liquidity;
  return Math.max(-maxMove, Math.min(maxMove, raw));
}

/** Applies a fractional move to a price (stays strictly positive). */
export function applyMove(price: number, fraction: number): number {
  const next = price * (1 + fraction);
  const safe = next > 0.01 ? next : 0.01;
  return Math.round(safe * 100) / 100;
}
