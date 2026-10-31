// Table-trainer tasks: every task names one cell of a course table (both directions: value → cell, cell → value).
import { CHI2_TABLE, F_TABLE, T_TABLE, Z_TABLE } from '../content/tables';
import type { Rng } from './rng';
import type { Dist } from './tables';

export interface TableTask {
  dist: Dist;
  prompt: string; // rich text
  block?: number; // F: index into F_TABLE.ns
  target: number; // the cell value to click
  answerCells: { row: number; col: number }[]; // all cells with the target value
  explain: string;
  curve: { kind: Dist; df1?: number; df2?: number; x: number; shade: 'left' | 'right' };
}

const cellsWith = (values: number[][], v: number) =>
  values.flatMap((row, i) => row.map((x, j) => (x === v ? { row: i, col: j } : null)).filter((c): c is { row: number; col: number } => !!c));

const inf = (v: number | null) => (v === null ? '\\infty' : String(v));

export function zTask(rng: Rng): TableTask {
  const i = rng.int(0, 30), j = rng.int(0, 9);
  const z = Z_TABLE.rows[i] + Z_TABLE.cols[j], v = Z_TABLE.values[i][j];
  const mode = rng.pick(['less', 'greater', 'inverse'] as const);
  const zt = z.toFixed(2);
  const prompt = mode === 'less' ? `Click the cell for $P(Z < ${zt})$.`
    : mode === 'greater' ? `You need $P(Z > ${zt})$. Click the cell you read (you then compute 1 − value).`
    : `Find $z$ with $P(Z < z) = ${v.toFixed(4)}$: click the cell.`;
  const explain = mode === 'inverse'
    ? `${v.toFixed(4)} sits in row ${Z_TABLE.rows[i].toFixed(1)}, column ${Z_TABLE.cols[j].toFixed(2)} → z = ${zt}.`
    : `Row ${Z_TABLE.rows[i].toFixed(1)} + column ${Z_TABLE.cols[j].toFixed(2)} → ${v.toFixed(4)}${mode === 'greater' ? `; P(Z > ${zt}) = 1 − ${v.toFixed(4)} = ${(1 - v).toFixed(4)}` : ''}.`;
  return { dist: 'z', prompt, target: v, answerCells: cellsWith(Z_TABLE.values, v), explain, curve: { kind: 'z', x: z, shade: mode === 'greater' ? 'right' : 'left' } };
}

export function tTask(rng: Rng): TableTask {
  const i = rng.int(0, T_TABLE.dfs.length - 1), j = rng.int(0, T_TABLE.probs.length - 2);
  const df = T_TABLE.dfs[i], p = T_TABLE.probs[j], v = T_TABLE.values[i][j];
  const mode = p >= 0.9 ? rng.pick(['quantile', 'alpha', 'conf'] as const) : 'quantile';
  const prompt = mode === 'quantile' ? `Click $t_{${p};\\,${inf(df)}}$ (P(T < t) = ${p}, df = ${inf(df)}).`
    : mode === 'alpha' ? `Right-tailed test, $\\alpha = ${+(1 - p).toFixed(3)}$, df = ${inf(df)}: click the critical value.`
    : `Two-sided ${Math.round((2 * p - 1) * 1000) / 10} % confidence interval, df = ${inf(df)}: click the reliability factor.`;
  return {
    dist: 't', prompt, target: v, answerCells: cellsWith(T_TABLE.values, v).filter((c) => c.row === i),
    explain: `Row df = ${df ?? '∞'}, column ${p.toFixed(3)} → ${v.toFixed(3)}${mode === 'conf' ? ` (two-sided: 1 − α/2 = ${p})` : ''}.`,
    curve: { kind: 't', df1: df ?? 1000, x: v, shade: mode === 'alpha' ? 'right' : 'left' },
  };
}

export function chi2Task(rng: Rng): TableTask {
  const i = rng.int(0, CHI2_TABLE.dfs.length - 1), j = rng.int(3, CHI2_TABLE.probs.length - 1);
  const df = CHI2_TABLE.dfs[i], p = CHI2_TABLE.probs[j], v = CHI2_TABLE.values[i][j];
  const mode = p >= 0.9 ? rng.pick(['quantile', 'alpha'] as const) : 'quantile';
  const prompt = mode === 'quantile' ? `Click $\\chi^2_{${p};\\,${df}}$.` : `χ² test of independence with df = ${df} at $\\alpha = ${+(1 - p).toFixed(3)}$: click the critical value.`;
  return { dist: 'chi2', prompt, target: v, answerCells: cellsWith(CHI2_TABLE.values, v).filter((c) => c.row === i), explain: `Row df = ${df}, column ${p.toFixed(3)} (left tail = 1 − α) → ${v.toFixed(3)}.`, curve: { kind: 'chi2', df1: df, x: v, shade: 'right' } };
}

export function fTask(rng: Rng): TableTask {
  const b = rng.int(0, F_TABLE.ns.length - 2), pi = rng.int(0, F_TABLE.probs.length - 1), mi = rng.int(0, F_TABLE.ms.length - 2);
  const n = F_TABLE.ns[b] as number, m = F_TABLE.ms[mi] as number, p = F_TABLE.probs[pi], v = F_TABLE.values[b][pi][mi];
  const anova = rng.next() < 0.5 && m <= 6;
  const prompt = anova
    ? `One-way ANOVA with k = ${m + 1} groups and n − k = ${n} at $\\alpha = ${+(1 - p).toFixed(3)}$: choose the block and click the critical F.`
    : `Click $F_{${p};\\,${m},\\,${n}}$ (m = ${m} numerator, n = ${n} denominator).`;
  return {
    dist: 'f', block: b, prompt, target: v, answerCells: [{ row: pi, col: mi }],
    explain: `Block n = ${n}, row ${p.toFixed(3)}, column m = ${m} → ${v}${anova ? ` (m = k − 1 = ${m})` : ''}.`,
    curve: { kind: 'f', df1: m, df2: n, x: v, shade: 'right' },
  };
}

export const TASKS: Record<Dist, (rng: Rng) => TableTask> = { z: zTask, t: tTask, chi2: chi2Task, f: fTask };
