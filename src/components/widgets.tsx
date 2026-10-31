import { useEffect, useState } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { addDays, EXAM_START, prettyDate, rangeKeys, todayKey, weekStart } from '../lib/dates';
import { allMastery } from '../lib/mastery';
import { useStore } from '../store';

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function Countdown({ compact = false }: { compact?: boolean }) {
  const now = useNow(compact ? 60000 : 1000);
  const diff = Math.max(0, EXAM_START.getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
  if (compact) return <span title="Exam: Wed 9 Dec 2026, 14:30 (Lisbon)">⏳ {d}d {h}h to exam</span>;
  const cell = (v: number, l: string) => (
    <div className="flex flex-col items-center rounded-xl bg-surface2 px-3 py-2">
      <span className="font-display text-2xl font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted">{l}</span>
    </div>
  );
  return <div className="flex gap-2">{cell(d, 'days')}{cell(h, 'hours')}{cell(m, 'min')}{cell(s, 'sec')}</div>;
}

/** GitHub-style heatmap of daily XP for the plan period (and a bit before). */
export function Heatmap({ weeks = 9 }: { weeks?: number }) {
  const dailyXp = useStore((s) => s.dailyXp);
  const freezes = useStore((s) => s.streak.freezes);
  const today = todayKey();
  const end = addDays(weekStart(today), 6);
  const start = addDays(weekStart(today), -7 * (weeks - 1));
  const days = rangeKeys(start, end);
  const cols: string[][] = [];
  days.forEach((d, i) => { (cols[Math.floor(i / 7)] ??= []).push(d); });
  const level = (xp: number) => (xp <= 0 ? 0 : xp < 40 ? 1 : xp < 120 ? 2 : xp < 250 ? 3 : 4);
  const colors = ['var(--surface2)', 'color-mix(in srgb, var(--good) 30%, var(--surface2))', 'color-mix(in srgb, var(--good) 55%, var(--surface2))', 'color-mix(in srgb, var(--good) 80%, var(--surface2))', 'var(--good)'];
  return (
    <div>
      <div className="flex gap-1">
        <div className="mr-1 grid grid-rows-7 gap-1 text-[10px] text-muted">{['M', '', 'W', '', 'F', '', 'S'].map((l, i) => <span key={i} className="h-3.5 leading-[14px]">{l}</span>)}</div>
        {cols.map((c, i) => (
          <div key={i} className="grid grid-rows-7 gap-1">
            {c.map((d) => {
              const xp = dailyXp[d] ?? 0;
              const frozen = freezes.includes(d);
              return (
                <div key={d} title={`${prettyDate(d)}: ${xp} XP${frozen ? ' (streak freeze)' : ''}`}
                  className={`h-3.5 w-3.5 rounded-[4px] ${d === today ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''} ${d > today ? 'opacity-40' : ''}`}
                  style={{ background: frozen ? '#7dd3fc' : colors[level(xp)] }} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted">Less {colors.map((c, i) => <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />)} More · <span className="h-3 w-3 rounded-[3px] bg-sky-300" /> freeze</div>
    </div>
  );
}

export function Gauge({ value, max = 20, pass = 7.5, label }: { value: number; max?: number; pass?: number; label: string }) {
  const frac = Math.max(0, Math.min(1, value / max));
  const angle = (a: number) => Math.PI * (1 - a);
  const pt = (a: number, r: number) => [60 + r * Math.cos(angle(a)), 62 - r * Math.sin(angle(a))];
  const arc = (a0: number, a1: number, r: number) => {
    const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const color = value >= 14 ? 'var(--good)' : value >= pass ? 'var(--warn)' : 'var(--bad)';
  const [px, py] = pt(pass / max, 54);
  return (
    <svg viewBox="0 0 120 72" className="w-full max-w-[220px]" role="img" aria-label={`${label}: ${value} of ${max}`}>
      <path d={arc(0, 1, 46)} stroke="var(--surface2)" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d={arc(0, Math.max(0.001, frac), 46)} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
      <line x1={pt(pass / max, 38)[0]} y1={pt(pass / max, 38)[1]} x2={px} y2={py} stroke="var(--ink)" strokeWidth="1.5" />
      <text x="60" y="58" textAnchor="middle" className="font-display" fontSize="18" fontWeight="700" fill="var(--ink)">{value.toFixed(1)}</text>
      <text x="60" y="69" textAnchor="middle" fontSize="7" fill="var(--muted)">/ {max} · pass {pass}</text>
    </svg>
  );
}

export function MasteryRadar({ height = 280 }: { height?: number }) {
  const state = useStore();
  const data = allMastery(state).map((m) => ({ topic: m.label.replace(/ \(.*\)/, '').replace('Regression: ', 'Reg. '), value: m.total }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="var(--line)" />
          <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} formatter={(v) => [`${v} %`, 'Mastery']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
