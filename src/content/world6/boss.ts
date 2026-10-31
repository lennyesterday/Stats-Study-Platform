import { linearRegression, round } from '../../lib/stats';
import { tTable } from '../../lib/tables';
import { decision, f, num, readT } from '../helpers';
import type { BossDef } from '../types';

export const boss: BossDef = {
  title: 'The Regression Titan',
  story: 'The final guardian before the exam. It hides a straight line inside a cloud of points. Find it, measure how well it fits, and prove it is real.',
  generate: (rng) => {
    const n = rng.pick([8, 10, 12]);
    const x = Array.from({ length: n }, () => rng.float(1, 9, 1));
    const y = x.map((v) => round(10 + 0.8 * v + rng.float(-1.8, 1.8, 1), 1));
    const r = linearRegression(x, y);
    const x0 = rng.float(2, 8, 1);
    const crit = tTable(n - 2, 0.975).value;
    return {
      intro: `Daily study hours (x) and GPA (y) of ${n} students.\n\nx: ${x.join(', ')}\n\ny: ${y.join(', ')}\n\nα = 0.05.`,
      parts: [
        { label: 'a', prompt: 'Slope b₁ and intercept b₀ (4 decimals).', inputs: [num('b1', 'b₁', r.b1, 4, 0.001), num('b0', 'b₀', r.b0, 4, 0.01)], hints: [], solution: [`x̄ = ${f(r.xbar, 4)}, ȳ = ${f(r.ybar, 4)}, Sxx = ${f(r.sxx, 4)}, Sxy = ${f(r.sxy, 4)}`, `b₁ = **${f(r.b1, 4)}**, b₀ = **${f(r.b0, 4)}**`] },
        { label: 'b', prompt: `Predicted GPA for x = ${x0} (2 decimals).`, inputs: [num('y', 'ŷ', r.b0 + r.b1 * x0, 2, 0.02)], hints: [], solution: [`ŷ = ${f(r.b0, 4)} + ${f(r.b1, 4)}·${x0} = **${f(r.b0 + r.b1 * x0, 2)}**`] },
        { label: 'c', prompt: 'R² and the standard error of the estimate (4 decimals).', inputs: [num('r2', 'R²', r.r2, 4, 0.001), num('se', 'sₑ', r.se, 4, 0.002)], hints: [], solution: [`SST = ${f(r.sst, 4)}, SSE = ${f(r.sse, 4)} → R² = **${f(r.r2, 4)}**`, `sₑ = √(${f(r.sse, 4)}/${n - 2}) = **${f(r.se, 4)}**`] },
        { label: 'd', prompt: 't statistic for H₀: β₁ = 0 (3 decimals), critical value and decision.', inputs: [num('t', 't', r.tB1, 3, 0.01), num('c', 'Critical value', crit, 3, 0), decision(Math.abs(r.tB1) > crit)], hints: [], solution: [`s_b₁ = ${f(r.se, 4)}/√${f(r.sxx, 4)} = ${f(r.seB1, 4)}; t = **${f(r.tB1, 3)}**`, readT(n - 2, 0.975).text, `→ **${Math.abs(r.tB1) > crit ? 'reject H₀: significant linear relationship' : 'do not reject H₀'}**`] },
        { label: 'e', prompt: 'F statistic of the regression ANOVA (3 decimals).', inputs: [num('F', 'F', r.F, 3, 0.05)], hints: [], solution: [`F = MSR/MSE = ${f(r.ssr, 4)}/${f(r.mse, 4)} = **${f(r.F, 3)}** = t² ✓`] },
      ],
    };
  },
};
