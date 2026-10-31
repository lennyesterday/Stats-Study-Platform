import type { Flashcard } from '../types';

const c = (id: string, topic: Flashcard['topic'], front: string, back: string): Flashcard => ({ id: `w2-${id}`, topic, front, back });

export const flashcards: Flashcard[] = [
  c('srs', 'sampling', 'Simple random sample — definition?', 'Every member of the population has the same chance of being selected, independently of the others.'),
  c('bias', 'sampling', 'Does a larger sample fix a biased sampling method?', 'No. n reduces **random** error (sampling variability), not **systematic** error (bias).'),
  c('variability', 'sampling', 'Two random samples give x̄ = 9.1 and 9.6. Why?', '**Sampling variability** — statistics vary from sample to sample by chance.'),
  c('sampdist', 'sampling', 'What is the sampling distribution of x̄?', 'The distribution of x̄ over all possible samples of size n: centre μ, spread σ/√n.'),
  c('se', 'sampling', 'What does the standard error of the mean measure, and why does it shrink as n grows?', 'How much x̄ varies from sample to sample. Larger samples average out more of the individual variation, so x̄ lands closer to μ: the SE shrinks with √n.'),
  c('sd-vs-se', 'sampling', 'SD vs. SE?', 'SD: spread of **individual** values. SE: spread of **sample means** (SD/√n).'),
  c('halve-se', 'sampling', 'How must n change to halve the SE?', 'Multiply n by **4** (SE ∝ 1/√n).'),
  c('clt', 'sampling', 'State the Central Limit Theorem.', 'For n large (≥ 30), the sampling distribution of x̄ is approximately **normal** with mean μ and SE σ/√n — whatever the shape of the population.'),
  c('clt-data', 'sampling', '"By the CLT the data become normal when n ≥ 30." True?', 'False. The CLT concerns the distribution of the **sample mean**, not of the data.'),
  c('clt-normal-pop', 'sampling', 'Population is normal and n = 8. Is x̄ normal?', 'Yes — exactly normal for any n when the population is normal. CLT is needed only for non-normal populations.'),
  c('clt-z', 'sampling', 'Why do you divide by σ/√n (not by σ) when computing z for a sample mean?', 'You are locating x̄ within the sampling distribution of x̄, and its spread is the standard error σ/√n, not the spread of individual values.'),
  c('unbiased', 'ci-mean', 'Unbiased estimator?', 'Its sampling distribution is centred on the parameter: $E(\\hat\\theta)=\\theta$ (e.g. x̄ for μ, s² for σ²).'),
  c('point', 'ci-mean', 'Point estimators of μ, σ, π?', 'x̄, s, p.'),
  c('ci-structure', 'ci-mean', 'Structure of every CI in the course?', 'Point estimate ± **margin of error**, and ME = **reliability factor** × standard error.'),
  c('ci-t', 'ci-mean', 'CI for μ: when do you use z and when t? Why?', '**z** when σ is known, **t** when σ is estimated by s. Estimating σ adds uncertainty, so t has heavier tails and gives a wider interval. For large n, t ≈ z.'),
  c('col975', 'ci-mean', 'Which t-table column for a 95 % two-sided CI?', '**0.975** (α/2 = 0.025 in each tail).'),
  c('ci-width-n', 'ci-mean', 'Effect of n ↑ on the CI?', 'SE ↓ → ME ↓ → narrower (more precise) interval.'),
  c('ci-width-conf', 'ci-mean', '95 % → 99 % confidence: effect on the CI?', 'Larger reliability factor (1.96 → 2.576) → **wider** interval (less precise).'),
  c('precision', 'ci-mean', 'Which is more precise: 15.0 ± 0.2 or 15.0 ± 1.5?', '15.0 ± 0.2 — smaller margin of error.'),
  c('n-formula', 'ci-mean', 'You want half the margin of error. How must n change, and why round n up?', '**4 times** as large, because the margin shrinks with √n. Round up, because rounding down would leave the margin slightly too large.'),
  c('from-ci', 'ci-mean', 'Given CI [14.4; 15.6]: x̄ and ME?', 'x̄ = midpoint = 15.0; ME = half-width = 0.6.'),
  c('ci-prop', 'ci-prop', 'Why does the CI for a proportion use z, never t?', 'Its SE comes from p itself; there is no separate σ to estimate. For large n the CLT makes p approximately normal, so z is used.'),
  c('prop-cond', 'ci-prop', 'Why does the proportion CI need np ≥ 5 and n(1 − p) ≥ 5?', 'Enough successes and failures are needed for the normal approximation to work. With too few, the distribution of p is too skewed.'),
  c('interp', 'ci-mean', 'Correct interpretation of a 95 % CI [a; b] for μ?', 'We are 95 % confident that the **population mean** lies between a and b (95 % of intervals built this way contain μ).'),
  c('interp-wrong', 'ci-mean', 'What is wrong with "95 % of students have a GPA in the CI"?', 'The CI is about the **mean** μ, not about individual students.'),
  c('interp-prob', 'ci-mean', '"There is a 95 % probability that μ is in [14.4; 15.6]." Problem?', 'μ is fixed; a computed interval either contains it or not. The 95 % refers to the **method** (long-run coverage).'),
  c('df59', 'ci-mean', 'df = 59 is not in the t table. What do you do?', 'Use the nearest row (df = 60). At this size the t values barely change from row to row.'),
];
