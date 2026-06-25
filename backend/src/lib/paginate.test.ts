import { describe, it, expect } from 'vitest';
import { paginate, normalizePageParams, toSkipTake, MAX_PAGE_SIZE } from './paginate.js';

const items = Array.from({ length: 45 }, (_, i) => i + 1);

describe('normalizePageParams', () => {
  it('aplică valori implicite', () => {
    expect(normalizePageParams()).toEqual({ page: 1, pageSize: 20 });
  });

  it('forțează page ≥ 1 și pageSize în limite', () => {
    expect(normalizePageParams({ page: 0, pageSize: 0 })).toEqual({ page: 1, pageSize: 1 });
    expect(normalizePageParams({ page: -5, pageSize: 999 })).toEqual({ page: 1, pageSize: MAX_PAGE_SIZE });
  });

  it('trunchiază valorile fracționare', () => {
    expect(normalizePageParams({ page: 2.9, pageSize: 10.7 })).toEqual({ page: 2, pageSize: 10 });
  });
});

describe('paginate', () => {
  it('întoarce prima pagină corect', () => {
    const p = paginate(items, { page: 1, pageSize: 20 });
    expect(p.items).toHaveLength(20);
    expect(p.items[0]).toBe(1);
    expect(p).toMatchObject({ page: 1, total: 45, totalPages: 3, hasNext: true, hasPrev: false });
  });

  it('întoarce ultima pagină parțială', () => {
    const p = paginate(items, { page: 3, pageSize: 20 });
    expect(p.items).toEqual([41, 42, 43, 44, 45]);
    expect(p).toMatchObject({ hasNext: false, hasPrev: true });
  });

  it('o pagină peste limite întoarce listă goală', () => {
    expect(paginate(items, { page: 99, pageSize: 20 }).items).toEqual([]);
  });

  it('listă goală => o pagină, fără elemente', () => {
    expect(paginate([], {})).toMatchObject({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  });
});

describe('toSkipTake', () => {
  it('traduce paginarea în skip/take', () => {
    expect(toSkipTake({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 });
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
  });
});
