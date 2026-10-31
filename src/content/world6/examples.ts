import { linearRegression } from '../../lib/stats';
import { f, numColumn, readT } from '../helpers';
import type { SoftwareOutput, WorkedExample } from '../types';

export function regressionOutput(r: ReturnType<typeof linearRegression>, xName: string, conf = 0.95, tCrit?: number): SoftwareOutput {
  const tc = tCrit ?? 0;
  return {
    title: 'SUMMARY OUTPUT (Excel)',
    rows: [
      ['Regression Statistics', '', '', '', '', ''],
      ['Multiple R', f(Math.abs(r.r), 4), '', '', '', ''],
      ['R Square', f(r.r2, 4), '', '', '', ''],
      ['Standard Error', f(r.se, 4), '', '', '', ''],
      ['Observations', String(r.n), '', '', '', ''],
      ['ANOVA', 'df', 'SS', 'MS', 'F', 'Significance F'],
      ['Regression', '1', f(r.ssr, 3), f(r.ssr, 3), f(r.F, 3), r.pValue < 0.0001 ? r.pValue.toExponential(2) : f(r.pValue, 4)],
      ['Residual', String(r.n - 2), f(r.sse, 3), f(r.mse, 3), '', ''],
      ['Total', String(r.n - 1), f(r.sst, 3), '', '', ''],
      ['', 'Coefficients', 'Standard Error', 't Stat', 'P-value', tc ? `Lower ${conf * 100}% / Upper` : ''],
      ['Intercept', f(r.b0, 4), f(r.se * Math.sqrt(1 / r.n + r.xbar ** 2 / r.sxx), 4), f(r.b0 / (r.se * Math.sqrt(1 / r.n + r.xbar ** 2 / r.sxx)), 3), '', ''],
      [xName, f(r.b1, 4), f(r.seB1, 4), f(r.tB1, 3), r.pValue < 0.0001 ? r.pValue.toExponential(2) : f(r.pValue, 4), tc ? `${f(r.b1 - tc * r.seB1, 4)} / ${f(r.b1 + tc * r.seB1, 4)}` : ''],
    ],
  };
}

const hx = [2, 4, 5, 6, 8, 9], hy = [11, 13, 13, 15, 16, 17];
const h = linearRegression(hx, hy);
const ds = linearRegression(numColumn('StudyHoursPerWeek'), numColumn('FinalGrade'));
const sl = linearRegression(numColumn('SleepHoursPerNight'), numColumn('FinalGrade'));

