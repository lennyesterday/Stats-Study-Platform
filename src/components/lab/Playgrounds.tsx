// Interactive playgrounds: ANOVA (drag points), χ² heatmap (edit counts), regression (drag points).
import { useRef, useState } from 'react';
import { column, numColumn } from '../../content/helpers';
import { anovaFromRaw, chiSquareIndependence, linearRegression, round } from '../../lib/stats';
import { chi2Table, fTable } from '../../lib/tables';
import { Button, Card } from '../ui';
import { Stat, svgPoint, useMarkOnce } from './common';

const W = 640, H = 320, P = 34;

// ---------- ANOVA ----------
const GROUP_COLORS = ['#2856d9', '#d4372c', '#14915a'];
const START = [[11, 12, 13, 12.5, 11.5], [13, 14, 15, 14.5, 13.5], [15, 16, 17, 16.5, 15.5]];

export function AnovaPlay() {
  const touch = useMarkOnce('anova');
  const [g, setG] = useState(START);
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const a = anovaFromRaw(g);
  const crit = fTable(2, 12, 0.95).value;
  const Y = (v: number) => H - P - (v / 20) * (H - 2 * P);
  const inv = (y: number) => Math.max(0, Math.min(20, ((H - P - y) / (H - 2 * P)) * 20));
  const GX = (k: number, i: number) => P + 60 + k * 190 + i * 22;
  const means = g.map((xs) => xs.reduce((s, v) => s + v, 0) / xs.length);
  const move = (e: React.PointerEvent) => {
    if (!drag || !svg.current) return;
    const v = round(inv(svgPoint(svg.current, e).y), 1);
    setG((old) => old.map((xs, k) => (k === drag[0] ? xs.map((x, i) => (i === drag[1] ? v : x)) : xs)));
  };
  const spread = (k: number) => { touch(); setG(g.map((xs) => { const m = xs.reduce((s, v) => s + v, 0) / xs.length; return xs.map((v) => round(m + (v - m) * k, 1)); })); };
  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_230px]">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
          {[0, 5, 10, 15, 20].map((v) => <g key={v}><line x1={P} x2={W - 10} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={6} y={Y(v) + 4} fontSize={11} fill="var(--muted)">{v}</text></g>)}
          <line x1={P} x2={W - 10} y1={Y(a.grandMean)} y2={Y(a.grandMean)} stroke="var(--ink)" strokeDasharray="6 4" />
          <text x={W - 12} y={Y(a.grandMean) - 5} fontSize={11} textAnchor="end" fill="var(--ink)">grand mean {a.grandMean.toFixed(2)}</text>
          {g.map((xs, k) => (
            <g key={k}>
              <line x1={GX(k, 0) - 12} x2={GX(k, 4) + 12} y1={Y(means[k])} y2={Y(means[k])} stroke={GROUP_COLORS[k]} strokeWidth={3} />
              <line x1={GX(k, 2)} x2={GX(k, 2)} y1={Y(means[k])} y2={Y(a.grandMean)} stroke={GROUP_COLORS[k]} strokeWidth={6} opacity={0.25} />
              {xs.map((v, i) => (
                <g key={i}>
                  <line x1={GX(k, i)} x2={GX(k, i)} y1={Y(v)} y2={Y(means[k])} stroke={GROUP_COLORS[k]} opacity={0.4} />
                  <circle cx={GX(k, i)} cy={Y(v)} r={9} fill={GROUP_COLORS[k]} className="cursor-ns-resize" onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag([k, i]); touch(); }} />
                </g>
              ))}
              <text x={GX(k, 2)} y={H - 10} fontSize={12} textAnchor="middle" fill="var(--ink)">{['Solo', 'Group', 'Tutoring'][k]}</text>
            </g>
          ))}
        </svg>
        <div className="space-y-2">
          <p className="text-sm text-muted">Drag the points (GPA 0–20). Thick faint bars = between-group distance; thin lines = within-group residuals.</p>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="SSB" value={a.ssb.toFixed(2)} /><Stat label="SSW" value={a.ssw.toFixed(2)} />
            <Stat label="MSB" value={a.msb.toFixed(2)} /><Stat label="MSW" value={a.msw.toFixed(2)} />
          </div>
          <Stat label={`F (2, 12) · critical ${crit}`} value={Number.isFinite(a.F) ? a.F.toFixed(3) : '∞'} tone={a.F > crit ? 'good' : 'bad'} />
          <Stat label="p-value" value={a.pValue.toFixed(4)} />
          <div className="text-sm">{a.F > crit ? '→ reject H₀: means differ' : '→ do not reject H₀'}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => spread(0.5)}>Less spread</Button>
            <Button size="sm" variant="ghost" onClick={() => spread(1.6)}>More spread</Button>
            <Button size="sm" variant="ghost" onClick={() => { touch(); setG(g.map((xs) => { const m = xs.reduce((s, v) => s + v, 0) / xs.length; return xs.map((v) => round(v - m + 14, 1)); })); }}>Equal means</Button>
            <Button size="sm" variant="ghost" onClick={() => setG(START)}>Reset</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- χ² heatmap ----------
