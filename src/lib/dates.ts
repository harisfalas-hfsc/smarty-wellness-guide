/**
 * Calendar-date helpers. Calendar dates (YYYY-MM-DD) are always the user's
 * LOCAL date; timestamps are stored in UTC (timestamptz) by the database.
 */
export function localDateKey(date: Date = new Date(), timeZone?: string | null): string {
  if (timeZone) {
    try {
      // en-CA formats as YYYY-MM-DD
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch {
      /* invalid zone: fall through to device local date */
    }
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
