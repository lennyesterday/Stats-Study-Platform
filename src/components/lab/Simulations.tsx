// CLT simulator, CI simulator (100 intervals), hypothesis test with rejection region and power curve.
import { useMemo, useState } from 'react';
import { numColumn } from '../../content/helpers';
import { mean, normalInv, normalPdf, powerZ, sd, type Tail } from '../../lib/stats';
import { tTable } from '../../lib/tables';
import { Button, Card } from '../ui';
import { Bars, Seg, Slider, Stat, useMarkOnce } from './common';

const W = 640, H = 260, P = 28;

// ---------- random draws ----------
const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
const GRADES = numColumn('FinalGrade');
type Pop = 'uniform' | 'skewed' | 'bimodal' | 'dataset';
const POPS: Record<Pop, { label: string; draw: () => number; lo: number; hi: number }> = {
  uniform: { label: 'Uniform 0–20', draw: () => Math.random() * 20, lo: 0, hi: 20 },
  skewed: { label: 'Right-skewed', draw: () => Math.min(40, -5 * Math.log(1 - Math.random())), lo: 0, hi: 30 },
  bimodal: { label: 'Bimodal', draw: () => (Math.random() < 0.5 ? 6 : 15) + 1.8 * gauss(), lo: 0, hi: 22 },
  dataset: { label: 'Dataset FinalGrade', draw: () => GRADES[Math.floor(Math.random() * GRADES.length)], lo: 30, hi: 100 },
};

export function CltSim() {
  const touch = useMarkOnce('clt');
  const [pop, setPop] = useState<Pop>('skewed');
  const [n, setN] = useState(5);
  const [means, setMeans] = useState<number[]>([]);
  const P0 = POPS[pop];
  const popSample = useMemo(() => Array.from({ length: 4000 }, P0.draw), [P0]);
  const mu = mean(popSample), sigma = sd(popSample, true);
  const draw = (k: number) => {
    touch();
    const add = Array.from({ length: k }, () => mean(Array.from({ length: n }, P0.draw)));
    setMeans((m) => [...m, ...add].slice(-20000));
  };
  const X = (v: number) => P + ((v - P0.lo) / (P0.hi - P0.lo)) * (W - 2 * P);
  const Y = (f: number) => H - P - f * (H - 2 * P);
  const se = sigma / Math.sqrt(n);
  const bins = 50, bw = (P0.hi - P0.lo) / bins;
  const peak = means.length ? normalPdf(0) / se * bw * means.length : 1;
  const counts = means.length ? Math.max(...Array.from({ length: bins }, (_, k) => means.filter((v) => v >= P0.lo + k * bw && v < P0.lo + (k + 1) * bw).length)) : 1;
  const scale = Math.max(peak, counts);
  const curve = Array.from({ length: 121 }, (_, i) => { const v = P0.lo + ((P0.hi - P0.lo) * i) / 120; return `${X(v)},${Y((normalPdf((v - mu) / se) / se) * bw * means.length / scale)}`; }).join(' ');
  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg value={pop} onChange={(p) => { setPop(p); setMeans([]); touch(); }} options={(Object.keys(POPS) as Pop[]).map((p) => ({ v: p, label: POPS[p].label }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <div className="text-xs text-muted">Population (μ = {mu.toFixed(2)}, σ = {sigma.toFixed(2)})</div>
          <svg viewBox={`0 0 ${W} 90`} className="w-full"><Bars values={popSample} lo={P0.lo} hi={P0.hi} bins={50} X={X} Y={(f) => 80 - f * 70} H={80} color="var(--muted)" /></svg>
          <div className="mt-2 text-xs text-muted">Sampling distribution of x̄ — {means.length} samples of size n = {n}</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <Bars values={means} lo={P0.lo} hi={P0.hi} bins={bins} X={X} Y={Y} H={H - P} scaleTo={scale} />
            {means.length > 0 && <polyline points={curve} fill="none" stroke="var(--curve)" strokeWidth={2} />}
            <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="var(--muted)" />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => { const v = P0.lo + t * (P0.hi - P0.lo); return <text key={t} x={X(v)} y={H - 8} fontSize={11} textAnchor="middle" fill="var(--muted)">{v.toFixed(0)}</text>; })}
          </svg>
        </div>
        <div className="space-y-3">
          <Slider label="Sample size n" value={n} min={1} max={50} onChange={(v) => { setN(v); setMeans([]); touch(); }} />
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => draw(1)}>+1 sample</Button><Button size="sm" onClick={() => draw(1000)}>+1000</Button><Button size="sm" variant="ghost" onClick={() => setMeans([])}>Reset</Button></div>
          <Stat label="mean of x̄'s" value={means.length ? mean(means).toFixed(3) : '—'} />
          <Stat label="SD of x̄'s (observed)" value={means.length > 1 ? sd(means).toFixed(3) : '—'} />
          <Stat label="σ/√n (theory)" value={se.toFixed(3)} />
          <p className="text-xs text-muted">Red curve: N(μ, σ²/n). Try the skewed population with n = 1, 5, 30.</p>
        </div>
      </div>
    </Card>
  );
}

