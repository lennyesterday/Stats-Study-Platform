import type { Flashcard } from '../types';

const c = (id: string, front: string, back: string): Flashcard => ({ id: `w4-${id}`, topic: 'anova', front, back });

export const flashcards: Flashcard[] = [
  c('when', 'When do you use one-way ANOVA?', 'Metric dependent variable × one categorical factor with k ≥ 2 groups; compare the k population means.'),
  c('why-not-t', 'Why not run all pairwise t-tests instead of ANOVA?', 'Every test has its own α chance of a false alarm, so with many tests the chance of at least one false "significant" result grows a lot (6 tests at 5 % → about 26 %). ANOVA tests everything at once with one α.'),
  c('h0', 'H₀ and H₁ of one-way ANOVA?', '$H_0: \\mu_1 = \\dots = \\mu_k$; $H_1$: **at least one** mean differs.'),
  c('h1-wrong', '"H₁: all means are different." Correct?', 'No — one differing mean is enough for H₁.'),
  c('assumptions', 'Assumptions of one-way ANOVA?', 'Independent random samples, normal populations (or large groups), equal variances.'),
  c('sst', 'SST — what does it measure?', 'Total variation of all observations around the grand mean.'),
  c('ssb', 'What does SSB capture, and what does a large SSB (relative to SSW) suggest?', 'Variation **between** group means, explained by the factor. If it is large compared with the noise inside groups, the groups really seem to differ.'),
  c('ssw', 'What does SSW capture?', 'Variation **within** the groups: the noise the factor does not explain.'),
  c('decomp', 'Key identity of ANOVA?', 'SST = SSB + SSW (and df_T = df_B + df_W).'),
  c('ms', 'Why divide the sums of squares by their df before comparing them?', 'SS grow with the number of groups and observations. Dividing by df turns them into comparable variance estimates (mean squares).'),
  c('f', 'What does F = MSB/MSW compare, and when is it large?', 'Between-group variance vs. within-group variance. F is large when the group means differ more than the noise inside the groups would explain.'),
  c('f-one', 'What value does F take on average when H₀ is true?', 'About 1 — MSB and MSW both estimate σ².'),
  c('tail', 'Is the ANOVA F test one- or two-tailed?', 'Always **right-tailed**: reject if F > critical value.'),
  c('ftable', 'F table for ANOVA: where is k − 1 and n − k?', 'k − 1 = **m** (numerator, columns); n − k = **n** (denominator, blocks); row = 1 − α.'),
  c('ms-add', 'Do MS values add up in the ANOVA table?', 'No — only SS and df add up.'),
  c('eta', 'η² in ANOVA?', 'SSB/SST — share of total variability explained by the factor.'),
  c('posthoc', 'Purpose of post-hoc tests (Tukey, Bonferroni)?', 'After a significant F: find **which** pairs of means differ while controlling the family-wise error rate.'),
  c('posthoc-when', 'Run post-hoc tests after a non-significant F?', 'No — only after rejecting H₀.'),
  c('causation', 'Tutoring group has the highest mean grade (significant). Does tutoring cause better grades?', 'Not from observational data — association only; confounders (motivation, time) possible.'),
  c('vs-chi', 'ANOVA vs. contingency analysis — key difference?', 'ANOVA: metric Y by groups (means). χ²: two categorical variables (frequencies).'),
  c('conclusion', 'Conclusion template after rejecting H₀ in ANOVA?', '"At α = 0.05 there is sufficient evidence that the mean [Y] differs for at least one [factor] group."'),
  c('regression-link', 'Which other test uses the same "explained / unexplained" F logic?', 'The F test of a regression: F = MSR/MSE.'),
  c('reject-meaning', 'ANOVA rejects H₀. What do you know, and what not?', 'At least one population mean differs. Not **which** one(s) and not **how big** the differences are: that needs post-hoc tests and an effect size (η²).'),
  c('k2-t', 'ANOVA with only 2 groups: how does it relate to the two-sample t-test?', 'Same question, same decision (F = t²). ANOVA generalises the comparison of two means to k groups.'),
  c('more-noise', 'Same group means, but much more spread inside each group. What happens to F, and why?', 'F gets **smaller**: MSW grows, so the same differences between the means are harder to tell apart from noise.'),
  c('bigger-gap', 'The group means move further apart, the spread inside groups stays the same. Effect on F and the p-value?', 'SSB and MSB grow → F grows → the p-value shrinks.'),
];
