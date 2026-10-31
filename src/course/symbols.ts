// Glossary of the symbols used in the course formulas: hover a symbol for its meaning,
// click a formula for the full explanation (see formulaUi.tsx). Keys are the symbols as displayed.

export interface Sym { name: string; desc: string }

const S = (name: string, desc: string): Sym => ({ name, desc });

export const GLOSSARY: Record<string, Sym> = {
  // data and samples
  'x': S('Value', 'One observed value of the variable.'),
  'X': S('Random variable', 'The variable before it is observed; its values follow a distribution.'),
  'xᵢ': S('i-th value', 'The value of observation number i.'),
  'xᵢⱼ': S('Value i in group j', 'Observation number i inside group j.'),
  'y': S('Value of Y', 'One observed value of the dependent (response) variable.'),
  'Y': S('Dependent variable', 'The variable we want to explain or predict (response).'),
  'n': S('Sample size', 'Number of observations in the sample.'),
  'N': S('Population size / normal distribution', 'N = number of elements in the whole population. N(μ, σ²) = a normal distribution with mean μ and variance σ².'),
  'nⱼ': S('Group size', 'Number of observations in group j.'),
  'k': S('Number of groups', 'How many groups (samples) are compared.'),
  'm': S('Number', 'A count, e.g. the number of tests, or the numerator df of an F distribution.'),
  'i': S('Index', 'Counts the observations: i = 1, 2, …, n.'),
  'j': S('Group index', 'Counts the groups (or columns): j = 1, …, k.'),
  'count': S('Count', 'How often a value or category occurs (absolute frequency).'),
  'Σ': S('Sum', 'Add up the expression over all observations (or all cells).'),
  'Σx': S('Sum of values', 'All values added together.'),
  '√': S('Square root', 'Undoes squaring, e.g. turns a variance into a standard deviation.'),

  // centre and spread
  'x̄': S('Sample mean', 'Average of the sample values: Σx / n. Estimates μ.'),
  'X̄': S('Sample mean (random)', 'The sample mean seen as a random variable: it changes from sample to sample.'),
  'x̄ⱼ': S('Group mean', 'Mean of group j.'),
  'ȳ': S('Mean of Y', 'Average of the y values.'),
  'μ': S('Population mean', 'The true mean of the population (a parameter, usually unknown).'),
  'μ₀': S('Hypothesised mean', 'The value of μ stated in H₀.'),
  'μⱼ': S('Population mean of group j', 'True mean of group j.'),
  'μₖ': S('Population mean of group k', 'True mean of the last group.'),
  'μ₁': S('Population mean of group 1', 'True mean of group 1.'),
  'μ₂': S('Population mean of group 2', 'True mean of group 2.'),
  's': S('Sample standard deviation', 'Typical distance of the values from x̄, computed with n − 1. Estimates σ.'),
  's²': S('Sample variance', 'Average squared distance from x̄, dividing by n − 1. Estimates σ².'),
  's₁²': S('Variance of sample 1', 'Sample variance of the first group.'),
  's₂²': S('Variance of sample 2', 'Sample variance of the second group.'),
  'σ': S('Population standard deviation', 'True standard deviation of the population (a parameter).'),
  'σ²': S('Population variance', 'True variance of the population (a parameter).'),
  'Var': S('Variance', 'Expected squared distance from the mean.'),
  'SD': S('Standard deviation', 'Square root of the variance, in the original units.'),
  'CV': S('Coefficient of variation', 'Spread relative to the mean: s / x̄. Unit-free, often in %.'),
  'Range': S('Range', 'Largest value minus smallest value.'),
  'max': S('Maximum', 'The largest value.'),
  'min': S('Minimum', 'The smallest value.'),
  'IQR': S('Interquartile range', 'Q3 − Q1: spread of the middle 50 % of the data.'),
  'Q1': S('First quartile', '25 % of the values lie below it.'),
  'Q3': S('Third quartile', '75 % of the values lie below it.'),
  'position': S('Position', 'Place in the sorted list of values.'),
  'relative frequency': S('Relative frequency', 'Share of observations in a category: count / n.'),

  // probability and distributions
  'P': S('Probability', 'P(…) is the probability of the event in brackets.'),
  'E': S('Expected value', 'E[X] is the long-run average of X.'),
  'F': S('F', 'Cumulative distribution function F(x) = P(X ≤ x), or the F statistic / F distribution.'),
  'f': S('Density', 'f(x) is the probability density function; areas under it are probabilities.'),
  'a': S('Constant / bound', 'A fixed number: a lower bound of an interval, or a constant in aX + b.'),
  'b': S('Constant / bound', 'A fixed number: an upper bound of an interval, or a constant in aX + b.'),
  'Z': S('Standard normal variable', 'Normal with mean 0 and SD 1: Z ~ N(0, 1).'),
  'z': S('z-score', 'Number of standard deviations a value lies from the mean: (x − μ) / σ.'),
  'Φ': S('Standard normal CDF', 'Φ(z) = P(Z < z), the area to the left of z. This is what the z-table gives.'),
  'Φ⁻¹': S('Inverse normal CDF', 'Φ⁻¹(p) is the z with area p to its left (read the z-table backwards).'),
  'T': S('t statistic (random)', 'Standardised sample mean using s instead of σ; follows a t distribution.'),
  't': S('t value', 'A value of the t distribution, or the computed t test statistic.'),
  'df': S('Degrees of freedom', 'Number of values free to vary; picks the row of the t, χ² or F table.'),
  'df₁': S('Numerator df', 'Degrees of freedom of the numerator of F (columns of the F table).'),
  'df₂': S('Denominator df', 'Degrees of freedom of the denominator of F (row blocks of the F table).'),
  'ν': S('Degrees of freedom', 'ν (nu) is the number of degrees of freedom.'),
  'χ²': S('Chi-square', 'A chi-square distributed value, or the chi-square test statistic.'),

  // estimation
  'standard error': S('Standard error', 'How much the estimate varies from sample to sample, e.g. σ / √n for x̄.'),
  'SE': S('Standard error', 'Standard deviation of a statistic across samples, e.g. σ / √n for x̄.'),
  'CI': S('Confidence interval', 'Range of plausible values for the parameter: estimate ± margin of error.'),
  'α': S('Significance level', 'Risk of a Type I error; confidence level = 1 − α. Usually 0.05.'),
  'α/2': S('Half of α', 'Area in each tail for a two-sided interval or test.'),
  'z_α/2': S('Critical z value', 'The z with area α/2 to its right, e.g. 1.960 for 95 %.'),
  't_α/2, n−1': S('Critical t value', 'The t with area α/2 to its right and n − 1 df.'),
  't_crit': S('Critical t value', 'Table value that marks the rejection region.'),
  'reliability factor': S('Reliability factor', 'The critical value (z for α/2, or t for α/2 with n − 1 df) that sets the confidence level.'),
  'margin of error': S('Margin of error', 'Reliability factor × standard error: half the width of the CI.'),
  'point estimate': S('Point estimate', 'The single best guess from the sample, e.g. x̄ or p.'),
  'width': S('Width', 'Upper bound minus lower bound of the interval.'),
  'p': S('Sample proportion', 'Share of successes in the sample: x / n. Estimates π.'),
  'π': S('Population proportion', 'True share of successes in the population (a parameter).'),
  'π₀': S('Hypothesised proportion', 'The value of π stated in H₀.'),

  // testing
  'H₀': S('Null hypothesis', 'The claim tested; it always contains the equality (=, ≤ or ≥).'),
  'H₁': S('Alternative hypothesis', 'What we conclude when H₀ is rejected (≠, > or <).'),

  // ANOVA
  'SSB': S('Sum of squares between', 'Variation of the group means around the grand mean: Σ nⱼ(x̄ⱼ − x̄)².'),
  'SSW': S('Sum of squares within', 'Variation of the values around their own group mean.'),
  'SST': S('Total sum of squares', 'Total variation of all values around the overall mean.'),
  'MSB': S('Mean square between', 'SSB / (k − 1): between-group variance.'),
  'MSW': S('Mean square within', 'SSW / (n − k): within-group variance.'),

  // contingency analysis
  'O': S('Observed count', 'The count in a cell of the contingency table.'),
  'Eᵢⱼ': S('Expected count', 'Count in cell (i, j) expected under independence: row total × column total / grand total.'),
  'r': S('r', 'Correlation coefficient (regression) or number of rows (contingency table).'),
  'c': S('Number of columns', 'Columns of the contingency table.'),
  'row total': S('Row total', 'Sum of the counts in that row.'),
  'row totalᵢ': S('Row total i', 'Sum of the counts in row i.'),
  'column totalⱼ': S('Column total j', 'Sum of the counts in column j.'),
  'grand total': S('Grand total', 'Total number of observations in the table.'),
  'cell count': S('Cell count', 'Number of observations in that cell.'),

  // regression
  'Ŷ': S('Predicted Y', 'Value of Y on the regression line for a given X.'),
  'ŷ': S('Predicted y', 'Value of y on the regression line for a given x.'),
  'b₀': S('Intercept', 'Predicted Y when X = 0: where the line crosses the y-axis.'),
  'b₁': S('Slope', 'Change in predicted Y when X increases by 1 unit.'),
  'β₀': S('Population intercept', 'True intercept of the population regression line.'),
  'β₁': S('Population slope', 'True slope; H₀: β₁ = 0 means no linear relationship.'),
  'e': S('Residual', 'Observed minus predicted: Y − Ŷ.'),
  'R²': S('Coefficient of determination', 'Share of the variation in Y explained by the line (0 to 1).'),
  'SSR': S('Regression sum of squares', 'Explained variation: Σ(ŷ − ȳ)².'),
  'SSE': S('Error sum of squares', 'Unexplained variation: Σ(y − ŷ)², the squared residuals.'),
};

