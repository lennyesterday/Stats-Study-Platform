import { useCallback, useRef, type ReactNode } from 'react';
import { useStore } from '../../store';

/** Calls markViz once, on the first real interaction. */
export function useMarkOnce(id: string) {
  const done = useRef(false);
  const mark = useStore((s) => s.markViz);
  return useCallback(() => {
    if (done.current) return;
    done.current = true;
    mark(id);
  }, [id, mark]);
}

/** Pointer position in SVG viewBox coordinates. */
export function svgPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }) {
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  const m = svg.getScreenCTM();
  return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-xl bg-surface2 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={`font-mono text-lg font-semibold ${tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : ''}`}>{value}</div>
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt = String }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between"><span className="text-muted">{label}</span><span className="font-mono">{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[var(--accent)]" />
    </label>
  );
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} className={`rounded-lg px-2.5 py-1 text-sm ${value === o.v ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'}`}>{o.label}</button>
      ))}
    </div>
  );
}

/** Simple histogram bars in an SVG area. */
export function Bars({ values, lo, hi, bins, X, Y, H, color = 'var(--accent)', scaleTo }: { values: number[]; lo: number; hi: number; bins: number; X: (v: number) => number; Y: (v: number) => number; H: number; color?: string; scaleTo?: number }) {
  const counts = Array(bins).fill(0) as number[];
  const w = (hi - lo) / bins;
  values.forEach((v) => { const k = Math.floor((v - lo) / w); if (k >= 0 && k < bins) counts[k]++; });
  const max = scaleTo ?? Math.max(1, ...counts);
  return (
    <g>
      {counts.map((c, k) => {
        const y = Y(c / max);
        return <rect key={k} x={X(lo + k * w) + 0.5} width={Math.max(0, X(lo + (k + 1) * w) - X(lo + k * w) - 1)} y={y} height={Math.max(0, H - y)} fill={color} opacity={0.75} rx={1} />;
      })}
    </g>
  );
}
