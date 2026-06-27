import { describe, it, expect } from 'vitest';
import { applySectorCorrelation, type CorrMember } from './correlation.js';

const leaders = { AI: 'NVDA' };
const members: CorrMember[] = [
  { symbol: 'NVDA', sector: 'AI', correlation: 0 },
  { symbol: 'AMD', sector: 'AI', correlation: 0.5 },
  { symbol: 'BA', sector: 'Aero', correlation: 0 },
];

describe('applySectorCorrelation', () => {
  it('liderul rămâne cu randamentul propriu', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: 0.1, AMD: 0.02, BA: -0.01 }, leaders });
    expect(out.NVDA).toBeCloseTo(0.1);
  });

  it('urmăritorul preia o parte din mișcarea liderului', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: 0.1, AMD: 0.02, BA: -0.01 }, leaders });
    // AMD = own 0.02 + 0.5 * lider 0.10
    expect(out.AMD).toBeCloseTo(0.07);
  });

  it('când liderul scade, urmăritorul e tras în jos', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: -0.08, AMD: 0.01, BA: 0 }, leaders });
    expect(out.AMD).toBeCloseTo(0.01 + 0.5 * -0.08); // -0.03
    expect(out.AMD).toBeLessThan(0);
  });

  it('instrument fără lider de sector rămâne neschimbat', () => {
    const out = applySectorCorrelation({ members, ownReturn: { NVDA: 0.1, AMD: 0.02, BA: -0.01 }, leaders });
    expect(out.BA).toBeCloseTo(-0.01);
  });

  it('sector fără corelație (0) => randament propriu', () => {
    const out = applySectorCorrelation({
      members: [{ symbol: 'X', sector: 'AI', correlation: 0 }],
      ownReturn: { X: 0.05, NVDA: 0.2 },
      leaders,
    });
    expect(out.X).toBeCloseTo(0.05);
  });
});
