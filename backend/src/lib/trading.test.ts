import { describe, it, expect } from 'vitest';
import { executeTrade, TradeError } from './trading.js';
import type { Trade } from './portfolio.js';

describe('executeTrade — BUY', () => {
  it('decreases cash by the transaction value', () => {
    const r = executeTrade(100000, [], { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 });
    expect(r.cashAfter).toBe(100000 - 1500);
    expect(r.notional).toBe(1500);
    expect(r.trade).toMatchObject({ symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 });
  });

  it('throws on insufficient funds', () => {
    expect(() => executeTrade(100, [], { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 })).toThrow(
      TradeError,
    );
  });

  it('allows spending the cash exactly', () => {
    const r = executeTrade(1500, [], { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 150 });
    expect(r.cashAfter).toBe(0);
  });
});

describe('executeTrade — SELL', () => {
  const history: Trade[] = [{ symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 }];

  it('adds cash when selling an existing holding', () => {
    const r = executeTrade(99000, history, { symbol: 'AAPL', side: 'SELL', quantity: 5, price: 120 });
    expect(r.cashAfter).toBe(99000 + 600);
  });

  it('throws on a short sale (more than you hold)', () => {
    expect(() =>
      executeTrade(99000, history, { symbol: 'AAPL', side: 'SELL', quantity: 11, price: 120 }),
    ).toThrow(/only hold/);
  });

  it('throws when selling a symbol not held', () => {
    expect(() =>
      executeTrade(99000, history, { symbol: 'TSLA', side: 'SELL', quantity: 1, price: 120 }),
    ).toThrow(TradeError);
  });
});

describe('executeTrade — validations', () => {
  it('rejects non-positive quantity or price', () => {
    expect(() => executeTrade(100, [], { symbol: 'X', side: 'BUY', quantity: 0, price: 1 })).toThrow();
    expect(() => executeTrade(100, [], { symbol: 'X', side: 'BUY', quantity: 1, price: 0 })).toThrow();
  });
});
