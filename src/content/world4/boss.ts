import { anovaFromSummaries, round } from '../../lib/stats';
import { fPBounds, fTable } from '../../lib/tables';
import { decision, f, num, readF } from '../helpers';
import type { BossDef } from '../types';

export const boss: BossDef = {
  title: 'The Variance Hydra',
  story: 'Three heads — Between, Within and Total — and cutting one off only works if the other two add up. Build the full ANOVA table from the group summaries and strike with the F-Snedecor table.',
  generate: (rng) => {
    const k = rng.pick([3, 4]), dfw = k === 3 ? rng.pick([12, 15, 27]) : rng.pick([12, 20]);
    const n = dfw + k, sizes = Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
    const names = ['Solo', 'Group', 'Tutoring', 'Online'].slice(0, k);
    const g = sizes.map((nj) => ({ n: nj, mean: round(14 + rng.float(-1.6, 1.6, 2), 2), sd: round(rng.float(1.5, 2.6, 2), 2) }));
    const a = anovaFromSummaries(g);
    const tableN = dfw === 27 ? 30 : dfw;
    const crit = fTable(k - 1, tableN, 0.95).value;
    const b = fPBounds(a.F, k - 1, tableN);
    return {
      intro: `GPA (0–20) of n = ${n} students by study method. Is there a difference in mean GPA? α = 0.05. No hints in a boss fight.`,
      output: { title: 'Group summaries — GPA', rows: [['Method', 'n', 'Mean', 'SD'], ...g.map((x, i) => [names[i], String(x.n), f(x.mean, 2), f(x.sd, 2)])] },
      parts: [
        { label: 'a', prompt: 'Degrees of freedom between and within.', inputs: [num('b', 'df between', k - 1, 0, 0), num('w', 'df within', dfw, 0, 0)], hints: [], solution: [`df_B = ${k} − 1 = ${k - 1}; df_W = ${n} − ${k} = ${dfw}`] },
        { label: 'b', prompt: 'SSB and SSW (2 decimals).', inputs: [num('ssb', 'SSB', a.ssb, 2, Math.max(0.05, a.ssb * 0.002)), num('ssw', 'SSW', a.ssw, 2, Math.max(0.05, a.ssw * 0.002))], hints: [], solution: [`Grand mean = ${f(a.grandMean, 4)}`, `SSB = Σ nⱼ(x̄ⱼ − ${f(a.grandMean, 4)})² = **${f(a.ssb, 2)}**`, `SSW = Σ (nⱼ − 1)sⱼ² = **${f(a.ssw, 2)}**`] },
        { label: 'c', prompt: 'MSB, MSW and F (3 decimals).', inputs: [num('msb', 'MSB', a.msb, 3, 0.01), num('msw', 'MSW', a.msw, 3, 0.005), num('F', 'F', a.F, 3, 0.01)], hints: [], solution: [`MSB = ${f(a.ssb, 2)}/${k - 1} = ${f(a.msb, 3)}; MSW = ${f(a.ssw, 2)}/${dfw} = ${f(a.msw, 3)}; F = **${f(a.F, 3)}**`] },
        { label: 'd', prompt: `Critical value from the course F table${dfw === 27 ? ' (block 27 is missing — use the nearest conservative block, n = 30)' : ''} and decision.`, inputs: [num('c', 'Critical F', crit, 2, 0.006), decision(a.F > crit)], hints: [], solution: [readF(k - 1, tableN, 0.95).text, `${f(a.F, 3)} ${a.F > crit ? '>' : '≤'} ${crit} → **${a.F > crit ? 'reject H₀' : 'do not reject H₀'}**`] },
        { label: 'e', prompt: 'Bracket the p-value with the F table: lower and upper bound (lower 0 if p < 0.005, upper 1 if p > 0.10).', inputs: [num('lo', 'Lower', b.lower, 3, 0), num('hi', 'Upper', b.upper, 3, 0)], hints: [], solution: [`→ **${b.text}** (exact p = ${f(a.pValue, 4)})`] },
      ],
    };
  },
};