export const examples: WorkedExample[] = [
  {
    id: 'w6-ex1', title: 'Least squares by hand (n = 6)', topic: 'regression',
    context: `Daily study hours x and GPA y of 6 students: x = ${hx.join(', ')}; y = ${hy.join(', ')}.`,
    steps: [
      { label: 'Means', body: `$\\bar x = ${f(h.xbar, 4)}$, $\\bar y = ${f(h.ybar, 4)}$` },
      { label: 'Sums of squares', body: `$S_{xx} = \\sum (x-\\bar x)^2 = ${f(h.sxx, 4)}$, $S_{xy} = \\sum (x-\\bar x)(y-\\bar y) = ${f(h.sxy, 4)}$` },
      { label: 'Slope', body: `$b_1 = ${f(h.sxy, 4)}/${f(h.sxx, 4)} = ${f(h.b1, 4)}$` },
      { label: 'Intercept', body: `$b_0 = ${f(h.ybar, 4)} - ${f(h.b1, 4)}\\cdot ${f(h.xbar, 4)} = ${f(h.b0, 4)}$ → $\\hat y = ${f(h.b0, 4)} + ${f(h.b1, 4)}x$` },
      { label: 'Fit', body: `SST = ${f(h.sst, 4)}, SSE = ${f(h.sse, 4)}, SSR = ${f(h.ssr, 4)} → $R^2 = ${f(h.r2, 4)}$, $r = ${f(h.r, 4)}$` },
      { label: 'Interpretation', body: `Each additional daily study hour is associated with a GPA that is on average ${f(h.b1, 2)} points higher; ${f(h.r2 * 100, 1)} % of the variability of GPA is explained by study hours.` },
    ],
  },
  {
    id: 'w6-ex2', title: 'Interpreting GPA = 10 + 0.8 · hours', topic: 'regression',
    context: 'A regression of GPA (0–20) on daily study hours gives $\\widehat{GPA} = 10 + 0.8\\cdot hours$ with R² = 0.60. Observed range: 1 to 9 hours.',
    steps: [
      { label: 'Slope', body: 'For each additional hour of daily study, GPA is estimated to be **0.8 points higher on average**.' },
      { label: 'Intercept', body: '10 = estimated mean GPA for 0 hours of study — outside the observed range (1–9 h), so not meaningful on its own.' },
      { label: 'Prediction', body: 'For 6 h: $\\hat y = 10 + 0.8\\cdot 6 = 14.8$.' },
      { label: 'Residual', body: 'A student with 6 h and GPA 16: $e = 16 - 14.8 = +1.2$ (above the line).' },
      { label: 'R² and r', body: '60 % of the variability in GPA is explained by study hours. $r = +\\sqrt{0.60} = 0.775$ (positive because the slope is positive).' },
      { label: 'Extrapolation', body: 'For 15 h/day: ŷ = 22 > 20 — impossible. Never extrapolate far outside the data.' },
    ],
  },
  {
    id: 'w6-ex3', title: 'Excel output: FinalGrade on StudyHoursPerWeek (dataset)', topic: 'reg-inference',
    context: 'Dataset, n = 60. Read the output, test the slope at α = 0.05 and give a 95 % CI for β₁.',
    output: regressionOutput(ds, 'StudyHoursPerWeek', 0.95, 2.0),
    steps: [
      { label: 'Equation', body: `$\\widehat{FinalGrade} = ${f(ds.b0, 2)} + ${f(ds.b1, 3)}\\cdot StudyHours$` },
      { label: 'Hypotheses', body: '$H_0: \\beta_1 = 0$ vs $H_1: \\beta_1 \\ne 0$' },
      { label: 't statistic', body: `$t = ${f(ds.b1, 4)}/${f(ds.seB1, 4)} = ${f(ds.tB1, 2)}$, df = 58` },
      { label: 'Critical value', body: `df 58 is not in the course table → use row 60: ${readT(60, 0.975).text} (exact T.INV(0.975; 58) = 2.002).` },
      { label: 'Decision', body: `|t| = ${f(ds.tB1, 2)} ≫ 2.000 → **reject H₀**: weekly study hours have a significant linear relationship with the final grade.` },
      { label: 'CI for β₁', body: `$${f(ds.b1, 4)} \\pm 2.000\\cdot ${f(ds.seB1, 4)} = [${f(ds.b1 - 2 * ds.seB1, 3)};\\ ${f(ds.b1 + 2 * ds.seB1, 3)}]$ — each extra weekly study hour is associated with 4.4 to 4.7 more points on average.` },
      { label: 'Fit', body: `R² = ${f(ds.r2, 3)}: ${f(ds.r2 * 100, 1)} % of the variability of FinalGrade is explained. $s_e = ${f(ds.se, 3)}$ points.` },
    ],
  },
  {
    id: 'w6-ex4', title: 'Regression ANOVA table and F = t²', topic: 'reg-inference',
    context: 'Dataset: FinalGrade regressed on SleepHoursPerNight (n = 60). Some cells are missing.',
    output: { title: 'ANOVA (regression) — incomplete', rows: [['', 'df', 'SS', 'MS', 'F'], ['Regression', '?', f(sl.ssr, 2), '?', '?'], ['Residual', '?', '?', '?', ''], ['Total', '59', f(sl.sst, 2), '', '']] },
    steps: [
      { label: 'df', body: 'Regression: 1; Residual: n − 2 = 58; Total: 59.' },
      { label: 'SSE', body: `SSE = SST − SSR = ${f(sl.sst, 2)} − ${f(sl.ssr, 2)} = ${f(sl.sse, 2)}` },
      { label: 'MS and F', body: `MSR = ${f(sl.ssr, 2)}; MSE = ${f(sl.sse, 2)}/58 = ${f(sl.mse, 3)}; F = ${f(sl.F, 2)}` },
      { label: 'R²', body: `R² = SSR/SST = ${f(sl.r2, 4)}` },
      { label: 'Link to t', body: `$t = \\sqrt{F} = ${f(Math.sqrt(sl.F), 3)}$ — the slope t statistic (b₁ = ${f(sl.b1, 3)}). Same p-value, same decision.` },
    ],
  },
  {
    id: 'w6-ex5', title: 'Residuals, outliers and causation', topic: 'reg-inference',
    context: `Using the dataset line $\\widehat{FinalGrade} = ${f(ds.b0, 2)} + ${f(ds.b1, 3)}x$: student S038 studies 5.5 h/week and scored 52; student S013 studies 11 h/week and scored 73.`,
    steps: [
      { label: 'Fitted values', body: `S038: ŷ = ${f(ds.b0 + ds.b1 * 5.5, 2)}; S013: ŷ = ${f(ds.b0 + ds.b1 * 11, 2)}` },
      { label: 'Residuals', body: `S038: e = 52 − ${f(ds.b0 + ds.b1 * 5.5, 2)} = ${f(52 - ds.b0 - ds.b1 * 5.5, 2)}; S013: e = 73 − ${f(ds.b0 + ds.b1 * 11, 2)} = ${f(73 - ds.b0 - ds.b1 * 11, 2)}` },
      { label: 'Compare with sₑ', body: `$s_e = ${f(ds.se, 2)}$: both residuals are within about 2 sₑ — no outliers.` },
      { label: 'Causation', body: 'The line describes an association. Motivation, stress and attendance are plausible confounders: motivated students study more **and** score higher, so the slope is not the causal effect of one extra study hour.' },

    ],
  },
];
