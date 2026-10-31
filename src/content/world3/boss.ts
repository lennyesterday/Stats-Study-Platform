import { round } from '../../lib/stats';
import { tTable, zTable } from '../../lib/tables';
import { decision, f, num, readT, readZp } from '../helpers';
import type { BossDef } from '../types';

export const boss: BossDef = {
  title: 'The Null Hypothesis Dragon',
  story: 'The Dragon guards the status quo. It only falls to a correctly stated H₁, the right critical value, a correct p-value — and a conclusion written in proper English.',
  generate: (rng) => {
    const n = rng.pick([16, 21, 25, 26]), mu0 = 15, s = rng.float(1.6, 2.6, 2);
    const xbar = round(mu0 + rng.float(0.5, 2.6, 2) * s / Math.sqrt(n), 2);
    const t = (xbar - mu0) / (s / Math.sqrt(n));
    const crit = tTable(n - 1, 0.95).value;
    const x = rng.int(30, 44), m = 60, p = x / m, z = round((p - 0.5) / Math.sqrt(0.25 / m), 2);
    const pv = 2 * (1 - zTable(Math.abs(z)));
    return {
      intro: `The Dean claims the mean GPA of Nova students is **higher than 15**. A sample of n = ${n} gives x̄ = ${xbar}, s = ${s}. α = 0.05.`,
      parts: [
        { label: 'a', prompt: 'Which hypotheses? Choose the alternative.', inputs: [{ id: 'h1', label: 'H₁', kind: 'choice', options: ['μ ≠ 15', 'μ > 15', 'μ < 15', 'x̄ > 15'], answer: 1 }], hints: [], solution: ['$H_0: \\mu \\le 15$ vs $H_1: \\mu > 15$ (right-tailed; hypotheses are about μ, never x̄).'] },
        { label: 'b', prompt: 'Test statistic (3 dec.) and critical value (3 dec.).', inputs: [num('t', 't', t, 3, 0.002), num('c', 'critical value', crit, 3, 0)], hints: [], solution: [`$t = (${xbar} - 15)/(${s}/\\sqrt{${n}}) = ${f(t, 3)}$`, readT(n - 1, 0.95).text] },
        { label: 'c', prompt: 'Decision at α = 0.05.', inputs: [decision(t > crit)], hints: [], solution: [`${f(t, 3)} ${t > crit ? '>' : '≤'} ${f(crit, 3)} → ${t > crit ? 'reject H₀: the mean GPA is significantly higher than 15' : 'do not reject H₀: no sufficient evidence that the mean GPA exceeds 15'}.`] },
        { label: 'd', prompt: `Second claim: "half of the students use a study group". In a sample of 60, ${x} do. Two-tailed test of π = 0.5: give z (2 dec.) and the p-value (4 dec.).`, inputs: [num('z', 'z', z, 2, 0.01), num('p', 'p-value', pv, 4, 0.0003)], hints: [], solution: [`$z = (${f(p, 4)} - 0.5)/\\sqrt{0.25/60} = ${f(z, 2)}$`, readZp(Math.abs(z)).text, `p = 2 × (1 − ${f(zTable(Math.abs(z)), 4)}) = ${f(pv, 4)}`] },
      ],
    };
  },
};
