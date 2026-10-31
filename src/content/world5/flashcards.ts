import type { Flashcard } from '../types';

const c = (id: string, front: string, back: string): Flashcard => ({ id: `w5-${id}`, topic: 'chisq', front, back });

export const flashcards: Flashcard[] = [
  c('when', 'When do you use the χ² test of independence?', 'Two **categorical** variables from one random sample, summarised in an r × c contingency table.'),
  c('h0', 'H₀ and H₁ of the χ² test of independence?', 'H₀: the variables are independent. H₁: they are associated (dependent).'),
  c('expected', 'What does an expected count represent?', 'The count a cell would have if the two variables were **independent**, given the row and column totals.'),
  c('stat', 'What does a large χ² value mean?', 'Observed counts are far from what independence predicts, so the data speak against independence.'),
  c('tail', 'Is the χ² test one- or two-tailed?', 'Right-tailed: reject H₀ for large χ².'),
  c('crit-table', 'Course χ² table: which column for α = 0.05?', '0.950 — the table gives the left-tail probability P(X < x).'),
  c('condition', 'Validity condition of the χ² test?', 'All **expected** counts ≥ 5 (rule of thumb).'),
  c('condition-fix', 'Expected counts below 5 — what can you do?', 'Merge categories, collect more data, or (2×2) use Fisher\'s exact test.'),
  c('observed-zero', 'An observed count is 0. Is the test invalid?', 'Not necessarily — the condition is about **expected** counts.'),
  c('percent', 'Can you run χ² on percentages?', 'No — always on absolute counts.'),
  c('margins', 'What do expected counts have in common with observed counts?', 'The same row and column totals.'),
  c('contrib', 'What is a cell contribution and why look at it?', '$(O-E)^2/E$ — shows which cells drive the χ² value.'),
  c('cramer', 'What does Cramér\'s V add to the χ² test?', 'The **strength** of the association, from 0 (none) to 1 (perfect). The p-value only says whether there is one, and it also depends on n.'),
  c('causation', 'χ² significant: PartTimeJob and PassFail associated. Does the job cause failing?', 'No — association only; stress or time could be confounders.'),
  c('method', 'Several expected counts are around 2–3. Can you trust the χ² test?', 'No. The validity condition (expected counts ≥ 5) fails, so the χ² approximation is unreliable. Merge categories or collect more data.'),
  c('independent-def', 'Independence in terms of conditional distributions?', 'The row-% profile is the same in every row (equivalently column %).'),
  c('vs-anova', 'Mean grade by method vs pass rate by method — which tests?', 'Mean grade → ANOVA. Pass rate → χ² test of independence.'),
  c('conclusion', 'Conclusion template after rejecting H₀?', '"At α = 0.05 there is sufficient evidence that X and Y are associated (not independent)."'),
  c('large-n', 'Very small p-value → strong association?', 'Not necessarily; p depends on n. Use Cramér\'s V for strength.'),
  c('independent-example', 'The fail rate is 20 % both for students with and without a job. Are Job and PassFail associated?', 'No. Identical conditional distributions are exactly what independence means.'),
  c('expected-why', 'Why are expected counts built from the row and column totals?', 'Under independence each column has the same share in every row, so a cell gets its row total times the overall share of its column.'),
  c('o-equals-e', 'All observed counts equal the expected counts. What is χ², and what does it mean?', 'χ² = 0: the data match independence perfectly, so there is no evidence of an association.'),
  c('bigger-table', 'Why does a bigger table need a larger χ² to reject H₀?', 'More cells add more (O − E)²/E terms even when H₀ is true, so df = (r − 1)(c − 1) grows and the critical value moves to the right.'),
  c('double-n', 'You double every count in the table (same percentages). What happens to χ²?', 'It doubles: same pattern, more evidence, smaller p-value. That is why χ² needs counts, and why the p-value alone does not measure strength.'),
  c('chi-vs-prop', 'How does a χ² test on a 2×2 table relate to comparing two proportions?', 'Both ask whether the rate of one outcome differs between two groups; for a 2×2 table they are equivalent (χ² = z²).'),
];
