/**
 * lib/notifications — pure logic for triggering notifications.
 *
 * Detects notable events (someone overtook you, a stock jumped) and builds
 * notification payloads. No DB, no actual sending.
 */

export interface RankSnapshot {
  userId: string;
  displayName: string;
  rank: number;
}

export interface OvertakeEvent {
  /** Who was overtaken (receives the notification). */
  userId: string;
  /** Who overtook them. */
  byUserId: string;
  byDisplayName: string;
}

/**
 * Compares two leaderboards and returns the new overtakes: pairs (A overtaken by B)
 * where A was above B before, and now B is above A.
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
      // Before, A was above B (lower rank), now B is above A.
      if (prevA < prevB && a.rank > b.rank) {
        const byUser = currByUser.get(b.userId)!;
        events.push({ userId: a.userId, byUserId: b.userId, byDisplayName: byUser.displayName });
      }
    }
  }
  return events;
}

/** The percentage change in price between two values. */
export function priceChangePct(prev: number, next: number): number {
  if (prev <= 0) return 0;
  return (next - prev) / prev;
}

/** True if the absolute change exceeds the threshold (e.g. 0.05 = ±5%). */
export function isPriceJump(prev: number, next: number, threshold = 0.05): boolean {
  return Math.abs(priceChangePct(prev, next)) >= threshold;
}

export interface PushPayload {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

/** Builds the payload for a leaderboard overtake. */
export function overtakePush(event: OvertakeEvent, groupName: string): PushPayload {
  return {
    title: 'You have been overtaken!',
    body: `${event.byDisplayName} overtook you in "${groupName}".`,
    data: { type: 'OVERTAKE', byUserId: event.byUserId },
  };
}

/** Builds the payload for a price jump. */
export function priceJumpPush(symbol: string, prev: number, next: number): PushPayload {
  const pct = priceChangePct(prev, next);
  const dir = pct >= 0 ? 'is up' : 'is down';
  return {
    title: `${symbol} ${dir}`,
    body: `${symbol} ${dir} ${(Math.abs(pct) * 100).toFixed(1)}% (${prev.toFixed(2)} → ${next.toFixed(2)}).`,
    data: { type: 'PRICE_JUMP', symbol, changePct: pct },
  };
}
