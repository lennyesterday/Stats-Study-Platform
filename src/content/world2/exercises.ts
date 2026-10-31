import type { Rng } from '../../lib/rng';
import { round } from '../../lib/stats';
import { tTable, zTable } from '../../lib/tables';
import { f, num, readT, readZp } from '../helpers';
import type { ExerciseDef, InterpretationTask } from '../types';

/** z reliability factor as printed in the last (∞) row of the course t table. */
export const zConf = (conf: number) => tTable(Infinity, round(1 - (1 - conf) / 2, 4)).value;
export const tConf = (conf: number, df: number) => tTable(df, round(1 - (1 - conf) / 2, 4)).value;
const pct = (c: number) => `${Math.round(c * 100)} %`;
const confPick = (rng: Rng) => rng.pick([0.9, 0.95, 0.95, 0.99]);
/** sample sizes whose df = n − 1 is a row of the t table */
export const tableN = (rng: Rng, max = 31) => rng.pick([6, 8, 10, 11, 13, 16, 19, 21, 25, 26, 31, 41, 61].filter((n) => n <= max));

const VARS = [
  { name: 'StudyHoursPerWeek', unit: 'hours', mu: 9.3, sigma: 3.3, dec: 1 },
  { name: 'SleepHoursPerNight', unit: 'hours', mu: 6.8, sigma: 0.85, dec: 2 },
  { name: 'FinalGrade', unit: 'points', mu: 67.2, sigma: 15.2, dec: 1 },
  { name: 'GPA (0–20)', unit: 'points', mu: 14.5, sigma: 2.0, dec: 1 },
];

