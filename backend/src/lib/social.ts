/**
 * lib/social — pure logic for the social layer (feed, reactions, profile).
 *
 * Formatting activity messages, masking the email (privacy) and
 * aggregating reactions are pure, tested functions, without a DB.
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
 * Masks an email for public display in a group:
 * `ana.popescu@test.ro` -> `an***@test.ro`. Keeps the domain.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***${domain}`;
}

/** Readable EN message for a feed event. */
export function buildActivityMessage(
  type: ActivityType,
  displayName: string,
  payload: Record<string, unknown>,
): string {
  switch (type) {
    case 'TRADE': {
      const p = payload as unknown as TradePayload;
      const verb = p.side === 'BUY' ? 'bought' : 'sold';
      return `${displayName} ${verb} ${formatQty(p.quantity)} ${p.symbol} at ${formatMoney(p.price)}`;
    }
    case 'JOINED_GROUP':
      return `${displayName} joined the group`;
    case 'BADGE':
      return `${displayName} earned the "${String(payload.badge ?? '')}" badge`;
    default:
      return `${displayName} did something`;
  }
}

export interface ReactionRow {
  emoji: string;
  userId: string;
}

export interface ReactionSummaryEntry {
  emoji: string;
  count: number;
  /** Whether the current user reacted with this emoji. */
  reactedByMe: boolean;
}

/** Aggregates reactions by emoji, marking which ones the current user used. */
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

/** Emojis allowed for reactions (a closed, validatable list). */
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
