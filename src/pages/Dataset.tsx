import { useState } from 'react';
import { col, COLS, f, g4, LETTERS, M, NUMERIC, RAW } from '../course';

/** Data.xlsx: summary and sortable rows (Stats Study Lab › Dataset). */
export default function Dataset() {
  const [sort, setSort] = useState({ k: 0, dir: 1 });
  const rows = [...RAW].sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : a[sort.k] < b[sort.k] ? -1 : 0) * sort.dir);
  return (
    <div className="lab">
      <div className="head"><span className="eyebrow">Reference</span><h1>Dataset</h1><p className="lede">Data.xlsx: 60 students, their study habits, sleep, attendance and final grades. Used in each week's Practice › Apply to dataset. Variance and SD are sample values (÷ n − 1).</p></div>
      <section className="refsec">
        <h2 style={{ marginBottom: 12 }}>Summary</h2>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>Variable</th><th>Mean</th><th>Median</th><th>Variance s²</th><th>SD s</th><th>Min</th><th>Max</th></tr></thead>
          <tbody>{NUMERIC.map((c) => { const v = col(c.i); return (
            <tr key={c.i}><td><b>{c.name}</b> <span className="sub">col {LETTERS[c.i]}</span></td><td className="m">{f(M.mean(v), 2)}</td><td className="m">{g4(M.median(v))}</td><td className="m">{f(M.varS(v), 2)}</td><td className="m">{f(M.sdS(v), 3)}</td><td className="m">{Math.min(...v)}</td><td className="m">{Math.max(...v)}</td></tr>
          ); })}</tbody>
        </table></div>
      </section>
      <section className="refsec">
        <h2>All rows</h2><p className="sub">Click a column name to sort.</p>
        <div className="tablewrap" style={{ maxHeight: 560, overflow: 'auto' }}><table className="t sortable">
          <thead><tr>{COLS.map((c, k) => <th key={k} onClick={() => setSort({ k, dir: sort.k === k ? -sort.dir : 1 })}>{c}{sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>)}</tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r[0]}>{r.map((v, k) => <td key={k} className={typeof v === 'number' ? 'm' : ''}>{k === 10 ? <span className={`pill ${v === 'Pass' ? 'pass' : 'fail'}`}>{v}</span> : v}</td>)}</tr>
          ))}</tbody>
        </table></div>
      </section>
    </div>
  );
}
