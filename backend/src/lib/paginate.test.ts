import { describe, it, expect } from 'vitest';
import { paginate, normalizePageParams, toSkipTake, MAX_PAGE_SIZE } from './paginate.js';

const items = Array.from({ length: 45 }, (_, i) => i + 1);

describe('normalizePageParams', () => {
  it('applies default values', () => {
    expect(normalizePageParams()).toEqual({ page: 1, pageSize: 20 });
  });

  it('forces page ≥ 1 and pageSize within limits', () => {
    expect(normalizePageParams({ page: 0, pageSize: 0 })).toEqual({ page: 1, pageSize: 1 });
    expect(normalizePageParams({ page: -5, pageSize: 999 })).toEqual({ page: 1, pageSize: MAX_PAGE_SIZE });
  });

  it('truncates fractional values', () => {
    expect(normalizePageParams({ page: 2.9, pageSize: 10.7 })).toEqual({ page: 2, pageSize: 10 });
  });
});

describe('paginate', () => {
  it('returns the first page correctly', () => {
    const p = paginate(items, { page: 1, pageSize: 20 });
    expect(p.items).toHaveLength(20);
    expect(p.items[0]).toBe(1);
    expect(p).toMatchObject({ page: 1, total: 45, totalPages: 3, hasNext: true, hasPrev: false });
  });

  it('returns the last partial page', () => {
    const p = paginate(items, { page: 3, pageSize: 20 });
    expect(p.items).toEqual([41, 42, 43, 44, 45]);
    expect(p).toMatchObject({ hasNext: false, hasPrev: true });
  });

  it('a page beyond the limits returns an empty list', () => {
    expect(paginate(items, { page: 99, pageSize: 20 }).items).toEqual([]);
  });

  it('empty list => one page, no items', () => {
    expect(paginate([], {})).toMatchObject({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  });
});

describe('toSkipTake', () => {
  it('translates pagination into skip/take', () => {
    expect(toSkipTake({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 });
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
  });
});
