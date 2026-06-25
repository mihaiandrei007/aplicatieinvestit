import { describe, it, expect } from 'vitest';
import { executeTrade, TradeError } from './trading.js';
import type { Trade } from './portfolio.js';

describe('executeTrade — BUY', () => {
  it('scade numerarul cu valoarea tranzacției', () => {
    const r = executeTrade(100000, [], { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 });
    expect(r.cashAfter).toBe(100000 - 1500);
    expect(r.notional).toBe(1500);
    expect(r.trade).toMatchObject({ symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 });
  });

  it('aruncă la fonduri insuficiente', () => {
    expect(() => executeTrade(100, [], { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 })).toThrow(
      TradeError,
    );
  });

  it('permite cheltuirea exactă a numerarului', () => {
    const r = executeTrade(1500, [], { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 });
    expect(r.cashAfter).toBe(0);
  });
});

describe('executeTrade — SELL', () => {
  const history: Trade[] = [{ symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 }];

  it('adaugă numerar la vânzarea unei dețineri existente', () => {
    const r = executeTrade(99000, history, { symbol: 'AAPL', side: 'SELL', quantity: 5, price: 120 });
    expect(r.cashAfter).toBe(99000 + 600);
  });

  it('aruncă la vânzare descoperită (mai mult decât deții)', () => {
    expect(() =>
      executeTrade(99000, history, { symbol: 'AAPL', side: 'SELL', quantity: 11, price: 120 }),
    ).toThrow(/deții doar/);
  });

  it('aruncă la vânzarea unui simbol nedeținut', () => {
    expect(() =>
      executeTrade(99000, history, { symbol: 'TSLA', side: 'SELL', quantity: 1, price: 120 }),
    ).toThrow(TradeError);
  });
});

describe('executeTrade — validări', () => {
  it('respinge cantitate sau preț nepozitiv', () => {
    expect(() => executeTrade(100, [], { symbol: 'X', side: 'BUY', quantity: 0, price: 1 })).toThrow();
    expect(() => executeTrade(100, [], { symbol: 'X', side: 'BUY', quantity: 1, price: 0 })).toThrow();
  });
});
