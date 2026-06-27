/** Instrumentele de start, grupate pe sectoare cu dependențe (lider → urmăritori). */

import { simulatePrices } from '../lib/priceSim.js';

export interface SeedInstrument {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
  drift: number;
  beta: number;
  liquidity: number;
  /** Sectorul/tema (pentru co-mișcare). */
  sector: string;
  /** Cât de mult urmează liderul sectorului (0 = lider/independent, 0..1). */
  correlation: number;
}

/** Liderul fiecărui sector — el „trage" ceilalți membri în aceeași direcție. */
export const SECTOR_LEADERS: Readonly<Record<string, string>> = {
  AI: 'NVDA',
  BigTech: 'AAPL',
  EV: 'TSLA',
  Media: 'NFLX',
  Finanțe: 'JPM',
  Consum: 'KO',
  Aero: 'BA',
};

export const SEED_INSTRUMENTS: readonly SeedInstrument[] = [
  // --- AI / semiconductori (lider: NVDA) ---
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 132, volatility: 0.5, drift: 0.14, beta: 1.7, liquidity: 1_100_000, sector: 'AI', correlation: 0 },
  { symbol: 'AMD', name: 'Adv. Micro Devices', basePrice: 158, volatility: 0.52, drift: 0.11, beta: 1.7, liquidity: 500_000, sector: 'AI', correlation: 0.55 },
  { symbol: 'TSM', name: 'Taiwan Semi', basePrice: 175, volatility: 0.38, drift: 0.1, beta: 1.2, liquidity: 700_000, sector: 'AI', correlation: 0.5 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', basePrice: 165, volatility: 0.4, drift: 0.1, beta: 1.2, liquidity: 600_000, sector: 'AI', correlation: 0.45 },
  { symbol: 'MU', name: 'Micron Tech.', basePrice: 105, volatility: 0.45, drift: 0.08, beta: 1.4, liquidity: 400_000, sector: 'AI', correlation: 0.5 },
  { symbol: 'ARM', name: 'Arm Holdings', basePrice: 130, volatility: 0.55, drift: 0.12, beta: 1.6, liquidity: 300_000, sector: 'AI', correlation: 0.55 },
  { symbol: 'SMCI', name: 'Super Micro', basePrice: 45, volatility: 0.7, drift: 0.12, beta: 2.0, liquidity: 200_000, sector: 'AI', correlation: 0.6 },
  { symbol: 'PLTR', name: 'Palantir Tech.', basePrice: 27, volatility: 0.65, drift: 0.12, beta: 2.0, liquidity: 200_000, sector: 'AI', correlation: 0.4 },

  // --- Big Tech (lider: AAPL) ---
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 198, volatility: 0.24, drift: 0.08, beta: 1.1, liquidity: 1_200_000, sector: 'BigTech', correlation: 0 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 432, volatility: 0.21, drift: 0.09, beta: 0.95, liquidity: 1_300_000, sector: 'BigTech', correlation: 0.4 },
  { symbol: 'GOOG', name: 'Alphabet Inc.', basePrice: 175, volatility: 0.24, drift: 0.08, beta: 1.05, liquidity: 1_000_000, sector: 'BigTech', correlation: 0.4 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 185, volatility: 0.3, drift: 0.07, beta: 1.2, liquidity: 1_000_000, sector: 'BigTech', correlation: 0.35 },
  { symbol: 'META', name: 'Meta Platforms', basePrice: 505, volatility: 0.33, drift: 0.1, beta: 1.3, liquidity: 800_000, sector: 'BigTech', correlation: 0.4 },

  // --- Auto / EV (lider: TSLA) ---
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248, volatility: 0.6, drift: 0.1, beta: 1.9, liquidity: 700_000, sector: 'EV', correlation: 0 },
  { symbol: 'RIVN', name: 'Rivian Auto.', basePrice: 12, volatility: 0.8, drift: 0.05, beta: 2.2, liquidity: 150_000, sector: 'EV', correlation: 0.6 },
  { symbol: 'F', name: 'Ford Motor', basePrice: 11, volatility: 0.3, drift: 0.03, beta: 1.2, liquidity: 300_000, sector: 'EV', correlation: 0.35 },
  { symbol: 'GM', name: 'General Motors', basePrice: 48, volatility: 0.32, drift: 0.04, beta: 1.3, liquidity: 300_000, sector: 'EV', correlation: 0.35 },

  // --- Media / streaming (lider: NFLX) ---
  { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 640, volatility: 0.35, drift: 0.09, beta: 1.25, liquidity: 450_000, sector: 'Media', correlation: 0 },
  { symbol: 'DIS', name: 'Walt Disney Co.', basePrice: 102, volatility: 0.28, drift: 0.05, beta: 1.15, liquidity: 400_000, sector: 'Media', correlation: 0.4 },

  // --- Finanțe (lider: JPM) ---
  { symbol: 'JPM', name: 'JPMorgan Chase', basePrice: 205, volatility: 0.26, drift: 0.06, beta: 1.1, liquidity: 700_000, sector: 'Finanțe', correlation: 0 },
  { symbol: 'BAC', name: 'Bank of America', basePrice: 40, volatility: 0.3, drift: 0.05, beta: 1.2, liquidity: 500_000, sector: 'Finanțe', correlation: 0.5 },
  { symbol: 'GS', name: 'Goldman Sachs', basePrice: 460, volatility: 0.3, drift: 0.06, beta: 1.3, liquidity: 400_000, sector: 'Finanțe', correlation: 0.45 },
  { symbol: 'V', name: 'Visa Inc.', basePrice: 280, volatility: 0.22, drift: 0.07, beta: 0.95, liquidity: 600_000, sector: 'Finanțe', correlation: 0.35 },

  // --- Consum (lider: KO) ---
  { symbol: 'KO', name: 'Coca-Cola Co.', basePrice: 62, volatility: 0.16, drift: 0.04, beta: 0.6, liquidity: 600_000, sector: 'Consum', correlation: 0 },
  { symbol: 'NKE', name: 'Nike Inc.', basePrice: 78, volatility: 0.29, drift: 0.05, beta: 1.0, liquidity: 350_000, sector: 'Consum', correlation: 0.3 },
  { symbol: 'MCD', name: "McDonald's Corp.", basePrice: 290, volatility: 0.2, drift: 0.05, beta: 0.7, liquidity: 500_000, sector: 'Consum', correlation: 0.3 },
  { symbol: 'SBUX', name: 'Starbucks Corp.', basePrice: 95, volatility: 0.28, drift: 0.05, beta: 1.0, liquidity: 350_000, sector: 'Consum', correlation: 0.35 },

  // --- Aero (independent) ---
  { symbol: 'BA', name: 'Boeing Co.', basePrice: 180, volatility: 0.42, drift: 0.04, beta: 1.4, liquidity: 300_000, sector: 'Aero', correlation: 0 },
];

/** Prețul curent inițial pentru un instrument (determinist din index). */
export function initialPrice(inst: SeedInstrument, index: number): number {
  const series = simulatePrices(
    { basePrice: inst.basePrice, volatility: inst.volatility, drift: inst.drift, steps: 5 },
    1000 + index,
  );
  return series[series.length - 1]!;
}
