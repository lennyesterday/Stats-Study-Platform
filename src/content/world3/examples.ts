import { mean, round, sd, tCdf } from '../../lib/stats';
import { tPBounds, zTable } from '../../lib/tables';
import { f, numColumn, readT, readZp } from '../helpers';
import type { WorkedExample } from '../types';

const t1 = (15.8 - 15) / (2.4 / Math.sqrt(40));
const t2 = (4.6 - 5) / (1.1 / Math.sqrt(25));
const z3 = round((6.77 - 7) / (0.85 / Math.sqrt(60)), 2);
const p4 = 49 / 60, z4 = round((p4 - 0.9) / Math.sqrt((0.9 * 0.1) / 60), 2);
const grade = numColumn('FinalGrade');
const gm = mean(grade), gse = sd(grade) / Math.sqrt(60), t5 = (gm - 65) / gse;
const p5 = 2 * (1 - tCdf(Math.abs(t5), 59));
const cut = 15 + 1.645 * 0.4, z6 = round((cut - 16) / 0.4, 2);

export const examples: WorkedExample[] = [
  {
    id: 'w3-ex1', title: 'Course example: is the mean GPA 15?', topic: 'testing',
    context: 'A sample of **n = 40** students has mean GPA **x̄ = 15.8** and **s = 2.4** (0–20 scale). At α = 0.05, does the mean GPA differ from **15**?',
    steps: [
      { label: 'Hypotheses', body: '$H_0: \\mu = 15$ vs $H_1: \\mu \\ne 15$ (two-tailed: "differ").' },
      { label: 'Significance level', body: 'α = 0.05 → α/2 = 0.025 in each tail.' },
      { label: 'Test statistic', body: `σ unknown → t with df = 39: $t = \\frac{15.8 - 15}{2.4/\\sqrt{40}} = \\frac{0.8}{${f(2.4 / Math.sqrt(40), 4)}} = ${f(t1, 3)}$` },
      { label: 'Critical value (table)', body: `df = 39 is not in the table → use the closest row: ${readT(40, 0.975).text} (exact: 2.023). Decision rule: reject H₀ if |t| > 2.021.` },
      { label: 'Decision', body: `|${f(t1, 2)}| > 2.021 → **reject H₀**. (p-value ≈ ${f(2 * (1 - tCdf(t1, 39)), 3)} < 0.05.)` },
      { label: 'Conclusion', body: 'At the 5 % significance level there is sufficient evidence that the mean GPA of the population differs from 15 (it appears to be higher).' },
    ],
  },
  {
    id: 'w3-ex2', title: 'Claim: "5 hours of study per day"', topic: 'testing',
    context: 'A study guide claims students study **5 hours per day** on average. A sample of **n = 25** gives x̄ = 4.6 h, s = 1.1 h. Test at α = 0.05.',
    steps: [
      { label: 'Hypotheses', body: '$H_0: \\mu = 5$ vs $H_1: \\mu \\ne 5$' },
      { label: 'Statistic', body: `$t = \\frac{4.6 - 5}{1.1/\\sqrt{25}} = \\frac{-0.4}{0.22} = ${f(t2, 3)}$, df = 24` },
      { label: 'Critical value', body: `${readT(24, 0.975).text}. Rejection region: |t| > 2.064.` },
      { label: 'p-value bracket', body: `|t| = ${f(Math.abs(t2), 3)} lies between 1.711 (0.950) and 2.064 (0.975) in row 24 → one tail between 0.025 and 0.05 → **${tPBounds(t2, 24, 'two').text}** (two-tailed).` },
      { label: 'Decision & conclusion', body: `|${f(t2, 2)}| < 2.064 and p > 0.05 → **do not reject H₀**. The data do not provide sufficient evidence that the mean daily study time differs from 5 hours. (This does **not** prove it is 5.)` },
    ],
  },
  {
    id: 'w3-ex3', title: 'Do students sleep less than 7 hours? (z test, left tail)', topic: 'testing',
    context: 'n = 60 students, x̄ = 6.77 h. Assume σ = 0.85 h is known. α = 0.05.',
    steps: [
      { label: 'Hypotheses', body: '$H_0: \\mu \\ge 7$ vs $H_1: \\mu < 7$ (left-tailed: "less than").' },
      { label: 'Statistic', body: `$z = \\frac{6.77 - 7}{0.85/\\sqrt{60}} = ${f(z3, 2)}$` },
      { label: 'Critical value', body: 'Left-tailed, α = 0.05 → $-z_{0.95} = -1.645$. Reject if z < −1.645.' },
      { label: 'p-value', body: `${readZp(z3).text} → p = **${f(zTable(z3), 4)}**` },
      { label: 'Decision & conclusion', body: `z = ${f(z3, 2)} < −1.645 (and p = ${f(zTable(z3), 4)} < 0.05) → **reject H₀**. There is significant evidence that students sleep on average less than 7 hours per night.` },
    ],
  },
  {
    id: 'w3-ex4', title: 'Testing the pass rate (proportion)', topic: 'test-prop',
    context: 'The programme claims that **at least 90 %** of students pass. In the dataset 49 of 60 passed. Test at α = 0.05.',
    steps: [
      { label: 'Hypotheses', body: '$H_0: \\pi \\ge 0.90$ vs $H_1: \\pi < 0.90$' },
      { label: 'Conditions', body: 'nπ₀ = 54 ≥ 5, n(1−π₀) = 6 ≥ 5 ✓' },
      { label: 'Statistic (SE with π₀!)', body: `$p = ${f(p4, 4)}$; $z = \\frac{${f(p4, 4)} - 0.90}{\\sqrt{0.9 \\cdot 0.1/60}} = ${f(z4, 2)}$` },
      { label: 'p-value', body: `${readZp(z4).text} → p = **${f(zTable(z4), 4)}**` },
      { label: 'Conclusion', body: `p < 0.05 → reject H₀: at the 5 % level, the pass rate is significantly below 90 %.` },
    ],
  },
  {
    id: 'w3-ex5', title: 'Reading a Jamovi one-sample t-test', topic: 'errors',
    context: 'Jamovi → One Sample T-Test, FinalGrade, test value 65, H₁: μ ≠ 65.',
    output: { title: 'Jamovi — One Sample T-Test', rows: [['', 'Statistic', 'df', 'p', 'Mean difference', 'SE difference'], ['FinalGrade  Student\'s t', f(t5, 2), '59.0', f(p5, 3), f(gm - 65, 2), f(gse, 3)]] },
    steps: [
      { label: 'What was tested?', body: '$H_0: \\mu = 65$ vs $H_1: \\mu \\ne 65$ for the mean final grade.' },
      { label: 'Check the statistic', body: `$t = (67.17 - 65)/${f(gse, 3)} = ${f(t5, 2)}$ ✓` },
      { label: 'Decision', body: `p = ${f(p5, 3)} > 0.05 → **do not reject H₀**. Equivalent: |t| = ${f(t5, 2)} < $t_{0.975;60} = 2.000$.` },
      { label: 'Conclusion', body: 'There is not sufficient evidence that the mean final grade differs from 65. A mean difference of 2.17 points is not statistically significant with n = 60.' },
    ],
  },
  {
    id: 'w3-ex6', title: 'Power and Type II error', topic: 'errors',
    context: '$H_0: \\mu = 15$ vs $H_1: \\mu > 15$, σ = 2, n = 25, α = 0.05. What is the power if the true mean is **16**?',
    steps: [
      { label: 'Rejection region in x̄ units', body: `SE = 2/5 = 0.4. Reject if $\\bar x > 15 + 1.645 \\times 0.4 = ${f(cut, 3)}$.` },
      { label: 'Under the true μ = 16', body: `$z = (${f(cut, 3)} - 16)/0.4 = ${f(z6, 2)}$` },
      { label: 'Power', body: `Power = $P(Z > ${f(z6, 2)}) = ${f(zTable(-z6), 4)}$` },
      { label: 'Type II error', body: `β = 1 − power = **${f(1 - zTable(-z6), 4)}**. With a larger n, SE shrinks and the power increases.` },
    ],
  },
];
