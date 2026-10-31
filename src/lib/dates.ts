// Local-date helpers. Dates are 'YYYY-MM-DD' strings in the user's local time zone.

export const EXAM_START = new Date('2026-12-09T14:30:00Z'); // 14:30 Europe/Lisbon (WET = UTC+0 in December)
export const PLAN_START = '2026-10-28';
export const PLAN_END = '2026-12-09';

export function toKey(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(k: string, n: number): string {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);
}

export function rangeKeys(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

/** Monday of the ISO week containing k. */
export function weekStart(k: string): string {
  const d = fromKey(k);
  const dow = (d.getDay() + 6) % 7;
  return addDays(k, -dow);
}

export const weekday = (k: string) => fromKey(k).getDay(); // 0 = Sunday

export function prettyDate(k: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return fromKey(k).toLocaleDateString('en-GB', opts);
}
