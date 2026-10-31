import type { Rng } from '../../lib/rng';
import { anovaFromRaw, anovaFromSummaries, mean, round, sd, type AnovaResult } from '../../lib/stats';
import { fPBounds, fTable } from '../../lib/tables';
import { choice, decision, f, num, readF } from '../helpers';
import type { ExerciseDef, InterpretationTask, SoftwareOutput } from '../types';

/** total sample sizes n with n − k in the F table (blocks 1–10, 12, 15, 20, 30, 60, 120) */
const DFW = [9, 10, 12, 15, 20, 30, 60];
const FACTORS = [
  { y: 'GPA (0–20)', factor: 'study method', groups: ['Solo', 'Group', 'Hybrid', 'Tutoring'], base: 14, spread: 2.2 },
  { y: 'weekly study hours', factor: 'stress level', groups: ['Low', 'Medium', 'High', 'Very high'], base: 9, spread: 3 },
  { y: 'sleep per night (h)', factor: 'year of study', groups: ['1st year', '2nd year', '3rd year', 'Master'], base: 7, spread: 0.8 },
  { y: 'FinalGrade', factor: 'part-time job status', groups: ['None', '< 10 h', '10–20 h', '> 20 h'], base: 65, spread: 12 },
];

function setup(rng: Rng) {
  const k = rng.pick([3, 3, 4]);
  const dfw = rng.pick(DFW.filter((d) => d >= k * 2));
  return { k, dfw, n: dfw + k, ctx: rng.pick(FACTORS) };
}

export function anovaOutput(a: AnovaResult, p = true): SoftwareOutput {
  return {
    title: 'ANOVA — Single Factor (Excel)',
    rows: [
      ['Source of Variation', 'SS', 'df', 'MS', 'F', ...(p ? ['P-value'] : [])],
      ['Between Groups', f(a.ssb, 2), String(a.dfb), f(a.msb, 3), f(a.F, 3), ...(p ? [f(a.pValue, 4)] : [])],
      ['Within Groups', f(a.ssw, 2), String(a.dfw), f(a.msw, 3), '', ...(p ? [''] : [])],
      ['Total', f(a.sst, 2), String(a.dft), '', '', ...(p ? [''] : [])],
    ],
  };
}

/** group summaries for k groups with total df_W chosen from the table */
function summaries(rng: Rng, k: number, n: number, base: number, spread: number) {
  const sizes = Array.from({ length: k }, () => Math.floor(n / k));
  for (let i = 0; i < n - sizes.reduce((a, b) => a + b, 0); i++) sizes[i]++;
  const effect = rng.float(0.2, 1.1, 2);
  return sizes.map((nj) => ({ n: nj, mean: round(base + rng.float(-effect, effect, 2) * spread, 2), sd: round(spread * rng.float(0.75, 1.25, 2), 2) }));
}