const cross = (a: 'PartTimeJob' | 'StressLevel' | 'StudyMethod' | 'Gender', ra: string[], b: 'PassFail' | 'PartTimeJob', cb: string[]) => {
  const A = column(a), B = column(b);
  return ra.map((r) => cb.map((c) => A.filter((x, i) => x === r && B[i] === c).length));
};
const PRESETS = [
  { name: 'Stress × part-time job (dataset)', rows: ['Low', 'Medium', 'High'], cols: ['No job', 'Job'], obs: cross('StressLevel', ['Low', 'Medium', 'High'], 'PartTimeJob', ['No', 'Yes']) },
  { name: 'Part-time job × pass (dataset)', rows: ['No job', 'Job'], cols: ['Pass', 'Fail'], obs: cross('PartTimeJob', ['No', 'Yes'], 'PassFail', ['Pass', 'Fail']) },
  { name: 'Programme × study place', rows: ['Bachelor', 'Master'], cols: ['Library', 'Home', 'Café'], obs: [[30, 25, 15], [20, 35, 25]] },
  { name: 'Perfect independence', rows: ['A', 'B'], cols: ['X', 'Y', 'Z'], obs: [[10, 20, 30], [20, 40, 60]] },
];

export function ChiPlay() {
  const touch = useMarkOnce('chisq');
  const [preset, setPreset] = useState(0);
  const [obs, setObs] = useState(PRESETS[0].obs);
  const pr = PRESETS[preset];
  const valid = obs.every((r) => r.every((v) => Number.isFinite(v) && v >= 0)) && obs.every((r) => r.some((v) => v > 0)) && obs[0].some((_, j) => obs.some((r) => r[j] > 0));
  const res = valid ? chiSquareIndependence(obs) : null;
  const maxC = res ? Math.max(0.5, ...res.contributions.flat()) : 1;
  const crit = res ? chi2Table(res.df, 0.95).value : 0;
  const minE = res ? Math.min(...res.expected.flat()) : 0;
  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p, i) => <Button key={i} size="sm" variant={i === preset ? 'primary' : 'ghost'} onClick={() => { setPreset(i); setObs(p.obs); touch(); }}>{p.name}</Button>)}
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_230px]">
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead><tr><th />{pr.cols.map((c) => <th key={c} className="px-2 py-1">{c}</th>)}<th className="px-2 text-muted">Total</th></tr></thead>
            <tbody>
              {obs.map((r, i) => (
                <tr key={i}>
                  <th className="pr-2 text-left">{pr.rows[i]}</th>
                  {r.map((v, j) => {
                    const c = res?.contributions[i][j] ?? 0, e = res?.expected[i][j] ?? 0;
                    const over = v > e, op = Math.min(1, c / maxC);
                    return (
                      <td key={j} className="p-1">
                        <div className="rounded-xl p-2 text-center" style={{ background: `color-mix(in srgb, ${over ? 'var(--accent)' : 'var(--bad)'} ${Math.round(op * 70)}%, var(--surface2))` }}>
                          <input type="number" min={0} value={v} onChange={(ev) => { touch(); const n = Math.max(0, Math.round(Number(ev.target.value))); setObs(obs.map((row, a) => row.map((x, b) => (a === i && b === j ? n : x)))); }}
                            className="w-16 rounded-lg border border-line bg-surface px-1 py-0.5 text-center font-mono" />
                          <div className="mt-1 font-mono text-[11px]">E {e.toFixed(2)}</div>
                          <div className="font-mono text-[11px]">({c.toFixed(2)})</div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 text-center font-mono text-muted">{res?.rowTotals[i]}</td>
                </tr>
              ))}
              <tr><th className="pr-2 text-left text-muted">Total</th>{res?.colTotals.map((t, j) => <td key={j} className="text-center font-mono text-muted">{t}</td>)}<td className="text-center font-mono">{res?.n}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">Cell colour = contribution (O − E)²/E: blue = more than expected, red = fewer than expected. Values in brackets are the contributions.</p>
        </div>
        <div className="space-y-2">
          {res ? (<>
            <Stat label="χ²" value={res.chi2.toFixed(3)} tone={res.chi2 > crit ? 'good' : 'bad'} />
            <Stat label={`df = ${res.df} · critical (α = .05)`} value={crit.toFixed(3)} />
            <Stat label="p-value" value={res.pValue < 0.0001 ? '< 0.0001' : res.pValue.toFixed(4)} />
            <Stat label="smallest expected count" value={minE.toFixed(2)} tone={minE >= 5 ? 'good' : 'bad'} />
            <div className="text-sm">{res.chi2 > crit ? '→ reject H₀: associated' : '→ do not reject H₀ (independence plausible)'}{minE < 5 && <div className="text-bad">⚠ expected count &lt; 5 — approximation unreliable</div>}</div>
          </>) : <p className="text-sm text-bad">Every row and column needs at least one count.</p>}
        </div>
      </div>
    </Card>
  );
}

// ---------- regression ----------
const SAMPLE = [0, 4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54].map((i) => ({ x: numColumn('StudyHoursPerWeek')[i], y: numColumn('FinalGrade')[i] }));

export function RegPlay() {
  const touch = useMarkOnce('regression');
  const [pts, setPts] = useState(SAMPLE);
  const [drag, setDrag] = useState<number | null>(null);
  const [showRes, setShowRes] = useState(true);
  const svg = useRef<SVGSVGElement>(null);
  const [xlo, xhi, ylo, yhi] = [0, 18, 20, 100];
  const X = (v: number) => P + ((v - xlo) / (xhi - xlo)) * (W - 2 * P);
  const Y = (v: number) => H - P - ((v - ylo) / (yhi - ylo)) * (H - 2 * P);
  const inv = (p: { x: number; y: number }) => ({ x: round(Math.max(xlo, Math.min(xhi, xlo + ((p.x - P) / (W - 2 * P)) * (xhi - xlo))), 1), y: round(Math.max(ylo, Math.min(yhi, ylo + ((H - P - p.y) / (H - 2 * P)) * (yhi - ylo))), 0) });
  const ok = pts.length >= 3 && new Set(pts.map((p) => p.x)).size > 1;
  const r = ok ? linearRegression(pts.map((p) => p.x), pts.map((p) => p.y)) : null;
  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_230px]">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none"
          onPointerMove={(e) => { if (drag === null || !svg.current) return; const q = inv(svgPoint(svg.current, e)); setPts(pts.map((p, i) => (i === drag ? q : p))); }}
          onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}
          onDoubleClick={(e) => { if (!svg.current) return; touch(); setPts([...pts, inv(svgPoint(svg.current, e))]); }}>
          {[20, 40, 60, 80, 100].map((v) => <g key={v}><line x1={P} x2={W - P} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={4} y={Y(v) + 4} fontSize={10} fill="var(--muted)">{v}</text></g>)}
          {[0, 3, 6, 9, 12, 15, 18].map((v) => <text key={v} x={X(v)} y={H - 10} fontSize={10} textAnchor="middle" fill="var(--muted)">{v}</text>)}
          <text x={W - P} y={H - 22} fontSize={11} textAnchor="end" fill="var(--muted)">StudyHoursPerWeek</text>
          {r && showRes && pts.map((p, i) => <line key={`r${i}`} x1={X(p.x)} x2={X(p.x)} y1={Y(p.y)} y2={Y(r.b0 + r.b1 * p.x)} stroke="var(--bad)" strokeWidth={1.5} opacity={0.7} />)}
          {r && <line x1={X(xlo)} x2={X(xhi)} y1={Y(r.b0 + r.b1 * xlo)} y2={Y(r.b0 + r.b1 * xhi)} stroke="var(--accent)" strokeWidth={2.5} />}
          {r && <circle cx={X(r.xbar)} cy={Y(r.ybar)} r={5} fill="none" stroke="var(--ink)" strokeWidth={1.5} />}
          {pts.map((p, i) => (
            <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={8} fill="var(--xp)" className="cursor-move"
              onPointerDown={(e) => { e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId); setDrag(i); touch(); }}
              onDoubleClick={(e) => { e.stopPropagation(); setPts(pts.filter((_, k) => k !== i)); }} />
          ))}
        </svg>
        <div className="space-y-2">
          <p className="text-sm text-muted">Drag points · double-click empty space to add · double-click a point to remove. The ring marks (x̄, ȳ).</p>
          {r ? (<>
            <Stat label="ŷ = b₀ + b₁x" value={`${r.b0.toFixed(2)} + ${r.b1.toFixed(3)}x`} />
            <div className="grid grid-cols-2 gap-2"><Stat label="r" value={r.r.toFixed(3)} /><Stat label="R²" value={r.r2.toFixed(3)} /></div>
            <div className="grid grid-cols-2 gap-2"><Stat label="SSE" value={r.sse.toFixed(1)} /><Stat label="sₑ" value={r.se.toFixed(2)} /></div>
            <Stat label={`t (slope), df ${r.n - 2}`} value={r.n > 2 ? r.tB1.toFixed(2) : '—'} />
          </>) : <p className="text-sm text-bad">Need at least 3 points with different x.</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showRes} onChange={(e) => setShowRes(e.target.checked)} /> show residuals</label>
          <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setPts(SAMPLE)}>Dataset sample</Button><Button size="sm" variant="ghost" onClick={() => { touch(); setPts(SAMPLE.map((p) => ({ x: p.x, y: round(20 + Math.random() * 80, 0) }))); }}>Random y</Button></div>
        </div>
      </div>
    </Card>
  );
}
