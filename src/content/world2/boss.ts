import { round } from '../../lib/stats';
import { zTable } from '../../lib/tables';
import { f, num, readT, readZp } from '../helpers';
import type { BossDef } from '../types';
import { tableN, tConf } from './exercises';

export const boss: BossDef = {
  title: 'The Interval Hydra',
  story: 'Cut off one head and two intervals grow back. Only precise reliability factors, correct standard errors and an honest CLT can defeat the Hydra.',
  generate: (rng) => {
    const n = tableN(rng, 26), xbar = rng.float(6.2, 7.4, 2), s = rng.float(0.6, 1.1, 2);
    const t = tConf(0.95, n - 1), se = s / Math.sqrt(n);
    const N = rng.pick([36, 49, 64]), mu = 6.8, sigma = 0.85, a = round(mu + rng.float(0.1, 0.3, 2), 2);
    const z = round((a - mu) / (sigma / Math.sqrt(N)), 2);
    const x = rng.int(18, 30), m = 60, p = x / m, sep = Math.sqrt((p * (1 - p)) / m);
    const E = rng.pick([0.1, 0.15, 0.2]);
    const nReq = Math.ceil((1.96 * sigma / E) ** 2 - 1e-9);
    return {
      intro: `A survey of SleepHoursPerNight among **n = ${n}** students gives x̄ = **${xbar}** h and s = **${s}** h.`,
      parts: [
        { label: 'a', prompt: 'Build a 95 % CI for μ: give the reliability factor (3 dec.) and both bounds (3 dec.).', inputs: [num('t', 't', t, 3, 0), num('lo', 'Lower', xbar - t * se, 3, 0.002), num('hi', 'Upper', xbar + t * se, 3, 0.002)], hints: [], solution: [readT(n - 1, 0.975).text, `SE = ${f(se, 4)}, ME = ${f(t * se, 4)} → [${f(xbar - t * se, 3)}; ${f(xbar + t * se, 3)}]`] },
        { label: 'b', prompt: `Now assume μ = 6.8, σ = 0.85. For a new random sample of N = ${N}, find $P(\\bar X > ${a})$ (4 dec.).`, inputs: [num('p', 'P(x̄ > a)', 1 - zTable(z), 4, 0.0002)], hints: [], solution: [`CLT: SE = 0.85/√${N} = ${f(sigma / Math.sqrt(N), 4)}; z = ${f(z, 2)}`, readZp(z).text, `1 − ${f(zTable(z), 4)} = ${f(1 - zTable(z), 4)}`] },
        { label: 'c', prompt: `${x} of 60 surveyed students sleep less than 6.5 h. 95 % CI for π (bounds, 3 dec.).`, inputs: [num('lo', 'Lower', p - 1.96 * sep, 3, 0.002), num('hi', 'Upper', p + 1.96 * sep, 3, 0.002)], hints: [], solution: [`p = ${f(p, 4)}, SE = ${f(sep, 4)} → [${f(p - 1.96 * sep, 3)}; ${f(p + 1.96 * sep, 3)}]`] },
        { label: 'd', prompt: `How many students are needed to estimate μ within ±${E} h at 95 % (σ = 0.85)?`, inputs: [num('n', 'n', nReq, 0, 0)], hints: [], solution: [`(1.96 × 0.85 / ${E})² = ${f((1.96 * sigma / E) ** 2, 2)} → **${nReq}**`] },
      ],
    };
  },
};