// ---------- CI simulator ----------
interface Ci { lo: number; hi: number; hit: boolean }
export function CiSim() {
  const touch = useMarkOnce('ci');
  const mu = 15, sigma = 2.5;
  const [n, setN] = useState(25);
  const [conf, setConf] = useState(0.95);
  const [known, setKnown] = useState(true);
  const [cis, setCis] = useState<Ci[]>([]);
  const [total, setTotal] = useState({ hit: 0, all: 0 });
  const factor = known ? normalInv(1 - (1 - conf) / 2) : tTable(n - 1, 1 - (1 - conf) / 2).value;
  const run = () => {
    touch();
    const out = Array.from({ length: 100 }, () => {
      const xs = Array.from({ length: n }, () => mu + sigma * gauss());
      const m = mean(xs), s = known ? sigma : sd(xs), me = factor * s / Math.sqrt(n);
      return { lo: m - me, hi: m + me, hit: m - me <= mu && mu <= m + me };
    });
    setCis(out);
    setTotal((t) => ({ hit: t.hit + out.filter((c) => c.hit).length, all: t.all + 100 }));
  };
  const lo = 11, hi = 19;
  const X = (i: number) => P + (i / 100) * (W - 2 * P);
  const Y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P);
  const hits = cis.filter((c) => c.hit).length;
  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1={P} x2={W - P} y1={Y(mu)} y2={Y(mu)} stroke="var(--ink)" strokeDasharray="5 4" />
          <text x={W - P} y={Y(mu) - 4} fontSize={11} textAnchor="end" fill="var(--ink)">μ = 15</text>
          {cis.map((c, i) => <line key={i} x1={X(i + 0.5)} x2={X(i + 0.5)} y1={Y(Math.max(lo, c.lo))} y2={Y(Math.min(hi, c.hi))} stroke={c.hit ? 'var(--accent)' : 'var(--bad)'} strokeWidth={c.hit ? 2 : 3} />)}
          {[12, 14, 16, 18].map((v) => <text key={v} x={6} y={Y(v) + 4} fontSize={10} fill="var(--muted)">{v}</text>)}
        </svg>
        <div className="space-y-3">
          <Seg value={conf} onChange={(v) => { setConf(v); touch(); }} options={[{ v: 0.9, label: '90%' }, { v: 0.95, label: '95%' }, { v: 0.99, label: '99%' }]} />
          <Seg value={known ? 1 : 0} onChange={(v) => setKnown(v === 1)} options={[{ v: 1, label: 'σ known (z)' }, { v: 0, label: 'σ unknown (t)' }]} />
          <Slider label="n" value={n} min={5} max={100} onChange={setN} />
          <Button onClick={run}>Draw 100 intervals</Button>
          <Stat label="This batch: contain μ" value={cis.length ? `${hits} / 100` : '—'} tone={cis.length ? (hits >= conf * 100 - 3 ? 'good' : 'bad') : undefined} />
          <Stat label="All batches" value={total.all ? `${((total.hit / total.all) * 100).toFixed(1)} %` : '—'} />
          <Stat label="Reliability factor" value={factor.toFixed(3)} />
          <p className="text-xs text-muted">Red intervals miss μ. In the long run about {conf * 100} % hit — the confidence is in the method, not in one interval.</p>
        </div>
      </div>
    </Card>
  );
}

