import type { Rng } from '../../lib/rng';
import { chiSquareIndependence, round } from '../../lib/stats';
import { chi2PBounds, chi2Table } from '../../lib/tables';
import { choice, decision, f, num, readChi2 } from '../helpers';
import type { ExerciseDef, InterpretationTask } from '../types';
import { DATASET_COLUMNS, DATASET_ROWS } from '../dataset';
import { ctOutput } from './examples';

const CONTEXTS = [
  { a: 'Programme', ra: ['Bachelor', 'Master', 'PhD'], b: 'Preferred study place', cb: ['Library', 'Home', 'Café', 'Campus lab'] },
  { a: 'StressLevel', ra: ['Low', 'Medium', 'High'], b: 'Sleep category', cb: ['< 6 h', '6–7 h', '7–8 h', '> 8 h'] },
  { a: 'StudyMethod', ra: ['Solo', 'Group', 'Tutoring', 'Online'], b: 'Grade band', cb: ['A', 'B', 'C', 'Fail'] },
  { a: 'Gender', ra: ['Female', 'Male'], b: 'PartTimeJob', cb: ['No', 'Yes'] },
  { a: 'Year', ra: ['1st', '2nd', '3rd'], b: 'Coffee per day', cb: ['0', '1–2', '3+'] },
];

/** random table with all expected counts ≥ 5 (unless allowSmall); dependence controlled by `assoc` */
function randomTable(rng: Rng, r: number, c: number, allowSmall = false) {
  for (;;) {
    const assoc = rng.float(0, 0.9, 2);
    const obs = Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => Math.max(0, Math.round(rng.int(8, 30) * (1 + assoc * Math.cos((i + 1) * (j + 1) + rng.next()))))));
    const res = chiSquareIndependence(obs);
    if (res.rowTotals.some((t) => t === 0) || res.colTotals.some((t) => t === 0)) continue;
    if (allowSmall || Math.min(...res.expected.flat()) >= 5) return { obs, res };
  }
}

function pickContext(rng: Rng) {
  const ctx = rng.pick(CONTEXTS);
  const r = ctx.ra.length === 2 ? 2 : rng.pick([2, ctx.ra.length]);
  const c = ctx.cb.length === 2 ? 2 : rng.pick([2, 3, ctx.cb.length]);
  return { ctx, ra: ctx.ra.slice(0, r), cb: ctx.cb.slice(0, c), r, c };
}

