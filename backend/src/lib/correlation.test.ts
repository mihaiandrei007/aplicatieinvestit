import { describe, it, expect } from 'vitest';
import { applySectorCorrelation, type CorrMember } from './correlation.js';

const leaders = { AI: 'NVDA' };
const members: CorrMember[] = [
  { symbol: 'NVDA', sector: 'AI', correlation: 0 },
  { symbol: 'AMD', sector: 'AI', correlation: 0.5 },
  { symbol: 'BA', sector: 'Aero', correlation: 0 },
];

describe('applySectorCorrelation', () => {
  it('the leader keeps its own return', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: 0.1, AMD: 0.02, BA: -0.01 }, leaders });
    expect(out.NVDA).toBeCloseTo(0.1);
  });

  it('the follower takes on part of the leader move', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: 0.1, AMD: 0.02, BA: -0.01 }, leaders });
    // AMD = own 0.02 + 0.5 * leader 0.10
    expect(out.AMD).toBeCloseTo(0.07);
  });

  it('when the leader drops, the follower is dragged down', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: -0.08, AMD: 0.01, BA: 0 }, leaders });
    expect(out.AMD).toBeCloseTo(0.01 + 0.5 * -0.08); // -0.03
    expect(out.AMD).toBeLessThan(0);
  });

  it('an instrument with no sector leader stays unchanged', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: 0.1, AMD: 0.02, BA: -0.01 }, leaders });
    expect(out.BA).toBeCloseTo(-0.01);
  });

  it('sector with no correlation (0) => own return', () => {
    const out = applySectorCorrelation({
      members: [{ symbol: 'X', sector: 'AI', correlation: 0 }],
      ownReturn: { X: 0.05, NVDA: 0.2 },
      leaders,
    });
    expect(out.X).toBeCloseTo(0.05);
  });
});
