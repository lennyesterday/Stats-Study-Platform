import type { Rng } from '../../lib/rng';
import { linearRegression, round } from '../../lib/stats';
import { tPBounds, tTable, fTable } from '../../lib/tables';
import { choice, decision, f, num, readT } from '../helpers';
import type { ExerciseDef, InterpretationTask } from '../types';
import { regressionOutput } from './examples';

/** sample sizes with n − 2 in the t table */
const REG_N = [7, 8, 10, 12, 15, 17, 20, 22, 25, 27, 32];
const CTX = [
  { x: 'daily study hours', y: 'GPA (0–20)', xr: [1, 9], b0: 10, b1: 0.8, noise: 1.2, xd: 1, yd: 1 },
  { x: 'sleep hours per night', y: 'stress score (0–40)', xr: [4.5, 9], b0: 38, b1: -2.6, noise: 3, xd: 1, yd: 0 },
  { x: 'attendance (%)', y: 'FinalGrade', xr: [55, 98], b0: -38, b1: 1.3, noise: 4, xd: 0, yd: 0 },
  { x: 'weekly study hours', y: 'FinalGrade', xr: [3, 16], b0: 25, b1: 4.5, noise: 5, xd: 1, yd: 0 },
];

function sample(rng: Rng, n: number) {
  const c = rng.pick(CTX);
  const x = Array.from({ length: n }, () => rng.float(c.xr[0], c.xr[1], c.xd));
  const y = x.map((v) => round(c.b0 + c.b1 * v + (rng.next() + rng.next() + rng.next() - 1.5) * 2 * c.noise * rng.float(0.5, 1.5, 2), c.yd));
  return { c, x, y, r: linearRegression(x, y) };
}

