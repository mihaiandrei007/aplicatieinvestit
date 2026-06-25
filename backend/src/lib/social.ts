/**
 * lib/social — logică pură pentru stratul social (feed, reacții, profil).
 *
 * Formatarea mesajelor de activitate, mascarea email-ului (intimitate) și
 * agregarea reacțiilor sunt funcții pure, testate, fără DB.
 */

export type ActivityType = 'TRADE' | 'JOINED_GROUP' | 'BADGE';
export type ActivitySide = 'BUY' | 'SELL';

export interface TradePayload {
  symbol: string;
  side: ActivitySide;
  quantity: number;
  price: number;
}

/**
 * Maschează un email pentru afișare publică în grup:
 * `ana.popescu@test.ro` -> `an***@test.ro`. Păstrează domeniul.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***${domain}`;
}

/** Mesaj RO lizibil pentru un eveniment din feed. */
export function buildActivityMessage(
  type: ActivityType,
  displayName: string,
  payload: Record<string, unknown>,
): string {
  switch (type) {
    case 'TRADE': {
      const p = payload as unknown as TradePayload;
      const verb = p.side === 'BUY' ? 'a cumpărat' : 'a vândut';
      return `${displayName} ${verb} ${formatQty(p.quantity)} ${p.symbol} la ${formatMoney(p.price)}`;
    }
    case 'JOINED_GROUP':
      return `${displayName} s-a alăturat grupului`;
    case 'BADGE':
      return `${displayName} a primit insigna „${String(payload.badge ?? '')}"`;
    default:
      return `${displayName} a făcut o acțiune`;
  }
}

export interface ReactionRow {
  emoji: string;
  userId: string;
}

export interface ReactionSummaryEntry {
  emoji: string;
  count: number;
  /** Dacă utilizatorul curent a reacționat cu acest emoji. */
  reactedByMe: boolean;
}

/** Agregă reacțiile pe emoji, marcând ce a folosit utilizatorul curent. */
export function summarizeReactions(
  reactions: readonly ReactionRow[],
  currentUserId: string,
): ReactionSummaryEntry[] {
  const map = new Map<string, { count: number; reactedByMe: boolean }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { count: 0, reactedByMe: false };
    entry.count += 1;
    if (r.userId === currentUserId) entry.reactedByMe = true;
    map.set(r.emoji, entry);
  }
  return [...map.entries()]
    .map(([emoji, v]) => ({ emoji, ...v }))
    .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}

/** Emoji permise pentru reacții (listă închisă, validabilă). */
export const ALLOWED_EMOJIS = ['👍', '🔥', '😂', '😮', '😢', '🚀'] as const;

export function isAllowedEmoji(emoji: string): boolean {
  return (ALLOWED_EMOJIS as readonly string[]).includes(emoji);
}

function formatQty(qty: number): string {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}
