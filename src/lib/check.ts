// Answer checking for numeric inputs, Moodle-style.
import { round } from './stats';

export const parseNumber = (raw: string) => {
  const s = raw.trim().replace(/−/g, '-').replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
};

export const decimalsOf = (raw: string) => {
  const s = raw.trim().replace(',', '.');
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

export type CheckResult = { ok: boolean; reason?: 'empty' | 'format' | 'decimals' | 'value' };

/**
 * tol = accepted absolute deviation after rounding (default: 1 unit in the last requested decimal,
 * which forgives different but legitimate intermediate rounding).
 * strict = Moodle mode: the answer must have exactly `decimals` decimal digits.
 */
export function checkNumber(raw: string, answer: number, decimals: number, tol?: number, strict = false): CheckResult {
  if (!raw.trim()) return { ok: false, reason: 'empty' };
  const v = parseNumber(raw);
  if (Number.isNaN(v)) return { ok: false, reason: 'format' };
  const t = tol ?? 10 ** -decimals;
  const close = Math.abs(round(v, decimals) - answer) <= t + 1e-9;
  if (!close) return { ok: false, reason: 'value' };
  if (strict && decimalsOf(raw) !== decimals) return { ok: false, reason: 'decimals' };
  return { ok: true };
}
