import { chi2Pdf, fPdf, normalPdf, tPdf } from '../lib/stats';
import type { Dist } from '../lib/tables';

/** Density curve with a shaded tail — used by the table trainer. */
export function DensityPlot({ kind, df1 = 1, df2 = 1, x, shade, height = 150 }: { kind: Dist; df1?: number; df2?: number; x: number; shade: 'left' | 'right'; height?: number }) {
  const pdf = (u: number) => (kind === 'z' ? normalPdf(u) : kind === 't' ? tPdf(u, df1) : kind === 'chi2' ? chi2Pdf(u, df1) : fPdf(u, df1, df2));
  const [lo, hi] = kind === 'z' || kind === 't' ? [-4, 4] : kind === 'chi2' ? [0, Math.max(df1 + 4 * Math.sqrt(2 * df1), x * 1.15)] : [0, Math.max(5, x * 1.3)];
  const W = 520, H = height, pad = 18, N = 160;
  const xs = Array.from({ length: N + 1 }, (_, i) => lo + ((hi - lo) * i) / N);
  const ys = xs.map((u) => (u <= 0 && kind !== 'z' && kind !== 't' ? 0 : pdf(u)));
  const ymax = Math.max(...ys.filter(Number.isFinite), 0.05) * 1.1;
  const X = (u: number) => pad + ((u - lo) / (hi - lo)) * (W - 2 * pad);
  const Y = (v: number) => H - pad - (Math.min(v, ymax) / ymax) * (H - 2 * pad);
  const pts = xs.map((u, i) => `${X(u)},${Y(Number.isFinite(ys[i]) ? ys[i] : ymax)}`);
  const xc = Math.max(lo, Math.min(hi, x));
  const inShade = (u: number) => (shade === 'left' ? u <= xc : u >= xc);
  const area = xs.map((u, i) => [u, i] as const).filter(([u]) => inShade(u)).map(([u, i]) => `${X(u)},${Y(Number.isFinite(ys[i]) ? ys[i] : ymax)}`);
  const base = shade === 'left' ? `${X(xc)},${Y(0)} ${X(lo)},${Y(0)}` : `${X(hi)},${Y(0)} ${X(xc)},${Y(0)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="density curve">
      <polygon points={`${area.join(' ')} ${base}`} fill="var(--shade)" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--curve)" strokeWidth={2} />
      <line x1={pad} x2={W - pad} y1={Y(0)} y2={Y(0)} stroke="var(--muted)" strokeWidth={1} />
      <line x1={X(xc)} x2={X(xc)} y1={Y(0)} y2={pad - 6} stroke="var(--ink)" strokeDasharray="4 3" />
      <text x={X(xc)} y={H - 2} textAnchor="middle" fontSize={12} fill="var(--ink)">{x.toFixed(kind === 'z' ? 2 : 3)}</text>
    </svg>
  );
}
