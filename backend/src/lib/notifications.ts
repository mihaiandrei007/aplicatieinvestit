/**
 * lib/notifications — logică pură pentru declanșarea notificărilor.
 *
 * Detectează evenimente notabile (te-a depășit cineva, o acțiune a sărit) și
 * construiește payload-uri de notificare. Fără DB, fără trimitere efectivă.
 */

export interface RankSnapshot {
  userId: string;
  displayName: string;
  rank: number;
}

export interface OvertakeEvent {
  /** Cine a fost depășit (primește notificarea). */
  userId: string;
  /** Cine l-a depășit. */
  byUserId: string;
  byDisplayName: string;
}

/**
 * Compară două clasamente și întoarce depășirile noi: perechi (A depășit de B)
 * unde înainte A era peste B, iar acum B e peste A.
 */
export function detectOvertakes(
  previous: readonly RankSnapshot[],
  current: readonly RankSnapshot[],
): OvertakeEvent[] {
  const prevRank = new Map(previous.map((r) => [r.userId, r.rank]));
  const currByUser = new Map(current.map((r) => [r.userId, r]));
  const events: OvertakeEvent[] = [];

  for (const a of current) {
    const prevA = prevRank.get(a.userId);
    if (prevA === undefined) continue;
    for (const b of current) {
      if (a.userId === b.userId) continue;
      const prevB = prevRank.get(b.userId);
      if (prevB === undefined) continue;
      // Înainte A era peste B (rang mai mic), acum B e peste A.
      if (prevA < prevB && a.rank > b.rank) {
        const byUser = currByUser.get(b.userId)!;
        events.push({ userId: a.userId, byUserId: b.userId, byDisplayName: byUser.displayName });
      }
    }
  }
  return events;
}

/** Variația procentuală a prețului între două valori. */
export function priceChangePct(prev: number, next: number): number {
  if (prev <= 0) return 0;
  return (next - prev) / prev;
}

/** True dacă variația absolută depășește pragul (ex. 0.05 = ±5%). */
export function isPriceJump(prev: number, next: number, threshold = 0.05): boolean {
  return Math.abs(priceChangePct(prev, next)) >= threshold;
}

export interface PushPayload {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

/** Construiește payload-ul pentru o depășire în clasament. */
export function overtakePush(event: OvertakeEvent, groupName: string): PushPayload {
  return {
    title: 'Ai fost depășit!',
    body: `${event.byDisplayName} te-a depășit în „${groupName}".`,
    data: { type: 'OVERTAKE', byUserId: event.byUserId },
  };
}

/** Construiește payload-ul pentru un salt de preț. */
export function priceJumpPush(symbol: string, prev: number, next: number): PushPayload {
  const pct = priceChangePct(prev, next);
  const dir = pct >= 0 ? 'a urcat' : 'a scăzut';
  return {
    title: `${symbol} ${dir}`,
    body: `${symbol} ${dir} cu ${(Math.abs(pct) * 100).toFixed(1)}% (${prev.toFixed(2)} → ${next.toFixed(2)}).`,
    data: { type: 'PRICE_JUMP', symbol, changePct: pct },
  };
}
