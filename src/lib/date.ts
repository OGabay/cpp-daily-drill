/** Local calendar date as YYYY-MM-DD (not UTC — the streak follows the user's own midnight). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The local date key for the calendar day before `d`. DST-safe (uses calendar arithmetic, not -24h). */
export function previousDateKey(d: Date = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12);
  return localDateKey(prev);
}

/** Epoch ms of the next local midnight after `d`. */
export function nextLocalMidnight(d: Date = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
}
