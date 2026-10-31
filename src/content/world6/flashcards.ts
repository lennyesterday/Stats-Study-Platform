import type { Flashcard, TopicId } from '../types';

const c = (id: string, front: string, back: string, topic: TopicId = 'regression'): Flashcard => ({ id: `w6-${id}`, topic, front, back });

export const flashcards: Flashcard[] = [
  c('when', 'When do you use simple linear regression?', 'Two **metric** variables; explain/predict Y from X with a straight line.'),
  c('r', 'Pearson correlation r: range and meaning?', '−1 ≤ r ≤ 1; strength and direction of the **linear** relationship.'),
  c('b1', 'How are the slope b₁ and the correlation r related?', 'They always have the same sign. The slope is the correlation rescaled into "units of Y per unit of X" (b₁ = r·s_y/s_x).'),
  c('point', 'Which point always lies on the OLS line?', '$(\\bar x, \\bar y)$'),
  c('ols', 'What does OLS minimise?', 'The sum of squared residuals $\\sum (y_i - \\hat y_i)^2$.'),
  c('slope-int', 'Interpret b₁ = 0.8 (GPA on daily study hours).', 'Each additional daily study hour is associated with a GPA that is on average 0.8 points higher.'),
  c('intercept', 'When is the intercept meaningful?', 'Only if x = 0 is within (or near) the observed range of X.'),
  c('residual', 'Residual definition?', '$e = y - \\hat y$ (observed minus predicted).'),
  c('resid-sum', 'Sum of the OLS residuals?', 'Always 0.'),
  c('decomp', 'Variance decomposition in regression?', 'SST = SSR + SSE'),
  c('r2', 'R² definition and meaning?', 'SSR/SST = 1 − SSE/SST: share of the variability of Y explained by the model.'),
  c('r2-r', 'R² = 0.60, slope negative. r = ?', '$r = -\\sqrt{0.60} = -0.775$'),
  c('se', 'What does the standard error of the estimate s_e tell you?', 'The typical size of a residual: how far observations lie from the line, in units of Y.'),
  c('t', 'What question does the test of H₀: β₁ = 0 answer?', 'Is there a linear relationship in the population at all? β₁ = 0 would mean X does not help predict Y.', 'reg-inference'),
  c('ci', 'The 95 % CI for β₁ contains 0. What do you conclude?', 'The slope is not significant at α = 0.05: no evidence of a linear relationship.', 'reg-inference'),
  c('ft', 'Link between F and t in simple regression?', '$F = t^2$, identical p-values.', 'reg-inference'),
  c('anova-table', 'Why does the regression output contain an ANOVA table with F = MSR/MSE?', 'Same idea as ANOVA: explained variation (by the line) vs. unexplained variation (residuals). A large F means the line explains much more than noise.', 'reg-inference'),
  c('sigf', 'What is "Significance F" in Excel?', 'The p-value of the F test (= p-value of the slope in simple regression).', 'reg-inference'),
  c('line', 'Regression assumptions (LINE)?', 'Linearity, Independence, Normality of errors, Equal variance.', 'reg-inference'),
  c('resid-plot', 'Funnel shape in a residual plot means?', 'Heteroscedasticity (non-constant variance).', 'reg-inference'),
  c('curve', 'Curved pattern in a residual plot means?', 'The relationship is not linear.', 'reg-inference'),
  c('extrap', 'What is extrapolation and why is it risky?', 'Predicting outside the observed X range — the linear pattern may not hold there.'),
  c('causation', 'High r between study hours and grades — causal?', 'Not necessarily; confounders like motivation may drive both.'),
  c('r2-wrong', '"R² = 0.6 means predictions are 60 % accurate." True?', 'No — 60 % of the **variability** of Y is explained.'),
  c('symmetry', 'Is the regression of Y on X the same line as X on Y?', 'No (unless |r| = 1). Correlation is symmetric, regression is not.'),
];