export const exercises: ExerciseDef[] = [
  {
    id: 'w2-se', title: 'Standard error of the mean', topic: 'sampling', difficulty: 1,
    generate: (rng) => {
      const v = rng.pick(VARS), n = rng.pick([16, 25, 36, 40, 49, 64, 100]);
      const se = v.sigma / Math.sqrt(n);
      return {
        prompt: `${v.name} has population SD σ = ${v.sigma} ${v.unit}. Samples of n = ${n} students are drawn.\n\n(a) What is the standard error of x̄? (3 decimals)\n(b) What would the SE be with 4n = ${4 * n} students? (3 decimals)`,
        inputs: [num('se', '(a) SE', se, 3), num('se4', '(b) SE with 4n', se / 2, 3)],
        hints: ['SE = σ / √n', 'Quadrupling n halves the SE.'],
        solution: [`$SE = ${v.sigma}/\\sqrt{${n}} = ${f(se, 3)}$`, `$SE = ${v.sigma}/\\sqrt{${4 * n}} = ${f(se / 2, 3)}$ — exactly half.`],
      };
    },
  },
  {
    id: 'w2-clt-prob', title: 'CLT probability for x̄', topic: 'sampling', difficulty: 2,
    generate: (rng) => {
      const v = rng.pick(VARS), n = rng.pick([30, 36, 40, 49, 50, 64]);
      const se = v.sigma / Math.sqrt(n);
      const a = round(v.mu + rng.pick([-1, 1]) * rng.float(0.4, 2.2, 2) * se, v.dec);
      const above = rng.next() < 0.5;
      const z = round((a - v.mu) / se, 2);
      const p = above ? 1 - zTable(z) : zTable(z);
      return {
        prompt: `${v.name} in the population: μ = ${v.mu}, σ = ${v.sigma} (distribution unknown). A random sample of **n = ${n}** students is taken.\n\nFind $P(\\bar X ${above ? '>' : '<'} ${a})$ (4 decimals).`,
        inputs: [num('p', `P(x̄ ${above ? '>' : '<'} ${a})`, p, 4, 0.0002)],
        hints: ['n ≥ 30 → CLT: x̄ ≈ N(μ, σ/√n).', `SE = ${v.sigma}/√${n}`, 'Standardise with z = (a − μ)/SE, round z to 2 decimals.'],
        solution: [`CLT (n = ${n} ≥ 30): $\\bar X \\approx N(${v.mu}, ${f(se, 4)})$`, `$z = (${a} - ${v.mu})/${f(se, 4)} = ${f(z, 2)}$`, readZp(z).text, `Answer: **${f(p, 4)}**`],
      };
    },
  },
  {
    id: 'w2-ci-z', title: 'CI for μ, σ known', topic: 'ci-mean', difficulty: 1,
    generate: (rng) => {
      const v = rng.pick(VARS), n = rng.pick([30, 36, 40, 50, 64, 100]), conf = confPick(rng);
      const xbar = round(v.mu + rng.float(-0.5, 0.5, 2) * v.sigma, v.dec + 1);
      const z = zConf(conf), se = v.sigma / Math.sqrt(n), me = z * se;
      return {
        prompt: `A sample of n = ${n} students gives x̄ = ${xbar} for **${v.name}**. The population SD is known: σ = ${v.sigma}.\n\nBuild a **${pct(conf)}** confidence interval for μ (bounds with 3 decimals).`,
        inputs: [num('z', 'Reliability factor', z, 3, 0.001), num('lo', 'Lower bound', xbar - me, 3, 0.002), num('hi', 'Upper bound', xbar + me, 3, 0.002)],
        hints: [`${pct(conf)} → α = ${round(1 - conf, 2)} → look up P(Z < z) = ${round(1 - (1 - conf) / 2, 3)}.`, 'ME = z × σ/√n'],
        solution: [`$z_{${round(1 - (1 - conf) / 2, 3)}} = ${f(z, 3)}$ (Z table / last row of the t table)`, `$SE = ${v.sigma}/\\sqrt{${n}} = ${f(se, 4)}$, $ME = ${f(z, 3)} \\times ${f(se, 4)} = ${f(me, 4)}$`, `CI: **[${f(xbar - me, 3)}; ${f(xbar + me, 3)}]**`],
      };
    },
  },
  {
    id: 'w2-ci-t', title: 'CI for μ, σ unknown (t)', topic: 'ci-mean', difficulty: 2,
    generate: (rng) => {
      const v = rng.pick(VARS), n = tableN(rng), conf = confPick(rng);
      const xbar = round(v.mu + rng.float(-0.4, 0.4, 2) * v.sigma, v.dec + 1);
      const s = round(v.sigma * rng.float(0.8, 1.2, 2), v.dec + 1);
      const t = tConf(conf, n - 1), se = s / Math.sqrt(n), me = t * se;
      return {
        prompt: `n = ${n} students: x̄ = ${xbar}, s = ${s} for **${v.name}**. σ is unknown.\n\nBuild a **${pct(conf)}** CI for μ: give the reliability factor (3 decimals) and the bounds (2 decimals).`,
        inputs: [num('t', 'Reliability factor t', t, 3, 0), num('lo', 'Lower bound', xbar - me, 2, 0.01), num('hi', 'Upper bound', xbar + me, 2, 0.01)],
        hints: ['σ unknown → t with df = n − 1.', `Column = 1 − α/2 = ${round(1 - (1 - conf) / 2, 3)}.`, 'ME = t × s/√n'],
        solution: [readT(n - 1, round(1 - (1 - conf) / 2, 3)).text, `$SE = ${s}/\\sqrt{${n}} = ${f(se, 4)}$; $ME = ${f(t, 3)} \\times ${f(se, 4)} = ${f(me, 4)}$`, `CI: **[${f(xbar - me, 2)}; ${f(xbar + me, 2)}]**`],
      };
    },
  },
  {
    id: 'w2-conf-effect', title: 'How the confidence level changes the ME', topic: 'ci-mean', difficulty: 2,
    generate: (rng) => {
      const n = rng.pick([36, 49, 64, 100]), sigma = rng.pick([0.85, 2.0, 3.3, 15.2]);
      const se = sigma / Math.sqrt(n);
      return {
        prompt: `σ = ${sigma}, n = ${n}. Compute the margin of error of the Z interval for μ at **90 %**, **95 %** and **99 %** confidence (3 decimals).`,
        inputs: [num('m90', 'ME at 90 %', 1.645 * se, 3, 0.002), num('m95', 'ME at 95 %', 1.96 * se, 3, 0.002), num('m99', 'ME at 99 %', 2.576 * se, 3, 0.002)],
        hints: ['Reliability factors: 1.645, 1.96, 2.576.', `SE = ${sigma}/√${n} = ${f(se, 4)}`],
        solution: [`SE = ${f(se, 4)}`, `90 %: 1.645 × SE = ${f(1.645 * se, 3)}; 95 %: ${f(1.96 * se, 3)}; 99 %: ${f(2.576 * se, 3)}`, 'More confidence → wider interval → less precision.'],
      };
    },
  },
  {
    id: 'w2-sample-size', title: 'Required sample size', topic: 'ci-mean', difficulty: 2,
    generate: (rng) => {
      const v = rng.pick(VARS), conf = confPick(rng);
      const E = round(v.sigma * rng.pick([0.1, 0.15, 0.2, 0.25, 0.3]), 2);
      const z = zConf(conf);
      const raw = (z * v.sigma / E) ** 2;
      return {
        prompt: `You want to estimate the mean **${v.name}** (σ ≈ ${v.sigma}) with a margin of error of at most **±${E}** at **${pct(conf)}** confidence. How many students do you need?`,
        inputs: [num('n', 'Minimum n', Math.ceil(raw - 1e-9), 0, 0)],
        hints: ['n = (z·σ/E)²', 'Always round UP.'],
        solution: [`$n = (${f(z, 3)} \\times ${v.sigma}/${E})^2 = ${f(raw, 2)}$ → round up → **${Math.ceil(raw - 1e-9)}**`],
      };
    },
  },
  {
    id: 'w2-ci-prop', title: 'CI for a proportion', topic: 'ci-prop', difficulty: 2,
    generate: (rng) => {
      const n = rng.pick([50, 60, 80, 100, 120, 200]), x = rng.int(Math.round(n * 0.15), Math.round(n * 0.85)), conf = confPick(rng);
      const p = x / n, se = Math.sqrt((p * (1 - p)) / n), z = zConf(conf);
      const what = rng.pick(['have a part-time job', 'study in groups', 'report high stress', 'sleep less than 7 hours']);
      return {
        prompt: `In a random sample of ${n} Nova students, ${x} ${what}.\n\nBuild a **${pct(conf)}** CI for the population proportion π (all answers with 3 decimals).`,
        inputs: [num('p', 'Sample proportion p', p, 3), num('lo', 'Lower bound', p - z * se, 3, 0.002), num('hi', 'Upper bound', p + z * se, 3, 0.002)],
        hints: ['p = x/n', 'SE = √(p(1−p)/n)', `z = ${f(z, 3)}`],
        solution: [`$p = ${x}/${n} = ${f(p, 4)}$; check np = ${x} ≥ 5, n(1−p) = ${n - x} ≥ 5 ✓`, `$SE = \\sqrt{${f(p, 4)}(1-${f(p, 4)})/${n}} = ${f(se, 4)}$`, `$${f(p, 4)} \\pm ${f(z, 3)} \\times ${f(se, 4)}$ → **[${f(p - z * se, 3)}; ${f(p + z * se, 3)}]**`],
      };
    },
  },
  {
    id: 'w2-reverse', title: 'Reverse-engineer a CI', topic: 'ci-mean', difficulty: 2,
    generate: (rng) => {
      const n = tableN(rng), xbar = rng.float(12, 17, 2), s = rng.float(1, 3, 2);
      const t = tConf(0.95, n - 1), me = t * s / Math.sqrt(n);
      const lo = round(xbar - me, 3), hi = round(xbar + me, 3);
      return {
        prompt: `A report gives the 95 % CI for the mean GPA as **[${f(lo, 3)}; ${f(hi, 3)}]**, based on n = ${n} students (σ unknown, t interval).\n\nFind x̄, the margin of error and the sample SD s (all 2 decimals).`,
        inputs: [num('x', 'x̄', (lo + hi) / 2, 2), num('me', 'Margin of error', (hi - lo) / 2, 2), num('s', 'Sample SD s', ((hi - lo) / 2) * Math.sqrt(n) / t, 2, 0.02)],
        hints: ['x̄ = midpoint, ME = half the width.', 'ME = t·s/√n → s = ME·√n / t.', `t from row df = ${n - 1}, column 0.975.`],
        solution: [`$\\bar x = (${f(lo, 3)} + ${f(hi, 3)})/2 = ${f((lo + hi) / 2, 3)}$; $ME = (${f(hi, 3)} - ${f(lo, 3)})/2 = ${f((hi - lo) / 2, 3)}$`, readT(n - 1, 0.975).text, `$s = ${f((hi - lo) / 2, 4)} \\times \\sqrt{${n}}/${f(t, 3)} = ${f(((hi - lo) / 2) * Math.sqrt(n) / t, 3)}$`],
      };
    },
  },
  {
    id: 'w2-prop-data', title: 'Proportion CI from the course dataset', topic: 'ci-prop', difficulty: 1,
    generate: (rng) => {
      const v = rng.pick([{ label: 'passed the course', x: 49 }, { label: 'have a part-time job', x: 25 }, { label: 'report HIGH stress', x: 13 }, { label: 'use tutoring as study method', x: 13 }]);
      const conf = confPick(rng), n = 60, p = v.x / n, se = Math.sqrt((p * (1 - p)) / n), z = zConf(conf);
      return {
        prompt: `In the dataset, ${v.x} of the 60 students ${v.label}. Treat them as a random sample and build a **${pct(conf)}** CI for π (bounds with 3 decimals).`,
        inputs: [num('lo', 'Lower bound', p - z * se, 3, 0.002), num('hi', 'Upper bound', p + z * se, 3, 0.002)],
        hints: ['p = x/60', 'p ± z·√(p(1−p)/n)'],
        solution: [`$p = ${v.x}/60 = ${f(p, 4)}$, $SE = ${f(se, 4)}$, $z = ${f(z, 3)}$`, `CI: **[${f(p - z * se, 3)}; ${f(p + z * se, 3)}]**`],
      };
    },
  },
  {
    id: 'w2-width', title: 'Interval width and sample size', topic: 'ci-mean', difficulty: 3,
    generate: (rng) => {
      const sigma = rng.pick([0.85, 2, 3.3]), n = rng.pick([25, 36, 64]), k = rng.pick([2, 3, 4]);
      const w1 = 2 * 1.96 * sigma / Math.sqrt(n);
      return {
        prompt: `A 95 % Z interval for μ (σ = ${sigma}) based on n = ${n} has width W.\n\n(a) Compute W (3 decimals).\n(b) What sample size makes the interval **${k} times narrower**?\n(c) What is the new width? (3 decimals)`,
        inputs: [num('w', '(a) W', w1, 3, 0.002), num('n2', '(b) new n', n * k * k, 0, 0), num('w2', '(c) new width', w1 / k, 3, 0.002)],
        hints: ['W = 2 × ME = 2 × 1.96 × σ/√n', `Width ∝ 1/√n → to divide W by ${k}, multiply n by ${k}².`],
        solution: [`$W = 2 \\times 1.96 \\times ${sigma}/\\sqrt{${n}} = ${f(w1, 3)}$`, `$n' = ${k}^2 \\times ${n} = ${n * k * k}$`, `$W' = ${f(w1 / k, 3)}$`],
      };
    },
  },
];

