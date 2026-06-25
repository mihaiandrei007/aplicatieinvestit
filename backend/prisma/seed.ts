/**
 * Seed: populează câteva instrumente cu prețuri inițiale deterministe.
 * Rulează cu `npm run db:seed` (necesită DATABASE_URL configurat).
 */

import { PrismaClient } from '@prisma/client';
import { simulatePrices } from '../src/lib/priceSim.js';

const prisma = new PrismaClient();

const SEED_INSTRUMENTS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 180, volatility: 0.25, drift: 0.08, beta: 1.1 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 420, volatility: 0.22, drift: 0.09, beta: 0.95 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 250, volatility: 0.55, drift: 0.1, beta: 1.8 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 185, volatility: 0.3, drift: 0.07, beta: 1.2 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 120, volatility: 0.5, drift: 0.12, beta: 1.7 },
  { symbol: 'GOOG', name: 'Alphabet Inc.', basePrice: 175, volatility: 0.24, drift: 0.08, beta: 1.05 },
];

async function main() {
  for (let i = 0; i < SEED_INSTRUMENTS.length; i++) {
    const s = SEED_INSTRUMENTS[i]!;
    // Avansează prețul cu câțiva pași folosind simulatorul determinist.
    const series = simulatePrices(
      { basePrice: s.basePrice, volatility: s.volatility, drift: s.drift, steps: 5 },
      1000 + i,
    );
    const currentPrice = series[series.length - 1]!;

    await prisma.instrument.upsert({
      where: { symbol: s.symbol },
      update: { currentPrice },
      create: { ...s, currentPrice },
    });
    console.log(`  ${s.symbol}: ${currentPrice}`);
  }
  console.log('Seed complet.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
