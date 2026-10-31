// Conceptual Moodle-style questions (true/false, single choice, drop-down gaps) used in mock exams only.
import type { MockQuestion, TopicId } from '../types';

type Q = MockQuestion;
const tf = (id: string, topic: TopicId, prompt: string, answer: boolean, why: string): Q => ({ id, topic, type: 'truefalse', prompt, answer, solution: [why] });
const single = (id: string, topic: TopicId, prompt: string, options: string[], answer: number, why: string): Q => ({ id, topic, type: 'single', prompt, options, answer, solution: [why] });
const gaps = (id: string, topic: TopicId, prompt: string, g: { options: string[]; answer: number }[], why: string): Q => ({ id, topic, type: 'gaps', prompt, gaps: g, solution: [why] });

/** early part of an exam: worlds 1–3 */
export const EARLY: Q[] = [
  tf('c-var1', 'variables', 'StressLevel (Low / Medium / High) is an ordinal qualitative variable.', true, 'Categories with a natural order → ordinal.'),
  tf('c-var2', 'variables', 'StudentID is a quantitative discrete variable because it contains numbers.', false, 'IDs are labels → nominal qualitative.'),
  tf('c-desc1', 'descriptives', 'The median is more affected by outliers than the mean.', false, 'The mean is pulled by outliers; the median is robust.'),
  tf('c-desc2', 'descriptives', 'If a distribution is right-skewed, the mean is usually larger than the median.', true, 'The long right tail pulls the mean up.'),
  single('c-desc3', 'descriptives', 'Which Excel function gives the sample standard deviation?', ['STDEV.S', 'STDEV.P', 'VAR.S', 'AVERAGE'], 0, 'STDEV.S divides by n − 1.'),
  tf('c-dist1', 'distributions', 'For a standard normal Z, P(Z = 1.5) = 0.9332.', false, 'For a continuous variable any single value has probability 0; 0.9332 = P(Z < 1.5).'),
  tf('c-tab1', 'tables', 'In the course χ² table, the critical value for α = 0.05 is found in the column 0.950.', true, 'The tables give left-tail probabilities P(X < x).'),
  tf('c-tab2', 'tables', 'As df increases, the t critical value for a fixed confidence level gets smaller and approaches the z value.', true, 'Row ∞ equals the z values (e.g. 1.960).'),
  tf('c-clt1', 'sampling', 'The Central Limit Theorem says that for large n the population becomes normal.', false, 'It is the sampling distribution of x̄ that becomes approximately normal, not the population.'),
  tf('c-clt2', 'sampling', 'Quadrupling the sample size halves the standard error of the mean.', true, 'SE = σ/√n; √4 = 2.'),
  single('c-clt3', 'sampling', 'The standard deviation of the sampling distribution of x̄ is called…', ['the standard error', 'the sample standard deviation', 'the margin of error', 'the reliability factor'], 0, 'SE = σ/√n.'),
  tf('c-ci1', 'ci-mean', 'A 95 % CI of [14.2; 15.8] means that 95 % of all students have a GPA between 14.2 and 15.8.', false, 'The CI is about the population mean μ, not individual values.'),
  tf('c-ci2', 'ci-mean', 'Other things equal, a 99 % CI is wider than a 95 % CI.', true, 'Larger reliability factor (2.576 vs 1.960).'),
  single('c-ci3', 'ci-mean', 'σ unknown, n = 16. Which reliability factor for a 95 % CI?', ['t₀.₉₇₅;15 = 2.131', 'z₀.₉₇₅ = 1.960', 't₀.₉₅;15 = 1.753', 't₀.₉₇₅;16 = 2.120'], 0, 'df = n − 1 = 15, column 0.975.'),
  tf('c-cip1', 'ci-prop', 'For a CI for a proportion we use the t distribution with n − 1 df.', false, 'Proportions use z (large-sample normal approximation).'),
  tf('c-test1', 'testing', 'If the p-value is 0.03, we reject H₀ at α = 0.05 but not at α = 0.01.', true, '0.03 < 0.05 but 0.03 > 0.01.'),
  tf('c-test2', 'testing', 'Not rejecting H₀ proves that H₀ is true.', false, 'We only lack sufficient evidence against it.'),
  gaps('c-test3', 'testing', 'In a right-tailed t test with t = 2.40 and critical value 1.711, we {0} H₀ because the test statistic is {1} the critical value.', [{ options: ['reject', 'do not reject'], answer: 0 }, { options: ['greater than', 'smaller than'], answer: 0 }], '2.40 > 1.711 → reject H₀.'),
  single('c-err1', 'errors', 'A Type I error is…', ['rejecting H₀ when H₀ is true', 'not rejecting H₀ when H₀ is false', 'rejecting H₁ when H₁ is true', 'using the wrong table'], 0, 'P(Type I) = α.'),
  tf('c-err2', 'errors', 'Increasing the sample size (α fixed) increases the power of a test.', true, 'Smaller SE → easier to detect a true difference.'),
  gaps('c-err3', 'errors', 'Lowering α from 0.05 to 0.01 makes a Type I error {0} likely and a Type II error {1} likely.', [{ options: ['less', 'more'], answer: 0 }, { options: ['more', 'less'], answer: 0 }], 'Smaller rejection region: fewer false alarms, more misses (lower power).'),
  tf('c-prop1', 'test-prop', 'In a z test for a proportion, the standard error is computed with the hypothesised value π₀.', true, 'SE = √(π₀(1 − π₀)/n) under H₀.'),
];