/** Same symbol, different meaning in a specific week or part (key `w{week}` or `w{week}p{part}`). */
const OVERRIDES: Record<string, Record<string, Sym>> = {
  w1p2: { p: S('Percentile as a fraction', 'p = 0.25 for Q1, 0.5 for the median, 0.75 for Q3.') },
  w1p3: { F: S('Cumulative distribution function', 'F(x) = P(X ≤ x): the probability of a value up to x.'), E: S('Expected value', 'E[X] is the long-run average of X, weighted by the probabilities.') },
  w1p4: { p: S('Area', 'Area below z (a probability between 0 and 1).') },
  w1p7: { F: S('F distribution / ratio', 'F(m, n): ratio of two chi-squares divided by their df; F = s₁² / s₂².'), n: S('Denominator df', 'Degrees of freedom of the denominator (n₂ − 1).'), m: S('Numerator df', 'Degrees of freedom of the numerator (n₁ − 1).') },
  w3: { m: S('Number of tests', 'How many independent tests are run.') },
  w4: { F: S('F statistic', 'MSB / MSW: between-group variance relative to within-group variance.'), n: S('Total sample size', 'Number of observations in all groups together.'), 'x̄': S('Grand mean', 'Mean of all observations together.') },
  w5: { E: S('Expected count', 'Count expected in a cell if the variables were independent.'), r: S('Number of rows', 'Rows of the contingency table.') },
  w6: { r: S('Correlation coefficient', 'Strength and direction of the linear relationship, between −1 and 1.'), SST: S('Total sum of squares', 'Total variation of Y: Σ(y − ȳ)².'), X: S('Independent variable', 'The explanatory variable (predictor).') },
};

