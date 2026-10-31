import { anovaFromRaw, anovaFromSummaries, mean, sd } from '../../lib/stats';
import { f, column, numColumn, readF } from '../helpers';
import type { WorkedExample } from '../types';

const raw = { Solo: [12, 14, 13, 13], Group: [15, 16, 14, 17], Hybrid: [16, 18, 17, 17] };
const groups = Object.values(raw);
const a1 = anovaFromRaw(groups);
const grand = mean(groups.flat());

const methods = ['Solo', 'Group', 'Tutoring', 'OnlineResources'];
const grade = numColumn('FinalGrade'), method = column('StudyMethod');
const sums = methods.map((m) => {
  const xs = grade.filter((_, i) => method[i] === m);
  return { name: m, n: xs.length, mean: mean(xs), sd: sd(xs) };
});
const a2 = anovaFromSummaries(sums);

const sleep = numColumn('SleepHoursPerNight'), stress = column('StressLevel');
const a4 = anovaFromRaw(['Low', 'Medium', 'High'].map((l) => sleep.filter((_, i) => stress[i] === l)));

export const examples: WorkedExample[] = [
  {
    id: 'w4-ex1', title: 'ANOVA by hand from raw data', topic: 'anova',
    context: `GPA (0–20) of 12 students by study method: **Solo** ${raw.Solo.join(', ')} · **Group** ${raw.Group.join(', ')} · **Hybrid** ${raw.Hybrid.join(', ')}. Test at α = 0.05 whether mean GPA differs between methods.`,
    steps: [
      { label: 'Hypotheses', body: '$H_0: \\mu_{Solo} = \\mu_{Group} = \\mu_{Hybrid}$ vs $H_1$: at least one mean differs.' },
      { label: 'Group means & grand mean', body: `$\\bar x_{Solo} = ${f(mean(raw.Solo), 2)}$, $\\bar x_{Group} = ${f(mean(raw.Group), 2)}$, $\\bar x_{Hybrid} = ${f(mean(raw.Hybrid), 2)}$; grand mean $\\bar{\\bar x} = ${f(grand, 3)}$` },
      { label: 'SSB', body: `$SSB = 4(${f(mean(raw.Solo), 2)} - ${f(grand, 3)})^2 + 4(${f(mean(raw.Group), 2)} - ${f(grand, 3)})^2 + 4(${f(mean(raw.Hybrid), 2)} - ${f(grand, 3)})^2 = ${f(a1.ssb, 3)}$` },
      { label: 'SSW', body: `Squared deviations from each group mean: Solo ${f(sd(raw.Solo) ** 2 * 3, 2)}, Group ${f(sd(raw.Group) ** 2 * 3, 2)}, Hybrid ${f(sd(raw.Hybrid) ** 2 * 3, 2)} → $SSW = ${f(a1.ssw, 3)}$. Check: SST = ${f(a1.sst, 3)} = SSB + SSW ✓` },
      { label: 'Mean squares and F', body: `$df_B = 2$, $df_W = 9$. $MSB = ${f(a1.ssb, 3)}/2 = ${f(a1.msb, 3)}$, $MSW = ${f(a1.ssw, 3)}/9 = ${f(a1.msw, 3)}$, $F = ${f(a1.F, 3)}$` },
      { label: 'Critical value', body: readF(2, 9, 0.95).text },
      { label: 'Decision & conclusion', body: `F = ${f(a1.F, 2)} > 4.26 → **reject H₀**. At the 5 % level, mean GPA differs for at least one study method (p = ${f(a1.pValue, 4)}).` },
    ],
  },
  {
    id: 'w4-ex2', title: 'ANOVA from group summaries: FinalGrade by StudyMethod', topic: 'anova',
    context: 'Dataset (n = 60). Only the group summaries are given. Test at α = 0.05.',
    output: { title: 'Group summaries — FinalGrade', rows: [['StudyMethod', 'n', 'Mean', 'SD'], ...sums.map((g) => [g.name, String(g.n), f(g.mean, 2), f(g.sd, 2)])] },
    steps: [
      { label: 'Grand mean', body: `$\\bar{\\bar x} = \\frac{\\sum n_j \\bar x_j}{n} = ${f(a2.grandMean, 3)}$` },
      { label: 'SSB', body: `$SSB = \\sum n_j(\\bar x_j - \\bar{\\bar x})^2 = ${f(a2.ssb, 1)}$` },
      { label: 'SSW from SDs', body: `$SSW = \\sum (n_j - 1)s_j^2 = ${sums.map((g) => `${g.n - 1}\\cdot${f(g.sd, 2)}^2`).join(' + ')} = ${f(a2.ssw, 1)}$` },
      { label: 'F', body: `$MSB = ${f(a2.ssb, 1)}/3 = ${f(a2.msb, 2)}$; $MSW = ${f(a2.ssw, 1)}/56 = ${f(a2.msw, 2)}$; $F = ${f(a2.F, 2)}$ with df (3, 56)` },
      { label: 'Critical value', body: `Block n = 56 is not in the table → use n = 60: ${readF(3, 60, 0.95).text} (exact F.INV(0.95; 3; 56) = 2.769).` },
      { label: 'Conclusion', body: `F = ${f(a2.F, 2)} ≫ 2.76 → reject H₀ (p ≈ ${a2.pValue.toExponential(1)}). Mean final grades differ between study methods — the Tutoring group stands out (84.5 vs 60–65). Association, not causation: tutored students may differ in other ways.` },
    ],
  },
  {
    id: 'w4-ex3', title: 'Fill in the missing cells', topic: 'anova',
    context: 'An Excel ANOVA table lost some cells. k = 4 groups, n = 24 students.',
    output: { title: 'ANOVA (Excel) — incomplete', rows: [['Source of Variation', 'SS', 'df', 'MS', 'F'], ['Between Groups', '?', '?', '45.0', '?'], ['Within Groups', '?', '?', '?', ''], ['Total', '435.0', '?', '', '']] },
    steps: [
      { label: 'Degrees of freedom', body: '$df_B = k - 1 = 3$, $df_W = n - k = 20$, $df_T = n - 1 = 23$ (3 + 20 = 23 ✓).' },
      { label: 'SSB', body: '$SSB = MSB \\times df_B = 45 \\times 3 = 135$' },
      { label: 'SSW and MSW', body: '$SSW = SST - SSB = 435 - 135 = 300$; $MSW = 300/20 = 15$' },
      { label: 'F and decision', body: `$F = 45/15 = 3.00$. ${readF(3, 20, 0.95).text} → 3.00 < 3.10 → do not reject H₀ at 5 % (but reject at 10 %: ${readF(3, 20, 0.9).value}).` },
    ],
  },
  {
    id: 'w4-ex4', title: 'Jamovi output: SleepHoursPerNight by StressLevel', topic: 'anova',
    context: 'Jamovi → ANOVA, dependent SleepHoursPerNight, factor StressLevel (Low/Medium/High).',
    output: { title: 'Jamovi — ANOVA: SleepHoursPerNight', rows: [['', 'Sum of Squares', 'df', 'Mean Square', 'F', 'p'], ['StressLevel', f(a4.ssb, 2), String(a4.dfb), f(a4.msb, 2), f(a4.F, 1), '< .001'], ['Residuals', f(a4.ssw, 2), String(a4.dfw), f(a4.msw, 3), '', '']] },
    steps: [
      { label: 'Hypotheses', body: '$H_0$: mean sleep is equal in the three stress groups; $H_1$: at least one differs.' },
      { label: 'Check F', body: `$F = MSB/MSW = ${f(a4.msb, 2)}/${f(a4.msw, 3)} = ${f(a4.F, 1)}$, df (2, 57).` },
      { label: 'Effect size', body: `$\\eta^2 = SSB/SST = ${f(a4.ssb, 2)}/${f(a4.sst, 2)} = ${f(a4.ssb / a4.sst, 3)}$ — stress level accounts for ${f((a4.ssb / a4.sst) * 100, 0)} % of the variability in sleep.` },
      { label: 'Conclusion', body: 'p < 0.001 → reject H₀: mean sleep duration differs between stress levels (low-stress students sleep about 2 h more than high-stress students). The direction of causality is unknown.' },
    ],
  },
  {
    id: 'w4-ex5', title: 'Why not six t-tests?', topic: 'anova',
    context: 'You want to compare FinalGrade across the 4 study methods with pairwise t-tests at α = 0.05.',
    steps: [
      { label: 'Number of tests', body: '$\\binom{4}{2} = 6$ pairwise comparisons.' },
      { label: 'Family-wise error', body: `$P(\\text{at least one false rejection}) = 1 - 0.95^6 = ${f(1 - 0.95 ** 6, 3)}$` },
      { label: 'Conclusion', body: 'A 26.5 % chance of a false alarm instead of 5 %. ANOVA keeps it at 5 % with one overall F test; post-hoc tests (Tukey) then compare pairs with corrected error rates.' },
    ],
  },
];
