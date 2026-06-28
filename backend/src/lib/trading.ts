/**
 * lib/trading — pure rules for executing a trade.
 *
 * Validates a buy/sell request against the current cash and holdings and returns
 * the new cash balance + the trade to record.
 * Does not touch the database — the route does that, after validating here.
 */

import { aggregate, type Trade, type Side, type Holding } from './portfolio.js';

export interface TradeRequest {
  symbol: string;
  side: Side;
  quantity: number;
  /** The current execution price (from the simulator). */
  price: number;
}

export interface TradeResult {
  /** The cash remaining after the trade. */
  cashAfter: number;
  /** The gross value of the trade (quantity * price). */
  notional: number;
  trade: Trade;
}

export class TradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradeError';
  }
}

/**
 * Applies a trade on top of the current state (cash + trade history).
 * Throws `TradeError` on insufficient funds or an uncovered (naked) sale.
 */
export function executeTrade(
  cash: number,
  history: readonly Trade[],
  request: TradeRequest,
): TradeResult {
  if (!Number.isFinite(request.quantity) || request.quantity <= 0) {
    throw new TradeError('The quantity must be positive.');
  }
  if (!Number.isFinite(request.price) || request.price <= 0) {
    throw new TradeError('The price must be positive.');
  }

  const notional = request.quantity * request.price;
  const trade: Trade = {
    symbol: request.symbol,
    side: request.side,
    quantity: request.quantity,
    price: request.price,
  };

  if (request.side === 'BUY') {
    if (notional > cash + 1e-9) {
      throw new TradeError(
        `Insufficient funds: required ${notional.toFixed(2)}, available ${cash.toFixed(2)}.`,
      );
    }
    return { cashAfter: round(cash - notional), notional, trade };
  }

  // SELL: check the current holding for the symbol.
  const held = currentQuantity(history, request.symbol);
  if (request.quantity > held + 1e-9) {
    throw new TradeError(
      `You cannot sell ${request.quantity} ${request.symbol}: you only hold ${held}.`,
    );
  }
  return { cashAfter: round(cash + notional), notional, trade };
}

function currentQuantity(history: readonly Trade[], symbol: string): number {
  const holding: Holding | undefined = aggregate(history).holdings.find((h) => h.symbol === symbol);
  return holding?.quantity ?? 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