export const exercises: ExerciseDef[] = [
  {
    id: 'w4-df', title: 'Degrees of freedom of an ANOVA', topic: 'anova', difficulty: 1,
    generate: (rng) => {
      const k = rng.int(3, 6), n = rng.int(18, 90);
      return {
        prompt: `A one-way ANOVA compares **k = ${k}** groups with a total of **n = ${n}** students. Give df between, df within and df total.`,
        inputs: [num('b', 'df between', k - 1, 0, 0), num('w', 'df within', n - k, 0, 0), num('t', 'df total', n - 1, 0, 0)],
        hints: ['Between: k − 1', 'Within: n − k', 'Total: n − 1 = sum of the two'],
        solution: [`$df_B = ${k} - 1 = ${k - 1}$`, `$df_W = ${n} - ${k} = ${n - k}$`, `$df_T = ${n} - 1 = ${n - 1}$ (check: ${k - 1} + ${n - k} = ${n - 1} ✓)`],
      };
    },
  },
  {
    id: 'w4-complete', title: 'Complete the ANOVA table from SSB and SSW', topic: 'anova', difficulty: 1,
    generate: (rng) => {
      const { k, n, ctx } = setup(rng);
      const ssw = round(rng.float(2, 6, 1) * ctx.spread ** 2 * (n - k) / 4, 1);
      const ssb = round(ssw * rng.float(0.05, 0.9, 2), 1);
      const msb = ssb / (k - 1), msw = ssw / (n - k), F = msb / msw;
      return {
        prompt: `${ctx.y} by ${ctx.factor}: k = ${k} groups, n = ${n} students, **SSB = ${ssb}**, **SSW = ${ssw}**. Compute SST, MSB, MSW (3 decimals) and F (3 decimals).`,
        inputs: [num('sst', 'SST', ssb + ssw, 1, 0.05), num('msb', 'MSB', msb, 3, 0.002), num('msw', 'MSW', msw, 3, 0.002), num('F', 'F', F, 3, 0.003)],
        hints: ['SST = SSB + SSW', `MSB = SSB/(k − 1) = SSB/${k - 1}`, `MSW = SSW/(n − k) = SSW/${n - k}`, 'F = MSB/MSW'],
        solution: [`SST = ${ssb} + ${ssw} = ${f(ssb + ssw, 1)}`, `MSB = ${ssb}/${k - 1} = **${f(msb, 3)}**`, `MSW = ${ssw}/${n - k} = **${f(msw, 3)}**`, `F = ${f(msb, 3)}/${f(msw, 3)} = **${f(F, 3)}**`],
      };
    },
  },
  {
    id: 'w4-fcrit', title: 'Critical value from the F table', topic: 'anova', difficulty: 1,
    generate: (rng) => {
      const { k, n } = setup(rng);
      const alpha = rng.pick([0.05, 0.05, 0.1, 0.01]);
      const r = readF(k - 1, n - k, round(1 - alpha, 3));
      return {
        prompt: `ANOVA with **k = ${k}** groups and **n = ${n}** observations at **α = ${alpha}**. Find the critical value of F (as printed in the course table).`,
        inputs: [num('c', 'Critical F', r.value, 2, 0.006)],
        hints: [`Numerator df m = k − 1 = ${k - 1} (column), denominator df n = n − k = ${n - k} (block).`, `Row: 1 − α = ${round(1 - alpha, 3)}.`],
        solution: [`df = (${k - 1}, ${n - k})`, r.text],
      };
    },
  },
  {
    id: 'w4-decide', title: 'F test decision', topic: 'anova', difficulty: 2, decision: true,
    generate: (rng) => {
      const { k, n, ctx } = setup(rng);
      const alpha = rng.pick([0.05, 0.1, 0.01]);
      const crit = fTable(k - 1, n - k, round(1 - alpha, 3)).value;
      const F = round(crit * rng.float(0.4, 2.2, 2), 2);
      return {
        prompt: `Testing whether mean ${ctx.y} differs by ${ctx.factor} (k = ${k}, n = ${n}) gives **F = ${f(F, 2)}**. Decide at α = ${alpha}.`,
        inputs: [num('c', 'Critical F', crit, 2, 0.006), decision(F > crit)],
        hints: [`df (${k - 1}, ${n - k}); row ${round(1 - alpha, 3)}.`, 'Right-tailed: reject if F > critical value.'],
        solution: [readF(k - 1, n - k, round(1 - alpha, 3)).text, `${f(F, 2)} ${F > crit ? '>' : '≤'} ${crit} → **${F > crit ? 'reject H₀' : 'do not reject H₀'}**: ${F > crit ? 'at least one group mean differs' : 'no sufficient evidence that the group means differ'} (α = ${alpha}).`],
      };
    },
  },
  {
    id: 'w4-fill', title: 'Fill the missing cells of an ANOVA table', topic: 'anova', difficulty: 2,
    generate: (rng) => {
      const { k, n } = setup(rng);
      const msw = rng.float(4, 30, 1), F = rng.float(0.8, 6, 2);
      const msb = round(msw * F, 2), ssb = round(msb * (k - 1), 2), ssw = round(msw * (n - k), 2);
      const sst = round(ssb + ssw, 2);
      return {
        prompt: `Only some cells survived: **MSB = ${f(msb, 2)}**, **SST = ${f(sst, 2)}**, k = ${k}, n = ${n}. Find SSB, SSW, MSW (2 decimals) and F (3 decimals).`,
        output: { title: 'ANOVA — incomplete', rows: [['Source', 'SS', 'df', 'MS', 'F'], ['Between Groups', '?', '?', f(msb, 2), '?'], ['Within Groups', '?', '?', '?', ''], ['Total', f(sst, 2), '?', '', '']] },
        inputs: [num('ssb', 'SSB', ssb, 2, 0.02), num('ssw', 'SSW', ssw, 2, 0.02), num('msw', 'MSW', ssw / (n - k), 2, 0.01), num('F', 'F', msb / (ssw / (n - k)), 3, 0.003)],
        hints: [`df_B = ${k - 1}, df_W = ${n - k}`, 'SSB = MSB × df_B', 'SSW = SST − SSB', 'MSW = SSW/df_W, F = MSB/MSW'],
        solution: [`df_B = ${k - 1}, df_W = ${n - k}, df_T = ${n - 1}`, `SSB = ${f(msb, 2)} × ${k - 1} = **${f(ssb, 2)}**`, `SSW = ${f(sst, 2)} − ${f(ssb, 2)} = **${f(ssw, 2)}**`, `MSW = ${f(ssw, 2)}/${n - k} = **${f(ssw / (n - k), 2)}**`, `F = ${f(msb, 2)}/${f(ssw / (n - k), 3)} = **${f(msb / (ssw / (n - k)), 3)}**`],
      };
    },
  },
  {
    id: 'w4-summ', title: 'ANOVA from group summaries (n, mean, s)', topic: 'anova', difficulty: 3, decision: true,
    generate: (rng) => {
      const { k, n, ctx } = setup(rng);
      const g = summaries(rng, k, n, ctx.base, ctx.spread);
      const a = anovaFromSummaries(g);
      const crit = fTable(k - 1, n - k, 0.95).value;
      return {
        prompt: `Mean ${ctx.y} by ${ctx.factor}. Test at α = 0.05 whether the population means differ.`,
        output: { title: 'Group summaries', rows: [['Group', 'n', 'Mean', 'SD'], ...g.map((x, i) => [ctx.groups[i], String(x.n), f(x.mean, 2), f(x.sd, 2)])] },
        inputs: [num('gm', 'Grand mean (3 dec.)', a.grandMean, 3, 0.002), num('ssb', 'SSB (2 dec.)', a.ssb, 2, Math.max(0.05, a.ssb * 0.002)), num('ssw', 'SSW (2 dec.)', a.ssw, 2, Math.max(0.05, a.ssw * 0.002)), num('F', 'F (3 dec.)', a.F, 3, 0.01), decision(a.F > crit)],
        hints: ['Grand mean = Σ nⱼ x̄ⱼ / n (weighted!)', 'SSB = Σ nⱼ (x̄ⱼ − grand mean)²', 'SSW = Σ (nⱼ − 1) sⱼ²', `df (${k - 1}, ${n - k})`],
        solution: [
          `Grand mean $= (${g.map((x) => `${x.n}\\cdot${f(x.mean, 2)}`).join(' + ')})/${n} = ${f(a.grandMean, 3)}$`,
          `$SSB = ${g.map((x) => `${x.n}(${f(x.mean, 2)} - ${f(a.grandMean, 3)})^2`).join(' + ')} = ${f(a.ssb, 2)}$`,
          `$SSW = ${g.map((x) => `${x.n - 1}\\cdot ${f(x.sd, 2)}^2`).join(' + ')} = ${f(a.ssw, 2)}$`,
          `MSB = ${f(a.msb, 3)}, MSW = ${f(a.msw, 3)}, **F = ${f(a.F, 3)}**`,
          `${readF(k - 1, n - k, 0.95).text} → ${a.F > crit ? 'reject H₀: at least one mean differs' : 'do not reject H₀: no sufficient evidence of different means'} (p = ${f(a.pValue, 4)}).`,
        ],
      };
    },
  },
  {
    id: 'w4-raw', title: 'ANOVA by hand from raw data', topic: 'anova', difficulty: 3, decision: true,
    generate: (rng) => {
      const shape = rng.pick([[3, 4], [3, 5], [4, 4]] as const);
      const [k, nj] = shape;
      const base = rng.int(11, 15), eff = rng.float(0, 1.6, 1);
      const groups = Array.from({ length: k }, () => {
        const mu = base + rng.float(-eff, eff, 0);
        return Array.from({ length: nj }, () => Math.round(mu + rng.float(-2, 2, 0)));
      });
      const a = anovaFromRaw(groups);
      const crit = fTable(k - 1, a.dfw, 0.95).value;
      return {
        prompt: `GPA (0–20) of students in ${k} tutorial groups. Test at α = 0.05 whether the mean GPA differs between tutorial groups.`,
        output: { title: 'Raw data', rows: [['Group', ...Array.from({ length: nj }, (_, i) => `#${i + 1}`)], ...groups.map((g, i) => [`T${i + 1}`, ...g.map(String)])] },
        inputs: [num('ssb', 'SSB (3 dec.)', a.ssb, 3, 0.01), num('ssw', 'SSW (3 dec.)', a.ssw, 3, 0.01), num('F', 'F (3 dec.)', a.F, 3, 0.01), decision(a.F > crit)],
        hints: ['Compute each group mean and the grand mean first.', `SSB = ${nj} · Σ (x̄ⱼ − grand mean)²`, 'SSW = sum of squared deviations from each group\'s own mean', `df (${k - 1}, ${a.dfw})`],
        solution: [
          `Group means: ${groups.map((g, i) => `T${i + 1} = ${f(mean(g), 3)}`).join(', ')}; grand mean = ${f(a.grandMean, 3)}`,
          `SSB = **${f(a.ssb, 3)}**, SSW = **${f(a.ssw, 3)}** (group SDs ${groups.map((g) => f(sd(g), 3)).join(', ')})`,
          `MSB = ${f(a.ssb, 3)}/${k - 1} = ${f(a.msb, 3)}, MSW = ${f(a.ssw, 3)}/${a.dfw} = ${f(a.msw, 3)}, **F = ${f(a.F, 3)}**`,
          `${readF(k - 1, a.dfw, 0.95).text} → **${a.F > crit ? 'reject H₀' : 'do not reject H₀'}**`,
        ],
      };
    },
  },
  {
    id: 'w4-fwer', title: 'Family-wise error of multiple t-tests', topic: 'anova', difficulty: 1,
    generate: (rng) => {
      const k = rng.int(3, 6), alpha = rng.pick([0.05, 0.1, 0.01]);
      const m = (k * (k - 1)) / 2, p = 1 - (1 - alpha) ** m;
      return {
        prompt: `You compare **${k}** group means with all pairwise t-tests, each at α = ${alpha}. How many tests are needed, and what is the probability of at least one Type I error (4 decimals, assume independence)?`,
        inputs: [num('m', 'Number of tests', m, 0, 0), num('p', 'P(at least one Type I error)', p, 4, 0.0002)],
        hints: ['Pairs: k(k − 1)/2', '1 − (1 − α)^m'],
        solution: [`$m = \\binom{${k}}{2} = ${m}$`, `$1 - (1 - ${alpha})^{${m}} = ${f(p, 4)}$ — far more than α = ${alpha}. That is why we use ANOVA.`],
      };
    },
  },
  {
    id: 'w4-pbounds', title: 'Bracket the p-value with the F table', topic: 'anova', difficulty: 3,
    generate: (rng) => {
      const { k, n } = setup(rng);
      const c90 = fTable(k - 1, n - k, 0.9).value, c995 = fTable(k - 1, n - k, 0.995).value;
      const F = round(rng.float(c90 * 0.9, c995 * 1.15, 2), 2);
      const b = fPBounds(F, k - 1, n - k);
      return {
        prompt: `ANOVA with df (${k - 1}, ${n - k}) gives **F = ${f(F, 2)}**. Using the F table (rows .900, .950, .975, .990, .995), bracket the p-value: give the lower and upper bound (lower = 0 if p < 0.005; upper = 1 if p > 0.10).`,
        inputs: [num('lo', 'Lower bound', b.lower, 3, 0), num('hi', 'Upper bound', b.upper, 3, 0)],
        hints: [`Block n = ${n - k}, column m = ${k - 1}: read the five values for the five rows.`, 'If F lies between the .95 and .975 values, then 0.025 < p < 0.05.'],
        solution: [`Values in block ${n - k}, column ${k - 1}: ${[0.9, 0.95, 0.975, 0.99, 0.995].map((p) => `${p}: ${fTable(k - 1, n - k, p).value}`).join(' · ')}`, `F = ${f(F, 2)} → **${b.text}**`],
      };
    },
  },
  {
    id: 'w4-eta', title: 'Effect size η²', topic: 'anova', difficulty: 1,
    generate: (rng) => {
      const ssb = rng.float(50, 900, 1), ssw = rng.float(400, 3000, 1);
      const eta = ssb / (ssb + ssw);
      return {
        prompt: `An ANOVA table shows **SSB = ${ssb}** and **SSW = ${ssw}**. What share of the total variability is explained by the factor (η², 4 decimals)?`,
        inputs: [num('e', 'η²', eta, 4, 0.0002)],
        hints: ['η² = SSB / SST', 'SST = SSB + SSW'],
        solution: [`SST = ${f(ssb + ssw, 1)}`, `η² = ${ssb}/${f(ssb + ssw, 1)} = **${f(eta, 4)}** — the factor explains ${f(eta * 100, 1)} % of the variability.`],
      };
    },
  },
  {
    id: 'w4-method', title: 'ANOVA or not?', topic: 'anova', difficulty: 1,
    generate: (rng) => {
      const cases = [
        { q: 'Compare mean FinalGrade across 4 study methods.', a: 0 },
        { q: 'Is PassFail associated with StudyMethod?', a: 1 },
        { q: 'Does FinalGrade increase with StudyHoursPerWeek?', a: 2 },
        { q: 'Compare mean sleep hours across Low / Medium / High stress.', a: 0 },
        { q: 'Is Gender associated with having a part-time job?', a: 1 },
        { q: 'Predict GPA from attendance %.', a: 2 },
        { q: 'Is the mean GPA different from 15?', a: 3 },
      ];
      const c = rng.pick(cases);
      const opts = ['One-way ANOVA', 'χ² test of independence', 'Simple linear regression', 't test for one mean'];
      return {
        prompt: `Which method fits? **${c.q}**`,
        inputs: [choice('m', 'Method', opts, c.a)],
        hints: ['Check the variable types: metric vs categorical.', 'ANOVA = metric Y × categorical factor (k groups).'],
        solution: [`**${opts[c.a]}**. ${['Metric Y, categorical factor with k groups.', 'Two categorical variables → contingency table.', 'Two metric variables → regression.', 'One metric variable vs a fixed value μ₀.'][c.a]}`],
      };
    },
  },
];

