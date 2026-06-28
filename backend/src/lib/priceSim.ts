/**
 * lib/priceSim — DETERMINISTIC price simulator.
 *
 * The same seed => exactly the same price series. Essential so that all members
 * of a group see the same market and so that tests are reproducible.
 *
 * Model: geometric Brownian motion (drift + volatility) with optional rare
 * jumps. The "random" numbers come from a deterministic PRNG (mulberry32).
 */

export interface PriceSimParams {
  /** The starting price (strictly positive). */
  basePrice: number;
  /** Annualized volatility (e.g. 0.2 = 20%). */
  volatility: number;
  /** Annualized drift (expected mean return, e.g. 0.05 = 5%). */
  drift: number;
  /** Number of steps to simulate. */
  steps: number;
  /** Fraction of a year per step (1/252 ≈ one trading day). */
  dt?: number;
  /** The probability of a jump per step (0..1). Defaults to 0 (no jumps). */
  jumpProbability?: number;
  /** The maximum relative size of a jump (e.g. 0.1 = ±10%). */
  jumpSize?: number;
}

/**
 * Deterministic mulberry32 PRNG. Returns a function that produces numbers in [0, 1).
 * Exported so other modules (e.g. invite codes) can reuse the same source.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns two uniforms in (0,1) into a standard normal (Box-Muller). */
function standardNormal(rng: () => number): number {
  let u1 = rng();
  const u2 = rng();
  if (u1 < 1e-12) u1 = 1e-12; // avoids log(0)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generates the price series (length `steps + 1`, including the initial price).
 * Prices stay strictly positive by construction (exponential multiplication).
 */
export function simulatePrices(params: PriceSimParams, seed: number): number[] {
  const { basePrice, volatility, drift, steps } = params;
  const dt = params.dt ?? 1 / 252;
  const jumpProbability = params.jumpProbability ?? 0;
  const jumpSize = params.jumpSize ?? 0;

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error(`basePrice must be positive (received: ${basePrice}).`);
  }
  if (!Number.isInteger(steps) || steps < 0) {
    throw new Error(`steps must be an integer ≥ 0 (received: ${steps}).`);
  }

  const rng = makeRng(seed);
  const prices: number[] = [basePrice];
  let price = basePrice;

  for (let i = 0; i < steps; i++) {
    const z = standardNormal(rng);
    const diffusion = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z;
    price *= Math.exp(diffusion);

    if (jumpProbability > 0 && rng() < jumpProbability) {
      const jump = (rng() * 2 - 1) * jumpSize; // in [-jumpSize, +jumpSize]
      price *= 1 + jump;
    }

    prices.push(roundCents(price));
  }

  return prices;
}

/** The price at the next step, starting from a current one (for incremental advance). */
export function nextPrice(current: number, params: Omit<PriceSimParams, 'basePrice' | 'steps'>, seed: number): number {
  const series = simulatePrices({ ...params, basePrice: current, steps: 1 }, seed);
  return series[1]!;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
