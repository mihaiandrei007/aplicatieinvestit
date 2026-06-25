import { describe, it, expect } from 'vitest';
import {
  detectOvertakes,
  priceChangePct,
  isPriceJump,
  overtakePush,
  priceJumpPush,
  type RankSnapshot,
} from './notifications.js';

describe('detectOvertakes', () => {
  it('detectează o depășire simplă', () => {
    const prev: RankSnapshot[] = [
      { userId: 'a', displayName: 'Ana', rank: 1 },
      { userId: 'b', displayName: 'Bogdan', rank: 2 },
    ];
    const curr: RankSnapshot[] = [
      { userId: 'b', displayName: 'Bogdan', rank: 1 },
      { userId: 'a', displayName: 'Ana', rank: 2 },
    ];
    const events = detectOvertakes(prev, curr);
    expect(events).toEqual([{ userId: 'a', byUserId: 'b', byDisplayName: 'Bogdan' }]);
  });

  it('nu raportează nimic dacă ordinea nu se schimbă', () => {
    const same: RankSnapshot[] = [
      { userId: 'a', displayName: 'Ana', rank: 1 },
      { userId: 'b', displayName: 'Bogdan', rank: 2 },
    ];
    expect(detectOvertakes(same, same)).toEqual([]);
  });

  it('ignoră utilizatori noi (fără rang anterior)', () => {
    const prev: RankSnapshot[] = [{ userId: 'a', displayName: 'Ana', rank: 1 }];
    const curr: RankSnapshot[] = [
      { userId: 'c', displayName: 'Cristi', rank: 1 },
      { userId: 'a', displayName: 'Ana', rank: 2 },
    ];
    expect(detectOvertakes(prev, curr)).toEqual([]);
  });

  it('gestionează depășiri multiple', () => {
    const prev: RankSnapshot[] = [
      { userId: 'a', displayName: 'A', rank: 1 },
      { userId: 'b', displayName: 'B', rank: 2 },
      { userId: 'c', displayName: 'C', rank: 3 },
    ];
    const curr: RankSnapshot[] = [
      { userId: 'c', displayName: 'C', rank: 1 },
      { userId: 'a', displayName: 'A', rank: 2 },
      { userId: 'b', displayName: 'B', rank: 3 },
    ];
    const events = detectOvertakes(prev, curr);
    // C a depășit pe A și pe B
    expect(events).toContainEqual({ userId: 'a', byUserId: 'c', byDisplayName: 'C' });
    expect(events).toContainEqual({ userId: 'b', byUserId: 'c', byDisplayName: 'C' });
  });
});

describe('variație de preț', () => {
  it('priceChangePct calculează corect', () => {
    expect(priceChangePct(100, 105)).toBeCloseTo(0.05);
    expect(priceChangePct(100, 90)).toBeCloseTo(-0.1);
    expect(priceChangePct(0, 50)).toBe(0);
  });

  it('isPriceJump respectă pragul', () => {
    expect(isPriceJump(100, 105, 0.05)).toBe(true);
    expect(isPriceJump(100, 104, 0.05)).toBe(false);
    expect(isPriceJump(100, 94, 0.05)).toBe(true);
  });
});

describe('payload-uri push', () => {
  it('overtakePush conține numele și grupul', () => {
    const p = overtakePush({ userId: 'a', byUserId: 'b', byDisplayName: 'Bogdan' }, 'Liceu');
    expect(p.body).toContain('Bogdan');
    expect(p.body).toContain('Liceu');
    expect(p.data.type).toBe('OVERTAKE');
  });

  it('priceJumpPush indică direcția și procentul', () => {
    expect(priceJumpPush('AAPL', 100, 110).body).toContain('10.0%');
    expect(priceJumpPush('AAPL', 100, 90).body).toContain('a scăzut');
  });
});
