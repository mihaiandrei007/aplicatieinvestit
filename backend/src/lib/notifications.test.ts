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
  it('detects a simple overtake', () => {
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

  it('reports nothing if the order does not change', () => {
    const same: RankSnapshot[] = [
      { userId: 'a', displayName: 'Ana', rank: 1 },
      { userId: 'b', displayName: 'Bogdan', rank: 2 },
    ];
    expect(detectOvertakes(same, same)).toEqual([]);
  });

  it('ignores new users (with no previous rank)', () => {
    const prev: RankSnapshot[] = [{ userId: 'a', displayName: 'Ana', rank: 1 }];
    const curr: RankSnapshot[] = [
      { userId: 'c', displayName: 'Cristi', rank: 1 },
      { userId: 'a', displayName: 'Ana', rank: 2 },
    ];
    expect(detectOvertakes(prev, curr)).toEqual([]);
  });

  it('handles multiple overtakes', () => {
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
    // C overtook A and B
    expect(events).toContainEqual({ userId: 'a', byUserId: 'c', byDisplayName: 'C' });
    expect(events).toContainEqual({ userId: 'b', byUserId: 'c', byDisplayName: 'C' });
  });
});

describe('price variation', () => {
  it('priceChangePct computes correctly', () => {
    expect(priceChangePct(100, 105)).toBeCloseTo(0.05);
    expect(priceChangePct(100, 90)).toBeCloseTo(-0.1);
    expect(priceChangePct(0, 50)).toBe(0);
  });

  it('isPriceJump respects the threshold', () => {
    expect(isPriceJump(100, 105, 0.05)).toBe(true);
    expect(isPriceJump(100, 104, 0.05)).toBe(false);
    expect(isPriceJump(100, 94, 0.05)).toBe(true);
  });
});

describe('push payloads', () => {
  it('overtakePush contains the name and the group', () => {
    const p = overtakePush({ userId: 'a', byUserId: 'b', byDisplayName: 'Bogdan' }, 'Liceu');
    expect(p.body).toContain('Bogdan');
    expect(p.body).toContain('Liceu');
    expect(p.data.type).toBe('OVERTAKE');
  });

  it('priceJumpPush indicates the direction and the percentage', () => {
    expect(priceJumpPush('AAPL', 100, 110).body).toContain('10.0%');
    expect(priceJumpPush('AAPL', 100, 90).body).toContain('is down');
  });
});
