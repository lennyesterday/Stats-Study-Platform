import type { Flashcard } from '../types';

const c = (id: string, topic: Flashcard['topic'], front: string, back: string): Flashcard => ({ id: `w3-${id}`, topic, front, back });

export const flashcards: Flashcard[] = [
  c('h0', 'testing', 'What always belongs in H₀?', 'The **equality** (=, ≤, ≥) and a specific value μ₀ or π₀. Hypotheses are about parameters.'),
  c('tails', 'testing', 'Words → tails: "differs", "more than", "less than"?', '≠ two-tailed · > right-tailed · < left-tailed.'),
  c('gpa15', 'testing', 'Hypotheses for "the mean GPA is higher than 15"?', '$H_0: \\mu \\le 15$ vs $H_1: \\mu > 15$'),
  c('sleep7', 'testing', 'Hypotheses for "students sleep less than 7 hours"?', '$H_0: \\mu \\ge 7$ vs $H_1: \\mu < 7$'),
  c('steps', 'testing', 'The 6 steps of a hypothesis test?', 'Hypotheses → α → test statistic → critical value / p-value → decision → conclusion in context.'),
  c('t-stat', 'testing', 'What does a test statistic like t = (x̄ − μ₀)/(s/√n) actually measure?', 'How many **standard errors** the sample mean lies from the value claimed by H₀. A large |t| means the data are hard to explain if H₀ were true.'),
  c('crit-two', 'testing', 'Why is the critical z for a two-tailed test (1.96) bigger than for a one-tailed test (1.645) at the same α?', 'Two-tailed splits α over both tails (2.5 % each), so you must go further out to cut off only 2.5 % on one side.'),
  c('pval-def', 'errors', 'Definition of the p-value?', 'Probability, **assuming H₀ is true**, of a test statistic at least as extreme as the observed one.'),
  c('pval-rule', 'errors', 'Decision rule with the p-value?', 'Reject H₀ if p-value < α.'),
  c('pval-wrong', 'errors', '"p = 0.03 means a 3 % chance H₀ is true." Correct?', 'No. p is computed **assuming** H₀; it is not the probability of H₀.'),
  c('pval-two', 'errors', 'Why do you double the tail probability for a two-tailed p-value?', 'With H₁: ≠, results that extreme in **either** direction count as evidence, so the other tail counts too.'),
  c('pval-bracket', 'errors', 'The t table has no p-values. How do you get the p-value for t = 2.35 (df 10)?', 'Find the two columns in row df = 10 whose values surround 2.35. Their probabilities bracket the p-value (here 0.02 < p < 0.05, two-tailed).'),
  c('same-decision', 'errors', 'Can the p-value and critical-value methods disagree?', 'Never — they always give the same decision.'),
  c('type1', 'errors', 'Type I error?', 'Rejecting H₀ when it is **true** ("false alarm"). P = α.'),
  c('type2', 'errors', 'Type II error?', 'Not rejecting H₀ when it is **false** ("missed effect"). P = β.'),
  c('power', 'errors', 'Power of a test?', '1 − β = P(reject H₀ | H₀ false).'),
  c('n-power', 'errors', 'Effect of a larger n on α, β and power?', 'α stays as chosen; SE ↓ → β ↓ → power ↑.'),
  c('alpha-beta', 'errors', 'Lowering α from 0.05 to 0.01 (same n): effect on β?', 'β increases (harder to reject → more missed effects).'),
  c('accept', 'errors', 'Why never write "we accept H₀"?', 'Failing to reject only means insufficient evidence; H₀ is not proven (n may be too small).'),
  c('practical', 'errors', 'Statistical vs. practical significance?', 'Statistical: unlikely due to chance (p < α). Practical: big enough to matter. Large n can make tiny effects significant.'),
  c('ci-test', 'testing', 'How does a 95 % CI decide a two-tailed test at α = 0.05?', 'Reject H₀: μ = μ₀ iff μ₀ lies **outside** the CI.'),
  c('ci-test-01', 'testing', 'To decide a two-tailed test at α = 0.01 with a CI, which CI?', 'The **99 %** CI.'),
  c('prop-ci-vs-test', 'test-prop', 'Why does the test for π use π₀ in the SE, but the CI uses p?', 'The test asks "what if H₀ were true?", so it uses the claimed value π₀. A CI has no claimed value, so it uses the best estimate p.'),
  c('conclusion', 'testing', 'Template for the conclusion sentence?', '"At the 5 % significance level, there is (not) sufficient evidence to conclude that [H₁ in words, with context]."'),
  c('test-z-or-t', 'testing', 'σ unknown but n = 200: z or t?', 'Formally t (df = 199) — but t ≈ z for large n (use the ∞ / 120 row).'),
];
