/** Startup initialization: seeds instruments and an initial price history (idempotent). */

import { prisma } from './db.js';
import { SEED_INSTRUMENTS, initialPrice } from './data/instruments.js';
import { simulatePrices } from './lib/priceSim.js';

/** Adds any missing instruments without touching the live price of existing ones. */
export async function ensureInstruments(): Promise<void> {
  let created = 0;
  for (let i = 0; i < SEED_INSTRUMENTS.length; i++) {
    const s = SEED_INSTRUMENTS[i]!;
    const existing = await prisma.instrument.findUnique({ where: { symbol: s.symbol } });
    if (existing) continue;
    await prisma.instrument.create({ data: { ...s, currentPrice: initialPrice(s, i) } });
    created++;
  }
  if (created > 0) console.log(`Bootstrap: ${created} instrument(s) created.`);
}

/** Small deterministic seed from a symbol. */
function symbolSeed(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1_000_000;
}

/** Seeds ~40 synthetic history points for any instrument that has none, so charts aren't empty. */
export async function ensurePriceHistory(): Promise<void> {
  const instruments = await prisma.instrument.findMany();
  const now = Date.now();
  const STEP_MS = 15_000;
  for (const inst of instruments) {
    const has = await prisma.pricePoint.count({ where: { symbol: inst.symbol } });
    if (has > 0) continue;
    const series = simulatePrices(
      { basePrice: inst.basePrice, volatility: inst.volatility, drift: inst.drift, steps: 40 },
      symbolSeed(inst.symbol),
    );
    const last = series[series.length - 1] || inst.currentPrice;
    const scale = last > 0 ? inst.currentPrice / last : 1;
    const n = series.length;
    const data = series.map((p, k) => ({
      symbol: inst.symbol,
      price: Number((p * scale).toFixed(4)),
      at: new Date(now - (n - 1 - k) * STEP_MS),
    }));
    await prisma.pricePoint.createMany({ data });
  }
}