/** last six questions: worlds 4–6 */
export const LATE: Q[] = [
  tf('c-an1', 'anova', 'In a one-way ANOVA, H₁ states that all population means are different.', false, 'H₁: at least one mean differs.'),
  tf('c-an2', 'anova', 'In the ANOVA table, MSB + MSW = MST.', false, 'Only SS and df add up.'),
  single('c-an3', 'anova', 'k = 4 groups, n = 40. Degrees of freedom of the F statistic?', ['(3, 36)', '(4, 40)', '(3, 39)', '(36, 3)'], 0, 'df = (k − 1, n − k).'),
  gaps('c-an4', 'anova', 'ANOVA compares {0} using the ratio of between-group to within-group {1}.', [{ options: ['means', 'variances', 'proportions'], answer: 0 }, { options: ['variability', 'medians', 'counts'], answer: 0 }], 'Means are compared via variance ratio F = MSB/MSW.'),
  tf('c-chi1', 'chisq', 'The χ² test of independence requires all observed counts to be at least 5.', false, 'The rule concerns expected counts.'),
  single('c-chi2', 'chisq', 'Degrees of freedom of a χ² test of independence on a 3 × 4 table?', ['6', '12', '11', '7'], 0, '(3 − 1)(4 − 1) = 6.'),
  tf('c-chi3', 'chisq', 'A significant χ² test proves that one variable causes the other.', false, 'Association only.'),
  tf('c-reg1', 'regression', 'In simple regression, R² equals the square of the correlation coefficient r.', true, 'R² = r².'),
  single('c-reg2', 'regression', 'R² = 0.64 and the slope is negative. Then r =', ['−0.80', '0.80', '−0.64', '0.41'], 0, 'r = −√0.64.'),
  tf('c-reg3', 'regression', 'The OLS regression line always passes through (x̄, ȳ).', true, 'b₀ = ȳ − b₁x̄.'),
  tf('c-regi1', 'reg-inference', 'The t test for the slope in simple regression has n − 1 degrees of freedom.', false, 'Two parameters are estimated → n − 2.'),
  gaps('c-regi2', 'reg-inference', 'In simple regression, the F statistic of the ANOVA table equals {0} and has df {1}.', [{ options: ['t²', '√t', '2t'], answer: 0 }, { options: ['(1, n − 2)', '(2, n − 1)', '(1, n − 1)'], answer: 0 }], 'F = t², df (1, n − 2).'),
];