export const interpretations: InterpretationTask[] = [
  {
    id: 'w4-int-excel', topic: 'anova', title: 'Interpret an Excel ANOVA',
    prompt: 'Write the conclusion (α = 0.05) for the Dean in 2–3 sentences.',
    output: { title: 'ANOVA: FinalGrade by StudyMethod', rows: [['Source of Variation', 'SS', 'df', 'MS', 'F', 'P-value'], ['Between Groups', '5 123.2', '3', '1 707.7', '11.34', '0.0000'], ['Within Groups', '8 433.1', '56', '150.6', '', ''], ['Total', '13 556.3', '59', '', '', '']] },
    model: 'Since F = 11.34 with df (3, 56) and p < 0.001 < 0.05, we reject H₀. At the 5 % significance level there is sufficient evidence that the mean final grade differs for at least one study method. ANOVA does not say which methods differ (post-hoc tests would), and because the data are observational, this does not prove that the study method causes the difference.',
    checklist: ['Reports F, df and p', 'Says "reject H₀"', 'Conclusion: at least one mean differs (not "all")', 'Mentions post-hoc tests or that we do not know which group', 'No causal claim'],
  },
  {
    id: 'w4-int-nonsig', topic: 'anova', title: 'A non-significant ANOVA',
    prompt: 'In a different cohort of 60 students, an ANOVA of AttendancePercent by study method gives F = 1.21, df (3, 56), p = 0.31. Interpret at α = 0.05.',
    model: 'Since p = 0.31 > 0.05, we do not reject H₀. There is not sufficient evidence that mean attendance differs between the four study methods. This does not prove the means are equal; the observed differences are compatible with random sampling variation.',
    checklist: ['Compares p with α', '"Do not reject" — never "accept"', 'Context: attendance and study method', 'H₀ not proven'],
  },
];
