/**
 * Seed: populează instrumentele (din src/data/instruments).
 * Rulează cu `npm run db:seed`. La deploy, serverul se auto-populează la pornire.
 */

import { PrismaClient } from '@prisma/client';
import { SEED_INSTRUMENTS, initialPrice } from '../src/data/instruments.js';

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < SEED_INSTRUMENTS.length; i++) {
    const s = SEED_INSTRUMENTS[i]!;
    const currentPrice = initialPrice(s, i);
    await prisma.instrument.upsert({
      where: { symbol: s.symbol },
      update: { currentPrice, liquidity: s.liquidity, sector: s.sector, correlation: s.correlation },
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
