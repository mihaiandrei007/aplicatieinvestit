/** Paletă și spațieri simple, reutilizate în toate ecranele. */
export const theme = {
  colors: {
    bg: '#0B1220',
    card: '#16203A',
    cardAlt: '#1E2A47',
    text: '#E8EDF6',
    muted: '#94A3B8',
    primary: '#4F8CFF',
    green: '#22C55E',
    red: '#EF4444',
    border: '#26324F',
  },
  spacing: (n: number) => n * 8,
  radius: 14,
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
