// Helpers shared by content files: formatting, input builders, dataset access, table read-outs.
import { fmt, round } from '../lib/stats';
import { chi2Table, fTable, tTable, zFromTable, zTable } from '../lib/tables';
import { DATASET_COLUMNS, DATASET_ROWS } from './dataset';
import type { ChoiceInput, NumberInput, SoftwareOutput } from './types';

export const f = fmt;
export { round };

export const num = (id: string, label: string, answer: number, decimals: number, tol?: number): NumberInput => ({
  id, label, answer: round(answer, decimals), decimals, tol,
});

export const choice = (id: string, label: string, options: string[], answer: number): ChoiceInput => ({ id, label, kind: 'choice', options, answer });

export const DECISION = ['Reject H₀', 'Do not reject H₀'];
export const decision = (reject: boolean, id = 'decision'): ChoiceInput => choice(id, 'Decision at the given α', DECISION, reject ? 0 : 1);

export type ColumnName = (typeof DATASET_COLUMNS)[number];
export const column = (name: ColumnName) => DATASET_ROWS.map((r) => r[DATASET_COLUMNS.indexOf(name)]);
export const numColumn = (name: ColumnName) => column(name) as number[];

/** Readable description of a table read-out, e.g. for solutions. */
export function readT(df: number, p: number) {
  const l = tTable(df, p);
  return { value: l.value, text: l.fromTable ? `t-Student table, row **${l.row}**, column **${l.col}** → **${f(l.value, 3)}**` : `${l.note} → **${f(l.value, 3)}**` };
}
export function readChi2(df: number, p: number) {
  const l = chi2Table(df, p);
  return { value: l.value, text: l.fromTable ? `Chi-square table, row **${l.row}**, column **${l.col}** → **${f(l.value, 3)}**` : `${l.note} → **${f(l.value, 3)}**` };
}
export function readF(m: number, n: number, p: number) {
  const l = fTable(m, n, p);
  return { value: l.value, text: l.fromTable ? `F-Snedecor table, block **n = ${n}** (denominator df), row **${p.toFixed(3)}**, column **m = ${m}** (numerator df) → **${l.value}**` : `${l.note} → **${l.value}**` };
}
export function readZ(p: number) {
  const z = zFromTable(p);
  const pp = p < 0.5 ? round(1 - p, 4) : p;
  return { value: z, text: `Look for **${pp}** inside the Z table${p < 0.5 ? ` (use symmetry: P(Z < z) = ${p} ⇒ z is negative)` : ''} → **z = ${z}**` };
}
export function readZp(z: number) {
  const zz = round(Math.abs(z), 2);
  const row = Math.floor(round(zz * 10, 6)) / 10;
  return { value: zTable(z), text: `Z table, row **${row.toFixed(1)}**, column **${round(zz - row, 2).toFixed(2)}** → P(Z < ${zz.toFixed(2)}) = **${zTable(zz).toFixed(4)}**${z < 0 ? `; by symmetry P(Z < ${z.toFixed(2)}) = 1 − ${zTable(zz).toFixed(4)} = **${zTable(z).toFixed(4)}**` : ''}` };
}

export const tableOutput = (title: string, header: string[], rows: (string | number)[][]): SoftwareOutput => ({ title, rows: [header, ...rows.map((r) => r.map(String))] });

export const sign = (x: number) => (x < 0 ? '−' : '+');
export const abs = Math.abs;
