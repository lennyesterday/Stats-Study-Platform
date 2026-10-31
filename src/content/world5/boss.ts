import { chiSquareIndependence, round } from '../../lib/stats';
import { chi2PBounds, chi2Table } from '../../lib/tables';
import { choice, decision, f, num, readChi2 } from '../helpers';
import type { BossDef } from '../types';
import { ctOutput } from './examples';

export const boss: BossDef = {
  title: 'The Contingency Kraken',
  story: 'Its tentacles grip every cell of the table. Compute what independence would look like, measure the distance, and sever the association — or prove there is none.',
  generate: (rng) => {
    const ra = ['Low', 'Medium', 'High'], cb = ['Library', 'Home', 'Café'];
    let obs: number[][], res;
    do {
      const tilt = rng.float(0, 0.8, 2);
      obs = ra.map((_, i) => cb.map((_, j) => Math.round(rng.int(12, 28) * (1 + tilt * (i === j ? 1 : -0.3)))));
      res = chiSquareIndependence(obs);
    } while (Math.min(...res.expected.flat()) < 5);
    const i = rng.int(0, 2), j = rng.int(0, 2);
    const crit = chi2Table(4, 0.95).value;
    const b = chi2PBounds(res.chi2, 4);
    const flat = res.contributions.flat(), idx = flat.indexOf(Math.max(...flat));
    const labels = ra.flatMap((r) => cb.map((c) => `${r} / ${c}`));
    return {
      intro: `A random sample of ${res.n} students: stress level × preferred study place. α = 0.05.`,
      output: ctOutput('Observed counts', 'StressLevel', ra, cb, obs),
      parts: [
        { label: 'a', prompt: `Expected count of **${ra[i]} / ${cb[j]}** (2 decimals).`, inputs: [num('e', 'E', res.expected[i][j], 2, 0.01)], hints: [], solution: [`E = ${res.rowTotals[i]} × ${res.colTotals[j]} / ${res.n} = ${f(res.expected[i][j], 2)}`] },
        { label: 'b', prompt: 'χ² statistic (3 decimals) and df.', inputs: [num('x', 'χ²', res.chi2, 3, 0.01), num('df', 'df', 4, 0, 0)], hints: [], solution: [`Contributions: ${flat.map((v) => f(v, 3)).join(' + ')} = **${f(res.chi2, 3)}**; df = (3 − 1)(3 − 1) = 4`] },
        { label: 'c', prompt: 'Critical value and decision.', inputs: [num('c', 'Critical value', crit, 3, 0), decision(res.chi2 > crit)], hints: [], solution: [readChi2(4, 0.95).text, `→ **${res.chi2 > crit ? 'reject H₀: stress and study place are associated' : 'do not reject H₀'}**`] },
        { label: 'd', prompt: 'p-value bounds from the table (lower 0 if below the smallest tail).', inputs: [num('lo', 'Lower', b.lower, 3, 0), num('hi', 'Upper', b.upper, 3, 0)], hints: [], solution: [`→ **${b.text}** (exact p = ${f(res.pValue, 4)})`] },
        { label: 'e', prompt: 'Which cell contributes most?', inputs: [choice('cell', 'Cell', labels, idx)], hints: [], solution: [`**${labels[idx]}** (${f(flat[idx], 3)}); Cramér's V = ${f(round(Math.sqrt(res.chi2 / (res.n * 2)), 3), 3)}`] },
      ],
    };
  },
};
