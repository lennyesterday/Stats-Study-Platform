import type { Rng } from '../../lib/rng';
import { round, type Tail } from '../../lib/stats';
import { tPBounds, tTable, zTable } from '../../lib/tables';
import { decision, f, num, readT, readZp } from '../helpers';
import type { ExerciseDef, ExerciseInstance, InterpretationTask } from '../types';
import { tableN } from '../world2/exercises';

const H1 = { two: '\\ne', right: '>', left: '<' } as const;
const H0 = { two: '=', right: '\\le', left: '\\ge' } as const;
const WORDS = { two: 'differs from', right: 'is greater than', left: 'is less than' } as const;

const CLAIMS = [
  { v: 'mean GPA (0–20)', mu0: 15, sd: 2.2, dec: 2 },
  { v: 'mean study time per day (hours)', mu0: 5, sd: 1.2, dec: 2 },
  { v: 'mean sleep per night (hours)', mu0: 7, sd: 0.85, dec: 2 },
  { v: 'mean StudyHoursPerWeek', mu0: 9, sd: 3.3, dec: 2 },
  { v: 'mean FinalGrade', mu0: 65, sd: 15, dec: 1 },
];

/** critical value with the course tables for z or t */
function critical(kind: 'z' | 't', alpha: number, tail: Tail, df = Infinity) {
  const p = tail === 'two' ? round(1 - alpha / 2, 4) : round(1 - alpha, 4);
  const v = kind === 'z' ? tTable(Infinity, p).value : tTable(df, p).value;
  return { value: tail === 'left' ? -v : v, p };
}

const reject = (stat: number, crit: number, tail: Tail) => (tail === 'two' ? Math.abs(stat) > Math.abs(crit) : tail === 'right' ? stat > crit : stat < crit);

function meanTest(rng: Rng, kind: 'z' | 't', tail: Tail): ExerciseInstance {
  const c = rng.pick(CLAIMS);
  const alpha = rng.pick([0.05, 0.05, 0.1, 0.01]);
  const n = kind === 't' ? tableN(rng) : rng.pick([36, 40, 50, 64, 100]);
  const se0 = c.sd / Math.sqrt(n);
  const shift = rng.float(0.3, 2.8, 2) * (tail === 'left' ? -1 : tail === 'right' ? 1 : rng.pick([-1, 1]));
  const xbar = round(c.mu0 + shift * se0, c.dec);
  const s = kind === 't' ? round(c.sd * rng.float(0.85, 1.15, 2), c.dec) : c.sd;
  const se = s / Math.sqrt(n);
  const stat = (xbar - c.mu0) / se;
  const cr = critical(kind, alpha, tail, n - 1);
  const rej = reject(round(stat, 3), cr.value, tail);
  const tailTxt = tail === 'two' ? 'two-tailed' : `${tail}-tailed`;
  return {
    prompt: `Claim to test: the population ${c.v} **${WORDS[tail]} ${c.mu0}**. A random sample of n = ${n} gives x̄ = ${xbar}${kind === 't' ? ` and s = ${s}` : ` (σ = ${s} is known)`}. Use α = ${alpha}.\n\nCompute the test statistic (3 decimals), the critical value (3 decimals, with sign for a left tail) and decide.`,
    inputs: [num('stat', `${kind} statistic`, stat, 3, 0.002), num('crit', 'Critical value', cr.value, 3, 0), decision(rej)],
    hints: [`$H_0: \\mu ${H0[tail]} ${c.mu0}$ vs $H_1: \\mu ${H1[tail]} ${c.mu0}$ (${tailTxt}).`, kind === 't' ? `σ unknown → t with df = ${n - 1}.` : 'σ known → z.', `Column of the table: ${cr.p}.`],
    solution: [
      `$H_0: \\mu ${H0[tail]} ${c.mu0}$ vs $H_1: \\mu ${H1[tail]} ${c.mu0}$ — ${tailTxt}, α = ${alpha}`,
      `$${kind} = \\frac{${xbar} - ${c.mu0}}{${s}/\\sqrt{${n}}} = \\frac{${f(xbar - c.mu0, 4)}}{${f(se, 4)}} = ${f(stat, 3)}$`,
      kind === 't' ? `${readT(n - 1, cr.p).text}${tail === 'left' ? ' → critical value **' + f(cr.value, 3) + '**' : ''}` : `z critical (column ${cr.p}): **${f(cr.value, 3)}**${tail === 'two' ? ' (±)' : ''}`,
      `Decision rule: reject H₀ if ${tail === 'two' ? `|${kind}| > ${f(Math.abs(cr.value), 3)}` : tail === 'right' ? `${kind} > ${f(cr.value, 3)}` : `${kind} < ${f(cr.value, 3)}`} → **${rej ? 'reject H₀' : 'do not reject H₀'}**.`,
      `Conclusion: at the ${alpha * 100} % level there is ${rej ? '' : '**not** '}sufficient evidence that the ${c.v} ${WORDS[tail]} ${c.mu0}.`,
    ],
  };
}

