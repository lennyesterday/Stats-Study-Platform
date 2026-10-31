import type { Rng } from '../../lib/rng';
import { mean, median, round, sd, variance } from '../../lib/stats';
import { T_DFS, tTable, zFromTable, zTable } from '../../lib/tables';
import { CHI2_TABLE, T_TABLE } from '../tables';
import { f, num, numColumn, readChi2, readF, readT, readZ, readZp } from '../helpers';
import type { ExerciseDef, InterpretationTask } from '../types';

const sample = (rng: Rng, col: Parameters<typeof numColumn>[0], n: number) => rng.shuffle(numColumn(col)).slice(0, n);
const zDec = (p: number) => (String(zFromTable(p)).split('.')[1]?.length ?? 0) > 2 ? 3 : 2;

export const exercises: ExerciseDef[] = [
  {
    id: 'w1-mean-median', title: 'Mean and median of a sample', topic: 'descriptives', difficulty: 1,
    generate: (rng) => {
      const xs = sample(rng, 'StudyHoursPerWeek', rng.int(6, 8));
      const sorted = [...xs].sort((a, b) => a - b);
      return {
        prompt: `A random sample of ${xs.length} students reports **StudyHoursPerWeek**: ${xs.join(', ')}.\n\nCompute the mean and the median (use 2 decimal digits).`,
        inputs: [num('mean', 'Mean x̄', mean(xs), 2), num('median', 'Median', median(xs), 2)],
        hints: ['Mean = sum of values ÷ n.', 'For the median, order the values first. Even n → average of the two middle values.'],
        solution: [`Sum = ${round(xs.reduce((a, b) => a + b, 0), 2)}, n = ${xs.length} → $\\bar x = ${f(mean(xs), 2)}$`, `Ordered: ${sorted.join(', ')} → median = **${f(median(xs), 2)}**`],
      };
    },
  },
  {
    id: 'w1-sample-var', title: 'Sample variance and standard deviation', topic: 'descriptives', difficulty: 2,
    generate: (rng) => {
      const xs = sample(rng, 'SleepHoursPerNight', 6);
      const m = mean(xs);
      return {
        prompt: `Six students report **SleepHoursPerNight**: ${xs.join(', ')}. Treat them as a **sample**.\n\nCompute $s^2$ and $s$ (3 decimal digits).`,
        inputs: [num('var', 'Sample variance s²', variance(xs), 3, 0.002), num('sd', 'Standard deviation s', sd(xs), 3, 0.002)],
        hints: ['First compute x̄.', 'Sum the squared deviations (xᵢ − x̄)².', 'Divide by n − 1 = 5, then take the square root.'],
        solution: [
          `$\\bar x = ${f(m, 4)}$`,
          `Squared deviations: ${xs.map((x) => f((x - m) ** 2, 4)).join('; ')} → sum = ${f(xs.reduce((a, x) => a + (x - m) ** 2, 0), 4)}`,
          `$s^2 = ${f(xs.reduce((a, x) => a + (x - m) ** 2, 0), 4)}/5 = ${f(variance(xs), 3)}$, $s = ${f(sd(xs), 3)}$`,
        ],
      };
    },
  },
  {
    id: 'w1-pop-sample', title: 'Population vs. sample variance (VAR.P vs VAR.S)', topic: 'descriptives', difficulty: 2,
    generate: (rng) => {
      const xs = sample(rng, 'Age', 5);
      return {
        prompt: `Ages of 5 students: ${xs.join(', ')}.\n\n(a) Treat them as the whole **population**: compute $\\sigma^2$.\n(b) Treat them as a **sample**: compute $s^2$. (2 decimals each)`,
        inputs: [num('pop', 'σ² (population)', variance(xs, true), 2), num('samp', 's² (sample)', variance(xs), 2)],
        hints: ['Both use the same sum of squared deviations.', 'Population divides by N = 5, sample by n − 1 = 4.'],
        solution: [`Mean = ${f(mean(xs), 2)}; SS = ${f(variance(xs, true) * 5, 4)}`, `$\\sigma^2 = SS/5 = ${f(variance(xs, true), 2)}$, $s^2 = SS/4 = ${f(variance(xs), 2)}$.`],
      };
    },
  },
  {
    id: 'w1-z-forward', title: 'Z table: score → probability', topic: 'tables', difficulty: 1,
    generate: (rng) => {
      const z = rng.float(-2.6, 2.6, 2);
      return {
        prompt: `Determine $P(Z < ${f(z, 2)})$ for a standard normal random variable (use 4 decimal digits).`,
        inputs: [num('p', 'P(Z < z)', zTable(z), 4, 0)],
        hints: ['Row = first decimal, column = second decimal.', z < 0 ? 'The table only has positive z: P(Z < −a) = 1 − P(Z < a).' : 'Read the cell directly.'],
        solution: [readZp(z).text],
      };
    },
  },
  {
    id: 'w1-z-tails', title: 'Z table: upper tails and intervals', topic: 'tables', difficulty: 2,
    generate: (rng) => {
      const z = rng.float(0.2, 2.8, 2);
      const a = rng.float(-2.2, -0.1, 2), b = rng.float(0.1, 2.2, 2);
      return {
        prompt: `For a standard normal random variable Z determine (4 decimal digits):\n\n(a) $P(Z > ${f(z, 2)})$\n(b) $P(${f(a, 2)} < Z < ${f(b, 2)})$`,
        inputs: [num('a', '(a) P(Z > z)', 1 - zTable(z), 4, 0), num('b', '(b) P(a < Z < b)', zTable(b) - zTable(a), 4, 0.0001)],
        hints: ['P(Z > z) = 1 − P(Z < z).', 'P(a < Z < b) = P(Z < b) − P(Z < a).'],
        solution: [`(a) ${readZp(z).text} → $1 - ${f(zTable(z), 4)} = ${f(1 - zTable(z), 4)}$`, `(b) ${readZp(b).text}\n\n${readZp(a).text}\n\n→ ${f(zTable(b), 4)} − ${f(zTable(a), 4)} = **${f(zTable(b) - zTable(a), 4)}**`],
      };
    },
  },
  {
    id: 'w1-z-inverse', title: 'Z table: probability → score', topic: 'tables', difficulty: 1,
    generate: (rng) => {
      const p = rng.pick([0.8, 0.85, 0.9, 0.95, 0.975, 0.99, 0.995]);
      const d = zDec(p);
      return {
        prompt: `Determine the value (z-score) of a standard normal random variable such that the probability of obtaining a value **below** it is ${p} (use ${d} decimal digits).`,
        inputs: [num('z', 'z', zFromTable(p), d, 0.01)],
        hints: ['Search the body of the Z table for the probability.', 'If it falls halfway between two cells, take the midpoint.'],
        solution: [readZ(p).text],
      };
    },
  },
  {
    id: 'w1-z-above', title: 'Z table: "above" questions', topic: 'tables', difficulty: 2,
    generate: (rng) => {
      const p = rng.pick([0.9, 0.95, 0.975, 0.99, 0.1, 0.05, 0.025, 0.01]);
      const below = round(1 - p, 4);
      const d = zDec(below);
      return {
        prompt: `Determine the z-score such that the probability of obtaining a value **above** it is ${p} (use ${d} decimal digits).`,
        inputs: [num('z', 'z', zFromTable(below), d, 0.01)],
        hints: ['P(Z > z) = p ⇔ P(Z < z) = 1 − p.', 'Is the area to the right large (> 0.5)? Then z must be negative.'],
        solution: [`$P(Z > z) = ${p} \\iff P(Z < z) = ${below}$`, readZ(below).text],
      };
    },
  },
  {
    id: 'w1-t-inverse', title: 't table: probability → score', topic: 'tables', difficulty: 1,
    generate: (rng) => {
      const df = rng.pick(T_DFS);
      const p = rng.pick(T_TABLE.probs.slice(0, 7));
      return {
        prompt: `Determine the value (t-score) of a t-Student random variable with **${df} degrees of freedom** such that the probability of obtaining a value **below** it is ${p} (use 3 decimal digits).`,
        inputs: [num('t', 't', tTable(df, p).value, 3, 0)],
        hints: ['Row = df, column = P[t < t-score].'],
        solution: [readT(df, p).text],
      };
    },
  },
  {
    id: 'w1-t-above', title: 't table: the "above" trap', topic: 'tables', difficulty: 2,
    generate: (rng) => {
      const df = rng.pick(T_DFS.filter((d) => d <= 30));
      const p = rng.pick([0.975, 0.95, 0.9, 0.99, 0.025, 0.05, 0.1, 0.01]);
      const below = round(1 - p, 3);
      const v = tTable(df, below).value;
      return {
        prompt: `Determine the t-score of a t-Student random variable with **${df} degrees of freedom** such that the probability of obtaining a value **above** it is ${p} (use 2 decimal digits).`,
        inputs: [num('t', 't', v, 2, 0)],
        hints: ['Translate: P(T > t) = p ⇔ P(T < t) = 1 − p.', 'Columns below 0.500 do not exist — use symmetry.'],
        solution: [`$P(T > t) = ${p} \\iff P(T < t) = ${below}$`, below < 0.5 ? `${readT(df, round(1 - below, 3)).text}; by symmetry t = **${f(v, 3)}** → 2 decimals: **${f(v, 2)}**` : `${readT(df, below).text} → 2 decimals: **${f(v, 2)}**`],
      };
    },
  },
  {
    id: 'w1-t-prob', title: 't table: score → probability', topic: 'tables', difficulty: 2,
    generate: (rng) => {
      const i = rng.int(0, T_TABLE.dfs.length - 2);
      const j = rng.int(1, 9);
      const df = T_TABLE.dfs[i]!, t = T_TABLE.values[i][j], p = T_TABLE.probs[j];
      return {
        prompt: `Determine the probability that a t-Student random variable with **${df} degrees of freedom** exceeds a t-score of ${f(t, 3)} (use 3 decimal digits).`,
        inputs: [num('p', 'P(T > t)', 1 - p, 3, 0)],
        hints: [`Look for ${f(t, 3)} in row df = ${df}.`, 'The column header is P(T < t); you need the complement.'],
        solution: [`Row df = ${df}: ${f(t, 3)} is in column **${p.toFixed(3)}** → $P(T < ${f(t, 3)}) = ${p}$`, `$P(T > ${f(t, 3)}) = 1 - ${p} = $ **${f(1 - p, 3)}**`],
      };
    },
  },
  {
    id: 'w1-chi-f', title: 'χ² and F tables', topic: 'tables', difficulty: 2,
    generate: (rng) => {
      const df = rng.pick(CHI2_TABLE.dfs.slice(0, 20));
      const p = rng.pick([0.95, 0.99, 0.975, 0.9, 0.05, 0.025]);
      const ns = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 60];
      const n = rng.pick(ns), m = rng.pick([1, 2, 3, 4, 5, 6, 8, 10]);
      const fp = rng.pick([0.95, 0.99, 0.9]);
      const c = readChi2(df, p), ff = readF(m, n, fp);
      return {
        prompt: `(a) Find q such that $P(\\chi^2_{${df}} < q) = ${p}$ (3 decimals).\n\n(b) Find f such that $P(F_{${m},${n}} < f) = ${fp}$ (2 decimals).`,
        inputs: [num('q', '(a) q', c.value, 3, 0), num('f', '(b) f', ff.value, 2, 0)],
        hints: ['χ²: row = df, column = probability.', 'F: block = n (denominator), row = probability, column = m (numerator).'],
        solution: [`(a) ${c.text}`, `(b) ${ff.text}`],
      };
    },
  },
  {
    id: 'w1-standardize', title: 'Standardise and use the Z table', topic: 'distributions', difficulty: 2,
    generate: (rng) => {
      const v = rng.pick([
        { name: 'FinalGrade', mu: 67.2, s: 15.2, lo: 40, hi: 95, dec: 0 },
        { name: 'SleepHoursPerNight', mu: 6.8, s: 0.85, lo: 5.2, hi: 8.3, dec: 1 },
        { name: 'StudyHoursPerWeek', mu: 9.3, s: 3.3, lo: 3, hi: 16, dec: 1 },
      ]);
      const x = rng.float(v.lo, v.hi, v.dec);
      const above = rng.next() < 0.5;
      const z = round((x - v.mu) / v.s, 2);
      const p = above ? 1 - zTable(z) : zTable(z);
      return {
        prompt: `Assume **${v.name}** ~ N(μ = ${v.mu}, σ = ${v.s}). For a randomly chosen student, find\n\n(a) the z-score of x = ${x} (2 decimals) and\n(b) $P(X ${above ? '>' : '<'} ${x})$ using the Z table (4 decimals).`,
        inputs: [num('z', '(a) z', z, 2, 0.01), num('p', `(b) P(X ${above ? '>' : '<'} x)`, p, 4, 0.0001)],
        hints: ['z = (x − μ) / σ', above ? 'P(X > x) = 1 − P(Z < z).' : 'P(X < x) = P(Z < z).'],
        solution: [`$z = \\frac{${x} - ${v.mu}}{${v.s}} = ${f(z, 2)}$`, readZp(z).text, above ? `$P(X > ${x}) = 1 - ${f(zTable(z), 4)} = $ **${f(p, 4)}**` : `$P(X < ${x}) = $ **${f(p, 4)}**`],
      };
    },
  },
];

