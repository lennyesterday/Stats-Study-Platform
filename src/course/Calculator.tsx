import katex from 'katex';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalcError, describe, evaluate, fmt, latexToCalc, parse, parseEquation, parseList, solve, SOLVE_TEMPLATES, texName, toFraction, toTex, type Solution } from './calc';
import { DockButton, FloatWindow, isShortcut, load, save, type Box } from './FloatWindow';
import { MathInput, type MathfieldElement } from './MathInput';

// Floating calculator (same window as the tables): keypad + keyboard, typeset preview with stacked fractions,
// Ans, history, rounding, a Solve tab (enter a formula, fill in what you know, get the unknown) and a Data tab.
// Open with C, the dock button or any [data-open-calc].

interface Entry { expr: string; latex?: string; value: number }
type Mode = 'calc' | 'solve' | 'data';
interface SolveState { eq: string; vals: Record<string, string>; unknown: string }

const calcBox = (): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(420, vw - 32), h = Math.min(680, vh - 32);
  return { x: Math.max(16, vw - w - 720), y: Math.max(16, vh - h - 72), w, h };
};

// [label, inserted text or command]; FRAC starts a fraction, NEXT jumps out of the current bracket,
// WRAP puts brackets around the selection (or inserts an empty pair)
const KEYS: [string, string][][] = [
  [['(', '('], [')', ')'], ['a/b', 'FRAC'], ['( )', 'WRAP'], ['→', 'NEXT'], ['⌫', 'DEL']],
  [['x²', '²'], ['xʸ', '^'], ['√', '√('], ['∛', '∛('], ['|x|', 'abs('], ['AC', 'AC']],
  [['ln', 'ln('], ['log', 'log('], ['eˣ', 'e^('], ['10ˣ', '10^('], ['nCr', 'C'], ['nPr', 'P']],
  [['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷'], ['1/x', '^(−1)'], ['π', 'π']],
  [['4', '4'], ['5', '5'], ['6', '6'], ['×', '×'], ['n!', '!'], ['e', 'e']],
  [['1', '1'], ['2', '2'], ['3', '3'], ['−', '−'], ['%', '%'], ['Ans', 'Ans']],
  [['0', '0'], ['.', '.'], ['(−)', '−'], ['+', '+'], ['=', '=']],
];
const CONTINUES = /^(?:[+^!*/−-]|\\(?:div|times|%))|^[CP]$/; // an operator first continues from the last answer
// what each key puts into the visual field (#@ = the number before the caret, #0 / #? = empty box)
const KEY_TEX: Record<string, string> = {
  FRAC: '\\frac{#@}{#?}', WRAP: '\\left(#0\\right)', '²': '^2', '^': '^{#?}', '√(': '\\sqrt{#0}', '∛(': '\\sqrt[3]{#0}',
  'abs(': '\\left|#0\\right|', 'ln(': '\\ln\\left(#0\\right)', 'log(': '\\log\\left(#0\\right)', 'e^(': 'e^{#0}', '10^(': '10^{#0}',
  '÷': '\\div', '×': '\\times', '−': '-', '^(−1)': '^{-1}', 'π': '\\pi', '%': '\\%', Ans: '\\mathrm{Ans}',
};
const TITLES: Record<string, string> = {
  'a/b': 'Fraction: box over box (or type /). The number before the cursor becomes the numerator', '→': 'Next box: numerator → denominator → out of the fraction (or arrow keys)',
  '( )': 'Put brackets around the selection', '|x|': 'Absolute value', '∛': 'Cube root', 'nCr': 'Combinations: 5 nCr 2 = 10',
  'nPr': 'Permutations: 5 nPr 2 = 20', '(−)': 'Negative number', '%': 'Percent (÷ 100)', 'Ans': 'Last answer', '⌫': 'Backspace', AC: 'Clear',
};
// characters that are awkward to type, for the Solve tab
const SYMBOLS = ['σ', 'μ', 'x̄', 'p̂', 'π', '₀', '₁', '₂', '√', '²', 'χ', 'α', 'β', 'ŷ'];
const DPS: (number | null)[] = [null, 2, 3, 4];

const tex = (s: string, display = false) => katex.renderToString(s, { throwOnError: false, strict: false, displayMode: display });
const texOf = (src: string) => { try { return toTex(parse(src)); } catch { return ''; } };
const withFraction = (v: number, dp: number | null) => { const f = toFraction(v); return f ? `${fmt(v, dp)} = ${f}` : fmt(v, dp); };

