import { useState } from 'react';
import { Rich } from '../components/Rich';
import { Button, Card, PageHeader, Tabs } from '../components/ui';

type Node = { q: string; options: { label: string; next: Node | Leaf }[] };
type Leaf = { method: string; stat: string; df: string; world: number; note: string };
const isLeaf = (x: Node | Leaf): x is Leaf => 'method' in x;

const TREE: Node = {
  q: 'What do you want to do?',
  options: [
    {
      label: 'Estimate a population value (interval)',
      next: { q: 'Which parameter?', options: [
        { label: 'Mean μ, σ known', next: { method: 'z confidence interval for μ', stat: '$\\bar x \\pm z_{1-\\alpha/2}\\,\\sigma/\\sqrt n$', df: '—', world: 2, note: 'Reliability factors 1.645 / 1.960 / 2.576.' } },
        { label: 'Mean μ, σ unknown', next: { method: 't confidence interval for μ', stat: '$\\bar x \\pm t_{1-\\alpha/2;n-1}\\,s/\\sqrt n$', df: 'n − 1', world: 2, note: 'Most common case in practice.' } },
        { label: 'Proportion π', next: { method: 'z confidence interval for π', stat: '$p \\pm z\\sqrt{p(1-p)/n}$', df: '—', world: 2, note: 'Check np ≥ 5 and n(1 − p) ≥ 5.' } },
      ] },
    },
    {
      label: 'Test a claim about ONE population',
      next: { q: 'About what?', options: [
        { label: 'Mean μ, σ known', next: { method: 'z test for μ', stat: '$z = (\\bar x-\\mu_0)/(\\sigma/\\sqrt n)$', df: '—', world: 3, note: 'Choose tail from H₁.' } },
        { label: 'Mean μ, σ unknown', next: { method: 't test for μ', stat: '$t = (\\bar x-\\mu_0)/(s/\\sqrt n)$', df: 'n − 1', world: 3, note: 'Two-tailed → column 1 − α/2.' } },
        { label: 'Proportion π', next: { method: 'z test for π', stat: '$z = (p-\\pi_0)/\\sqrt{\\pi_0(1-\\pi_0)/n}$', df: '—', world: 3, note: 'SE uses π₀!' } },
      ] },
    },
    {
      label: 'Study the relationship between TWO variables',
      next: { q: 'What are the variable types?', options: [
        { label: 'Metric Y × categorical X (k groups)', next: { method: 'One-way ANOVA (F test)', stat: '$F = MSB/MSW$', df: '(k − 1, n − k)', world: 4, note: 'Right-tailed. Post-hoc tests after rejecting.' } },
        { label: 'Categorical × categorical', next: { method: 'χ² test of independence', stat: '$\\chi^2 = \\sum (O-E)^2/E$', df: '(r − 1)(c − 1)', world: 5, note: 'All expected counts ≥ 5.' } },
        { label: 'Metric × metric', next: { method: 'Simple linear regression / correlation', stat: '$\\hat y = b_0 + b_1x$, $t = b_1/s_{b_1}$', df: 'n − 2', world: 6, note: 'F = t² in simple regression.' } },
      ] },
    },
  ],
};

const MATRIX = [
  ['Situation', 'Method', 'Statistic', 'Distribution / df', 'Excel / Jamovi'],
  ['One mean, σ known', 'z test / z CI', 'z = (x̄ − μ₀)/(σ/√n)', 'Z', 'NORM.S.INV, NORM.S.DIST'],
  ['One mean, σ unknown', 't test / t CI', 't = (x̄ − μ₀)/(s/√n)', 't, n − 1', 'T.INV.2T, T.DIST.RT'],
  ['One proportion', 'z test / z CI', 'z = (p − π₀)/SE', 'Z', 'NORM.S.DIST'],
  ['k means (metric × categorical)', 'One-way ANOVA', 'F = MSB/MSW', 'F, (k − 1, n − k)', 'Anova: Single Factor · F.DIST.RT'],
  ['Two categorical variables', 'χ² independence', 'Σ(O − E)²/E', 'χ², (r − 1)(c − 1)', 'CHISQ.TEST · CHISQ.DIST.RT'],
  ['Two metric variables', 'Regression / r', 't = b₁/s_b₁ ; F = MSR/MSE', 't, n − 2 ; F (1, n − 2)', 'Data Analysis → Regression'],
];

