/** Pure calculations for daily habit totals (unit-tested). */
export function sumBy<T>(rows: T[], date: string, dateOf: (r: T) => string, value: (r: T) => number): number {
  return rows.reduce((acc, r) => (dateOf(r) === date ? acc + Number(value(r)) : acc), 0);
}

/** Progress percentage, capped at 100; null when no target is set. */
export function progressPct(total: number, target: number | null | undefined): number | null {
  if (!target || target <= 0) return null;
  return Math.min(100, Math.round((total / target) * 100));
}

/** Monday-start week containing `date` (YYYY-MM-DD), as local date keys. */
export function weekDates(date: string): string[] {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const base = new Date(y, m - 1, d);
  const offset = (base.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(y, m - 1, d - offset + i);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  });
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const x = new Date(y, m - 1, d + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

/** Last `n` local dates ending today, newest first. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}
