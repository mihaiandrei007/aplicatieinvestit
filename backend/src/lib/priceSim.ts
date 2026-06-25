/**
 * lib/priceSim — simulator DETERMINIST de preț.
 *
 * Același seed => exact aceeași serie de prețuri. Esențial pentru ca toți membrii
 * unui grup să vadă aceeași piață și pentru ca testele să fie reproductibile.
 *
 * Model: mișcare browniană geometrică (drift + volatilitate) cu salturi rare
 * opționale. Numerele „aleatoare" provin dintr-un PRNG determinist (mulberry32).
 */

export interface PriceSimParams {
  /** Prețul de pornire (strict pozitiv). */
  basePrice: number;
  /** Volatilitate anualizată (ex. 0.2 = 20%). */
  volatility: number;
  /** Drift anualizat (randament mediu așteptat, ex. 0.05 = 5%). */
  drift: number;
  /** Număr de pași de simulat. */
  steps: number;
  /** Fracțiune dintr-un an per pas (1/252 ≈ o zi de tranzacționare). */
  dt?: number;
  /** Probabilitatea unui salt per pas (0..1). Implicit 0 (fără salturi). */
  jumpProbability?: number;
  /** Mărimea relativă maximă a unui salt (ex. 0.1 = ±10%). */
  jumpSize?: number;
}

/**
 * PRNG determinist mulberry32. Întoarce o funcție care produce numere în [0, 1).
 * Exportat pentru ca alte module (ex. coduri de invitație) să reutilizeze aceeași sursă.
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

/** Transformă două uniforme în (0,1) într-o normală standard (Box-Muller). */
function standardNormal(rng: () => number): number {
  let u1 = rng();
  const u2 = rng();
  if (u1 < 1e-12) u1 = 1e-12; // evită log(0)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generează seria de prețuri (lungime `steps + 1`, inclusiv prețul inițial).
 * Prețurile rămân strict pozitive prin construcție (multiplicare exponențială).
 */
export function simulatePrices(params: PriceSimParams, seed: number): number[] {
  const { basePrice, volatility, drift, steps } = params;
  const dt = params.dt ?? 1 / 252;
  const jumpProbability = params.jumpProbability ?? 0;
  const jumpSize = params.jumpSize ?? 0;

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error(`basePrice trebuie să fie pozitiv (primit: ${basePrice}).`);
  }
  if (!Number.isInteger(steps) || steps < 0) {
    throw new Error(`steps trebuie să fie un întreg ≥ 0 (primit: ${steps}).`);
  }

  const rng = makeRng(seed);
  const prices: number[] = [basePrice];
  let price = basePrice;

  for (let i = 0; i < steps; i++) {
    const z = standardNormal(rng);
    const diffusion = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z;
    price *= Math.exp(diffusion);

    if (jumpProbability > 0 && rng() < jumpProbability) {
      const jump = (rng() * 2 - 1) * jumpSize; // în [-jumpSize, +jumpSize]
      price *= 1 + jump;
    }

    prices.push(roundCents(price));
  }

  return prices;
}

/** Prețul de la pasul următor, plecând de la unul curent (pentru avans incremental). */
export function nextPrice(current: number, params: Omit<PriceSimParams, 'basePrice' | 'steps'>, seed: number): number {
  const series = simulatePrices({ ...params, basePrice: current, steps: 1 }, seed);
  return series[1]!;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
