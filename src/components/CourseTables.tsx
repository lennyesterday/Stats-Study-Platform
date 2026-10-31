// The four course tables in their original layout (left-tail probabilities), clickable and highlightable.
import { useState } from 'react';
import { CHI2_TABLE, F_TABLE, T_TABLE, Z_TABLE } from '../content/tables';
import type { Dist } from '../lib/tables';

export interface Cell { row: number; col: number }
export interface TableProps {
  highlight?: Cell | null;
  marks?: Record<string, 'good' | 'bad'>; // key `${row}:${col}`
  onCell?: (c: Cell, value: number) => void;
  /** F table only: index into F_TABLE.ns */
  block?: number;
  onBlock?: (i: number) => void;
  maxHeight?: number;
}

export const DIST_LABEL: Record<Dist, string> = { z: 'Z (standard normal)', t: 't-Student', chi2: 'Chi-square (χ²)', f: 'F-Snedecor' };
const inf = (v: number | null) => (v === null ? '∞' : String(v));

function Grid({ corner, colHeads, rowHeads, values, digits, highlight, marks, onCell, maxHeight = 520 }: {
  corner: string; colHeads: string[]; rowHeads: string[]; values: number[][]; digits: number;
} & TableProps) {
  const [hover, setHover] = useState<Cell | null>(null);
  const focus = highlight ?? hover;
  return (
    <div className="overflow-auto rounded-xl border border-line" style={{ maxHeight }}>
      <table className="border-collapse font-mono text-[12.5px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 border-b border-r border-line bg-surface2 px-2 py-1 text-left">{corner}</th>
            {colHeads.map((h, j) => <th key={j} className={`border-b border-line px-2 py-1 font-semibold ${focus?.col === j ? 'bg-accent-soft text-accent' : 'bg-surface2'}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {values.map((row, i) => (
            <tr key={i}>
              <th className={`sticky left-0 border-r border-line px-2 py-0.5 text-left font-semibold ${focus?.row === i ? 'bg-accent-soft text-accent' : 'bg-surface2'}`}>{rowHeads[i]}</th>
              {row.map((v, j) => {
                const mark = marks?.[`${i}:${j}`];
                const isHi = highlight?.row === i && highlight?.col === j;
                const cross = focus && (focus.row === i || focus.col === j);
                return (
                  <td key={j}
                    onClick={onCell ? () => onCell({ row: i, col: j }, v) : undefined}
                    onMouseEnter={() => setHover({ row: i, col: j })} onMouseLeave={() => setHover(null)}
                    className={`px-2 py-0.5 text-right transition-colors ${onCell ? 'cursor-pointer hover:bg-accent hover:text-accent-ink' : ''} ${mark === 'good' ? 'bg-good text-white' : mark === 'bad' ? 'bg-bad text-white' : isHi ? 'bg-accent text-accent-ink font-bold' : cross ? 'bg-accent-soft/60' : ''}`}>
                    {v.toFixed(digits)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ZTableView(p: TableProps) {
  return <Grid corner="z" colHeads={Z_TABLE.cols.map((c) => c.toFixed(2))} rowHeads={Z_TABLE.rows.map((r) => r.toFixed(1))} values={Z_TABLE.values} digits={4} {...p} />;
}
export function TTableView(p: TableProps) {
  return <Grid corner="df \ P" colHeads={T_TABLE.probs.map((x) => x.toFixed(3))} rowHeads={T_TABLE.dfs.map(inf)} values={T_TABLE.values} digits={3} {...p} />;
}
export function Chi2TableView(p: TableProps) {
  return <Grid corner="df \ P" colHeads={CHI2_TABLE.probs.map((x) => x.toFixed(3))} rowHeads={CHI2_TABLE.dfs.map(String)} values={CHI2_TABLE.values} digits={3} {...p} />;
}
export function FTableView({ block = 0, onBlock, ...p }: TableProps) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-1 text-muted">Block n (denominator df):</span>
        {F_TABLE.ns.map((n, i) => (
          <button key={i} onClick={() => onBlock?.(i)} disabled={!onBlock}
            className={`rounded-md px-2 py-0.5 font-mono text-xs ${i === block ? 'bg-accent text-accent-ink' : 'bg-surface2 hover:bg-accent-soft'}`}>{inf(n)}</button>
        ))}
      </div>
      <Grid corner={`n = ${inf(F_TABLE.ns[block])} · P \\ m`} colHeads={F_TABLE.ms.map(inf)} rowHeads={F_TABLE.probs.map((x) => x.toFixed(3))} values={F_TABLE.values[block]} digits={2} {...p} />
    </div>
  );
}

export function CourseTable({ dist, ...p }: TableProps & { dist: Dist }) {
  if (dist === 'z') return <ZTableView {...p} />;
  if (dist === 't') return <TTableView {...p} />;
  if (dist === 'chi2') return <Chi2TableView {...p} />;
  return <FTableView {...p} />;
}

/** Tabbed read-only table viewer (mock side panel, formula page). */
export function TableBrowser({ maxHeight = 420 }: { maxHeight?: number }) {
  const [dist, setDist] = useState<Dist>('z');
  const [block, setBlock] = useState(F_TABLE.ns.indexOf(30));
  return (
    <div>
      <div className="mb-2 flex gap-1">
        {(['z', 't', 'chi2', 'f'] as Dist[]).map((d) => (
          <button key={d} onClick={() => setDist(d)} className={`rounded-lg px-2.5 py-1 text-sm ${dist === d ? 'bg-accent text-accent-ink' : 'bg-surface2'}`}>{DIST_LABEL[d].split(' ')[0]}</button>
        ))}
      </div>
      <p className="mb-2 text-xs text-muted">All tables give left-tail probabilities P(X &lt; x).{dist === 'f' && ' m = numerator df (columns), n = denominator df (blocks).'}</p>
      <CourseTable dist={dist} block={block} onBlock={setBlock} maxHeight={maxHeight} />
    </div>
  );
}