const SENTENCES = [
  ['CI for μ', 'We are 95 % confident that the **population mean** [Y] lies between [L] and [U] [units].'],
  ['Reject H₀', 'At the α = 0.05 level there is **sufficient evidence** that [claim in context about μ / π].'],
  ['Do not reject H₀', 'At the α = 0.05 level there is **not sufficient evidence** that [claim]. (Never "accept H₀".)'],
  ['p-value', 'If H₀ were true, the probability of a result at least as extreme as ours would be [p].'],
  ['ANOVA', 'There is sufficient evidence that the mean [Y] differs for **at least one** [factor] group.'],
  ['χ²', 'There is sufficient evidence that [X] and [Y] are **associated** (not independent).'],
  ['Slope', 'For each additional [unit of X], [Y] is estimated to change by [b₁] [units] **on average**.'],
  ['R²', '[R²·100] % of the **variability** in [Y] is explained by the linear relationship with [X].'],
];

const TRAPS = [
  'Course tables are **left-tail**: α = 0.05 right tail → column 0.950; two-sided 95 % → 0.975.',
  'F table: **m = numerator** (columns, k − 1), **n = denominator** (blocks, n − k). Missing df → nearest conservative row.',
  'Population vs sample formulas: VAR.P / STDEV.P vs VAR.S / STDEV.S — read which one the question wants.',
  'Hypotheses are about **parameters** (μ, π, β₁), never about x̄ or p.',
  '"Do not reject" ≠ "accept"; a CI is about μ, not about 95 % of individuals.',
  'Proportion test: SE with **π₀**; proportion CI: SE with **p**.',
  'df: t test n − 1; regression n − 2; ANOVA (k − 1, n − k); χ² (r − 1)(c − 1).',
  'χ² condition concerns **expected** counts (≥ 5), not observed.',
  'Correlation / association ≠ causation. Extrapolation is risky.',
  'Multiple choice: a wrong answer costs only 10 % of the question (−0.07 / −0.10), so never leave a question blank.',
  'Round only at the end; intermediate rounding can land you between two answer options.',
];

export default function Methods() {
  const [tab, setTab] = useState<'tree' | 'matrix' | 'sentences' | 'traps'>('tree');
  const [path, setPath] = useState<number[]>([]);
  let node: Node | Leaf = TREE;
  for (const i of path) node = (node as Node).options[i].next;
  return (
    <div>
      <PageHeader title="Which Method?" subtitle="Decision tree, overview matrix, interpretation sentences and common traps" />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'tree', label: '🧭 Decision tree' }, { id: 'matrix', label: '▦ Overview matrix' }, { id: 'sentences', label: '✍️ Interpretation sentences' }, { id: 'traps', label: '⚠️ Common traps' }]} /></div>
      {tab === 'tree' && (
        <Card className="mx-auto max-w-2xl p-6">
          {path.length > 0 && <Button variant="ghost" size="sm" className="mb-3" onClick={() => setPath(path.slice(0, -1))}>← Back</Button>}
          {isLeaf(node) ? (
            <div>
              <div className="text-sm text-muted">Use:</div>
              <div className="text-2xl font-semibold">{node.method}</div>
              <div className="mt-3 space-y-1"><Rich text={`Statistic: ${node.stat}`} /><div>df: <b>{node.df}</b></div><div className="text-muted">{node.note}</div></div>
              <div className="mt-4 flex gap-2"><a className="rounded-lg bg-ink px-4 py-2 text-bg" href={`#/week/${node.world}/learn`}>Go to Week {node.world}</a><Button variant="ghost" onClick={() => setPath([])}>Start over</Button></div>
            </div>
          ) : (
            <div>
              <div className="mb-3 text-xl font-semibold">{node.q}</div>
              <div className="grid gap-2">{node.options.map((o, i) => <button key={i} onClick={() => setPath([...path, i])} className="rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-accent hover:bg-accent-soft">{o.label}</button>)}</div>
            </div>
          )}
        </Card>
      )}
      {tab === 'matrix' && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface2"><tr>{MATRIX[0].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
            <tbody>{MATRIX.slice(1).map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 1 ? 'font-semibold' : ''}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {tab === 'sentences' && <div className="grid gap-3 md:grid-cols-2">{SENTENCES.map(([t, s]) => <Card key={t} className="p-4"><div className="mb-1 text-sm font-semibold text-accent">{t}</div><Rich text={s} /></Card>)}</div>}
      {tab === 'traps' && <Card className="p-5"><ul className="space-y-2">{TRAPS.map((t, i) => <li key={i} className="flex gap-2"><span>⚠️</span><Rich text={t} /></li>)}</ul></Card>}
    </div>
  );
}