export const symFor = (key: string, week?: number, part?: number): Sym | undefined =>
  (week && part && OVERRIDES[`w${week}p${part}`]?.[key]) || (week && OVERRIDES[`w${week}`]?.[key]) || GLOSSARY[key];

// ---------- plain-text tokenizer (lesson HTML) ----------

const KEYS = Object.keys(GLOSSARY).filter((k) => !k.includes('_')).sort((a, b) => b.length - a.length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** symbols as whole tokens: not glued to other letters (so "n" in "count" is not a symbol) */
export const TOKEN_RE = new RegExp(`(?<![A-Za-zÀ-ɏ'’])(${KEYS.map(esc).join('|')})(?![A-Za-zÀ-ɏ\\u0304\\u0302])`, 'g');

/** the same for running text (flashcards): only real symbols, not keys that are also English words ("a", "count", "width" …) */
const PROSE_KEYS = KEYS.filter((k) => !/^[a-z]{3,}|^Range$|^[aie]$|\s/.test(k));
export const PROSE_TOKEN_RE = new RegExp(`(?<![A-Za-zÀ-ɏ'’\\d])(${PROSE_KEYS.map(esc).join('|')})(?![A-Za-zÀ-ɏ\\u0304\\u0302'’])`, 'g');

// ---------- TeX tokenizer (KaTeX formulas elsewhere in the app) ----------

const TEX_RULES: [RegExp, string][] = [
  [/\\(?:bar|overline)\s*\{?\s*x\s*\}?(?:_\{?j\}?)/y, 'x̄ⱼ'],
  [/\\(?:bar|overline)\s*\{?\s*x\s*\}?/y, 'x̄'],
  [/\\(?:bar|overline)\s*\{?\s*X\s*\}?/y, 'X̄'],
  [/\\(?:bar|overline)\s*\{?\s*y\s*\}?/y, 'ȳ'],
  [/\\(?:hat|widehat)\s*\{?\s*y\s*\}?/y, 'ŷ'],
  [/\\(?:hat|widehat)\s*\{?\s*Y\s*\}?/y, 'Ŷ'],
  [/\\(?:hat|widehat)\s*\{?\s*p\s*\}?/y, 'p'],
  [/\\sigma\s*\^\s*\{?2\}?/y, 'σ²'],
  [/\\sigma/y, 'σ'],
  [/\\mu\s*_\s*\{?0\}?/y, 'μ₀'],
  [/\\mu/y, 'μ'],
  [/\\pi\s*_\s*\{?0\}?/y, 'π₀'],
  [/\\pi/y, 'π'],
  [/\\alpha/y, 'α'],
  [/\\beta\s*_\s*\{?1\}?/y, 'β₁'],
  [/\\beta\s*_\s*\{?0\}?/y, 'β₀'],
  [/\\chi\s*\^\s*\{?2\}?/y, 'χ²'],
  [/s\s*\^\s*\{?2\}?/y, 's²'],
  [/R\s*\^\s*\{?2\}?/y, 'R²'],
  [/b\s*_\s*\{?1\}?/y, 'b₁'],
  [/b\s*_\s*\{?0\}?/y, 'b₀'],
  [/E\s*_\s*\{?ij\}?/y, 'Eᵢⱼ'],
  [/(?:SSB|SSW|SST|SSR|SSE|MSB|MSW|SE|df|CV|IQR|Var)(?![A-Za-z])/y, '$&'],
  [/[nNkxXyYszZtFpOErc](?![A-Za-z])/y, '$&'],
];

/** Wraps known symbols of a TeX string in \htmlData{sym=…} so the rendered KaTeX can show hover help. */
export function annotateTex(tex: string): string {
  let out = '', i = 0;
  const prevIsLetter = () => /[A-Za-z]/.test(tex[i - 1] ?? '');
  while (i < tex.length) {
    // copy \text{…}, \mathrm{…}, \operatorname{…}, \begin{…}, \end{…} verbatim
    const grp = /\\(?:text|mathrm|textbf|operatorname|begin|end)\s*\{[^{}]*\}/y; grp.lastIndex = i;
    const g = grp.exec(tex);
    if (g) { out += g[0]; i += g[0].length; continue; }
    let hit = false;
    for (const [re, key] of TEX_RULES) {
      re.lastIndex = i;
      const m = re.exec(tex);
      if (!m || (/^[A-Za-z]/.test(m[0]) && prevIsLetter())) continue;
      const k = key === '$&' ? m[0] : key;
      out += `{\\htmlData{sym=${k}}{${m[0]}}}`;
      i += m[0].length; hit = true; break;
    }
    if (hit) continue;
    // any other command: copy its whole name so its letters are never treated as symbols
    const cmd = /\\[A-Za-z]+|\\./y; cmd.lastIndex = i;
    const c = cmd.exec(tex);
    if (c) { out += c[0]; i += c[0].length; continue; }
    out += tex[i++];
  }
  return out;
}
