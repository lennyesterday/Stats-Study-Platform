// Course-table lookups. Every value here comes from the official course tables
// (src/content/tables.ts), which all use the LEFT-TAIL convention P[X < x] = p.
import { CHI2_TABLE, F_TABLE, T_TABLE, Z_TABLE } from '../content/tables';
import { chi2Inv, fInv, round, tInv } from './stats';

export type Dist = 'z' | 't' | 'chi2' | 'f';

/** P(Z < z) read from the Z table (z rounded to 2 decimals, symmetry for z < 0). */
export function zTable(z: number): number {
  const a = round(Math.abs(z), 2);
  let p: number;
  if (a >= 3.6) p = 0.9998;
  else {
    const row = Math.floor(round(a * 10, 6)) / 10;
    const col = round(a - row, 2);
    const i = Z_TABLE.rows.findIndex((r) => Math.abs(r - row) < 1e-9);
    const j = Z_TABLE.cols.findIndex((c) => Math.abs(c - col) < 1e-9);
    p = Z_TABLE.values[i][j];
  }
  return z < 0 ? round(1 - p, 4) : p;
}

/** Location of a z score in the table (row label + column label). */
export function zCell(z: number) {
  const a = round(Math.abs(z), 2);
  const row = Math.floor(round(a * 10, 6)) / 10;
  return { row, col: round(a - row, 2) };
}

/**
 * z such that P(Z < z) = p, the way students read it from the table:
 * take the closest table value; if p sits exactly halfway between two cells, average (→ 1.645).
 */
export function zFromTable(p: number): number {
  if (p < 0.5) return -zFromTable(round(1 - p, 6));
  let best: { z: number; d: number }[] = [];
  Z_TABLE.values.forEach((row, i) =>
    row.forEach((v, j) => {
      const z = round(Z_TABLE.rows[i] + Z_TABLE.cols[j], 2);
      const d = round(Math.abs(v - p), 6);
      if (!best.length || d < best[0].d) best = [{ z, d }];
      else if (d === best[0].d) best.push({ z, d });
    }),
  );
  const zs = best.map((b) => b.z);
  // ties: average of the neighbouring scores (table rounding plateaus are taken at their first cell)
  if (zs.length === 2 && round(zs[1] - zs[0], 2) === 0.01) return round((zs[0] + zs[1]) / 2, 3);
  return zs[0];
}

const findCol = (probs: readonly number[], p: number) => probs.findIndex((x) => Math.abs(x - p) < 1e-9);

export interface Lookup { value: number; fromTable: boolean; row?: string; col?: string; note?: string }

/** t such that P(T_df < t) = p. Negative p (< 0.5) uses symmetry. */
export function tTable(df: number, p: number): Lookup {
  if (p < 0.5) {
    const r = tTable(df, round(1 - p, 6));
    return { ...r, value: -r.value, note: `By symmetry: t = −(value for P = ${round(1 - p, 4)})` };
  }
  const i = T_TABLE.dfs.findIndex((d) => (d === null ? !isFinite(df) : d === df));
  const j = findCol(T_TABLE.probs, p);
  if (i >= 0 && j >= 0) return { value: T_TABLE.values[i][j], fromTable: true, row: `df = ${isFinite(df) ? df : '∞'}`, col: p.toFixed(3) };
  const below = [...T_TABLE.dfs].filter((d): d is number => d !== null && d < df).pop();
  const above = T_TABLE.dfs.find((d) => d !== null && d > df);
  return {
    value: round(tInv(p, df), 3), fromTable: false, col: p.toFixed(3),
    note: `df = ${df} is not in the course table (closest rows: ${below ?? '—'} and ${above ?? '∞'}). Exact value (Excel T.INV) shown.`,
  };
}

export function chi2Table(df: number, p: number): Lookup {
  const i = CHI2_TABLE.dfs.findIndex((d) => d === df);
  const j = findCol(CHI2_TABLE.probs, p);
  if (i >= 0 && j >= 0) return { value: CHI2_TABLE.values[i][j], fromTable: true, row: `df = ${df}`, col: p.toFixed(3) };
  return { value: round(chi2Inv(p, df), 3), fromTable: false, col: p.toFixed(3), note: `df = ${df} not in the table — exact value (CHISQ.INV) shown.` };
}

