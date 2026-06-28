import { describe, it, expect } from 'vitest';
import {
  maskEmail,
  buildActivityMessage,
  summarizeReactions,
  isAllowedEmoji,
  type ReactionRow,
} from './social.js';

describe('maskEmail', () => {
  it('masks the local part while keeping the domain', () => {
    expect(maskEmail('ana.popescu@test.ro')).toBe('an***@test.ro');
    expect(maskEmail('bo@x.ro')).toBe('bo***@x.ro');
  });

  it('handles short or invalid emails', () => {
    expect(maskEmail('a@b.ro')).toBe('a***@b.ro');
    expect(maskEmail('fara-at')).toBe('***');
  });
});

describe('buildActivityMessage', () => {
  it('formats a buy', () => {
    const msg = buildActivityMessage('TRADE', 'Ana', { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 178.42 });
    expect(msg).toBe('Ana bought 10 AAPL at 178.42');
  });

  it('formats a sell with a fractional quantity', () => {
    const msg = buildActivityMessage('TRADE', 'Bogdan', { symbol: 'TSLA', side: 'SELL', quantity: 2.5, price: 231.06 });
    expect(msg).toBe('Bogdan sold 2.50 TSLA at 231.06');
  });

  it('formats joining a group and badges', () => {
    expect(buildActivityMessage('JOINED_GROUP', 'Cristi', {})).toBe('Cristi joined the group');
    expect(buildActivityMessage('BADGE', 'Dana', { badge: 'Primul trade' })).toContain('Primul trade');
  });
});

describe('summarizeReactions', () => {
  const reactions: ReactionRow[] = [
    { emoji: '🔥', userId: 'u1' },
    { emoji: '🔥', userId: 'u2' },
    { emoji: '👍', userId: 'u3' },
  ];

  it('aggregates by emoji and orders descending', () => {
    const summary = summarizeReactions(reactions, 'u1');
    expect(summary[0]).toEqual({ emoji: '🔥', count: 2, reactedByMe: true });
    expect(summary[1]).toEqual({ emoji: '👍', count: 1, reactedByMe: false });
  });

  it('correctly marks the current user reaction', () => {
    expect(summarizeReactions(reactions, 'u3')[1]).toMatchObject({ emoji: '👍', reactedByMe: true });
  });

  it('empty list => no entries', () => {
    expect(summarizeReactions([], 'u1')).toEqual([]);
  });
});

describe('isAllowedEmoji', () => {
  it('accepts only emoji from the list', () => {
    expect(isAllowedEmoji('🔥')).toBe(true);
    expect(isAllowedEmoji('💩')).toBe(false);
  });
});
