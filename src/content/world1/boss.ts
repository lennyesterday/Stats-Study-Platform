import { mean, round, sd } from '../../lib/stats';
import { tTable, zTable } from '../../lib/tables';
import { f, num, numColumn, readChi2, readF, readT, readZp } from '../helpers';
import type { BossDef } from '../types';

export const boss: BossDef = {
  title: 'The Table Golem',
  story: 'A golem made of statistical tables blocks the bridge out of World 1. It only crumbles if you compute, standardise and read every table correctly — no hints.',
  generate: (rng) => {
    const xs = rng.shuffle(numColumn('FinalGrade')).slice(0, 6);
    const m = mean(xs), s = sd(xs);
    const x0 = rng.int(50, 85);
    const z = round((x0 - 67.2) / 15.2, 2);
    const pAbove = rng.pick([0.95, 0.9, 0.975]);
    const df = 5;
    const tv = tTable(df, round(1 - pAbove, 3)).value;
    const chiDf = rng.pick([3, 4, 6, 8]);
    const fm = rng.pick([2, 3, 4]), fn = rng.pick([10, 12, 15, 20]);
    const chi = readChi2(chiDf, 0.95), fv = readF(fm, fn, 0.95);
    return {
      intro: `Six final grades drawn from the dataset: **${xs.join(', ')}**.`,
      parts: [
        { label: 'a', prompt: 'Compute the sample mean and the sample standard deviation (2 decimals).', inputs: [num('m', 'x̄', m, 2), num('s', 's', s, 2, 0.01)], hints: [], solution: [`$\\bar x = ${f(m, 2)}$, $s = ${f(s, 2)}$ (divide by n − 1 = 5).`] },
        { label: 'b', prompt: `Assume FinalGrade ~ N(67.2, 15.2). Find $P(X > ${x0})$ with the Z table (4 decimals).`, inputs: [num('p', 'P(X > x)', 1 - zTable(z), 4, 0.0001)], hints: [], solution: [`$z = (${x0} - 67.2)/15.2 = ${f(z, 2)}$`, readZp(z).text, `$P(X > ${x0}) = 1 - ${f(zTable(z), 4)} = ${f(1 - zTable(z), 4)}$`] },
        { label: 'c', prompt: `For a t-Student variable with df = ${df}, find t such that the probability of obtaining a value **above** it is ${pAbove} (3 decimals).`, inputs: [num('t', 't', tv, 3, 0)], hints: [], solution: [`$P(T > t) = ${pAbove} \\iff P(T < t) = ${round(1 - pAbove, 3)}$`, `${readT(df, pAbove).text}; by symmetry t = **${f(tv, 3)}**`] },
        { label: 'd', prompt: `Find q with $P(\\chi^2_{${chiDf}} < q) = 0.95$ and f with $P(F_{${fm},${fn}} < f) = 0.95$.`, inputs: [num('q', 'q (3 decimals)', chi.value, 3, 0), num('f', 'f (2 decimals)', fv.value, 2, 0)], hints: [], solution: [chi.text, fv.text] },
      ],
    };
  },
};