export const interpretations: InterpretationTask[] = [
  {
    id: 'w2-int-ci', topic: 'ci-mean', title: 'Interpret a 95 % CI',
    prompt: 'From n = 16 students: 95 % CI for the mean GPA = [14.36; 15.64]. Write the interpretation a lecturer wants to read, and add one sentence about precision.',
    model: 'We are 95 % confident that the mean GPA of the population of Nova students lies between 14.36 and 15.64 (on the 0–20 scale); i.e. 95 % of intervals constructed this way would contain the true mean. The margin of error is about ±0.64 points — a larger sample would give a narrower, more precise interval.',
    checklist: ['Refers to the POPULATION mean μ (not x̄, not individual students)', 'Uses "confident" (not "probability that μ…")', 'Gives the bounds with context/units', 'Mentions precision / margin of error'],
  },
  {
    id: 'w2-int-clt', topic: 'sampling', title: 'Justify the normal model with the CLT',
    prompt: 'AttendancePercent is clearly left-skewed. A colleague says you cannot use the normal distribution to compute probabilities about the mean attendance of 40 random students. Respond in 2–3 sentences.',
    model: 'The skewness concerns individual attendance values. By the Central Limit Theorem, with n = 40 ≥ 30 the sampling distribution of the sample mean is approximately normal, with mean μ and standard error σ/√40, whatever the shape of the population. So normal-based probabilities for x̄ are justified (but not for single students).',
    checklist: ['Names the CLT', 'Distinguishes distribution of the data vs. of the sample mean', 'Mentions n ≥ 30', 'Gives the mean and SE of x̄'],
  },
];
