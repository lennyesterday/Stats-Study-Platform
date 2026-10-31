import { useEffect, useMemo, useRef, useState } from 'react';
import { enhanceFormulas } from './formulaUi';
import { WEEKS, xl } from '.';

const plain = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').toLowerCase();

/** Every formula from the lessons, grouped by week and part, with the matching Excel function (Stats Study Lab layout). */
export function CourseFormulaSheet({ compact = false, weekFilter = false }: { compact?: boolean; weekFilter?: boolean }) {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState(0); // 0 = all weeks
  const weeks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return WEEKS.filter((w) => !only || w.num === only).map((w) => ({
      w,
      parts: w.parts.map((p, pi) => ({
        p, pi,
        rows: p.concepts.flatMap((c, ci) => c.keys.map((k) => ({ k, ci, label: `${pi + 1}.${ci + 1} ${c.name}` })))
          .filter(({ k, label }) => !needle || plain(`${k[0]} ${k[1]} ${k[2]} ${label} ${p.title} ${w.title}`).includes(needle)),
      })).filter((x) => x.rows.length),
    })).filter((x) => x.parts.length);
  }, [q, only]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { if (root.current) enhanceFormulas(root.current); }, [weeks]);
  return (
    <div className="lab" ref={root}>
      <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search formulas (e.g. ANOVA, df, proportion)" aria-label="Search formulas" style={{ width: '100%', marginBottom: weekFilter ? 10 : 24 }} />
      {weekFilter && (
        <div className="chips" style={{ marginBottom: 18 }}>
          {[0, ...WEEKS.map((w) => w.num)].map((n) => <button key={n} type="button" className="chip" aria-pressed={only === n} onClick={() => setOnly(n)} title={n ? WEEKS[n - 1].title : 'All weeks'}>{n ? `Week ${n}` : 'All'}</button>)}
        </div>
      )}
      {weeks.map(({ w, parts }) => (
        <section className="refsec" key={w.id} data-week={w.num}>
          <h2 style={compact ? { fontSize: '1.1rem' } : undefined}>Week {w.num} · {w.title}</h2>
          {parts.map(({ p, pi, rows }) => (
            <div className="refpart" key={pi}>
              <h3>Part {pi + 1} · {p.title}</h3>
              {rows.map(({ k, ci, label }, i) => (
                <div className="frow" key={`${q}-${i}`} data-part={pi + 1} data-concept={ci + 1} style={compact ? { gridTemplateColumns: 'minmax(0,1fr)', gap: 6 } : { gridTemplateColumns: '180px minmax(0,1fr) auto' }}>
                  <div className="fname">{k[0]}<small>{label}</small></div>
                  <div className="fform" dangerouslySetInnerHTML={{ __html: k[1] }} />
                  {(!compact || k[2]) && <div className="fxl" dangerouslySetInnerHTML={{ __html: k[2] ? xl(k[2]) : '' }} />}
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
      {!weeks.length && <p className="sub">No formula matches “{q}”{only ? ` in week ${only}` : ''}.</p>}
    </div>
  );
}
