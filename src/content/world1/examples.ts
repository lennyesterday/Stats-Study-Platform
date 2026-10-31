import { mean, median, mode, percentile, round, sd, skewness, sum, variance } from '../../lib/stats';
import { zTable } from '../../lib/tables';
import { f, numColumn, readChi2, readF, readT, readZ, readZp } from '../helpers';
import type { WorkedExample } from '../types';

const hours = [9.5, 16, 8.5, 15, 13, 6];
const m = mean(hours);
const dev = hours.map((x) => x - m);
const sq = dev.map((d) => d * d);

const grade = numColumn('FinalGrade');
const n = grade.length;
const kurt = (() => {
  const s = sd(grade), mu = mean(grade);
  const k = sum(grade.map((x) => ((x - mu) / s) ** 4));
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * k - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
})();

const zg = round((50 - 67.2) / 15.2, 2);

export const examples: WorkedExample[] = [
  {
    id: 'w1-ex1',
    title: 'Mean, median, variance and SD by hand',
    topic: 'descriptives',
    context: `Six students from the dataset report their **StudyHoursPerWeek**: ${hours.join(', ')}. Treat them as a **sample**. Compute $\\bar x$, the median, $s^2$ and $s$.`,
    steps: [
      { label: 'Mean', body: `$\\bar x = \\frac{${hours.join(' + ')}}{6} = \\frac{${sum(hours)}}{6} = ${f(m, 3)}$` },
      { label: 'Median', body: `Order the data: ${[...hours].sort((a, b) => a - b).join(', ')}. With n = 6 (even) the median is the average of the 3rd and 4th values: $(${[...hours].sort((a, b) => a - b)[2]} + ${[...hours].sort((a, b) => a - b)[3]})/2 = ${f(median(hours), 2)}$.` },
      { label: 'Squared deviations', body: `$x_i - \\bar x$: ${dev.map((d) => f(d, 3)).join('; ')}\n\n$(x_i-\\bar x)^2$: ${sq.map((d) => f(d, 3)).join('; ')} → sum = **${f(sum(sq), 3)}**` },
      { label: 'Sample variance', body: `$s^2 = \\frac{${f(sum(sq), 3)}}{6-1} = ${f(variance(hours), 3)}$ hours²` },
      { label: 'Standard deviation', body: `$s = \\sqrt{${f(variance(hours), 3)}} = ${f(sd(hours), 3)}$ hours. (Population version: $\\sigma^2 = ${f(sum(sq), 3)}/6 = ${f(variance(hours, true), 3)}$.)` },
      { label: 'Conclusion', body: `On average these six students study **${f(m, 2)} hours per week**, and a typical student deviates by about **${f(sd(hours), 2)} hours** from that mean. Mean ≈ median → no strong skew.` },
    ],
  },
  {
    id: 'w1-ex2',
    title: 'Z table in both directions (course tasks)',
    topic: 'tables',
    context: 'Find (a) z with $P(Z < z) = 0.95$; (b) z with $P(Z > z) = 0.90$; (c) $P(-1.20 < Z < 0.85)$.',
    steps: [
      { label: 'Sketch first', body: 'Draw the bell curve, mark the requested area. (a) 95 % to the **left** → z is positive. (b) 90 % to the **right** → only 10 % on the left → z is negative.' },
      { label: '(a) probability → score', body: readZ(0.95).text + '. 0.95 lies exactly halfway between 0.9495 (z = 1.64) and 0.9505 (z = 1.65), so we take the midpoint **1.645**.' },
      { label: '(b) "above" → convert to "below"', body: `$P(Z > z) = 0.90 \\iff P(Z < z) = 0.10$. ${readZ(0.1).text}. (0.10 is not in the table; the closest is 1 − 0.8997 → 1.28.)` },
      { label: '(c) area between two scores', body: `${readZp(0.85).text}\n\n${readZp(-1.2).text}\n\n$P(-1.20 < Z < 0.85) = ${f(zTable(0.85), 4)} - ${f(zTable(-1.2), 4)} = ${f(zTable(0.85) - zTable(-1.2), 4)}$` },
      { label: 'Conclusion', body: '**z = 1.645**, **z = −1.28**, probability **' + f(zTable(0.85) - zTable(-1.2), 4) + '**. Always check the sign against your sketch.' },
    ],
  },
  {
    id: 'w1-ex3',
    title: 't table: the "above" trap',
    topic: 'tables',
    context: 'Find (a) t with df = 5 and $P(T < t) = 0.90$; (b) t with df = 15 such that the probability of obtaining a value **above** it is 0.975 (2 decimals); (c) $P(T_{20} > 1.064)$ (2 decimals).',
    steps: [
      { label: '(a)', body: readT(5, 0.9).text + '.' },
      { label: '(b) translate "above"', body: `$P(T_{15} > t) = 0.975 \\iff P(T_{15} < t) = 0.025$. The table only has columns ≥ 0.500, so use symmetry: $t_{0.025} = -t_{0.975}$. ${readT(15, 0.975).text} ⇒ **t = −2.131** → with 2 decimals: **−2.13**.` },
      { label: '(c) score → probability', body: 'Search row df = 20 for 1.064 → it sits in column **0.850**, so $P(T_{20} < 1.064) = 0.85$ and $P(T_{20} > 1.064) = 1 - 0.85 = $ **0.15**.' },
      { label: 'Watch out', body: 'The question asks for 2 decimals, so "−2.131" counts as **wrong**. Always round to exactly the requested precision.' },
    ],
  },
  {
    id: 'w1-ex4',
    title: 'χ² and F tables: no symmetry allowed',
    topic: 'tables',
    context: 'Find (a) q with $P(\\chi^2_4 < q) = 0.95$; (b) q with $P(\\chi^2_{10} < q) = 0.05$; (c) f with $P(F_{5,6} < f) = 0.95$; (d) f with $P(F_{3,20} < f) = 0.99$.',
    steps: [
      { label: '(a) upper tail', body: readChi2(4, 0.95).text + '.' },
      { label: '(b) lower tail', body: `${readChi2(10, 0.05).text}. Note: you **cannot** get this from the 0.95 column by changing a sign — χ² is right-skewed and only positive.` },
      { label: '(c) F: find the block first', body: `${readF(5, 6, 0.95).text}. This is the highlighted cell in the course table.` },
      { label: '(d)', body: readF(3, 20, 0.99).text + '.' },
      { label: 'Checklist', body: '- χ²: row = df, column = $P[\\chi^2 < q]$.\n- F: block = $n$ (denominator df), row = probability, column = $m$ (numerator df).' },
    ],
  },
  {
    id: 'w1-ex5',
    title: 'Standardising: how many students fail?',
    topic: 'distributions',
    context: 'Assume FinalGrade ~ N(μ = 67.2, σ = 15.2) (values from the dataset). What proportion of students would be expected to **fail** (grade below 50)? Compare with the data (11 of 60 failed).',
    steps: [
      { label: 'Standardise', body: `$z = \\frac{50 - 67.2}{15.2} = ${f(zg, 2)}$` },
      { label: 'Read the table', body: readZp(zg).text },
      { label: 'Compare', body: `Model: **${f(zTable(zg), 4)}** (≈ ${f(zTable(zg) * 100, 1)} %). Data: 11/60 = **${f(11 / 60, 4)}**. The normal model is a decent but not perfect approximation (the grade distribution is slightly left-skewed).` },
      { label: 'Conclusion', body: `Under a normal model about ${f(zTable(zg) * 100, 0)} % of students would fail; in the sample it was ${f((11 / 60) * 100, 0)} %.` },
    ],
  },
  {
    id: 'w1-ex6',
    title: 'Reading Excel "Descriptive Statistics" output',
    topic: 'descriptives',
    context: 'Excel → Data Analysis → Descriptive Statistics for **FinalGrade** (60 students). Interpret centre, spread and shape.',
    output: {
      title: 'FinalGrade — Descriptive Statistics (Excel)',
      rows: [
        ['Statistic', 'Value'],
        ['Mean', f(mean(grade), 3)],
        ['Standard Error', f(sd(grade) / Math.sqrt(n), 3)],
        ['Median', f(median(grade), 1)],
        ['Mode', String(mode(grade)[0])],
        ['Standard Deviation', f(sd(grade), 3)],
        ['Sample Variance', f(variance(grade), 3)],
        ['Kurtosis', f(kurt, 3)],
        ['Skewness', f(skewness(grade), 3)],
        ['Range', String(Math.max(...grade) - Math.min(...grade))],
        ['Minimum', String(Math.min(...grade))],
        ['Maximum', String(Math.max(...grade))],
        ['Sum', String(sum(grade))],
        ['Count', String(n)],
      ],
    },
    steps: [
      { label: 'Centre', body: `Mean ${f(mean(grade), 1)} and median ${f(median(grade), 1)}: half of the students scored below 68.5.` },
      { label: 'Spread', body: `SD = ${f(sd(grade), 1)} points: grades typically deviate about 15 points from the mean. Excel reports the **sample** variance (n − 1). The middle 50 % lie between Q1 = ${f(percentile(grade, 0.25), 2)} and Q3 = ${f(percentile(grade, 0.75), 2)}.` },
      { label: 'Shape', body: `Skewness ${f(skewness(grade), 2)} < 0 and mean < median → slight **left** skew (a tail of low grades).` },
      { label: 'Standard Error', body: `"Standard Error" = $s/\\sqrt n$ = ${f(sd(grade), 3)}/√60 = ${f(sd(grade) / Math.sqrt(n), 3)} — the SD of the **sample mean**. You will need it in World 2.` },
      { label: 'Write it up', body: '*"The average final grade is 67.2 (median 68.5) with a standard deviation of 15.2 points; the distribution is slightly left-skewed."*' },
    ],
  },
];
