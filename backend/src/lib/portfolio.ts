/**
 * lib/portfolio — dețineri și P&L derivate din istoricul tranzacțiilor.
 *
 * Funcții PURE, fără efecte secundare și fără dependență de bază de date sau UI.
 * Portate din proiectul „Portofoliu Virtual". Orice modificare aici e însoțită
 * de teste (vezi portfolio.test.ts).
 */

export type Side = 'BUY' | 'SELL';

/** O tranzacție executată, în forma minimă necesară calculelor. */
export interface Trade {
  symbol: string;
  side: Side;
  /** Cantitate strict pozitivă. */
  quantity: number;
  /** Preț de execuție per unitate, strict pozitiv. */
  price: number;
}

/** Deținere curentă pentru un simbol, cu cost mediu ponderat. */
export interface Holding {
  symbol: string;
  quantity: number;
  /** Cost mediu ponderat per unitate pentru cantitatea încă deținută. */
  avgCost: number;
}

/** Rezultatul agregării: dețineri + P&L realizat din vânzări. */
export interface PortfolioState {
  holdings: Holding[];
  /** Profit/pierdere deja „închis" prin vânzări. */
  realizedPnL: number;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} trebuie să fie un număr finit pozitiv (primit: ${value}).`);
  }
}

/**
 * Agregă o listă de tranzacții (în ordine cronologică) în dețineri curente,
 * folosind cost mediu ponderat. La vânzare, P&L realizat = (preț - cost mediu) * cantitate.
 *
 * Aruncă dacă se încearcă vânzarea mai multor unități decât sunt deținute.
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
          `Vânzare invalidă pentru ${trade.symbol}: cantitate ${trade.quantity} > deținut ${current.quantity}.`,
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

/** Convenabil: doar deținerile curente. */
export function computeHoldings(trades: readonly Trade[]): Holding[] {
  return aggregate(trades).holdings;
}

/** Valoarea de piață a unei dețineri la prețul curent. */
export function holdingMarketValue(holding: Holding, price: number): number {
  return holding.quantity * price;
}

/** P&L nerealizat al unei dețineri: (preț curent - cost mediu) * cantitate. */
export function unrealizedPnL(holding: Holding, price: number): number {
  return (price - holding.avgCost) * holding.quantity;
}

/** Suma valorilor de piață ale tuturor deținerilor (necesită preț pentru fiecare simbol). */
export function holdingsMarketValue(holdings: readonly Holding[], prices: Readonly<Record<string, number>>): number {
  return holdings.reduce((sum, h) => {
    const price = prices[h.symbol];
    if (price === undefined) {
      throw new Error(`Lipsește prețul pentru simbolul ${h.symbol}.`);
    }
    return sum + holdingMarketValue(h, price);
  }, 0);
}

/**
 * Capitalul total al contului = numerar + valoarea de piață a deținerilor.
 * Aceasta e baza pentru ROI și clasament.
 */
export function accountEquity(
  cash: number,
  holdings: readonly Holding[],
  prices: Readonly<Record<string, number>>,
): number {
  return cash + holdingsMarketValue(holdings, prices);
}
