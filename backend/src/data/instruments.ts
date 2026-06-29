/** The starting instruments, grouped by sectors with dependencies (leader → followers). */

import { simulatePrices } from '../lib/priceSim.js';

export interface SeedInstrument {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
  drift: number;
  beta: number;
  liquidity: number;
  /** The sector/theme (for co-movement). */
  sector: string;
  /** How closely it follows the sector leader (0 = leader/independent, 0..1). */
  correlation: number;
}

/** The leader of each sector — it "pulls" the other members in the same direction. */
export const SECTOR_LEADERS: Readonly<Record<string, string>> = {
  AI: 'NVDA',
  BigTech: 'AAPL',
  EV: 'TSLA',
  Media: 'NFLX',
  Finance: 'JPM',
  Consumer: 'KO',
  Aerospace: 'BA',
  Energy: 'XOM',
  Health: 'LLY',
  Crypto: 'COIN',
};

export const SEED_INSTRUMENTS: readonly SeedInstrument[] = [
  // --- AI / semiconductors (leader: NVDA) ---
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 132, volatility: 0.5, drift: 0.14, beta: 1.7, liquidity: 1_100_000, sector: 'AI', correlation: 0 },
  { symbol: 'AMD', name: 'Adv. Micro Devices', basePrice: 158, volatility: 0.52, drift: 0.11, beta: 1.7, liquidity: 500_000, sector: 'AI', correlation: 0.55 },
  { symbol: 'TSM', name: 'Taiwan Semi', basePrice: 175, volatility: 0.38, drift: 0.1, beta: 1.2, liquidity: 700_000, sector: 'AI', correlation: 0.5 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', basePrice: 165, volatility: 0.4, drift: 0.1, beta: 1.2, liquidity: 600_000, sector: 'AI', correlation: 0.45 },
  { symbol: 'MU', name: 'Micron Tech.', basePrice: 105, volatility: 0.45, drift: 0.08, beta: 1.4, liquidity: 400_000, sector: 'AI', correlation: 0.5 },
  { symbol: 'ARM', name: 'Arm Holdings', basePrice: 130, volatility: 0.55, drift: 0.12, beta: 1.6, liquidity: 300_000, sector: 'AI', correlation: 0.55 },
  { symbol: 'SMCI', name: 'Super Micro', basePrice: 45, volatility: 0.7, drift: 0.12, beta: 2.0, liquidity: 200_000, sector: 'AI', correlation: 0.6 },
  { symbol: 'PLTR', name: 'Palantir Tech.', basePrice: 27, volatility: 0.65, drift: 0.12, beta: 2.0, liquidity: 200_000, sector: 'AI', correlation: 0.4 },

  // --- Big Tech (leader: AAPL) ---
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 198, volatility: 0.24, drift: 0.08, beta: 1.1, liquidity: 1_200_000, sector: 'BigTech', correlation: 0 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 432, volatility: 0.21, drift: 0.09, beta: 0.95, liquidity: 1_300_000, sector: 'BigTech', correlation: 0.4 },
  { symbol: 'GOOG', name: 'Alphabet Inc.', basePrice: 175, volatility: 0.24, drift: 0.08, beta: 1.05, liquidity: 1_000_000, sector: 'BigTech', correlation: 0.4 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 185, volatility: 0.3, drift: 0.07, beta: 1.2, liquidity: 1_000_000, sector: 'BigTech', correlation: 0.35 },
  { symbol: 'META', name: 'Meta Platforms', basePrice: 505, volatility: 0.33, drift: 0.1, beta: 1.3, liquidity: 800_000, sector: 'BigTech', correlation: 0.4 },

  // --- Auto / EV (leader: TSLA) ---
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248, volatility: 0.6, drift: 0.1, beta: 1.9, liquidity: 700_000, sector: 'EV', correlation: 0 },
  { symbol: 'RIVN', name: 'Rivian Auto.', basePrice: 12, volatility: 0.8, drift: 0.05, beta: 2.2, liquidity: 150_000, sector: 'EV', correlation: 0.6 },
  { symbol: 'F', name: 'Ford Motor', basePrice: 11, volatility: 0.3, drift: 0.03, beta: 1.2, liquidity: 300_000, sector: 'EV', correlation: 0.35 },
  { symbol: 'GM', name: 'General Motors', basePrice: 48, volatility: 0.32, drift: 0.04, beta: 1.3, liquidity: 300_000, sector: 'EV', correlation: 0.35 },

  // --- Media / streaming (leader: NFLX) ---
  { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 640, volatility: 0.35, drift: 0.09, beta: 1.25, liquidity: 450_000, sector: 'Media', correlation: 0 },
  { symbol: 'DIS', name: 'Walt Disney Co.', basePrice: 102, volatility: 0.28, drift: 0.05, beta: 1.15, liquidity: 400_000, sector: 'Media', correlation: 0.4 },

  // --- Finance (leader: JPM) ---
  { symbol: 'JPM', name: 'JPMorgan Chase', basePrice: 205, volatility: 0.26, drift: 0.06, beta: 1.1, liquidity: 700_000, sector: 'Finance', correlation: 0 },
  { symbol: 'BAC', name: 'Bank of America', basePrice: 40, volatility: 0.3, drift: 0.05, beta: 1.2, liquidity: 500_000, sector: 'Finance', correlation: 0.5 },
  { symbol: 'GS', name: 'Goldman Sachs', basePrice: 460, volatility: 0.3, drift: 0.06, beta: 1.3, liquidity: 400_000, sector: 'Finance', correlation: 0.45 },
  { symbol: 'V', name: 'Visa Inc.', basePrice: 280, volatility: 0.22, drift: 0.07, beta: 0.95, liquidity: 600_000, sector: 'Finance', correlation: 0.35 },

  // --- Consumer (leader: KO) ---
  { symbol: 'KO', name: 'Coca-Cola Co.', basePrice: 62, volatility: 0.16, drift: 0.04, beta: 0.6, liquidity: 600_000, sector: 'Consumer', correlation: 0 },
  { symbol: 'NKE', name: 'Nike Inc.', basePrice: 78, volatility: 0.29, drift: 0.05, beta: 1.0, liquidity: 350_000, sector: 'Consumer', correlation: 0.3 },
  { symbol: 'MCD', name: "McDonald's Corp.", basePrice: 290, volatility: 0.2, drift: 0.05, beta: 0.7, liquidity: 500_000, sector: 'Consumer', correlation: 0.3 },
  { symbol: 'SBUX', name: 'Starbucks Corp.', basePrice: 95, volatility: 0.28, drift: 0.05, beta: 1.0, liquidity: 350_000, sector: 'Consumer', correlation: 0.35 },

  // --- Aerospace (independent) ---
  { symbol: 'BA', name: 'Boeing Co.', basePrice: 180, volatility: 0.42, drift: 0.04, beta: 1.4, liquidity: 300_000, sector: 'Aerospace', correlation: 0 },

  // --- More AI / Big Tech / Media fills ---
  { symbol: 'QCOM', name: 'Qualcomm Inc.', basePrice: 168, volatility: 0.4, drift: 0.08, beta: 1.3, liquidity: 400_000, sector: 'AI', correlation: 0.45 },
  { symbol: 'ORCL', name: 'Oracle Corp.', basePrice: 138, volatility: 0.26, drift: 0.08, beta: 1.0, liquidity: 600_000, sector: 'BigTech', correlation: 0.35 },
  { symbol: 'CRM', name: 'Salesforce Inc.', basePrice: 270, volatility: 0.3, drift: 0.07, beta: 1.2, liquidity: 450_000, sector: 'BigTech', correlation: 0.4 },
  { symbol: 'WBD', name: 'Warner Bros. Disc.', basePrice: 9, volatility: 0.42, drift: 0.03, beta: 1.4, liquidity: 200_000, sector: 'Media', correlation: 0.45 },

  // --- Energy (leader: XOM) ---
  { symbol: 'XOM', name: 'Exxon Mobil', basePrice: 112, volatility: 0.24, drift: 0.05, beta: 0.9, liquidity: 600_000, sector: 'Energy', correlation: 0 },
  { symbol: 'CVX', name: 'Chevron Corp.', basePrice: 158, volatility: 0.24, drift: 0.05, beta: 0.9, liquidity: 500_000, sector: 'Energy', correlation: 0.55 },
  { symbol: 'COP', name: 'ConocoPhillips', basePrice: 108, volatility: 0.3, drift: 0.05, beta: 1.1, liquidity: 350_000, sector: 'Energy', correlation: 0.5 },

  // --- Health (leader: LLY) ---
  { symbol: 'LLY', name: 'Eli Lilly & Co.', basePrice: 880, volatility: 0.3, drift: 0.1, beta: 0.9, liquidity: 500_000, sector: 'Health', correlation: 0 },
  { symbol: 'PFE', name: 'Pfizer Inc.', basePrice: 28, volatility: 0.24, drift: 0.03, beta: 0.7, liquidity: 400_000, sector: 'Health', correlation: 0.4 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', basePrice: 152, volatility: 0.18, drift: 0.04, beta: 0.6, liquidity: 500_000, sector: 'Health', correlation: 0.35 },
  { symbol: 'NVO', name: 'Novo Nordisk', basePrice: 120, volatility: 0.32, drift: 0.09, beta: 0.95, liquidity: 400_000, sector: 'Health', correlation: 0.45 },

  // --- Crypto-exposed (leader: COIN), high volatility ---
  { symbol: 'COIN', name: 'Coinbase Global', basePrice: 240, volatility: 0.75, drift: 0.12, beta: 2.2, liquidity: 250_000, sector: 'Crypto', correlation: 0 },
  { symbol: 'MSTR', name: 'MicroStrategy', basePrice: 165, volatility: 0.85, drift: 0.14, beta: 2.6, liquidity: 200_000, sector: 'Crypto', correlation: 0.65 },
  { symbol: 'MARA', name: 'Marathon Digital', basePrice: 20, volatility: 0.95, drift: 0.1, beta: 2.8, liquidity: 120_000, sector: 'Crypto', correlation: 0.7 },
];

/** The initial current price for an instrument (deterministic from the index). */
export function initialPrice(inst: SeedInstrument, index: number): number {
  const series = simulatePrices(
    { basePrice: inst.basePrice, volatility: inst.volatility, drift: inst.drift, steps: 5 },
    1000 + index,
  );
  return series[series.length - 1]!;
}
