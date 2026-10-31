import { useRef, useState } from 'react';
import { allPractice, f, partTopic, pick, TABLES, xl, type PracticeQ, type Week } from '.';
import { useStore } from '../store';
import { Html } from './Html';

type Mode = 'general' | 'data';
interface Q extends PracticeQ { key: string; label: string; part: number; mode: Mode }
interface PState { mode: Mode; filter: string; q: Q | null; answered: boolean; shown: boolean; last: string; fb: { ok: boolean; text: string } | null; picked: number | null; done: boolean }

// practice state survives tab switches (like the artifact's per-week pstate)
const PSTATE: Record<string, PState> = {};
const SCORE_KEY = 'sq-lab-score';
const loadScore = (): Record<string, { right: number; tries: number }> => { try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '{}'); } catch { return {}; } };

/** Week › Practice: fresh-number questions per concept, general or applied to Data.xlsx. */
export function Practice({ w }: { w: Week }) {
  const record = useStore((s) => s.recordExercise);
  const [, bump] = useState(0);
  const [score, setScore] = useState(loadScore);
  const input = useRef<HTMLInputElement>(null);
  const ps = PSTATE[w.id] ??= { mode: 'general', filter: 'all', q: null, answered: false, shown: false, last: '', fb: null, picked: null, done: false };
  const all = allPractice(w), types = all.filter((t) => t.mode === ps.mode), many = w.parts.length > 1;
  const rerender = () => bump((x) => x + 1);

  const newQ = () => {
    const pool = ps.filter === 'all' ? types : ps.filter.startsWith('part:') ? types.filter((t) => t.part === +ps.filter.slice(5)) : types.filter((t) => t.key === ps.filter);
    const t = pick(pool.length ? pool : types);
    Object.assign(ps, { q: { ...t.gen(), key: t.key, label: t.label, part: t.part, mode: t.mode }, answered: false, shown: false, last: '', fb: null, picked: null, done: false });
  };
  if (!ps.q || ps.q.mode !== ps.mode) newQ();
  const q = ps.q!;
  const pr = score[w.id] ?? { right: 0, tries: 0 };
  const tb = TABLES.find((t) => t.id === (q.table || w.parts[q.part]?.table));

  const tally = (ok: boolean) => {
    if (ps.answered) return;
    ps.answered = true;
    const next = { ...score, [w.id]: { right: pr.right + (ok ? 1 : 0), tries: pr.tries + 1 } };
    setScore(next); localStorage.setItem(SCORE_KEY, JSON.stringify(next));
    record(`lab:${w.num}:${q.key}`, partTopic(w.num, q.part), 1, ok, true);
  };
  const choose = (i: number) => {
    const ok = q.choices![i] === q.ans;
    tally(ok); ps.picked = i;
    if (ok) { ps.done = true; ps.shown = true; ps.fb = { ok: true, text: `Correct: ${q.ans}.` }; }
    else ps.fb = { ok: false, text: 'Not quite. Try another option, or open the solution.' };
    rerender();
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = ps.last.trim(), v = parseFloat(raw.replace(',', '.').replace('−', '-'));
    if (!Number.isFinite(v)) { ps.fb = { ok: false, text: 'Enter a number, for example 1.645 or −0.25.' }; return rerender(); }
    const dp = q.dp ?? 0, unit = 10 ** -dp, d = Math.min(...[q.ans as number, ...(q.alts || [])].map((a) => Math.abs(v - a)));
    const ok = d <= unit * 0.5 + 1e-9, near = !ok && d <= unit * 1.5 + 1e-9;
    tally(ok || near);
    ps.fb = ok ? { ok: true, text: `Correct: ${f(q.ans as number, dp)}.` }
      : near ? { ok: true, text: `Correct within rounding. The exact answer rounds to ${f(q.ans as number, dp)}; table values can shift the last digit.` }
      : { ok: false, text: 'Not quite. Check your steps and try again, or open the solution.' };
    if (ok || near) ps.shown = true;
    rerender();
  };
  const chip = (k: string, l: string) => <button key={k} className="chip" type="button" aria-pressed={ps.filter === k} onClick={() => { ps.filter = k; newQ(); rerender(); }}>{l}</button>;
  const setMode = (m: Mode) => { if (ps.mode === m) return; ps.mode = m; ps.filter = 'all'; newQ(); rerender(); };
  const solution = `${q.viz ? '<div data-viz></div>' : ''}${q.steps}${q.excel ? `<p class="sub" style="margin:0">Excel: ${xl(q.excel)}</p>` : ''}`;

  return (
    <div>
      <div className="pbar">
        <div className="seg">
          <button type="button" aria-pressed={ps.mode === 'general'} onClick={() => setMode('general')}>General exercises</button>
          <button type="button" aria-pressed={ps.mode === 'data'} onClick={() => setMode('data')}>Apply to dataset</button>
        </div>
        <div className="score">First-try score <b>{pr.right} / {pr.tries}</b>{pr.tries > 0 && <button className="linkbtn" type="button" onClick={() => { const next = { ...score, [w.id]: { right: 0, tries: 0 } }; setScore(next); localStorage.setItem(SCORE_KEY, JSON.stringify(next)); }}>Reset</button>}</div>
      </div>
      <p className="modehint">{ps.mode === 'general' ? 'Practise each concept with fresh numbers, like exam questions. Correct answers earn XP.' : 'Apply the concepts to Data.xlsx: 60 students, their study habits and final grades.'}</p>
      {ps.mode === 'data' && <details className="dsx" open><summary>Dataset explorer <span>· Data.xlsx</span></summary><Html html={'<div class="widget" data-w="explorer"></div>'} /></details>}
      <div className="chiprows">
        <div className="chiprow"><span className="cl">All parts</span><div className="chips">{chip('all', 'Mixed')}</div></div>
        {w.parts.map((p, i) => {
          const ts = types.filter((t) => t.part === i);
          return ts.length ? <div className="chiprow" key={i}><span className="cl">{i + 1} · {p.title}</span><div className="chips">{many && ts.length > 1 && chip(`part:${i}`, 'Mixed')}{ts.map((t) => chip(t.key, t.label))}</div></div> : null;
        })}
      </div>
      <article className="qcard">
        <div className="qmeta">{many && <span>Part {q.part + 1}</span>}<span>{q.label}</span><span>{q.choices ? 'Choose one' : q.dp === 0 ? 'Whole number' : `Round to ${q.dp} decimals`}</span>{q.mode === 'data' && <span className="data">Dataset</span>}</div>
        <Html className="qtext" html={q.q} />
        {q.choices ? (
          <div className="choices" role="group" aria-label="Answer options">
            {q.choices.map((c, i) => {
              const st = c === q.ans && (ps.done || ps.shown) ? 'right' : i === ps.picked ? (c === q.ans ? 'right' : 'wrong') : '';
              return <button key={i} className={`choice ${st}`} type="button" disabled={ps.done} onClick={() => choose(i)} dangerouslySetInnerHTML={{ __html: c }} />;
            })}
          </div>
        ) : (
          <form className="ansrow" onSubmit={submit} autoComplete="off">
            <input ref={input} inputMode="decimal" placeholder="Your answer" aria-label="Your answer" value={ps.last} onChange={(e) => { ps.last = e.target.value; rerender(); }} />
            <button className="btn" type="submit">Check</button>
          </form>
        )}
        {ps.fb && <div className={`feed ${ps.fb.ok ? 'ok' : 'no'}`}>{ps.fb.text}</div>}
        <div className="actions">
          {tb && <button className="btn ghost" type="button" data-open-table={tb.id}>{tb.name} table</button>}
          {!q.choices && <button className="btn ghost" type="button" data-open-calc="">Calculator</button>}
          <button className="btn ghost" type="button" onClick={() => { ps.shown = !ps.shown; if (ps.shown) tally(false); rerender(); }}>{ps.shown ? 'Hide solution' : 'Show solution'}</button>
          <button className="btn ghost" type="button" onClick={() => { newQ(); rerender(); setTimeout(() => input.current?.focus({ preventScroll: true })); }}>Next question →</button>
        </div>
        {ps.shown && <div className="solution"><h4>Solution</h4><Html html={solution} viz={q.viz} /></div>}
      </article>
    </div>
  );
}