export const exercises: ExerciseDef[] = [
  {
    id: 'w5-df', title: 'Degrees of freedom & critical value', topic: 'chisq', difficulty: 1,
    generate: (rng) => {
      const r = rng.int(2, 5), c = rng.int(2, 5), alpha = rng.pick([0.05, 0.05, 0.1, 0.01]);
      const df = (r - 1) * (c - 1), p = round(1 - alpha, 3);
      return {
        prompt: `A contingency table has **${r} rows** and **${c} columns**. Give the degrees of freedom of the χ² test of independence and the critical value at α = ${alpha}.`,
        inputs: [num('df', 'df', df, 0, 0), num('c', 'Critical value', chi2Table(df, p).value, 3, 0)],
        hints: ['df = (r − 1)(c − 1)', `Course table is left-tail → column ${p}.`],
        solution: [`df = (${r} − 1)(${c} − 1) = **${df}**`, readChi2(df, p).text],
      };
    },
  },
  {
    id: 'w5-expected', title: 'Expected count of one cell', topic: 'chisq', difficulty: 1,
    generate: (rng) => {
      const { ctx, ra, cb } = pickContext(rng);
      const { obs, res } = randomTable(rng, ra.length, cb.length);
      const i = rng.int(0, ra.length - 1), j = rng.int(0, cb.length - 1);
      return {
        prompt: `${ctx.a} × ${ctx.b}. Under independence, what is the expected count of the cell **${ra[i]} / ${cb[j]}** (2 decimals)?`,
        output: ctOutput('Observed counts', ctx.a, ra, cb, obs),
        inputs: [num('e', 'Expected count', res.expected[i][j], 2, 0.01)],
        hints: ['E = row total × column total / n'],
        solution: [`$E = ${res.rowTotals[i]} \\times ${res.colTotals[j]} / ${res.n} = ${f(res.expected[i][j], 2)}$`],
      };
    },
  },
  {
    id: 'w5-conditional', title: 'Conditional relative frequencies', topic: 'chisq', difficulty: 1,
    generate: (rng) => {
      const { ctx, ra, cb } = pickContext(rng);
      const { obs, res } = randomTable(rng, ra.length, cb.length);
      const i = rng.int(0, ra.length - 1), j = rng.int(0, cb.length - 1);
      return {
        prompt: `${ctx.a} × ${ctx.b}. Compute (a) the joint relative frequency of **${ra[i]} and ${cb[j]}**, (b) the share of **${cb[j]}** among **${ra[i]}** (row %), (c) the share of **${ra[i]}** among **${cb[j]}** (column %). 4 decimals.`,
        output: ctOutput('Observed counts', ctx.a, ra, cb, obs),
        inputs: [num('a', '(a) joint', obs[i][j] / res.n, 4, 0.0001), num('b', '(b) row conditional', obs[i][j] / res.rowTotals[i], 4, 0.0001), num('c', '(c) column conditional', obs[i][j] / res.colTotals[j], 4, 0.0001)],
        hints: ['Joint: cell / n', 'Row conditional: cell / row total', 'Column conditional: cell / column total'],
        solution: [`(a) ${obs[i][j]}/${res.n} = **${f(obs[i][j] / res.n, 4)}**`, `(b) ${obs[i][j]}/${res.rowTotals[i]} = **${f(obs[i][j] / res.rowTotals[i], 4)}**`, `(c) ${obs[i][j]}/${res.colTotals[j]} = **${f(obs[i][j] / res.colTotals[j], 4)}**`],
      };
    },
  },
  {
    id: 'w5-22', title: 'Full χ² test on a 2×2 table', topic: 'chisq', difficulty: 2, decision: true,
    generate: (rng) => {
      const ctx = CONTEXTS[3];
      const { obs, res } = randomTable(rng, 2, 2);
      const crit = 3.841;
      return {
        prompt: `Is ${ctx.a} associated with ${ctx.b}? Test at α = 0.05: compute χ² (3 decimals) and decide.`,
        output: ctOutput('Observed counts', ctx.a, ctx.ra, ctx.cb, obs),
        inputs: [num('x', 'χ²', res.chi2, 3, 0.005), num('c', 'Critical value', crit, 3, 0), decision(res.chi2 > crit)],
        hints: ['Compute all 4 expected counts first.', 'Sum (O − E)²/E over the 4 cells.', 'df = 1'],
        solution: [`Expected: ${res.expected.map((r) => r.map((e) => f(e, 2)).join(', ')).join(' | ')}`, `Contributions: ${res.contributions.flat().map((v) => f(v, 3)).join(' + ')} = **${f(res.chi2, 3)}**`, readChi2(1, 0.95).text, `${f(res.chi2, 3)} ${res.chi2 > crit ? '>' : '≤'} 3.841 → **${res.chi2 > crit ? 'reject H₀: the variables are associated' : 'do not reject H₀: no sufficient evidence of an association'}**`],
      };
    },
  },
  {
    id: 'w5-rc', title: 'Full χ² test on an r × c table', topic: 'chisq', difficulty: 3, decision: true,
    generate: (rng) => {
      const ctx = rng.pick(CONTEXTS.filter((c) => c.ra.length > 2));
      const r = ctx.ra.length, c = rng.pick([3, ctx.cb.length]);
      const cb = ctx.cb.slice(0, c);
      const { obs, res } = randomTable(rng, r, c);
      const alpha = rng.pick([0.05, 0.01, 0.1]), crit = chi2Table(res.df, round(1 - alpha, 3)).value;
      return {
        prompt: `${ctx.a} × ${ctx.b} for a random sample of ${res.n} students. Test independence at α = ${alpha}.`,
        output: ctOutput('Observed counts', ctx.a, ctx.ra, cb, obs),
        inputs: [num('df', 'df', res.df, 0, 0), num('x', 'χ² (3 dec.)', res.chi2, 3, 0.01), num('c', 'Critical value', crit, 3, 0), decision(res.chi2 > crit)],
        hints: ['E = row × column / n for every cell', 'χ² = Σ (O − E)²/E', `df = (${r} − 1)(${c} − 1)`, `Column ${round(1 - alpha, 3)} of the χ² table`],
        solution: [`Expected counts: ${res.expected.map((row) => row.map((e) => f(e, 2)).join(', ')).join(' | ')} (all ≥ 5 ✓)`, `χ² = **${f(res.chi2, 3)}**, df = ${res.df}`, readChi2(res.df, round(1 - alpha, 3)).text, `→ **${res.chi2 > crit ? 'reject H₀' : 'do not reject H₀'}** (p = ${f(res.pValue, 4)})`],
      };
    },
  },
  {
    id: 'w5-contrib', title: 'Which cell drives χ²?', topic: 'chisq', difficulty: 2,
    generate: (rng) => {
      const { ctx, ra, cb } = pickContext(rng);
      const { obs, res } = randomTable(rng, ra.length, cb.length);
      const flat = res.contributions.flat(), max = Math.max(...flat), idx = flat.indexOf(max);
      const labels = ra.flatMap((r) => cb.map((c) => `${r} / ${c}`));
      const i = Math.floor(idx / cb.length), j = idx % cb.length;
      return {
        prompt: `${ctx.a} × ${ctx.b}. Which cell contributes most to χ²? Give its contribution (3 decimals).`,
        output: ctOutput('Observed (expected)', ctx.a, ra, cb, obs, true),
        inputs: [choice('cell', 'Cell', labels, idx), num('v', 'Contribution', max, 3, 0.003)],
        hints: ['Contribution = (O − E)²/E', 'Look for the cell where O and E differ most relative to E.'],
        solution: [`All contributions: ${labels.map((l, k) => `${l}: ${f(flat[k], 3)}`).join(' · ')}`, `Largest: **${labels[idx]}** with $(${obs[i][j]} - ${f(res.expected[i][j], 2)})^2/${f(res.expected[i][j], 2)} = ${f(max, 3)}$ — ${obs[i][j] > res.expected[i][j] ? 'more' : 'fewer'} observations than expected under independence.`],
      };
    },
  },
  {
    id: 'w5-condition', title: 'Is the χ² test valid?', topic: 'chisq', difficulty: 2,
    generate: (rng) => {
      const { ctx, ra, cb } = pickContext(rng);
      let t = randomTable(rng, ra.length, cb.length, true);
      if (rng.next() < 0.5) {
        // shrink one row to create small expected counts
        const obs = t.obs.map((row, i) => (i === 0 ? row.map((v) => Math.max(1, Math.round(v / 4))) : row));
        t = { obs, res: chiSquareIndependence(obs) };
      }
      const minE = Math.min(...t.res.expected.flat());
      return {
        prompt: `${ctx.a} × ${ctx.b}. Find the smallest expected count (2 decimals) and decide whether the χ² approximation can be used.`,
        output: ctOutput('Observed counts', ctx.a, ra, cb, t.obs),
        inputs: [num('m', 'Smallest expected count', minE, 2, 0.01), choice('v', 'Valid?', ['Yes — all expected counts ≥ 5', 'No — merge categories or collect more data'], minE >= 5 ? 0 : 1)],
        hints: ['The smallest expected count sits at the smallest row total × smallest column total.'],
        solution: [`Smallest E = (smallest row total × smallest column total)/n = ${f(minE, 2)}`, minE >= 5 ? 'All expected counts ≥ 5 → the test is valid.' : 'Below 5 → the χ² approximation is unreliable; merge categories or use more data.'],
      };
    },
  },
  {
    id: 'w5-pbounds', title: 'Bracket the p-value with the χ² table', topic: 'chisq', difficulty: 3,
    generate: (rng) => {
      const df = rng.int(1, 8);
      const x = round(rng.float(chi2Table(df, 0.5).value, chi2Table(df, 0.995).value * 1.1, 2), 2);
      const b = chi2PBounds(x, df);
      return {
        prompt: `A χ² test of independence gives **χ² = ${f(x, 2)}** with **df = ${df}**. Using the chi-square table, give lower and upper bounds of the p-value (lower = 0 if p is below the smallest tabulated tail).`,
        inputs: [num('lo', 'Lower bound', b.lower, 3, 0), num('hi', 'Upper bound', b.upper, 3, 0)],
        hints: [`Row df = ${df}: find the two columns that bracket ${f(x, 2)}.`, 'p = 1 − column header.'],
        solution: [`Row ${df} of the table: ${[0.9, 0.95, 0.975, 0.99, 0.995].map((p) => `${p}: ${chi2Table(df, p).value}`).join(' · ')}`, `→ **${b.text}**`],
      };
    },
  },
  {
    id: 'w5-cramer', title: "Strength: Cramér's V", topic: 'chisq', difficulty: 2,
    generate: (rng) => {
      const r = rng.int(2, 4), c = rng.int(2, 4), n = rng.pick([60, 100, 150, 200, 400]);
      const x = rng.float(2, 40, 2), V = Math.sqrt(x / (n * (Math.min(r, c) - 1)));
      return {
        prompt: `An ${r} × ${c} table with n = ${n} gives χ² = ${x}. Compute Cramér's V (3 decimals).`,
        inputs: [num('v', "Cramér's V", V, 3, 0.002)],
        hints: ['V = √(χ² / (n · (min(r, c) − 1)))'],
        solution: [`min(r, c) − 1 = ${Math.min(r, c) - 1}`, `$V = \\sqrt{${x}/(${n}\\cdot${Math.min(r, c) - 1})} = ${f(V, 3)}$`],
      };
    },
  },
  {
    id: 'w5-dataset', title: 'Contingency tests on the dataset', topic: 'chisq', difficulty: 2,
    generate: (rng) => {
      const variants = [
        { a: 'PartTimeJob', ra: ['No', 'Yes'], b: 'PassFail', cb: ['Pass', 'Fail'] },
        { a: 'StressLevel', ra: ['Low', 'Medium', 'High'], b: 'PartTimeJob', cb: ['No', 'Yes'] },
        { a: 'Gender', ra: ['Female', 'Male'], b: 'PartTimeJob', cb: ['No', 'Yes'] },
      ] as const;
      const v = rng.pick(variants);
      const A = [...v.ra], B = [...v.cb];
      // dataset counts (Non-binary excluded for Gender)
      const obs = A.map((r) => B.map((c) => DATA.filter((d) => d[v.a] === r && d[v.b] === c).length));
      const res = chiSquareIndependence(obs);
      const crit = chi2Table(res.df, 0.95).value;
      return {
        prompt: `Dataset: is **${v.a}** associated with **${v.b}**? Compute χ² (3 decimals) and decide at α = 0.05.${v.a === 'Gender' ? ' (The single non-binary student is excluded.)' : ''}`,
        output: ctOutput('Observed counts (dataset)', v.a, A, B, obs),
        inputs: [num('x', 'χ²', res.chi2, 3, 0.01), decision(res.chi2 > crit)],
        hints: ['E = row × column / n', `df = ${res.df}`],
        solution: [`Expected: ${res.expected.map((r) => r.map((e) => f(e, 2)).join(', ')).join(' | ')}`, `χ² = **${f(res.chi2, 3)}**, df ${res.df}; ${readChi2(res.df, 0.95).text}`, `→ **${res.chi2 > crit ? 'reject H₀ — associated' : 'do not reject H₀ — no evidence of association'}** (p = ${f(res.pValue, 4)})`],
      };
    },
  },
];