export const exercises: ExerciseDef[] = [
  { id: 'w3-z-test', title: 'z test for μ (σ known)', topic: 'testing', difficulty: 1, decision: true, generate: (rng) => meanTest(rng, 'z', rng.pick(['two', 'right', 'left'] as Tail[])) },
  { id: 'w3-t-two', title: 't test for μ — two-tailed', topic: 'testing', difficulty: 2, decision: true, generate: (rng) => meanTest(rng, 't', 'two') },
  { id: 'w3-t-right', title: 't test for μ — right-tailed', topic: 'testing', difficulty: 2, decision: true, generate: (rng) => meanTest(rng, 't', 'right') },
  { id: 'w3-t-left', title: 't test for μ — left-tailed', topic: 'testing', difficulty: 2, decision: true, generate: (rng) => meanTest(rng, 't', 'left') },
  {
    id: 'w3-pvalue-z', title: 'p-value of a z test', topic: 'errors', difficulty: 2, decision: true,
    generate: (rng) => {
      const z = rng.float(-2.9, 2.9, 2), tail = rng.pick(['two', 'right', 'left'] as Tail[]), alpha = rng.pick([0.05, 0.01, 0.1]);
      const p = tail === 'two' ? 2 * (1 - zTable(Math.abs(z))) : tail === 'right' ? 1 - zTable(z) : zTable(z);
      return {
        prompt: `A ${tail === 'two' ? 'two' : tail}-tailed z test gives **z = ${f(z, 2)}**. Find the p-value (4 decimals) and decide at α = ${alpha}.`,
        inputs: [num('p', 'p-value', p, 4, 0.0002), decision(p < alpha)],
        hints: [tail === 'two' ? 'Two-tailed: p = 2·P(Z > |z|).' : tail === 'right' ? 'Right-tailed: p = P(Z > z).' : 'Left-tailed: p = P(Z < z).', 'Reject if p < α.'],
        solution: [readZp(tail === 'two' ? Math.abs(z) : z).text, `p = **${f(p, 4)}** ${p < alpha ? '<' : '≥'} ${alpha} → **${p < alpha ? 'reject' : 'do not reject'} H₀**`],
      };
    },
  },
  {
    id: 'w3-prop-test', title: 'z test for a proportion π', topic: 'test-prop', difficulty: 2, decision: true,
    generate: (rng) => {
      const pi0 = rng.pick([0.5, 0.6, 0.7, 0.8, 0.9, 0.25, 0.4]);
      const n = rng.pick([60, 80, 100, 150, 200]);
      const tail = rng.pick(['two', 'right', 'left'] as Tail[]);
      const shift = rng.float(0.2, 2.6, 2) * (tail === 'left' ? -1 : tail === 'right' ? 1 : rng.pick([-1, 1]));
      const x = Math.max(1, Math.min(n - 1, Math.round(n * (pi0 + shift * Math.sqrt((pi0 * (1 - pi0)) / n)))));
      const p = x / n, se = Math.sqrt((pi0 * (1 - pi0)) / n), z = round((p - pi0) / se, 2);
      const pv = tail === 'two' ? 2 * (1 - zTable(Math.abs(z))) : tail === 'right' ? 1 - zTable(z) : zTable(z);
      return {
        prompt: `Claim: the proportion of Nova students with a part-time job **${WORDS[tail]} ${pi0}**. In a random sample, ${x} of ${n} students have one. Test at α = 0.05: compute z (2 decimals), the p-value (4 decimals) and decide.`,
        inputs: [num('z', 'z', z, 2, 0.01), num('p', 'p-value', pv, 4, 0.0003), decision(pv < 0.05)],
        hints: [`$H_0: \\pi ${H0[tail]} ${pi0}$ vs $H_1: \\pi ${H1[tail]} ${pi0}$`, 'SE uses π₀: √(π₀(1−π₀)/n).'],
        solution: [`$p = ${x}/${n} = ${f(p, 4)}$, $SE = \\sqrt{${pi0}(1-${pi0})/${n}} = ${f(se, 4)}$`, `$z = (${f(p, 4)} - ${pi0})/${f(se, 4)} = ${f(z, 2)}$`, readZp(tail === 'two' ? Math.abs(z) : z).text, `p-value = **${f(pv, 4)}** → ${pv < 0.05 ? 'reject' : 'do not reject'} H₀`],
      };
    },
  },
  {
    id: 'w3-p-bounds', title: 'Bracket a p-value with the t table', topic: 'errors', difficulty: 3,
    generate: (rng) => {
      const df = rng.pick([5, 8, 10, 12, 15, 20, 24, 30]);
      const t = rng.float(1.2, 3.4, 2), tail = rng.pick(['one', 'two'] as const);
      const b = tPBounds(t, df, tail);
      return {
        prompt: `A ${tail === 'two' ? 'two' : 'right'}-tailed t test with **df = ${df}** gives **t = ${f(t, 2)}**. Using only the t table, give the lower and upper bound of the p-value (enter 0 if there is no lower bound).`,
        inputs: [num('lo', 'Lower bound', b.lower, 3, 0), num('hi', 'Upper bound', b.upper, 3, 0)],
        hints: [`Find where ${f(t, 2)} falls between two values in row ${df}.`, 'The column headers are P(T < t); the one-tail p is 1 − header.', tail === 'two' ? 'Double the one-tail bounds.' : 'One tail: no doubling.'],
        solution: [`Row ${df}: ${f(t, 2)} lies between the values of two neighbouring columns.`, `→ **${b.text}**`],
      };
    },
  },
  {
    id: 'w3-power', title: 'Power and Type II error of a z test', topic: 'errors', difficulty: 3,
    generate: (rng) => {
      const mu0 = rng.pick([15, 7, 65]), sigma = mu0 === 65 ? 15 : mu0 === 7 ? 0.85 : 2;
      const n = rng.pick([25, 36, 49, 64]), se = sigma / Math.sqrt(n);
      const mu1 = round(mu0 + rng.float(0.8, 2.8, 2) * se, 2);
      const cut = mu0 + 1.645 * se;
      const z = round((cut - mu1) / se, 2);
      const power = 1 - zTable(z);
      return {
        prompt: `$H_0: \\mu = ${mu0}$ vs $H_1: \\mu > ${mu0}$, σ = ${sigma}, n = ${n}, α = 0.05.\n\n(a) Above which value of x̄ is H₀ rejected? (3 decimals)\n(b) Power if the true mean is μ = ${mu1} (4 decimals)\n(c) β (4 decimals)`,
        inputs: [num('cut', '(a) critical x̄', cut, 3, 0.002), num('pw', '(b) power', power, 4, 0.0003), num('b', '(c) β', 1 - power, 4, 0.0003)],
        hints: ['Critical x̄ = μ₀ + 1.645·σ/√n', 'Power = P(x̄ > critical x̄ | μ = μ₁)', 'Standardise with μ₁.'],
        solution: [`SE = ${f(se, 4)}; critical x̄ = ${mu0} + 1.645 × ${f(se, 4)} = ${f(cut, 3)}`, `$z = (${f(cut, 3)} - ${mu1})/${f(se, 4)} = ${f(z, 2)}$`, `Power = 1 − P(Z < ${f(z, 2)}) = **${f(power, 4)}**; β = **${f(1 - power, 4)}**`],
      };
    },
  },
  {
    id: 'w3-ci-link', title: 'Decide a test with a CI', topic: 'testing', difficulty: 1, decision: true,
    generate: (rng) => {
      const lo = rng.float(13.5, 15.2, 2), hi = round(lo + rng.float(0.6, 1.8, 2), 2), conf = rng.pick([0.9, 0.95, 0.99]);
      const mu0 = rng.pick([14, 14.5, 15, 15.5, 16]);
      const inside = mu0 >= lo && mu0 <= hi;
      return {
        prompt: `The ${Math.round(conf * 100)} % CI for the mean GPA is **[${f(lo, 2)}; ${f(hi, 2)}]**. Test $H_0: \\mu = ${mu0}$ vs $H_1: \\mu \\ne ${mu0}$ at α = ${round(1 - conf, 2)}. What is the decision?`,
        inputs: [decision(!inside)],
        hints: ['A two-tailed test at α rejects exactly when μ₀ is outside the (1 − α) CI.'],
        solution: [`μ₀ = ${mu0} is **${inside ? 'inside' : 'outside'}** [${f(lo, 2)}; ${f(hi, 2)}] → **${inside ? 'do not reject' : 'reject'} H₀**.`],
      };
    },
  },
  {
    id: 'w3-full', title: 'Full exam-style test (with p-value)', topic: 'testing', difficulty: 3, decision: true,
    generate: (rng) => {
      const inst = meanTest(rng, 't', rng.pick(['two', 'right', 'left'] as Tail[]));
      return { ...inst, prompt: inst.prompt + '\n\n*Tip: also bracket the p-value with the t table for yourself — the solution shows the decision rule.*' };
    },
  },
];

