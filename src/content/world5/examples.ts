import { chiSquareIndependence } from '../../lib/stats';
import { chi2PBounds } from '../../lib/tables';
import { column, f, readChi2, type ColumnName } from '../helpers';
import type { WorkedExample, SoftwareOutput } from '../types';

/** observed counts of two dataset columns, in the given category order */
export function crossTab(a: ColumnName, b: ColumnName, ra: string[], cb: string[]) {
  const A = column(a), B = column(b);
  return ra.map((r) => cb.map((c) => A.filter((x, i) => x === r && B[i] === c).length));
}

export function ctOutput(title: string, rowName: string, ra: string[], cb: string[], obs: number[][], withExpected = false): SoftwareOutput {
  const r = chiSquareIndependence(obs);
  const rows = [[rowName, ...cb, 'Total']];
  ra.forEach((name, i) => {
    rows.push([name, ...obs[i].map(String), String(r.rowTotals[i])]);
    if (withExpected) rows.push(['  expected', ...r.expected[i].map((e) => f(e, 2)), '']);
  });
  rows.push(['Total', ...r.colTotals.map(String), String(r.n)]);
  return { title, rows };
}

const job = crossTab('PartTimeJob', 'PassFail', ['No', 'Yes'], ['Pass', 'Fail']);
const rJob = chiSquareIndependence(job);

const STRESS = ['Low', 'Medium', 'High'];
const stress = crossTab('StressLevel', 'PartTimeJob', STRESS, ['No', 'Yes']);
const rStress = chiSquareIndependence(stress);

const METHODS = ['Solo', 'Group', 'Tutoring', 'OnlineResources'];
const method = crossTab('StudyMethod', 'PassFail', METHODS, ['Pass', 'Fail']);
const rMethod = chiSquareIndependence(method);

const place = [[30, 25, 15], [20, 35, 25]];
const rPlace = chiSquareIndependence(place);
const bPlace = chi2PBounds(rPlace.chi2, rPlace.df);
const vPlace = Math.sqrt(rPlace.chi2 / (rPlace.n * 1));

const cells = (r: ReturnType<typeof chiSquareIndependence>, obs: number[][], rows: string[], cols: string[]) =>
  obs.flatMap((row, i) => row.map((o, j) => `${rows[i]}/${cols[j]}: $(${o} - ${f(r.expected[i][j], 2)})^2/${f(r.expected[i][j], 2)} = ${f(r.contributions[i][j], 3)}$`)).join('\n- ');