export function Calculator() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(() => load('sq-calc-mode', 'calc'));
  const [latex, setLatex] = useState('');
  const [hist, setHist] = useState<Entry[]>(() => load('sq-calc-hist', []));
  const [dp, setDp] = useState<number | null>(() => load('sq-calc-dp', null));
  const [err, setErr] = useState('');
  const [data, setData] = useState<string>(() => load('sq-calc-data', ''));
  const [sv, setSv] = useState<SolveState>(() => load('sq-calc-solve', { eq: SOLVE_TEMPLATES[0].eq, vals: {}, unknown: '' }));
  const mf = useRef<MathfieldElement>(null);
  const eqInput = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const ans = hist.length ? hist[hist.length - 1].value : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (isShortcut(e, 'c')) { e.preventDefault(); setOpen((o) => !o); } };
    const onClick = (e: MouseEvent) => { if ((e.target as HTMLElement).closest('[data-open-calc]')) setOpen(true); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);
  useEffect(() => { if (open && mode === 'calc') mf.current?.focus(); }, [open, mode]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [hist, open, mode]);

  // the visual field gives LaTeX; the engine gets plain text
  const parsed = useMemo((): { expr: string; error?: string } => {
    try { return { expr: latexToCalc(latex) }; } catch (e) { return { expr: '', error: e instanceof CalcError ? e.message : 'Cannot read this' }; }
  }, [latex]);
  const expr = parsed.expr;
  const preview = useMemo(() => {
    if (!expr.trim()) return '';
    try { return withFraction(evaluate(expr, ans), dp); } catch { return ''; }
  }, [expr, ans, dp]);

  const edit = (latexText: string) => { setLatex(latexText); setErr(''); };
  /** insert LaTeX at the caret; #@ takes the number before the caret, #? / #0 become empty boxes */
  const insert = (tex: string, negate = false) => {
    const f = mf.current;
    if (!f) return;
    if (!f.value && CONTINUES.test(tex) && hist.length && !negate) f.insert('\\mathrm{Ans}');
    f.insert(tex, { selectionMode: 'placeholder', focus: true });
    edit(f.value);
  };
  const run = () => {
    if (!latex.trim()) return;
    if (parsed.error) return setErr(parsed.error);
    try {
      const value = evaluate(expr, ans);
      const nextHist = [...hist, { expr, latex, value }].slice(-50);
      setHist(nextHist); save('sq-calc-hist', nextHist); edit('');
      mf.current?.focus();
    } catch (e) { setErr(e instanceof CalcError ? e.message : 'Cannot calculate this'); }
  };
  const press = (k: string, lbl = '') => {
    const f = mf.current;
    if (k === '=') return run();
    if (lbl === '(−)') return insert('-', true);
    if (k === 'AC') { edit(''); return f?.focus(); }
    if (!f) return;
    if (k === 'DEL' || k === 'NEXT') { f.executeCommand(k === 'DEL' ? 'deleteBackward' : 'moveToNextChar'); f.focus(); return edit(f.value); }
    insert(KEY_TEX[k] ?? k);
  };
  const onKeyDown = (e: KeyboardEvent, f: MathfieldElement) => {
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); e.stopPropagation(); run(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (f.value) edit(''); else setOpen(false); }
    else if (!f.value && CONTINUES.test(e.key) && hist.length && e.key.length === 1) { f.insert('\\mathrm{Ans}'); }
    else if (e.key === 'ArrowUp' && !f.value && hist.length) { e.preventDefault(); const h = hist[hist.length - 1]; edit(h.latex ?? h.expr); }
  };
  const setM = (m: Mode) => { setMode(m); save('sq-calc-mode', m); };
  const takeValue = (v: number) => { setM('calc'); edit(latex + fmt(v)); };

  // ---------- Solve ----------
  const updSolve = (patch: Partial<SolveState>) => setSv((s) => { const n = { ...s, ...patch }; save('sq-calc-solve', n); return n; });
  const eqInfo = useMemo(() => {
    try { const p = parseEquation(sv.eq); return { ...p, error: '' }; } catch (e) { return { lhs: null, rhs: null, vars: [] as string[], error: e instanceof CalcError ? e.message : 'Cannot read this equation' }; }
  }, [sv.eq]);
  const unknown = eqInfo.vars.includes(sv.unknown) ? sv.unknown : eqInfo.vars.find((v) => !sv.vals[v]?.trim()) ?? eqInfo.vars[0] ?? '';
  const solved = useMemo((): { res?: Solution; values?: Record<string, number>; error?: string; bad?: string } => {
    if (eqInfo.error || !unknown) return {};
    const values: Record<string, number> = {};
    for (const v of eqInfo.vars) {
      if (v === unknown) continue;
      const raw = sv.vals[v]?.trim();
      if (!raw) return { error: `Enter a value for ${v}` };
      try { values[v] = evaluate(raw, ans); } catch { return { error: `The value for ${v} is not a number`, bad: v }; }
    }
    try { return { res: solve(sv.eq, values, unknown, ans), values }; } catch (e) { return { error: e instanceof CalcError ? e.message : 'No solution found' }; }
  }, [eqInfo, sv, unknown, ans]);
  const template = SOLVE_TEMPLATES.find((t) => t.eq === sv.eq);
  const insertSym = (s: string) => {
    const el = eqInput.current, a = el?.selectionStart ?? sv.eq.length, b = el?.selectionEnd ?? sv.eq.length;
    updSolve({ eq: sv.eq.slice(0, a) + s + sv.eq.slice(b) });
    setTimeout(() => { el?.focus(); el?.setSelectionRange(a + s.length, a + s.length); });
  };

  // ---------- Data ----------
  const xs = useMemo(() => parseList(data), [data]);
  const d = xs.length ? describe(xs) : null;
  const stats: [string, string, number][] = d ? [
    ['n', 'count', d.n], ['Σx', 'sum', d.sum], ['Σx²', 'sum of squares', d.sumSq], ['x̄', 'mean', d.mean], ['Median', 'middle value', d.median],
    ['s²', 'sample variance (÷ n − 1)', d.varS], ['s', 'sample SD', d.sdS], ['σ²', 'population variance (÷ n)', d.varP], ['σ', 'population SD', d.sdP],
    ['Σ(x − x̄)²', 'squared deviations', d.ss], ['Min', 'smallest', d.min], ['Max', 'largest', d.max],
  ] : [];

  return (
    <>
      <DockButton open={open} onClick={() => setOpen((o) => !o)} label="Calculator" kbd="C"
        icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="4" y="2.5" width="12" height="15" rx="2" /><path d="M6.5 5.5h7v2.5h-7zM7 11h.01M10 11h.01M13 11h.01M7 14h.01M10 14h.01M13 14h.01" strokeLinecap="round" /></svg>} />
      {open && (
        <FloatWindow id="calc" title="Calculator" label="Calculator" defaultBox={calcBox} minW={340} minH={480} onClose={() => setOpen(false)}>
          <div className="dsub calc-sub">
            <div className="seg">
              <button type="button" aria-pressed={mode === 'calc'} onClick={() => setM('calc')}>Calculator</button>
              <button type="button" aria-pressed={mode === 'solve'} onClick={() => setM('solve')}>Solve</button>
              <button type="button" aria-pressed={mode === 'data'} onClick={() => setM('data')}>Data</button>
            </div>
            {mode !== 'data' && (
              <label className="calc-dp">Round
                <select value={dp ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : +e.target.value; setDp(v); save('sq-calc-dp', v); }}>
                  {DPS.map((x) => <option key={x ?? 'x'} value={x ?? ''}>{x == null ? 'exact' : `${x} dp`}</option>)}
                </select>
              </label>
            )}
          </div>

          {mode === 'calc' && (
            <div className="calc">
              <ol className="calc-log" ref={log} aria-label="History">
                {hist.length === 0 && <li className="calc-empty">Type or tap a calculation, then press = or Enter.<br />Fractions: a/b or /, then → to jump to the denominator.</li>}
                {hist.map((h, i) => {
                  const t = h.latex ?? texOf(h.expr);
                  return (
                    <li key={i}>
                      <button type="button" onClick={() => insert(fmt(h.value))} title={`${h.expr} · click to insert the result`}>
                        {t ? <span className="ce" dangerouslySetInnerHTML={{ __html: tex(t) }} /> : <span className="ce">{h.expr}</span>}
                        <span className="cv">= {withFraction(h.value, dp)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="calc-io">
                <MathInput value={latex} onChange={edit} onKeyDown={onKeyDown} fieldRef={mf} label="Calculation" />
                <div className={`calc-pv ${err ? 'err' : ''}`} aria-live="polite">
                  {err || (preview ? `= ${preview}` : !latex && hist.length ? <span className="calc-open">Ans = {fmt(ans, dp)}</span> : '\u00a0')}
                </div>
              </div>
              <div className="calc-keys">
                {KEYS.flat().map(([lbl, k]) => (
                  <button key={lbl} type="button" className={`ck ${/^[0-9.]$/.test(lbl) ? 'num' : ''} ${k === '=' ? 'eq' : ''} ${['AC', 'DEL'].includes(k) ? 'clr' : ''} ${/^[()]$|WRAP|FRAC|NEXT/.test(k) ? 'br' : ''}`} title={TITLES[lbl]} onMouseDown={(e) => e.preventDefault()} onClick={() => press(k, lbl)} aria-label={k === 'DEL' ? 'Backspace' : TITLES[lbl]?.split(':')[0]}>{lbl}</button>
                ))}
              </div>
              {hist.length > 0 && <button type="button" className="linkbtn calc-clear" onClick={() => { setHist([]); save('sq-calc-hist', []); }}>Clear history</button>}
            </div>
          )}

          {mode === 'solve' && (
            <div className="calc calc-solve">
              <label className="field"><span>Formula</span>
                <select value={template ? sv.eq : ''} onChange={(e) => { if (e.target.value) updSolve({ eq: e.target.value, unknown: '' }); }}>
                  {!template && <option value="">Own formula</option>}
                  {SOLVE_TEMPLATES.map((t) => <option key={t.eq} value={t.eq}>{t.name}: {t.eq}</option>)}
                </select>
              </label>
              <label className="field"><span>Equation (edit it or type your own, e.g. SE = SD / √n)</span>
                <input ref={eqInput} value={sv.eq} onChange={(e) => updSolve({ eq: e.target.value })} spellCheck={false} autoComplete="off" className="calc-eq" />
              </label>
              <div className="calc-syms" aria-label="Insert a symbol">
                {SYMBOLS.map((s) => <button key={s} type="button" className="ck br" onMouseDown={(e) => e.preventDefault()} onClick={() => insertSym(s)}>{s}</button>)}
              </div>
              {eqInfo.error ? <p className="calc-pv err">{eqInfo.error}</p> : (
                <>
                  <div className="calc-tex solve-tex" dangerouslySetInnerHTML={{ __html: tex(`${toTex(eqInfo.lhs!)} = ${toTex(eqInfo.rhs!)}`, true) }} />
                  {template?.hint && <p className="sub calc-hint">{template.hint}</p>}
                  <table className="t calc-vars"><thead><tr><th>Variable</th><th>Value</th><th>Solve for</th></tr></thead><tbody>
                    {eqInfo.vars.map((v) => (
                      <tr key={v} className={v === unknown ? 'is-unknown' : ''}>
                        <th dangerouslySetInnerHTML={{ __html: tex(texName(v)) }} />
                        <td>
                          {v === unknown
                            ? <span className="calc-q">{solved.res ? fmt(solved.res.value, dp) : '?'}</span>
                            : <input value={sv.vals[v] ?? ''} onChange={(e) => updSolve({ vals: { ...sv.vals, [v]: e.target.value } })} placeholder="value" aria-label={`Value of ${v}`}
                                className={solved.bad === v ? 'bad' : ''} spellCheck={false} autoComplete="off" inputMode="decimal" />}
                        </td>
                        <td><input type="radio" name="sq-solve-for" checked={v === unknown} onChange={() => updSolve({ unknown: v })} aria-label={`Solve for ${v}`} /></td>
                      </tr>
                    ))}
                  </tbody></table>
                  {solved.error && <p className="calc-pv err">{solved.error}</p>}
                  {solved.res && (
                    <div className="calc-result">
                      {solved.res.rearranged && (
                        <div className="calc-tex" dangerouslySetInnerHTML={{
                          __html: tex(`${texName(unknown)} = ${toTex(solved.res.rearranged)} = ${toTex(solved.res.rearranged, solved.values)}`, true),
                        }} />
                      )}
                      <div className="calc-ans">
                        <span dangerouslySetInnerHTML={{ __html: tex(`${texName(unknown)} = ${fmt(solved.res.value, dp)}`) }} />
                        {toFraction(solved.res.value) && <span className="calc-frac"> = {toFraction(solved.res.value)}</span>}
                        <button type="button" className="linkbtn" onClick={() => takeValue(solved.res!.value)}>Use in calculator →</button>
                      </div>
                      {solved.res.method === 'numeric' && <p className="sub calc-hint">Found numerically (the unknown appears more than once).{solved.res.others.length > 0 && <> Other solutions: {solved.res.others.slice(0, 4).map((x) => fmt(x, dp)).join(', ')}.</>}</p>}
                      {solved.res.note && <p className="sub calc-hint">{solved.res.note}</p>}
                    </div>
                  )}
                  <p className="sub calc-hint">Values can be calculations too, e.g. 1.96 or 12/√36 or Ans.</p>
                </>
              )}
            </div>
          )}

          {mode === 'data' && (
            <div className="calc calc-data">
              <label className="field"><span>Numbers (separated by spaces, commas, semicolons or new lines)</span>
                <textarea value={data} rows={4} onChange={(e) => { setData(e.target.value); save('sq-calc-data', e.target.value); }} placeholder="4 8 6 5 3 7 9" /></label>
              {d ? (
                <table className="t calc-stats"><tbody>
                  {stats.map(([sym, name, v]) => (
                    <tr key={sym}><th>{sym}</th><td>{name}</td><td className="m">{Number.isFinite(v) ? <button type="button" className="calc-val" onClick={() => takeValue(v)} title="Use in the calculator">{fmt(v)}</button> : '–'}</td></tr>
                  ))}
                </tbody></table>
              ) : <p className="sub">Paste a column of values to get n, mean, median, variance and SD. Click a value to use it in the calculator.</p>}
            </div>
          )}
        </FloatWindow>
      )}
    </>
  );
}
