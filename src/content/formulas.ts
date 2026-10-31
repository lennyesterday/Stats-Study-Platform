// Formula sheet content (KaTeX). Shown on /formulas, printable, and as side panel in mock exams.
import type { WorldId } from './types';

export interface FormulaItem { id: string; name: string; tex: string; meaning: string; use: string; assumptions?: string; df?: string }
export interface FormulaGroup { id: string; world: WorldId; title: string; items: FormulaItem[] }

export const FORMULAS: FormulaGroup[] = [
  {
    id: 'desc', world: 1, title: 'Descriptive statistics & standardising',
    items: [
      { id: 'mean', name: 'Mean', tex: '\\bar x = \\frac{\\sum x_i}{n}', meaning: 'Arithmetic average', use: 'Centre of metric data (sensitive to outliers)' },
      { id: 'var-s', name: 'Sample variance / SD', tex: 's^2 = \\frac{\\sum (x_i-\\bar x)^2}{n-1},\\quad s = \\sqrt{s^2}', meaning: 'Spread around the mean (VAR.S / STDEV.S)', use: 'Data are a sample' },
      { id: 'var-p', name: 'Population variance / SD', tex: '\\sigma^2 = \\frac{\\sum (x_i-\\mu)^2}{N}', meaning: 'Spread of a full population (VAR.P / STDEV.P)', use: 'Data are the whole population' },
      { id: 'cv', name: 'Coefficient of variation', tex: 'CV = \\frac{s}{\\bar x}', meaning: 'Relative spread (unit-free)', use: 'Compare variability across scales' },
      { id: 'z', name: 'Standardisation', tex: 'z = \\frac{x-\\mu}{\\sigma}', meaning: 'Number of SDs from the mean', use: 'Normal probabilities via the Z table' },
    ],
  },
  {
    id: 'sampling', world: 2, title: 'Sampling distributions & confidence intervals',
    items: [
      { id: 'se', name: 'Standard error of x̄', tex: 'SE = \\frac{\\sigma}{\\sqrt n}\\ \\ (\\text{or } s/\\sqrt n)', meaning: 'SD of the sampling distribution of x̄', use: 'CLT: x̄ ≈ N(μ, σ²/n)', assumptions: 'Normal population or n ≥ 30 (CLT)' },
      { id: 'clt', name: 'CLT probability', tex: 'z = \\frac{\\bar x-\\mu}{\\sigma/\\sqrt n}', meaning: 'Standardised sample mean', use: 'P(x̄ > a), P(a < x̄ < b)' },
      { id: 'ci-z', name: 'CI for μ, σ known', tex: '\\bar x \\pm z_{1-\\alpha/2}\\,\\frac{\\sigma}{\\sqrt n}', meaning: 'Reliability factor × SE', use: '90 % 1.645 · 95 % 1.960 · 99 % 2.576' },
      { id: 'ci-t', name: 'CI for μ, σ unknown', tex: '\\bar x \\pm t_{1-\\alpha/2;\\,n-1}\\,\\frac{s}{\\sqrt n}', meaning: 't reliability factor', use: 'Usual case in practice', assumptions: 'Normal population or large n', df: 'n − 1' },
      { id: 'ci-p', name: 'CI for π', tex: 'p \\pm z_{1-\\alpha/2}\\sqrt{\\frac{p(1-p)}{n}}', meaning: 'Proportion interval', use: 'Share of students with property X', assumptions: 'np ≥ 5 and n(1 − p) ≥ 5' },
      { id: 'n', name: 'Sample size for μ', tex: 'n = \\left(\\frac{z_{1-\\alpha/2}\\,\\sigma}{E}\\right)^2 \\ \\text{(round up)}', meaning: 'Smallest n for margin of error E', use: 'Planning a survey' },
      { id: 'n-p', name: 'Sample size for π', tex: 'n = \\frac{z^2\\,\\pi(1-\\pi)}{E^2}\\ \\ (\\pi = 0.5 \\text{ if unknown})', meaning: 'Smallest n for a proportion', use: 'Planning a survey' },
    ],
  },
  {
    id: 'testing', world: 3, title: 'Hypothesis tests for μ and π',
    items: [
      { id: 't-z', name: 'z test for μ', tex: 'z = \\frac{\\bar x-\\mu_0}{\\sigma/\\sqrt n}', meaning: 'Distance of x̄ from μ₀ in SEs', use: 'σ known' },
      { id: 't-t', name: 't test for μ', tex: 't = \\frac{\\bar x-\\mu_0}{s/\\sqrt n}', meaning: 'Distance of x̄ from μ₀ in SEs', use: 'σ unknown', df: 'n − 1' },
      { id: 't-p', name: 'z test for π', tex: 'z = \\frac{p-\\pi_0}{\\sqrt{\\pi_0(1-\\pi_0)/n}}', meaning: 'SE uses π₀', use: 'Claims about a proportion' },
      { id: 'rule', name: 'Decision rules', tex: '\\text{two: } |T| > c_{1-\\alpha/2}\\quad \\text{right: } T > c_{1-\\alpha}\\quad \\text{left: } T < -c_{1-\\alpha}', meaning: 'Reject H₀ in the rejection region', use: 'Or: reject if p-value < α' },
      { id: 'pval', name: 'p-value', tex: 'p = P(\\text{as extreme as observed}\\mid H_0)\\quad (\\times 2 \\text{ if two-tailed})', meaning: 'Evidence against H₀', use: 'Reject H₀ if p < α' },
      { id: 'err', name: 'Errors and power', tex: '\\alpha = P(\\text{reject } H_0\\mid H_0),\\ \\beta = P(\\text{not reject}\\mid H_1),\\ \\text{power} = 1-\\beta', meaning: 'Type I / II error', use: 'Larger n → more power' },
    ],
  },
  {
    id: 'anova', world: 4, title: 'One-way ANOVA',
    items: [
      { id: 'ss', name: 'Sums of squares', tex: 'SSB = \\sum n_j(\\bar x_j-\\bar{\\bar x})^2,\\ SSW = \\sum (n_j-1)s_j^2,\\ SST = SSB + SSW', meaning: 'Between / within / total variability', use: 'From raw data or group summaries' },
      { id: 'f', name: 'F statistic', tex: 'F = \\frac{SSB/(k-1)}{SSW/(n-k)} = \\frac{MSB}{MSW}', meaning: 'Ratio of between to within variance', use: 'H₀: all μ equal; right-tailed', assumptions: 'Independent samples, normal, equal variances', df: '(k − 1, n − k)' },
      { id: 'eta', name: 'Effect size', tex: '\\eta^2 = SSB/SST', meaning: 'Share of variability explained by the factor', use: 'Practical relevance' },
      { id: 'fwer', name: 'Family-wise error', tex: '1-(1-\\alpha)^m,\\quad m = \\binom{k}{2}', meaning: 'Risk of ≥ 1 false rejection over m tests', use: 'Why ANOVA, not many t tests' },
    ],
  },
  {
    id: 'chisq', world: 5, title: 'Contingency analysis (χ²)',
    items: [
      { id: 'e', name: 'Expected counts', tex: 'E_{ij} = \\frac{n_{i\\cdot}\\,n_{\\cdot j}}{n}', meaning: 'Counts under independence', use: 'Every cell', assumptions: 'All E ≥ 5' },
      { id: 'x2', name: 'χ² statistic', tex: '\\chi^2 = \\sum \\frac{(O-E)^2}{E}', meaning: 'Distance from independence', use: 'H₀: independent; right-tailed', df: '(r − 1)(c − 1)' },
      { id: 'v', name: "Cramér's V", tex: 'V = \\sqrt{\\frac{\\chi^2}{n(\\min(r,c)-1)}}', meaning: 'Strength of association (0–1)', use: 'After a significant test' },
    ],
  },
  {
    id: 'reg', world: 6, title: 'Simple linear regression',
    items: [
      { id: 'r', name: 'Correlation', tex: 'r = \\frac{S_{xy}}{\\sqrt{S_{xx}S_{yy}}}', meaning: 'Strength & direction of linear relation', use: '−1 ≤ r ≤ 1' },
      { id: 'b', name: 'OLS coefficients', tex: 'b_1 = \\frac{S_{xy}}{S_{xx}} = r\\frac{s_y}{s_x},\\quad b_0 = \\bar y - b_1\\bar x', meaning: 'Least-squares line ŷ = b₀ + b₁x', use: 'Slope = average change in Y per unit X' },
      { id: 'r2', name: 'Fit', tex: 'R^2 = \\frac{SSR}{SST} = 1-\\frac{SSE}{SST},\\quad s_e = \\sqrt{\\frac{SSE}{n-2}}', meaning: 'Explained share; typical residual', use: 'SST = SSR + SSE' },
      { id: 'tb', name: 'Slope test & CI', tex: 't = \\frac{b_1}{s_{b_1}},\\ s_{b_1} = \\frac{s_e}{\\sqrt{S_{xx}}},\\quad b_1 \\pm t_{1-\\alpha/2;\\,n-2}\\,s_{b_1}', meaning: 'H₀: β₁ = 0', use: 'Is the relationship significant?', assumptions: 'LINE: linear, independent, normal, equal variance', df: 'n − 2' },
      { id: 'fr', name: 'Regression F', tex: 'F = \\frac{MSR}{MSE} = \\frac{SSR/1}{SSE/(n-2)} = t^2', meaning: 'Same test as the slope t', use: 'ANOVA table of the regression', df: '(1, n − 2)' },
    ],
  },
];
