/**
 * Theme — the "pro-trader terminal" direction: deep black, lime accent, mono digits.
 * Gains are shown in lime (the accent), losses in red. No emoji.
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

/** Amount in ro-RO format (e.g. 112.340,50). */
export function formatMoney(value: number): string {
  return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Signed percentage return, ro-RO format (e.g. +12,34%). */
export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** Color for a value: lime when positive, red when negative. */
export function gainColor(value: number): string {
  return value >= 0 ? theme.colors.lime : theme.colors.red;
}

/** Initials for the monogram (e.g. "Ana Popescu" -> "AP"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