export const examples: WorkedExample[] = [
  {
    id: 'w5-ex1', title: 'Part-time job and passing (2×2, dataset)', topic: 'chisq',
    context: 'Dataset, n = 60. Is having a part-time job associated with passing the course? α = 0.05.',
    output: ctOutput('Observed counts', 'PartTimeJob', ['No', 'Yes'], ['Pass', 'Fail'], job),
    steps: [
      { label: 'Hypotheses', body: 'H₀: PartTimeJob and PassFail are independent; H₁: they are associated.' },
      { label: 'Expected counts', body: `$E_{ij} = \\frac{\\text{row}\\times\\text{col}}{n}$: No/Pass $= 35\\cdot49/60 = ${f(rJob.expected[0][0], 2)}$, No/Fail $= ${f(rJob.expected[0][1], 2)}$, Yes/Pass $= ${f(rJob.expected[1][0], 2)}$, Yes/Fail $= ${f(rJob.expected[1][1], 2)}$. All ≥ 5 ✓` },
      { label: 'Contributions', body: `- ${cells(rJob, job, ['No', 'Yes'], ['Pass', 'Fail'])}` },
      { label: 'χ² and df', body: `$\\chi^2 = ${f(rJob.chi2, 3)}$, $df = (2-1)(2-1) = 1$` },
      { label: 'Critical value', body: readChi2(1, 0.95).text },
      { label: 'Conclusion', body: `${f(rJob.chi2, 2)} > 3.841 → **reject H₀** (p < 0.001). Passing and having a part-time job are associated: 44 % of working students failed vs 0 % of non-working students. Not causal — working students also report higher stress.` },
    ],
  },
  {
    id: 'w5-ex2', title: 'Stress level and part-time job (3×2)', topic: 'chisq',
    context: 'Dataset, n = 60. Test at α = 0.01 whether stress level and having a part-time job are independent.',
    output: ctOutput('Observed (expected)', 'StressLevel', STRESS, ['No', 'Yes'], stress, true),
    steps: [
      { label: 'Hypotheses', body: 'H₀: StressLevel and PartTimeJob are independent; H₁: they are associated.' },
      { label: 'Condition', body: `Smallest expected count = ${f(Math.min(...rStress.expected.flat()), 2)} ≥ 5 ✓` },
      { label: 'χ²', body: `- ${cells(rStress, stress, STRESS, ['No', 'Yes'])}\n\nSum: $\\chi^2 = ${f(rStress.chi2, 3)}$` },
      { label: 'df and critical value', body: `$df = (3-1)(2-1) = 2$. ${readChi2(2, 0.99).text}` },
      { label: 'Conclusion', body: `${f(rStress.chi2, 2)} > 9.210 → **reject H₀** at 1 %. The largest contributions come from the High stress row: all 13 high-stress students have a job (expected 5.42). Stress and working are strongly associated.` },
    ],
  },
  {
    id: 'w5-ex3', title: 'When the condition fails: StudyMethod × PassFail', topic: 'chisq',
    context: 'Dataset. Is the study method associated with passing? α = 0.05.',
    output: ctOutput('Observed (expected)', 'StudyMethod', METHODS, ['Pass', 'Fail'], method, true),
    steps: [
      { label: 'Expected counts', body: `Fail column: ${rMethod.expected.map((r) => f(r[1], 2)).join(', ')} — **all below 5**. The χ² approximation is unreliable.` },
      { label: 'χ² anyway', body: `$\\chi^2 = ${f(rMethod.chi2, 3)}$, df = 3. ${readChi2(3, 0.95).text} → ${f(rMethod.chi2, 2)} < 7.815 → do not reject H₀ (p = ${f(rMethod.pValue, 4)}).` },
      { label: 'Remedy', body: 'Merge categories (e.g. Tutoring vs. all others) or collect more data; for 2×2 tables use Fisher\'s exact test. Report the caveat in your conclusion.' },
      { label: 'Conclusion', body: 'No sufficient evidence of an association between study method and passing at the 5 % level — and the test is of limited validity because expected counts are below 5.' },
    ],
  },
  {
    id: 'w5-ex4', title: 'Programme × preferred study place (2×3, by hand)', topic: 'chisq',
    context: '150 students were asked where they study most. Test at α = 0.05 whether the preferred place depends on the programme.',
    output: ctOutput('Observed counts', 'Programme', ['Bachelor', 'Master'], ['Library', 'Home', 'Café'], place),
    steps: [
      { label: 'Expected counts', body: `Row totals 70, 80; column totals 50, 60, 40. E(Bachelor, Library) = 70·50/150 = ${f(rPlace.expected[0][0], 2)}; … full table: ${rPlace.expected.map((r) => r.map((e) => f(e, 2)).join(' / ')).join(' ‖ ')}` },
      { label: 'Contributions', body: `- ${cells(rPlace, place, ['Bachelor', 'Master'], ['Library', 'Home', 'Café'])}` },
      { label: 'χ² and decision', body: `$\\chi^2 = ${f(rPlace.chi2, 3)}$, df = 2. ${readChi2(2, 0.95).text} → ${f(rPlace.chi2, 3)} > 5.991 → **reject H₀**.` },
      { label: 'p-value bounds', body: `Chi-square table, row df = 2: locate ${f(rPlace.chi2, 3)} between two neighbouring columns → **${bPlace.text}** (exact p = ${f(rPlace.pValue, 4)}).` },
      { label: 'Strength', body: `Cramér's $V = \\sqrt{${f(rPlace.chi2, 3)}/(150\\cdot 1)} = ${f(vPlace, 3)}$ — a weak-to-moderate association. Bachelor students prefer the library more than expected.` },
    ],
  },
  {
    id: 'w5-ex5', title: 'ANOVA or χ²? Same question, different variables', topic: 'chisq',
    context: 'Two research questions about the dataset: (a) Does the mean FinalGrade differ between study methods? (b) Does the pass rate differ between study methods?',
    steps: [
      { label: '(a)', body: 'FinalGrade is **metric**, StudyMethod is categorical → compare 4 means → **one-way ANOVA** (F ≈ 11.34, df (3, 56)).' },
      { label: '(b)', body: 'PassFail is **categorical** → compare 4 proportions in a 4×2 table → **χ² test of independence** (χ² ≈ 5.26, df 3).' },
      { label: 'Lesson', body: 'Turning a metric variable into Pass/Fail throws information away: the ANOVA is clearly significant, the χ² test is not (and is not even valid here).' },
    ],
  },
];