// ---------- test & power ----------
export function TestSim() {
  const touch = useMarkOnce('test');
  const mu0 = 15, sigma = 2;
  const [n, setN] = useState(25);
  const [alpha, setAlpha] = useState(0.05);
  const [tail, setTail] = useState<Tail>('right');
  const [mu1, setMu1] = useState(16);
  const se = sigma / Math.sqrt(n);
  const zc = tail === 'two' ? normalInv(1 - alpha / 2) : normalInv(1 - alpha);
  const cutR = mu0 + zc * se, cutL = mu0 - zc * se;
  const power = powerZ(mu0, mu1, sigma, n, alpha, tail);
  const lo = 12, hi = 18;
  const X = (v: number) => P + ((v - lo) / (hi - lo)) * (W - 2 * P);
  const ymax = normalPdf(0) / se * 1.1;
  const Y = (d: number) => H - P - (d / ymax) * (H - 2 * P);
  const xs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const d0 = (v: number) => normalPdf((v - mu0) / se) / se, d1 = (v: number) => normalPdf((v - mu1) / se) / se;
  const rej = (v: number) => (tail === 'right' ? v >= cutR : tail === 'left' ? v <= cutL : v >= cutR || v <= cutL);
  const area = (d: (v: number) => number, inside: (v: number) => boolean) => {
    const segs: string[] = []; let cur: string[] = [];
    xs.forEach((v) => { if (inside(v)) cur.push(`${X(v)},${Y(d(v))}`); else if (cur.length) { segs.push(cur.join(' ')); cur = []; } });
    if (cur.length) segs.push(cur.join(' '));
    return segs.map((s) => { const pts = s.split(' '); const first = pts[0].split(',')[0], last = pts[pts.length - 1].split(',')[0]; return `${s} ${last},${Y(0)} ${first},${Y(0)}`; });
  };
  const PW = 640, PH = 160;
  const muRange = Array.from({ length: 81 }, (_, i) => 13 + (4 * i) / 80);
  const PX = (m: number) => P + ((m - 13) / 4) * (PW - 2 * P), PY = (p: number) => PH - 20 - p * (PH - 36);
  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_230px]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onPointerDown={touch}>
            {area(d1, rej).map((pts, i) => <polygon key={`p${i}`} points={pts} fill="var(--good)" opacity={0.25} />)}
            {area(d0, rej).map((pts, i) => <polygon key={`a${i}`} points={pts} fill="var(--bad)" opacity={0.55} />)}
            <polyline points={xs.map((v) => `${X(v)},${Y(d0(v))}`).join(' ')} fill="none" stroke="var(--ink)" strokeWidth={2} />
            <polyline points={xs.map((v) => `${X(v)},${Y(d1(v))}`).join(' ')} fill="none" stroke="var(--good)" strokeWidth={2} strokeDasharray="6 4" />
            <line x1={P} x2={W - P} y1={Y(0)} y2={Y(0)} stroke="var(--muted)" />
            {(tail !== 'left') && <line x1={X(cutR)} x2={X(cutR)} y1={Y(0)} y2={P} stroke="var(--bad)" strokeDasharray="3 3" />}
            {(tail !== 'right') && <line x1={X(cutL)} x2={X(cutL)} y1={Y(0)} y2={P} stroke="var(--bad)" strokeDasharray="3 3" />}
            {[12, 13, 14, 15, 16, 17, 18].map((v) => <text key={v} x={X(v)} y={H - 8} fontSize={11} textAnchor="middle" fill="var(--muted)">{v}</text>)}
            <text x={X(mu0)} y={P - 6} fontSize={11} textAnchor="middle" fill="var(--ink)">H₀: μ = 15</text>
          </svg>
          <div className="mt-1 text-xs text-muted">Black: x̄ under H₀ · green dashed: x̄ if μ = {mu1.toFixed(1)} · red area = α · green area = power</div>
          <div className="mt-3 text-sm font-semibold">Power curve</div>
          <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full">
            <polyline points={muRange.map((m) => `${PX(m)},${PY(powerZ(mu0, m, sigma, n, alpha, tail))}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
            <line x1={P} x2={PW - P} y1={PY(alpha)} y2={PY(alpha)} stroke="var(--bad)" strokeDasharray="4 3" />
            <circle cx={PX(mu1)} cy={PY(power)} r={5} fill="var(--good)" />
            <line x1={P} x2={PW - P} y1={PY(0)} y2={PY(0)} stroke="var(--muted)" />
            {[13, 14, 15, 16, 17].map((m) => <text key={m} x={PX(m)} y={PH - 4} fontSize={10} textAnchor="middle" fill="var(--muted)">{m}</text>)}
            <text x={6} y={PY(1) + 4} fontSize={10} fill="var(--muted)">1</text><text x={6} y={PY(0)} fontSize={10} fill="var(--muted)">0</text>
          </svg>
        </div>
        <div className="space-y-3">
          <Seg value={tail} onChange={(t) => { setTail(t); touch(); }} options={[{ v: 'left', label: 'left' }, { v: 'two', label: 'two' }, { v: 'right', label: 'right' }]} />
          <Seg value={alpha} onChange={(a) => { setAlpha(a); touch(); }} options={[{ v: 0.1, label: 'α .10' }, { v: 0.05, label: '.05' }, { v: 0.01, label: '.01' }]} />
          <Slider label="n" value={n} min={4} max={100} onChange={(v) => { setN(v); touch(); }} />
          <Slider label="true μ" value={mu1} min={13} max={17} step={0.1} onChange={(v) => { setMu1(v); touch(); }} fmt={(v) => v.toFixed(1)} />
          <Stat label="critical x̄" value={tail === 'two' ? `${cutL.toFixed(2)} | ${cutR.toFixed(2)}` : (tail === 'right' ? cutR : cutL).toFixed(3)} />
          <Stat label="power = 1 − β" value={power.toFixed(3)} tone={power >= 0.8 ? 'good' : undefined} />
          <Stat label="β (Type II)" value={(1 - power).toFixed(3)} />
          <p className="text-xs text-muted">σ = 2 known. Larger n or a bigger true difference → more power; smaller α → less power.</p>
        </div>
      </div>
    </Card>
  );
}
