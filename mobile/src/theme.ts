/**
 * Temă — direcția „Terminal pro-trader": negru profund, accent lime, cifre mono.
 * Câștigurile se afișează în lime (accentul), pierderile în roșu. Fără emoji.
 */
export const theme = {
  colors: {
    bg: '#0A0B0D',
    surface: '#101317',
    surfaceAlt: '#0D0F12',
    text: '#E8EAED',
    muted: '#6B7178',
    muted2: '#9AA0A6',
    faint: '#565B62',
    lime: '#C8FA4B',
    limeInk: '#0A0B0D',
    red: '#E5484D',
    hair: '#1C1F24',
    border: '#23272D',
    borderHi: '#2A2E34',
  },
  spacing: (n: number) => n * 8,
  radius: 6,
  radiusSm: 4,
} as const;

/** Sumă în format ro-RO (ex. 112.340,50). */
export function formatMoney(value: number): string {
  return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Randament procentual cu semn, format ro-RO (ex. +12,34%). */
export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** Culoarea pentru o valoare: lime pe plus, roșu pe minus. */
export function gainColor(value: number): string {
  return value >= 0 ? theme.colors.lime : theme.colors.red;
}

/** Inițialele pentru monogramă (ex. „Ana Popescu" -> „AP"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
