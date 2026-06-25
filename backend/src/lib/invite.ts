/**
 * lib/invite — coduri de invitație pentru grupuri.
 *
 * Normalizarea și validarea sunt pure. Generarea primește o sursă de aleator
 * (rng) ca să rămână testabilă/determinabilă (vezi lib/priceSim.makeRng).
 */

/** Alfabet fără caractere ambigue (fără 0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

/** Aduce un cod la forma canonică: majuscule, fără spații/cratime. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

/** Verifică dacă un cod (după normalizare) respectă formatul. */
export function isValidInviteCode(raw: string): boolean {
  const code = normalizeInviteCode(raw);
  if (code.length !== INVITE_CODE_LENGTH) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}

/**
 * Generează un cod folosind o sursă de aleator `rng` în [0, 1).
 * Determinist pentru un rng determinist — util în teste.
 */
export function generateInviteCode(rng: () => number, length: number = INVITE_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(rng() * ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}