export const exercises: ExerciseDef[] = [
  {
    id: 'w6-summary', title: 'b₀ and b₁ from summary statistics', topic: 'regression', difficulty: 1,
    generate: (rng) => {
      const c = rng.pick(CTX);
      const xbar = round((c.xr[0] + c.xr[1]) / 2 + rng.float(-1, 1, 1), 2), sx = round((c.xr[1] - c.xr[0]) / 4, 2);
      const r = round(Math.sign(c.b1) * rng.float(0.35, 0.92, 2), 2);
      const sy = round(Math.abs(c.b1) * sx / Math.abs(r) * rng.float(0.8, 1.2, 2), 2), ybar = round(c.b0 + c.b1 * xbar, 2);
      const b1 = r * sy / sx, b0 = ybar - b1 * xbar;
      return {
        prompt: `X = ${c.x}, Y = ${c.y}. Summary: $\\bar x = ${xbar}$, $s_x = ${sx}$, $\\bar y = ${ybar}$, $s_y = ${sy}$, $r = ${r}$. Find the OLS slope and intercept (4 decimals).`,
        inputs: [num('b1', 'b₁', b1, 4, 0.0005), num('b0', 'b₀', b0, 4, 0.005)],
        hints: ['b₁ = r · s_y / s_x', 'b₀ = ȳ − b₁ x̄'],
        solution: [`$b_1 = ${r}\\cdot ${sy}/${sx} = ${f(b1, 4)}$`, `$b_0 = ${ybar} - ${f(b1, 4)}\\cdot ${xbar} = ${f(b0, 4)}$`],
      };
    },
  },
  {
    id: 'w6-raw', title: 'Least squares line from raw data', topic: 'regression', difficulty: 2,
    generate: (rng) => {
      const { c, x, y, r } = sample(rng, rng.int(5, 7));
      return {
        prompt: `X = ${c.x}, Y = ${c.y}.\n\nx: ${x.join(', ')}\n\ny: ${y.join(', ')}\n\nCompute b₁ and b₀ (4 decimals) and R² (4 decimals).`,
        inputs: [num('b1', 'b₁', r.b1, 4, 0.0005), num('b0', 'b₀', r.b0, 4, 0.01), num('r2', 'R²', r.r2, 4, 0.0005)],
        hints: ['Compute x̄ and ȳ.', 'Sxx = Σ(x − x̄)², Sxy = Σ(x − x̄)(y − ȳ)', 'R² = Sxy² / (Sxx·Syy)'],
        solution: [`x̄ = ${f(r.xbar, 4)}, ȳ = ${f(r.ybar, 4)}`, `Sxx = ${f(r.sxx, 4)}, Sxy = ${f(r.sxy, 4)}, Syy = ${f(r.sst, 4)}`, `b₁ = **${f(r.b1, 4)}**, b₀ = **${f(r.b0, 4)}**`, `R² = **${f(r.r2, 4)}** (r = ${f(r.r, 4)})`],
      };
    },
  },
  {
    id: 'w6-predict', title: 'Prediction and residual', topic: 'regression', difficulty: 1,
    generate: (rng) => {
      const c = rng.pick(CTX);
      const b0 = round(c.b0 + rng.float(-1, 1, 1) * c.noise, 2), b1 = round(c.b1 * rng.float(0.8, 1.2, 2), 3);
      const x0 = rng.float(c.xr[0], c.xr[1], c.xd), yhat = b0 + b1 * x0;
      const yobs = round(yhat + rng.float(-2, 2, 1) * c.noise, c.yd);
      return {
        prompt: `$\\widehat{Y} = ${b0} ${b1 < 0 ? '-' : '+'} ${Math.abs(b1)}\\,X$ with X = ${c.x}, Y = ${c.y}. A student has X = ${x0} and Y = ${yobs}. Predicted value and residual (2 decimals)?`,
        inputs: [num('yh', 'ŷ', yhat, 2, 0.01), num('e', 'Residual', yobs - yhat, 2, 0.01)],
        hints: ['ŷ = b₀ + b₁x', 'Residual = observed − predicted'],
        solution: [`$\\hat y = ${b0} + (${b1})(${x0}) = ${f(yhat, 2)}$`, `$e = ${yobs} - ${f(yhat, 2)} = ${f(yobs - yhat, 2)}$ (${yobs > yhat ? 'above' : 'below'} the line)`],
      };
    },
  },
  {
    id: 'w6-r2r', title: 'From R² to r (and back)', topic: 'regression', difficulty: 1,
    generate: (rng) => {
      const r2 = rng.float(0.05, 0.95, 2), neg = rng.next() < 0.5;
      return {
        prompt: `A simple regression has R² = ${r2} and slope b₁ ${neg ? '< 0' : '> 0'}. What is the correlation r (4 decimals), and what share (%) of Y's variability is **not** explained?`,
        inputs: [num('r', 'r', (neg ? -1 : 1) * Math.sqrt(r2), 4, 0.0002), num('u', 'Unexplained (%)', (1 - r2) * 100, 1, 0.05)],
        hints: ['r = ±√R², sign from the slope', 'Unexplained share = 1 − R²'],
        solution: [`r = ${neg ? '−' : '+'}√${r2} = **${f((neg ? -1 : 1) * Math.sqrt(r2), 4)}**`, `Unexplained: (1 − ${r2})·100 = **${f((1 - r2) * 100, 1)} %**`],
      };
    },
  },
  {
    id: 'w6-anova', title: 'Complete the regression ANOVA table', topic: 'reg-inference', difficulty: 2,
    generate: (rng) => {
      const n = rng.pick(REG_N), sst = rng.float(200, 3000, 1), r2 = rng.float(0.1, 0.9, 2);
      const ssr = round(sst * r2, 1), sse = round(sst - ssr, 1), mse = sse / (n - 2), F = ssr / mse;
      return {
        prompt: `Simple regression with n = ${n}: **SSR = ${ssr}**, **SST = ${f(sst, 1)}**. Find SSE (1 dec.), MSE (3 dec.), F (3 dec.), R² (4 dec.) and the standard error of the estimate (3 dec.).`,
        inputs: [num('sse', 'SSE', sse, 1, 0.05), num('mse', 'MSE', mse, 3, 0.002), num('F', 'F', F, 3, 0.005), num('r2', 'R²', ssr / sst, 4, 0.0002), num('se', 'sₑ', Math.sqrt(mse), 3, 0.002)],
        hints: ['SSE = SST − SSR', `MSE = SSE/(n − 2) = SSE/${n - 2}`, 'F = MSR/MSE with MSR = SSR/1', 'sₑ = √MSE'],
        solution: [`SSE = ${f(sst, 1)} − ${ssr} = **${f(sse, 1)}**`, `MSE = ${f(sse, 1)}/${n - 2} = **${f(mse, 3)}**`, `F = ${ssr}/${f(mse, 3)} = **${f(F, 3)}**`, `R² = ${ssr}/${f(sst, 1)} = **${f(ssr / sst, 4)}**`, `sₑ = √${f(mse, 3)} = **${f(Math.sqrt(mse), 3)}**`],
      };
    },
  },
  {
    id: 'w6-ttest', title: 't test of the slope', topic: 'reg-inference', difficulty: 2, decision: true,
    generate: (rng) => {
      const n = rng.pick(REG_N), alpha = rng.pick([0.05, 0.05, 0.01, 0.1]);
      const sb1 = rng.float(0.05, 0.6, 3), b1 = round(sb1 * rng.float(0.4, 4.5, 2) * rng.pick([1, 1, -1]), 3);
      const t = b1 / sb1, p = round(1 - alpha / 2, 4), crit = tTable(n - 2, p).value;
      return {
        prompt: `Regression of FinalGrade on a predictor, n = ${n}: **b₁ = ${b1}**, **s_b₁ = ${sb1}**. Test $H_0: \\beta_1 = 0$ vs $H_1: \\beta_1 \\ne 0$ at α = ${alpha}.`,
        inputs: [num('t', 't (3 dec.)', t, 3, 0.003), num('c', 'Critical value', crit, 3, 0), decision(Math.abs(round(t, 3)) > crit)],
        hints: ['t = b₁ / s_b₁', `df = n − 2 = ${n - 2}`, `Two-tailed: column ${p}`],
        solution: [`$t = ${b1}/${sb1} = ${f(t, 3)}$`, readT(n - 2, p).text, `|t| ${Math.abs(t) > crit ? '>' : '≤'} ${f(crit, 3)} → **${Math.abs(t) > crit ? 'reject H₀: significant linear relationship' : 'do not reject H₀: no significant linear relationship'}**`],
      };
    },
  },
  {
    id: 'w6-ci', title: 'Confidence interval for β₁', topic: 'reg-inference', difficulty: 2,
    generate: (rng) => {
      const n = rng.pick(REG_N), conf = rng.pick([0.9, 0.95, 0.99]);
      const sb1 = rng.float(0.05, 0.5, 3), b1 = rng.float(0.2, 3, 3);
      const p = round(1 - (1 - conf) / 2, 4), tc = tTable(n - 2, p).value;
      return {
        prompt: `n = ${n}, b₁ = ${b1}, s_b₁ = ${sb1}. Build the ${conf * 100} % CI for β₁ (3 decimals). Does it contain 0?`,
        inputs: [num('lo', 'Lower', b1 - tc * sb1, 3, 0.002), num('hi', 'Upper', b1 + tc * sb1, 3, 0.002), choice('z', 'Contains 0?', ['Yes', 'No'], b1 - tc * sb1 <= 0 ? 0 : 1)],
        hints: [`t with df n − 2 = ${n - 2}, column ${p}`, 'b₁ ± t·s_b₁'],
        solution: [readT(n - 2, p).text, `${b1} ± ${f(tc, 3)}·${sb1} = [${f(b1 - tc * sb1, 3)}; ${f(b1 + tc * sb1, 3)}]`, b1 - tc * sb1 <= 0 ? '0 is inside → β₁ = 0 cannot be rejected at this level.' : '0 is outside → the slope is significant at this level.'],
      };
    },
  },
  {
    id: 'w6-output', title: 'Read an Excel regression output', topic: 'reg-inference', difficulty: 3, decision: true,
    generate: (rng) => {
      const n = rng.pick([12, 15, 17, 20, 22]);
      const { c, r } = sample(rng, n);
      const x0 = rng.float(c.xr[0], c.xr[1], c.xd);
      return {
        prompt: `Regression of ${c.y} on ${c.x} (n = ${n}). From the output: (a) predicted Y for X = ${x0} (2 dec.), (b) R² (4 dec.), (c) t of the slope (3 dec.) and the decision at α = 0.05.`,
        output: regressionOutput(r, c.x),
        inputs: [num('y', '(a) ŷ', round(r.b0, 4) + round(r.b1, 4) * x0, 2, 0.02), num('r2', '(b) R²', r.r2, 4, 0.0002), num('t', '(c) t', r.tB1, 3, 0.003), decision(Math.abs(round(r.tB1, 3)) > tTable(n - 2, 0.975).value)],
        hints: ['Coefficients column: Intercept = b₀, X row = b₁', 'R Square row', `t Stat of the X row; df = ${n - 2}`],
        solution: [`ŷ = ${f(r.b0, 4)} + ${f(r.b1, 4)}·${x0} = **${f(round(r.b0, 4) + round(r.b1, 4) * x0, 2)}**`, `R² = **${f(r.r2, 4)}**`, `t = ${f(r.b1, 4)}/${f(r.seB1, 4)} = **${f(r.tB1, 3)}**; ${readT(n - 2, 0.975).text}`, `→ **${Math.abs(r.tB1) > tTable(n - 2, 0.975).value ? 'reject H₀' : 'do not reject H₀'}** (p = ${f(r.pValue, 4)})`],
      };
    },
  },
  {
    id: 'w6-ft', title: 'F = t² and p-value bounds', topic: 'reg-inference', difficulty: 3,
    generate: (rng) => {
      const n = rng.pick([7, 8, 10, 12, 17, 22, 32]);
      const t = rng.float(1.1, 3.6, 2), b = tPBounds(t, n - 2, 'two');
      const fc = fTable(1, n - 2, 0.95).value;
      return {
        prompt: `In a simple regression with n = ${n}, the slope has **t = ${f(t, 2)}**. (a) What is F in the ANOVA table (3 dec.)? (b) Bracket the two-sided p-value with the t table. (c) Critical F at 5 % from the F table.`,
        inputs: [num('F', '(a) F', t * t, 3, 0.003), num('lo', '(b) lower', b.lower, 3, 0), num('hi', '(b) upper', b.upper, 3, 0), num('fc', '(c) critical F', fc, 2, 0.006)],
        hints: ['F = t²', `t table row ${n - 2}`, `F table: m = 1, n = ${n - 2}`],
        solution: [`F = ${f(t, 2)}² = **${f(t * t, 3)}**`, `→ **${b.text}**`, `F₀.₉₅(1, ${n - 2}) = **${fc}** = (t₀.₉₇₅;${n - 2})² = ${f(tTable(n - 2, 0.975).value ** 2, 3)} ✓`],
      };
    },
  },
  {
    id: 'w6-interp-choice', title: 'Which interpretation is correct?', topic: 'regression', difficulty: 1,
    generate: (rng) => {
      const items = [
        { q: 'Slope b₁ = 0.8 in GPA = 10 + 0.8·hours', opts: ['Each extra daily hour is associated with 0.8 more GPA points on average', 'GPA increases by 80 %', 'Studying causes +0.8 GPA for every student', '80 % of GPA is explained by hours'], a: 0 },
        { q: 'R² = 0.60 for GPA on hours', opts: ['Predictions are 60 % accurate', '60 % of the variability of GPA is explained by study hours', 'r = 0.60', '60 % of students lie on the line'], a: 1 },
        { q: 'Intercept 10 in GPA = 10 + 0.8·hours (data: 1–9 h)', opts: ['Every student has at least 10 points', 'Estimated mean GPA at 0 h — an extrapolation, not meaningful', 'The slope at 0 hours', 'The standard error'], a: 1 },
        { q: 'Residual e = −2.1 for a student', opts: ['The student scored 2.1 points less than predicted', 'The student scored 2.1 more than predicted', 'The model is invalid', 'The slope is −2.1'], a: 0 },
      ];
      const it = rng.pick(items);
      return { prompt: `**${it.q}** — choose the correct interpretation.`, inputs: [choice('i', 'Interpretation', it.opts, it.a)], hints: ['Think "on average", "associated", "variability explained".'], solution: [`**${it.opts[it.a]}**`] };
    },
  },
];

