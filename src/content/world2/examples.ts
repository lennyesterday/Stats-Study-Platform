import { ciMeanT, ciProportion, mean, round, sampleSizeMean, sd } from '../../lib/stats';
import { zTable } from '../../lib/tables';
import { f, numColumn, readT, readZ, readZp } from '../helpers';
import type { WorkedExample } from '../types';

const se1 = 3.3 / Math.sqrt(36);
const z1 = round((10 - 9.3) / se1, 2);

const se2 = 0.85 / Math.sqrt(40);
const me2 = 1.96 * se2;

const ci3 = ciMeanT(15.0, 1.2, 16, 0.95);

const p4 = 49 / 60;
const ci4 = ciProportion(p4, 60, 0.95);

const grade = numColumn('FinalGrade');
const gm = mean(grade), gs = sd(grade), gse = gs / Math.sqrt(60);

export const examples: WorkedExample[] = [
  {
    id: 'w2-ex1', title: 'CLT: probability about a sample mean', topic: 'sampling',
    context: 'StudyHoursPerWeek in the Nova population has μ = 9.3 and σ = 3.3 (not normal). A random sample of **n = 36** students is drawn. What is $P(\\bar X > 10)$?',
    steps: [
      { label: 'Justify the model', body: 'n = 36 ≥ 30 → by the **CLT** $\\bar X \\approx N(\\mu = 9.3,\\; SE = \\sigma/\\sqrt n)$, even though individual study hours are not normal.' },
      { label: 'Standard error', body: `$SE = 3.3/\\sqrt{36} = ${f(se1, 2)}$` },
      { label: 'Standardise', body: `$z = \\frac{10 - 9.3}{${f(se1, 2)}} = ${f(z1, 2)}$` },
      { label: 'Table', body: readZp(z1).text },
      { label: 'Answer', body: `$P(\\bar X > 10) = 1 - ${f(zTable(z1), 4)} = $ **${f(1 - zTable(z1), 4)}**. Only about ${f((1 - zTable(z1)) * 100, 0)} % of samples of 36 students would average more than 10 hours. (For a *single* student: z = 0.21 → 42 %. Means vary much less than individuals.)` },
    ],
  },
  {
    id: 'w2-ex2', title: 'CI for μ with σ known (Z)', topic: 'ci-mean',
    context: 'A sample of **n = 40** students sleeps on average **x̄ = 6.8 h**. From earlier studies σ = 0.85 h. Build a **95 %** CI for the mean sleep duration μ.',
    steps: [
      { label: 'Choose the method', body: 'Mean, σ known → Z interval $\\bar x \\pm z_{0.975}\\,\\sigma/\\sqrt n$.' },
      { label: 'Reliability factor', body: `95 % → α = 0.05 → α/2 = 0.025 → need $P(Z < z) = 0.975$. ${readZ(0.975).text}.` },
      { label: 'Standard error & ME', body: `$SE = 0.85/\\sqrt{40} = ${f(se2, 4)}$; $ME = 1.96 \\times ${f(se2, 4)} = ${f(me2, 4)}$` },
      { label: 'Interval', body: `$6.8 \\pm ${f(me2, 3)}$ → **[${f(6.8 - me2, 3)}; ${f(6.8 + me2, 3)}]** hours` },
      { label: 'Interpretation', body: `We are 95 % confident that the **population mean** sleep duration of Nova students lies between ${f(6.8 - me2, 2)} and ${f(6.8 + me2, 2)} hours per night.` },
    ],
  },
  {
    id: 'w2-ex3', title: 'CI for μ with σ unknown (t) — GPA', topic: 'ci-mean',
    context: 'A sample of **n = 16** students has mean GPA **x̄ = 15.0** (0–20 scale) and **s = 1.2**. Build a **95 %** CI for the mean GPA μ.',
    steps: [
      { label: 'Choose the method', body: 'σ unknown, small n → t interval with **df = n − 1 = 15**.' },
      { label: 'Reliability factor', body: readT(15, 0.975).text },
      { label: 'SE and ME', body: `$SE = 1.2/\\sqrt{16} = ${f(ci3.se, 2)}$; $ME = 2.131 \\times 0.3 = ${f(ci3.me, 3)}$` },
      { label: 'Interval', body: `$15.0 \\pm ${f(ci3.me, 3)}$ → **[${f(ci3.lower, 2)}; ${f(ci3.upper, 2)}]**` },
      { label: 'Interpretation & precision', body: `We are 95 % confident that the mean GPA of the population lies between ${f(ci3.lower, 2)} and ${f(ci3.upper, 2)}. Compare: "15.0 ± 0.2" would be far more precise than "15.0 ± 1.5"; ours (± ${f(ci3.me, 2)}) is in between. With z instead of t the ME would be 0.588 — too optimistic for n = 16.` },
    ],
  },
  {
    id: 'w2-ex4', title: 'CI for a proportion — the pass rate', topic: 'ci-prop',
    context: 'In the dataset **49 of 60** students passed. Build a 95 % CI for the population pass rate π.',
    steps: [
      { label: 'Point estimate & condition', body: `$p = 49/60 = ${f(p4, 4)}$. Check: np = 49 ≥ 5 and n(1−p) = 11 ≥ 5 ✓` },
      { label: 'Standard error', body: `$SE = \\sqrt{\\frac{${f(p4, 4)}\\,(1-${f(p4, 4)})}{60}} = ${f(ci4.se, 4)}$` },
      { label: 'Interval', body: `$${f(p4, 4)} \\pm 1.96 \\times ${f(ci4.se, 4)} = ${f(p4, 4)} \\pm ${f(ci4.me, 4)}$ → **[${f(ci4.lower, 3)}; ${f(ci4.upper, 3)}]**` },
      { label: 'Interpretation', body: `We are 95 % confident that between ${f(ci4.lower * 100, 1)} % and ${f(ci4.upper * 100, 1)} % of all Nova students in this programme pass the course.` },
    ],
  },
  {
    id: 'w2-ex5', title: 'Jamovi output: SE, CI and the missing table row', topic: 'ci-mean',
    context: 'Jamovi → Descriptives for **FinalGrade** (n = 60) with "Confidence interval for mean" ticked. Verify the CI by hand with the course tables.',
    output: { title: 'Jamovi — Descriptives: FinalGrade', rows: [['', 'FinalGrade'], ['N', '60'], ['Mean', f(gm, 2)], ['Std. error mean', f(gse, 3)], ['95% CI mean lower bound', f(gm - 2.001 * gse, 2)], ['95% CI mean upper bound', f(gm + 2.001 * gse, 2)], ['SD', f(gs, 2)]] },
    steps: [
      { label: 'Standard error', body: `$SE = s/\\sqrt n = ${f(gs, 3)}/\\sqrt{60} = ${f(gse, 3)}$ ✓ (matches "Std. error mean")` },
      { label: 'Reliability factor', body: `df = 59 is **not** a row of the course t table. Closest row: df = 60 → ${readT(60, 0.975).text}. (Exact T.INV(0.975; 59) = 2.001.)` },
      { label: 'Interval', body: `$${f(gm, 2)} \\pm 2.000 \\times ${f(gse, 3)}$ = [${f(gm - 2 * gse, 2)}; ${f(gm + 2 * gse, 2)}] — practically identical to Jamovi.` },
      { label: 'Interpretation', body: `We are 95 % confident that the mean final grade of the population lies between about ${f(gm - 2 * gse, 1)} and ${f(gm + 2 * gse, 1)} points.` },
    ],
  },
  {
    id: 'w2-ex6', title: 'Designing the study: required sample size', topic: 'ci-mean',
    context: 'You want to estimate mean sleep within **±0.2 h** with **95 %** confidence; σ ≈ 0.85 h. How many students do you need? And for ±0.1 h?',
    steps: [
      { label: 'Formula', body: '$n = (z\\,\\sigma/E)^2$, rounded **up**.' },
      { label: 'E = 0.2', body: `$n = (1.96 \\times 0.85/0.2)^2 = ${f((1.96 * 0.85 / 0.2) ** 2, 2)}$ → **${sampleSizeMean(1.96, 0.85, 0.2)}** students` },
      { label: 'E = 0.1', body: `$n = (1.96 \\times 0.85/0.1)^2 = ${f((1.96 * 0.85 / 0.1) ** 2, 2)}$ → **${sampleSizeMean(1.96, 0.85, 0.1)}** students` },
      { label: 'Lesson', body: 'Halving the margin of error requires roughly **four times** the sample size, because ME ∝ 1/√n.' },
    ],
  },
];
