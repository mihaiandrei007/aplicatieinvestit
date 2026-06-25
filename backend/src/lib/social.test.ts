import { describe, it, expect } from 'vitest';
import {
  maskEmail,
  buildActivityMessage,
  summarizeReactions,
  isAllowedEmoji,
  type ReactionRow,
} from './social.js';

describe('maskEmail', () => {
  it('maschează partea locală păstrând domeniul', () => {
    expect(maskEmail('ana.popescu@test.ro')).toBe('an***@test.ro');
    expect(maskEmail('bo@x.ro')).toBe('bo***@x.ro');
  });

  it('gestionează email-uri scurte sau invalide', () => {
    expect(maskEmail('a@b.ro')).toBe('a***@b.ro');
    expect(maskEmail('fara-at')).toBe('***');
  });
});

describe('buildActivityMessage', () => {
  it('formatează o cumpărare', () => {
    const msg = buildActivityMessage('TRADE', 'Ana', { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 178.42 });
    expect(msg).toBe('Ana a cumpărat 10 AAPL la 178.42');
  });

  it('formatează o vânzare cu cantitate fracționară', () => {
    const msg = buildActivityMessage('TRADE', 'Bogdan', { symbol: 'TSLA', side: 'SELL', quantity: 2.5, price: 231.06 });
    expect(msg).toBe('Bogdan a vândut 2.50 TSLA la 231.06');
  });

  it('formatează alăturarea la grup și insignele', () => {
    expect(buildActivityMessage('JOINED_GROUP', 'Cristi', {})).toBe('Cristi s-a alăturat grupului');
    expect(buildActivityMessage('BADGE', 'Dana', { badge: 'Primul trade' })).toContain('Primul trade');
  });
});

describe('summarizeReactions', () => {
  const reactions: ReactionRow[] = [
    { emoji: '🔥', userId: 'u1' },
    { emoji: '🔥', userId: 'u2' },
    { emoji: '👍', userId: 'u3' },
  ];

  it('agregă pe emoji și ordonează descrescător', () => {
    const summary = summarizeReactions(reactions, 'u1');
    expect(summary[0]).toEqual({ emoji: '🔥', count: 2, reactedByMe: true });
    expect(summary[1]).toEqual({ emoji: '👍', count: 1, reactedByMe: false });
  });

  it('marchează corect reacția utilizatorului curent', () => {
    expect(summarizeReactions(reactions, 'u3')[1]).toMatchObject({ emoji: '👍', reactedByMe: true });
  });

  it('listă goală => fără intrări', () => {
    expect(summarizeReactions([], 'u1')).toEqual([]);
  });
});

describe('isAllowedEmoji', () => {
  it('acceptă doar emoji din listă', () => {
    expect(isAllowedEmoji('🔥')).toBe(true);
    expect(isAllowedEmoji('💩')).toBe(false);
  });
});
