/**
 * lib/portfolio — holdings and P&L derived from the trade history.
 *
 * PURE functions, with no side effects and no dependency on a database or UI.
 * Ported from the "Virtual portfolio" project. Any change here comes with
 * tests (see portfolio.test.ts).
 */

export type Side = 'BUY' | 'SELL';

/** An executed trade, in the minimal form needed for the calculations. */
export interface Trade {
  symbol: string;
  side: Side;
  /** Strictly positive quantity. */
  quantity: number;
  /** Execution price per unit, strictly positive. */
  price: number;
}

/** Current holding for a symbol, with weighted average cost. */
export interface Holding {
  symbol: string;
  quantity: number;
  /** Weighted average cost per unit for the quantity still held. */
  avgCost: number;
}

/** The result of aggregation: holdings + realized P&L from sales. */
export interface PortfolioState {
  holdings: Holding[];
  /** Profit/loss already "closed" through sales. */
  realizedPnL: number;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number (received: ${value}).`);
  }
}

/**
 * Aggregates a list of trades (in chronological order) into current holdings,
 * using weighted average cost. On a sale, realized P&L = (price - avg cost) * quantity.
 *
 * Throws if a sale of more units than are held is attempted.
 */
export function aggregate(trades: readonly Trade[]): PortfolioState {
  const map = new Map<string, Holding>();
  let realizedPnL = 0;

  for (const trade of trades) {
    assertPositive(trade.quantity, 'quantity');
    assertPositive(trade.price, 'price');

    const current = map.get(trade.symbol) ?? { symbol: trade.symbol, quantity: 0, avgCost: 0 };

    if (trade.side === 'BUY') {
      const newQuantity = current.quantity + trade.quantity;
      const newAvgCost =
        (current.quantity * current.avgCost + trade.quantity * trade.price) / newQuantity;
      map.set(trade.symbol, { symbol: trade.symbol, quantity: newQuantity, avgCost: newAvgCost });
    } else {
      if (trade.quantity > current.quantity + 1e-9) {
        throw new Error(
          `Invalid sale for ${trade.symbol}: quantity ${trade.quantity} > held ${current.quantity}.`,
        );
      }
      realizedPnL += (trade.price - current.avgCost) * trade.quantity;
      const remaining = current.quantity - trade.quantity;
      if (remaining <= 1e-9) {
        map.delete(trade.symbol);
      } else {
        map.set(trade.symbol, { symbol: trade.symbol, quantity: remaining, avgCost: current.avgCost });
      }
    }
  }

  const holdings = [...map.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  return { holdings, realizedPnL };
}

/** Convenience: just the current holdings. */
export function computeHoldings(trades: readonly Trade[]): Holding[] {
  return aggregate(trades).holdings;
}

/** The market value of a holding at the current price. */
export function holdingMarketValue(holding: Holding, price: number): number {
  return holding.quantity * price;
}

/** A holding's unrealized P&L: (current price - avg cost) * quantity. */
export function unrealizedPnL(holding: Holding, price: number): number {
  return (price - holding.avgCost) * holding.quantity;
}

/** The sum of the market values of all holdings (requires a price for each symbol). */
export function holdingsMarketValue(holdings: readonly Holding[], prices: Readonly<Record<string, number>>): number {
  return holdings.reduce((sum, h) => {
    const price = prices[h.symbol];
    if (price === undefined) {
      throw new Error(`Missing price for symbol ${h.symbol}.`);
    }
    return sum + holdingMarketValue(h, price);
  }, 0);
}

/**
 * The account's total capital = cash + the market value of the holdings.
 * This is the basis for ROI and the leaderboard.
 */
export function accountEquity(
  cash: number,
  holdings: readonly Holding[],
  prices: Readonly<Record<string, number>>,
): number {
  return cash + holdingsMarketValue(holdings, prices);
}
