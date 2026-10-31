import { AnovaPlay, ChiPlay, RegPlay } from '../components/lab/Playgrounds';
import { CiSim, CltSim, TestSim } from '../components/lab/Simulations';
import { PageHeader, Pill, Tabs } from '../components/ui';
import { navigate } from '../router';
import { useStore } from '../store';

const VIZ = [
  { id: 'clt', label: '🎲 CLT', title: 'Central Limit Theorem simulator', world: 2, intro: 'Pick a population — even a skewed one — and draw many samples. The distribution of x̄ becomes normal and narrower (σ/√n) as n grows.', C: CltSim },
  { id: 'ci', label: '📏 CI', title: 'Confidence interval simulator', world: 2, intro: '100 samples, 100 intervals. About (1 − α)·100 of them contain the true μ — that is what “95 % confidence” means.', C: CiSim },
  { id: 'test', label: '⚖️ Test & power', title: 'Rejection region & power curve', world: 3, intro: 'See α as the red tail under H₀ and power as the green area under the true distribution. Change n, α, the tail and the true μ.', C: TestSim },
  { id: 'anova', label: '📊 ANOVA', title: 'ANOVA playground', world: 4, intro: 'Drag the points of three groups. Separating the group means increases SSB; spreading points within groups increases SSW. F = MSB/MSW.', C: AnovaPlay },
  { id: 'chisq', label: '🧮 χ² heatmap', title: 'Contingency heatmap', world: 5, intro: 'Edit the observed counts. Each cell shows its expected count and contribution to χ²; colours show where the table deviates from independence.', C: ChiPlay },
  { id: 'regression', label: '📈 Regression', title: 'Regression playground', world: 6, intro: 'Drag points and watch the least-squares line, residuals, r and R² update. Try one outlier far from the others.', C: RegPlay },
] as const;

export default function Lab({ viz }: { viz?: string }) {
  const done = useStore((s) => s.vizDone);
  const cur = VIZ.find((v) => v.id === viz) ?? VIZ[0];
  const C = cur.C;
  return (
    <div>
      <PageHeader title="Visual Lab" subtitle="Interactive simulations — play until the formulas feel obvious" />
      <div className="mb-4"><Tabs value={cur.id as string} onChange={(id) => navigate(`/lab/${id}`)} tabs={VIZ.map((v) => ({ id: v.id as string, label: <>{v.label}{done[v.id] && ' ✓'}</> }))} /></div>
      <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{cur.title}</h2><Pill>Week {cur.world}</Pill></div>
      <p className="mb-4 max-w-3xl text-muted">{cur.intro}</p>
      <C key={cur.id} />
    </div>
  );
}
