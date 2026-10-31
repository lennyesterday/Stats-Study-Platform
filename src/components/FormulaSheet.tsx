import { useMemo, useState } from 'react';
import { FORMULAS } from '../content/formulas';
import { Tex } from './Rich';

/** Searchable formula list; `compact` is the mock-exam side panel variant. */
export function FormulaSheet({ compact = false, query: q0 = '' }: { compact?: boolean; query?: string }) {
  const [q, setQ] = useState(q0);
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return FORMULAS;
    return FORMULAS.map((g) => ({ ...g, items: g.items.filter((i) => [i.name, i.meaning, i.use, i.assumptions, i.df, g.title].join(' ').toLowerCase().includes(needle)) })).filter((g) => g.items.length);
  }, [q]);
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search formulas (e.g. ANOVA, df, proportion)…"
        className="no-print mb-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
      <div className={compact ? 'space-y-4' : 'grid gap-4 lg:grid-cols-2 print:block'}>
        {groups.map((g) => (
          <section key={g.id} className={compact ? '' : 'formula-block rounded-2xl border border-line bg-surface p-4'}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted print:text-[10px] print:text-black">W{g.world} · {g.title}</h3>
            <div className="space-y-2.5 print:space-y-1">
              {g.items.map((i) => (
                <div key={i.id} className="print:text-[9.5px]" data-formula={i.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-sm font-medium print:text-[9.5px]">{i.name}</span>
                    {i.df && <span className="text-xs text-accent print:text-[9px]">df = {i.df}</span>}
                  </div>
                  <div className="overflow-x-auto py-0.5"><Tex display={!compact}>{i.tex}</Tex></div>
                  {!compact && <div className="text-xs text-muted print:text-[8.5px]">{i.meaning} · {i.use}{i.assumptions ? ` · Assumptions: ${i.assumptions}` : ''}</div>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
