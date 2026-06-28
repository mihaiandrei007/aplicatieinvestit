import { describe, it, expect } from 'vitest';
import {
  aggregate,
  computeHoldings,
  unrealizedPnL,
  holdingsMarketValue,
  accountEquity,
  type Trade,
} from './portfolio.js';

describe('aggregate', () => {
  it('returns empty state for zero transactions', () => {
    expect(aggregate([])).toEqual({ holdings: [], realizedPnL: 0 });
  });

  it('computes the weighted average cost over successive buys', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 200 },
    ];
    const { holdings } = aggregate(trades);
    expect(holdings).toHaveLength(1);
    expect(holdings[0]).toMatchObject({ symbol: 'AAPL', quantity: 20, avgCost: 150 });
  });

  it('keeps the average cost and computes realized P&L on sale', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 4, price: 150 },
    ];
    const { holdings, realizedPnL } = aggregate(trades);
    expect(holdings[0]).toMatchObject({ symbol: 'AAPL', quantity: 6, avgCost: 100 });
    expect(realizedPnL).toBeCloseTo((150 - 100) * 4); // 200
  });

  it('removes the holding when it is sold off completely', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 10, price: 120 },
    ];
    const { holdings, realizedPnL } = aggregate(trades);
    expect(holdings).toHaveLength(0);
    expect(realizedPnL).toBeCloseTo(200);
  });

  it('throws when selling more than the held quantity', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 5, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 6, price: 120 },
    ];
    expect(() => aggregate(trades)).toThrow(/Invalid sale/);
  });

  it('throws on invalid quantity or price', () => {
    expect(() => aggregate([{ symbol: 'X', side: 'BUY', quantity: 0, price: 10 }])).toThrow();
    expect(() => aggregate([{ symbol: 'X', side: 'BUY', quantity: 1, price: -5 }])).toThrow();
  });

  it('handles multiple symbols and sorts them', () => {
    const trades: Trade[] = [
      { symbol: 'TSLA', side: 'BUY', quantity: 2, price: 700 },
      { symbol: 'AAPL', side: 'BUY', quantity: 3, price: 100 },
    ];
    const holdings = computeHoldings(trades);
    expect(holdings.map((h) => h.symbol)).toEqual(['AAPL', 'TSLA']);
  });
});

describe('valuation at market price', () => {
  const trades: Trade[] = [
    { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
    { symbol: 'TSLA', side: 'BUY', quantity: 2, price: 700 },
  ];

  it('unrealizedPnL reflects the price move', () => {
    const [aapl] = computeHoldings(trades);
    expect(unrealizedPnL(aapl!, 120)).toBeCloseTo((120 - 100) * 10);
  });

  it('holdingsMarketValue sums the values', () => {
    const holdings = computeHoldings(trades);
    expect(holdingsMarketValue(holdings, { AAPL: 120, TSLA: 800 })).toBeCloseTo(120 * 10 + 800 * 2);
  });

  it('holdingsMarketValue throws if a price is missing', () => {
    const holdings = computeHoldings(trades);
    expect(() => holdingsMarketValue(holdings, { AAPL: 120 })).toThrow(/Missing price/);
  });

  it('accountEquity = cash + holdings value', () => {
    const holdings = computeHoldings(trades);
    const cash = 100000 - (10 * 100 + 2 * 700);
    expect(accountEquity(cash, holdings, { AAPL: 100, TSLA: 700 })).toBeCloseTo(100000);
  });
});