const DATA = DATASET_ROWS.map((r) => Object.fromEntries(DATASET_COLUMNS.map((c, i) => [c, r[i]])) as Record<string, string | number>);

export const interpretations: InterpretationTask[] = [
  {
    id: 'w5-int-job', topic: 'chisq', title: 'Write the χ² conclusion',
    prompt: 'PartTimeJob × PassFail (dataset): χ² = 18.86, df = 1, p < 0.001. Fail rates: 0 % (no job) vs 44 % (job). Write a conclusion for the student newspaper.',
    model: 'Since χ² = 18.86 exceeds the critical value 3.841 (p < 0.001), we reject H₀ of independence. At the 5 % level, there is sufficient evidence that having a part-time job and passing the course are associated: 44 % of working students failed, compared with none of the non-working students. This is an association, not proof that jobs cause failure — working students also report more stress and less study time.',
    checklist: ['Compares χ² with the critical value or p with α', 'Says "associated / not independent"', 'Uses conditional percentages to describe the direction', 'No causal claim; mentions a possible confounder'],
  },
  {
    id: 'w5-int-invalid', topic: 'chisq', title: 'Report a questionable test',
    prompt: 'StudyMethod × PassFail: χ² = 5.26, df = 3, p = 0.154, but all four expected Fail counts are between 2.4 and 3.1. Write an honest conclusion.',
    model: 'Since p = 0.154 > 0.05, we do not reject H₀: there is no sufficient evidence of an association between study method and passing. However, all expected counts in the Fail column are below 5, so the χ² approximation is unreliable; categories should be merged (e.g. Tutoring vs. others) or more data collected before drawing firm conclusions.',
    checklist: ['Correct decision ("do not reject")', 'Mentions the expected-count condition', 'Proposes a remedy', 'No claim that the variables are independent'],
  },
];
