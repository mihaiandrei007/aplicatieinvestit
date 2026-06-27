/**
 * Seed: populează instrumentele cu prețuri inițiale deterministe.
 * Rulează cu `npm run db:seed` (necesită DATABASE_URL configurat).
 *
 * `liquidity` controlează cât de greu se mișcă prețul la cerere/ofertă:
 * companiile mari (mega-cap) au lichiditate mare (greu de mișcat).
 */

import { PrismaClient } from '@prisma/client';
import { simulatePrices } from '../src/lib/priceSim.js';

const prisma = new PrismaClient();

const SEED_INSTRUMENTS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 198, volatility: 0.24, drift: 0.08, beta: 1.1, liquidity: 1_200_000 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 432, volatility: 0.21, drift: 0.09, beta: 0.95, liquidity: 1_300_000 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 132, volatility: 0.5, drift: 0.14, beta: 1.7, liquidity: 1_100_000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 185, volatility: 0.3, drift: 0.07, beta: 1.2, liquidity: 1_000_000 },
  { symbol: 'GOOG', name: 'Alphabet Inc.', basePrice: 175, volatility: 0.24, drift: 0.08, beta: 1.05, liquidity: 1_000_000 },
  { symbol: 'META', name: 'Meta Platforms', basePrice: 505, volatility: 0.33, drift: 0.1, beta: 1.3, liquidity: 800_000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248, volatility: 0.6, drift: 0.1, beta: 1.9, liquidity: 700_000 },
  { symbol: 'AMD', name: 'Adv. Micro Devices', basePrice: 158, volatility: 0.52, drift: 0.11, beta: 1.7, liquidity: 500_000 },
  { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 640, volatility: 0.35, drift: 0.09, beta: 1.25, liquidity: 450_000 },
  { symbol: 'INTC', name: 'Intel Corp.', basePrice: 32, volatility: 0.4, drift: 0.03, beta: 1.1, liquidity: 400_000 },
  { symbol: 'DIS', name: 'Walt Disney Co.', basePrice: 102, volatility: 0.28, drift: 0.05, beta: 1.15, liquidity: 400_000 },
  { symbol: 'KO', name: 'Coca-Cola Co.', basePrice: 62, volatility: 0.16, drift: 0.04, beta: 0.6, liquidity: 600_000 },
  { symbol: 'NKE', name: 'Nike Inc.', basePrice: 78, volatility: 0.29, drift: 0.05, beta: 1.0, liquidity: 350_000 },
  { symbol: 'JPM', name: 'JPMorgan Chase', basePrice: 205, volatility: 0.26, drift: 0.06, beta: 1.1, liquidity: 700_000 },
  { symbol: 'BA', name: 'Boeing Co.', basePrice: 180, volatility: 0.42, drift: 0.04, beta: 1.4, liquidity: 300_000 },
  { symbol: 'PLTR', name: 'Palantir Tech.', basePrice: 27, volatility: 0.65, drift: 0.12, beta: 2.0, liquidity: 200_000 },
];

async function main() {
  for (let i = 0; i < SEED_INSTRUMENTS.length; i++) {
    const s = SEED_INSTRUMENTS[i]!;
    const series = simulatePrices(
      { basePrice: s.basePrice, volatility: s.volatility, drift: s.drift, steps: 5 },
      1000 + i,
    );
    const currentPrice = series[series.length - 1]!;
    await prisma.instrument.upsert({
      where: { symbol: s.symbol },
      update: { currentPrice, liquidity: s.liquidity },
      create: { ...s, currentPrice },
    });
    console.log(`  ${s.symbol.padEnd(5)} ${currentPrice}`);
  }
  console.log(`Seed complet — ${SEED_INSTRUMENTS.length} instrumente.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