/** f such that P(F_{m,n} < f) = p (m = numerator df, n = denominator df). */
export function fTable(m: number, n: number, p: number): Lookup {
  const mi = F_TABLE.ms.findIndex((d) => (d === null ? !isFinite(m) : d === m));
  const ni = F_TABLE.ns.findIndex((d) => (d === null ? !isFinite(n) : d === n));
  const pi = findCol(F_TABLE.probs, p);
  if (mi >= 0 && ni >= 0 && pi >= 0)
    return { value: F_TABLE.values[ni][pi][mi], fromTable: true, row: `n = ${isFinite(n) ? n : '∞'}, p = ${p.toFixed(3)}`, col: `m = ${isFinite(m) ? m : '∞'}` };
  return {
    value: round(fInv(p, m, n), 3), fromTable: false, col: `m = ${m}`,
    note: `F(${m}, ${n}) is not in the course table (denominator df available: 1–10, 12, 15, 20, 30, 60, 120, ∞). Exact value (F.INV) shown.`,
  };
}

/** Which table dfs are available — used by generators to pick "table-friendly" df. */
export const T_DFS = T_TABLE.dfs.filter((d): d is number => d !== null);
export const CHI2_DFS = [...CHI2_TABLE.dfs];
export const F_NS = F_TABLE.ns.filter((d): d is number => d !== null);
export const F_MS = F_TABLE.ms.filter((d): d is number => d !== null);

export interface Bounds { lower: number; upper: number; text: string }

/**
 * Bracket a p-value using one row of the t table. Returns e.g. 0.02 < p < 0.05.
 * tail: 'one' or 'two'.
 */
export function tPBounds(t: number, df: number, tail: 'one' | 'two'): Bounds {
  const i = T_TABLE.dfs.findIndex((d) => d === df);
  const row = T_TABLE.values[i];
  const probs = T_TABLE.probs; // descending .999 … .500
  const a = Math.abs(t);
  const mult = tail === 'two' ? 2 : 1;
  // row values are increasing as probs increase; walk from .500 upward
  let lo = 0.5, hi = 0.5;
  for (let j = probs.length - 1; j >= 0; j--) {
    if (a >= row[j]) { lo = probs[j]; hi = probs[j - 1] ?? 1; }
  }
  const upper = round(mult * (1 - lo), 4);
  const lower = round(mult * (1 - hi), 4);
  const text = lower === 0 ? `p < ${upper}` : `${lower} < p < ${upper}`;
  return { lower, upper, text };
}

export function chi2PBounds(x: number, df: number): Bounds {
  const i = CHI2_TABLE.dfs.findIndex((d) => d === df);
  const row = CHI2_TABLE.values[i];
  const probs = CHI2_TABLE.probs; // ascending
  let lo = 0, hi = probs[0];
  for (let j = 0; j < probs.length; j++) if (x >= row[j]) { lo = probs[j]; hi = probs[j + 1] ?? 1; }
  const upper = round(1 - lo, 4), lower = round(1 - hi, 4);
  return { lower, upper, text: lower === 0 ? `p < ${upper}` : `${lower} < p < ${upper}` };
}

export function fPBounds(f: number, m: number, n: number): Bounds {
  const mi = F_TABLE.ms.findIndex((d) => d === m);
  const ni = F_TABLE.ns.findIndex((d) => d === n);
  const col = F_TABLE.values[ni].map((r) => r[mi]);
  const probs = F_TABLE.probs; // .900 … .995
  let lo = 0, hi = probs[0];
  for (let j = 0; j < probs.length; j++) if (f >= col[j]) { lo = probs[j]; hi = probs[j + 1] ?? 1; }
  const upper = lo === 0 ? 1 : round(1 - lo, 4);
  const lower = round(1 - hi, 4);
  const text = lo === 0 ? `p > ${round(1 - probs[0], 3)}` : lower === 0 ? `p < ${upper}` : `${lower} < p < ${upper}`;
  return { lower, upper, text };
}
