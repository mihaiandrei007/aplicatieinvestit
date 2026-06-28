/**
 * lib/invite — invite codes for groups.
 *
 * Normalization and validation are pure. Generation takes a source of randomness
 * (rng) so it stays testable/deterministic (see lib/priceSim.makeRng).
 */

/** Alphabet without ambiguous characters (no 0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

/** Brings a code to its canonical form: uppercase, no spaces/hyphens. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

/** Checks whether a code (after normalization) matches the format. */
export function isValidInviteCode(raw: string): boolean {
  const code = normalizeInviteCode(raw);
  if (code.length !== INVITE_CODE_LENGTH) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}

/**
 * Generates a code using a source of randomness `rng` in [0, 1).
 * Deterministic for a deterministic rng — useful in tests.
 */
export function generateInviteCode(rng: () => number, length: number = INVITE_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(rng() * ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}