export const interpretations: InterpretationTask[] = [
  {
    id: 'w6-int-slope', topic: 'regression', title: 'Interpret the dataset regression',
    prompt: 'FinalGrade = 25.17 + 4.524 · StudyHoursPerWeek, R² = 0.986, t(slope) = 64.5, p < 0.001, n = 60. Interpret slope, R² and the test for a non-statistician.',
    model: 'For each additional hour of study per week, the final grade is estimated to be about 4.5 points higher on average. Weekly study hours explain 98.6 % of the variability in final grades in this sample. The slope is highly significant (t = 64.5, p < 0.001), so there is a linear relationship in the population. This is an association; it does not prove that extra studying causes higher grades.',
    checklist: ['Slope: "on average / estimated" + units', 'R² as share of variability explained', 'Significance of the slope (t, p)', 'No causal claim'],
  },
  {
    id: 'w6-int-extrap', topic: 'regression', title: 'Extrapolation warning',
    prompt: 'A colleague uses GPA = 10 + 0.8·hours (data: 1–9 h/day) to claim that 14 h/day would give a GPA of 21.2. Respond in 2–3 sentences.',
    model: 'The prediction is an extrapolation: 14 h lies far outside the observed range of 1–9 h, where the linear pattern has not been observed. The result (21.2) is even outside the possible 0–20 GPA scale, which shows the line cannot hold there. Predictions should only be made within the range of the data.',
    checklist: ['Names "extrapolation"', 'Refers to the observed range 1–9 h', 'Notes the impossible value > 20', 'Recommends predicting within the data range'],
  },
];