export const interpretations: InterpretationTask[] = [
  {
    id: 'w3-int-fail', topic: 'errors', title: '"Fail to reject" in words',
    prompt: 'A t test of H₀: μ = 5 (daily study hours) gives t = −1.82, df = 24, p ≈ 0.08. Write the decision and conclusion at α = 0.05 for a newsletter.',
    model: 'Since p ≈ 0.08 > 0.05, we do not reject H₀. At the 5 % significance level, the sample does not provide sufficient evidence that the mean daily study time of Nova students differs from 5 hours. This does not prove that the mean is exactly 5 hours — a larger sample might detect a difference.',
    checklist: ['Compares p with α (or t with critical value)', 'Uses "do not reject" (never "accept")', 'States the conclusion about the population mean in context', 'Notes that H₀ is not proven'],
  },
  {
    id: 'w3-int-practical', topic: 'errors', title: 'Statistical vs. practical significance',
    prompt: 'With n = 4 000, the mean GPA is 15.06 and a test of H₀: μ = 15 gives p = 0.001. Interpret for the Dean, who asks whether "GPA has really changed".',
    model: 'The result is statistically significant (p = 0.001 < 0.05): it is very unlikely to see a mean of 15.06 if the true mean were 15. However, the difference is only 0.06 points on a 20-point scale, which is practically negligible; the huge sample makes even tiny differences significant.',
    checklist: ['States statistical significance correctly', 'Quantifies the effect size in context (0.06 points)', 'Explains why large n makes tiny effects significant', 'Distinguishes "significant" from "important"'],
  },
];
