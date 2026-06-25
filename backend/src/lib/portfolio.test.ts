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
  it('returnează stare goală pentru zero tranzacții', () => {
    expect(aggregate([])).toEqual({ holdings: [], realizedPnL: 0 });
  });

  it('calculează cost mediu ponderat la cumpărări succesive', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 200 },
    ];
    const { holdings } = aggregate(trades);
    expect(holdings).toHaveLength(1);
    expect(holdings[0]).toMatchObject({ symbol: 'AAPL', quantity: 20, avgCost: 150 });
  });

  it('păstrează costul mediu și calculează P&L realizat la vânzare', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 4, price: 150 },
    ];
    const { holdings, realizedPnL } = aggregate(trades);
    expect(holdings[0]).toMatchObject({ symbol: 'AAPL', quantity: 6, avgCost: 100 });
    expect(realizedPnL).toBeCloseTo((150 - 100) * 4); // 200
  });

  it('elimină deținerea când e vândută complet', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 10, price: 120 },
    ];
    const { holdings, realizedPnL } = aggregate(trades);
    expect(holdings).toHaveLength(0);
    expect(realizedPnL).toBeCloseTo(200);
  });

  it('aruncă la vânzare peste cantitatea deținută', () => {
    const trades: Trade[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 5, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 6, price: 120 },
    ];
    expect(() => aggregate(trades)).toThrow(/Vânzare invalidă/);
  });

  it('aruncă la cantitate sau preț invalid', () => {
    expect(() => aggregate([{ symbol: 'X', side: 'BUY', quantity: 0, price: 10 }])).toThrow();
    expect(() => aggregate([{ symbol: 'X', side: 'BUY', quantity: 1, price: -5 }])).toThrow();
  });

  it('gestionează simboluri multiple și le sortează', () => {
    const trades: Trade[] = [
      { symbol: 'TSLA', side: 'BUY', quantity: 2, price: 700 },
      { symbol: 'AAPL', side: 'BUY', quantity: 3, price: 100 },
    ];
    const holdings = computeHoldings(trades);
    expect(holdings.map((h) => h.symbol)).toEqual(['AAPL', 'TSLA']);
  });
});

describe('evaluare la prețul pieței', () => {
  const trades: Trade[] = [
    { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
    { symbol: 'TSLA', side: 'BUY', quantity: 2, price: 700 },
  ];

  it('unrealizedPnL reflectă mișcarea prețului', () => {
    const [aapl] = computeHoldings(trades);
    expect(unrealizedPnL(aapl!, 120)).toBeCloseTo((120 - 100) * 10);
  });

  it('holdingsMarketValue însumează valorile', () => {
    const holdings = computeHoldings(trades);
    expect(holdingsMarketValue(holdings, { AAPL: 120, TSLA: 800 })).toBeCloseTo(120 * 10 + 800 * 2);
  });

  it('holdingsMarketValue aruncă dacă lipsește un preț', () => {
    const holdings = computeHoldings(trades);
    expect(() => holdingsMarketValue(holdings, { AAPL: 120 })).toThrow(/Lipsește prețul/);
  });

  it('accountEquity = numerar + valoare dețineri', () => {
    const holdings = computeHoldings(trades);
    const cash = 100000 - (10 * 100 + 2 * 700);
    expect(accountEquity(cash, holdings, { AAPL: 100, TSLA: 700 })).toBeCloseTo(100000);
  });
});
