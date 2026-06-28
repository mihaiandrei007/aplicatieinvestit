import { describe, it, expect } from 'vitest';
import { maybeGenerateNews, buildCtx, NEWS_TEMPLATES, type Instrumentish } from './news.js';
import { makeRng } from './priceSim.js';

const instruments: Instrumentish[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
];

describe('buildCtx', () => {
  it('produces realistic specifics and is deterministic', () => {
    const a = buildCtx(makeRng(3));
    const b = buildCtx(makeRng(3));
    expect(a).toEqual(b);
    expect(a.quarter).toMatch(/^T[1-4]$/);
    expect(a.money).toMatch(/\$.* bn/);
    expect(a.target).toBeGreaterThanOrEqual(50);
  });
});

describe('NEWS_TEMPLATES', () => {
  it('have valid polarity, positive magnitude, headline + body with the company name', () => {
    const ctx = buildCtx(makeRng(1));
    for (const t of NEWS_TEMPLATES) {
      expect([1, -1]).toContain(t.polarity);
      expect(t.magnitude).toBeGreaterThan(0);
      expect(t.headline('Apple', ctx).length).toBeGreaterThan(10);
      // the company name appears in the body (the macro headline is at the sector level)
      expect(t.body('Apple', ctx)).toContain('Apple');
      expect(t.body('Apple', ctx).length).toBeGreaterThan(40);
    }
  });

  it('covers multiple categories (variety)', () => {
    const cats = new Set(NEWS_TEMPLATES.map((t) => t.category));
    expect(cats.size).toBeGreaterThanOrEqual(8);
  });
});

describe('maybeGenerateNews', () => {
  it('is deterministic for the same seed', () => {
    expect(maybeGenerateNews(makeRng(5), instruments, 1)).toEqual(maybeGenerateNews(makeRng(5), instruments, 1));
  });

  it('with probability 1 generates a complete news item', () => {
    const news = maybeGenerateNews(makeRng(9), instruments, 1);
    expect(news).not.toBeNull();
    expect(['AAPL', 'TSLA']).toContain(news!.symbol);
    expect(news!.headline.length).toBeGreaterThan(10);
    expect(news!.body.length).toBeGreaterThan(40);
    expect(news!.source.length).toBeGreaterThan(2);
    expect(Math.abs(news!.impact)).toBeGreaterThan(0);
  });

  it('with probability 0 never generates', () => {
    expect(maybeGenerateNews(makeRng(1), instruments, 0)).toBeNull();
  });

  it('empty list => null', () => {
    expect(maybeGenerateNews(makeRng(1), [], 1)).toBeNull();
  });

  it('produces both positive and negative impact across multiple seeds', () => {
    const impacts = Array.from({ length: 40 }, (_, i) => maybeGenerateNews(makeRng(i + 1), instruments, 1)?.impact ?? 0);
    expect(impacts.some((x) => x > 0)).toBe(true);
    expect(impacts.some((x) => x < 0)).toBe(true);
  });
});
