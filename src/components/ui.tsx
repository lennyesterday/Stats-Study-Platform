import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { navigate } from '../router';
import type { SoftwareOutput } from '../content/types';

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[14px] border border-line bg-surface ${className}`} {...rest}>{children}</div>;
}

type Variant = 'primary' | 'ghost' | 'soft' | 'good' | 'bad';
const V: Record<Variant, string> = {
  primary: 'border border-ink bg-ink text-bg hover:bg-[#27272a]',
  ghost: 'border border-line2 bg-bg hover:bg-sunk text-ink',
  soft: 'bg-accent-soft text-[#1d5fae] hover:bg-[rgba(42,120,214,0.14)]',
  good: 'bg-good text-white hover:brightness-110',
  bad: 'bg-bad text-white hover:brightness-110',
};

export function Button({ variant = 'primary', className = '', size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-[0.9rem]';
  return <button className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${s} ${V[variant]} ${className}`} {...rest} />;
}

export function LinkButton({ to, children, variant = 'ghost', size = 'md', className = '' }: { to: string; children: ReactNode; variant?: Variant; size?: 'sm' | 'md'; className?: string }) {
  return <Button variant={variant} size={size} className={className} onClick={() => navigate(to)}>{children}</Button>;
}

export function Pill({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'bad' | 'warn' | 'accent' | 'xp'; className?: string }) {
  const t = { neutral: 'bg-surface2 text-muted', good: 'bg-good-soft text-good', bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', accent: 'bg-accent-soft text-accent', xp: 'bg-accent-soft text-xp' }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t} ${className}`}>{children}</span>;
}

export function Progress({ value, className = '', color = 'var(--accent)', height = 8 }: { value: number; className?: string; color?: string; height?: number }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-surface2 ${className}`} style={{ height }}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: color }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 font-medium transition ${value === t.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, right, eyebrow }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <span className="text-[0.72rem] font-medium uppercase tracking-[0.09em] text-muted">{eyebrow}</span>}
        <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em]">{title}</h1>
        {subtitle && <p className="mt-3 max-w-[62ch] text-[1.04rem] text-ink2">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function OutputTable({ output }: { output: SoftwareOutput }) {
  const [head, ...rows] = output.rows;
  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-line">
      <div className="border-b border-line bg-panel px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted">{output.title}</div>
      <table className="w-full text-sm">
        <thead><tr>{head.map((h, i) => <th key={i} className="border-b border-line px-3 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-line last:border-0">{r.map((c, j) => <td key={j} className="px-3 py-1 font-mono text-[13px]">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Callout({ tone, title, children }: { tone: 'tip' | 'warn' | 'think' | 'info'; title: string; children: ReactNode }) {
  const t = { tip: 'border-good/40 bg-good-soft', warn: 'border-bad/30 bg-bad-soft', think: 'border-transparent bg-accent-soft', info: 'border-line bg-panel' }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 ${t}`}>
      <div className="mb-1 text-sm font-semibold">{title}</div>
      <div className="text-[15px]">{children}</div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-6 text-center text-muted">{children}</div>;
}
