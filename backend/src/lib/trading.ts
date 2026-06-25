/**
 * lib/trading — reguli pure pentru execuția unei tranzacții.
 *
 * Validează o cerere de cumpărare/vânzare în raport cu numerarul și deținerile
 * curente și întoarce noul sold de numerar + tranzacția de înregistrat.
 * Nu atinge baza de date — ruta o face, după ce validează aici.
 */

import { aggregate, type Trade, type Side, type Holding } from './portfolio.js';

export interface TradeRequest {
  symbol: string;
  side: Side;
  quantity: number;
  /** Preț curent de execuție (din simulator). */
  price: number;
}

export interface TradeResult {
  /** Numerarul rămas după tranzacție. */
  cashAfter: number;
  /** Valoarea brută a tranzacției (quantity * price). */
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
 * Aplică o tranzacție peste starea curentă (numerar + istoric tranzacții).
 * Aruncă `TradeError` la fonduri insuficiente sau vânzare descoperită.
 */
export function executeTrade(
  cash: number,
  history: readonly Trade[],
  request: TradeRequest,
): TradeResult {
  if (!Number.isFinite(request.quantity) || request.quantity <= 0) {
    throw new TradeError('Cantitatea trebuie să fie pozitivă.');
  }
  if (!Number.isFinite(request.price) || request.price <= 0) {
    throw new TradeError('Prețul trebuie să fie pozitiv.');
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
        `Fonduri insuficiente: necesar ${notional.toFixed(2)}, disponibil ${cash.toFixed(2)}.`,
      );
    }
    return { cashAfter: round(cash - notional), notional, trade };
  }

  // SELL: verifică deținerea curentă pentru simbol.
  const held = currentQuantity(history, request.symbol);
  if (request.quantity > held + 1e-9) {
    throw new TradeError(
      `Nu poți vinde ${request.quantity} ${request.symbol}: deții doar ${held}.`,
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
