/** Inițializare la pornire: populează instrumentele dacă baza e goală (idempotent). */

import { prisma } from './db.js';
import { SEED_INSTRUMENTS, initialPrice } from './data/instruments.js';

export async function ensureInstruments(): Promise<void> {
  const count = await prisma.instrument.count();
  if (count > 0) return;
  for (let i = 0; i < SEED_INSTRUMENTS.length; i++) {
    const s = SEED_INSTRUMENTS[i]!;
    await prisma.instrument.create({ data: { ...s, currentPrice: initialPrice(s, i) } });
  }
  console.log(`Bootstrap: ${SEED_INSTRUMENTS.length} instrumente create.`);
}
