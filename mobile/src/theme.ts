/** Paletă, spațieri și tipografie — un look modern, prietenos, dark-first. */
export const theme = {
  colors: {
    bg: '#0B1020',
    bgElevated: '#121A2E',
    card: '#16203A',
    cardAlt: '#1E2A47',
    text: '#EAF0FB',
    muted: '#8A97B1',
    primary: '#5B8CFF',
    primaryAlt: '#7C5CFF',
    green: '#2BD67B',
    red: '#FF5C6C',
    gold: '#FFCF5C',
    border: '#26324F',
  },
  spacing: (n: number) => n * 8,
  radius: 18,
  radiusSm: 12,
} as const;

/** Formatează o sumă în „bani virtuali". */
export function formatMoney(value: number): string {
  return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formatează un randament procentual cu semn. */
export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

/** Inițialele pentru avatar (ex. „Ana Popescu" -> „AP"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
