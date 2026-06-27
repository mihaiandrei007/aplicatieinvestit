import { describe, it, expect } from 'vitest';
import { maybeGenerateNews, NEWS_TEMPLATES, type Instrumentish } from './news.js';
import { makeRng } from './priceSim.js';

const instruments: Instrumentish[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
];

describe('NEWS_TEMPLATES', () => {
  it('au polaritate validă și magnitudine pozitivă', () => {
    for (const t of NEWS_TEMPLATES) {
      expect([1, -1]).toContain(t.polarity);
      expect(t.magnitude).toBeGreaterThan(0);
      expect(t.headline('X')).toContain('X');
    }
  });
});

describe('maybeGenerateNews', () => {
  it('e determinist pentru același seed', () => {
    expect(maybeGenerateNews(makeRng(5), instruments, 1)).toEqual(maybeGenerateNews(makeRng(5), instruments, 1));
  });

  it('cu probabilitate 1 generează mereu o știre validă', () => {
    const news = maybeGenerateNews(makeRng(9), instruments, 1);
    expect(news).not.toBeNull();
    expect(['AAPL', 'TSLA']).toContain(news!.symbol);
    expect(news!.headline.length).toBeGreaterThan(5);
    expect(Math.abs(news!.impact)).toBeGreaterThan(0);
  });

  it('cu probabilitate 0 nu generează niciodată', () => {
    expect(maybeGenerateNews(makeRng(1), instruments, 0)).toBeNull();
  });

  it('listă goală de instrumente => null', () => {
    expect(maybeGenerateNews(makeRng(1), [], 1)).toBeNull();
  });

  it('impactul are semnul polarității șablonului', () => {
    // rulează mai multe seed-uri și verifică că apar și impact pozitiv și negativ
    const impacts = Array.from({ length: 30 }, (_, i) => maybeGenerateNews(makeRng(i + 1), instruments, 1)?.impact ?? 0);
    expect(impacts.some((x) => x > 0)).toBe(true);
    expect(impacts.some((x) => x < 0)).toBe(true);
  });
});
