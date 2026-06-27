/**
 * lib/priceImpact — impactul cererii/ofertei asupra prețului.
 *
 * Dacă net se cumpără (mai mult BUY decât SELL), prețul urcă; dacă se vinde net,
 * prețul scade. Mărimea mișcării depinde de „lichiditatea" instrumentului
 * (cât capital e nevoie ca să-l miște). Funcții PURE, testate.
 */

export interface Flow {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

/** Valoarea netă (BUY pozitiv, SELL negativ) pe fiecare simbol. */
export function netNotionalBySymbol(flows: readonly Flow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of flows) {
    const signed = (f.side === 'BUY' ? 1 : -1) * f.quantity * f.price;
    out[f.symbol] = (out[f.symbol] ?? 0) + signed;
  }
  return out;
}

/**
 * Fracțiunea de mișcare a prețului din valoarea netă tranzacționată.
 * impact = k * netNotional / liquidity, limitat la ±maxMove.
 * `liquidity` > 0 = cât capital net mișcă prețul cu ~k * 100%.
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

/** Aplică o mișcare fracționară unui preț (rămâne strict pozitiv). */
export function applyMove(price: number, fraction: number): number {
  const next = price * (1 + fraction);
  const safe = next > 0.01 ? next : 0.01;
  return Math.round(safe * 100) / 100;
}