export const interpretations: InterpretationTask[] = [
  {
    id: 'w1-int-desc', topic: 'descriptives', title: 'Describe FinalGrade in two sentences',
    prompt: 'Excel output for FinalGrade (n = 60): Mean 67.17, Median 68.5, SD 15.16, Skewness −0.26, Min 36, Max 94. Write two sentences describing centre, spread and shape for a non-statistician.',
    model: 'The typical final grade is about 67 points (half of the students scored below 68.5), and grades typically deviate by about 15 points from the average, ranging from 36 to 94. The distribution is slightly skewed to the left: a few low grades pull the mean just below the median.',
    checklist: ['Mentions a centre (mean and/or median) with units/meaning', 'Interprets the median as "50 % below"', 'Mentions spread (SD or range) in context', 'Names the skew direction correctly (left / negative)'],
  },
  {
    id: 'w1-int-table', topic: 'tables', title: 'Explain a table value in words',
    prompt: 'A classmate writes: "From the t table, t₁₅ = 2.131 at 0.975, so P(T₁₅ > 2.131) = 0.975." Explain the mistake and give the correct statement(s).',
    model: 'The table is cumulative from the left: 0.975 is P(T₁₅ < 2.131). Therefore P(T₁₅ > 2.131) = 1 − 0.975 = 0.025. By symmetry, the value with 97.5 % of the probability ABOVE it is −2.131.',
    checklist: ['States that the table gives P(T < t) (left tail)', 'Gives P(T > 2.131) = 0.025', 'Mentions symmetry / −2.131 for "above = 0.975"'],
  },
];
