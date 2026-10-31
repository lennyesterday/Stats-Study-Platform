import { useEffect, useRef, useState } from 'react';
import { conceptAnchor, getWeek, xl } from '.';
import { FORMULAS } from '../content/formulas';
import { navigate } from '../router';
import { jumpTo } from './Learn';
import { symFor, TOKEN_RE } from './symbols';

// Formula help: hover a symbol for its meaning, click a formula for a window that explains it.
// Lesson HTML gets its symbols wrapped by enhanceFormulas(); KaTeX formulas carry data-sym from annotateTex().

const NOTE_RE = /^\s*([^=]{1,24}?)\s+=\s+(.+)$/;

/** "x = value · μ = mean" → { x: 'value', μ: 'mean' }; other pieces are general notes */
function parseNote(text: string) {
  const vars: Record<string, string> = {}, rest: string[] = [];
  text.split(' · ').forEach((piece) => {
    const m = NOTE_RE.exec(piece), lhs = m?.[1].trim();
    if (m && lhs && symFor(lhs)) vars[lhs] = m[2].trim();
    else if (piece.trim()) rest.push(piece.trim());
  });
  return { vars, rest };
}

function wrapSymbols(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) { const n = walker.currentNode as Text; if (!n.parentElement?.closest('.sym')) nodes.push(n); }
  for (const node of nodes) {
    const text = node.data;
    TOKEN_RE.lastIndex = 0;
    if (!TOKEN_RE.test(text)) continue;
    TOKEN_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m: RegExpExecArray | null;
    while ((m = TOKEN_RE.exec(text))) {
      if (m.index > last) frag.append(text.slice(last, m.index));
      const s = document.createElement('span');
      s.className = 'sym'; s.dataset.sym = m[1]; s.tabIndex = 0; s.textContent = m[1];
      frag.append(s);
      last = m.index + m[1].length;
    }
    if (last < text.length) frag.append(text.slice(last));
    node.replaceWith(frag);
  }
  // z<sub>α/2</sub> and friends: merge the subscript into the symbol when the glossary knows the pair
  el.querySelectorAll('sub').forEach((sub) => {
    const prev = sub.previousSibling;
    if (!(prev instanceof HTMLElement) || !prev.classList.contains('sym')) return;
    const key = `${prev.dataset.sym}_${sub.textContent}`;
    if (!symFor(key)) return;
    prev.append(sub); prev.dataset.sym = key;
  });
}

/** Makes lesson formulas interactive. Context (week / part / concept) comes from data attributes and the concept article. */
export function enhanceFormulas(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.formula, .fform').forEach((f) => {
    if (f.dataset.fx) return;
    f.dataset.fx = '1';
    const art = f.closest<HTMLElement>('article.concept'), row = f.closest<HTMLElement>('[data-concept]');
    const m = art ? /^c-(\d+)-(\d+)$/.exec(art.id) : null;
    const week = f.closest<HTMLElement>('[data-week]')?.dataset.week;
    if (week) f.dataset.week = week;
    if (m) { f.dataset.part = m[1]; f.dataset.concept = m[2]; }
    else if (row) { f.dataset.part = row.dataset.part; f.dataset.concept = row.dataset.concept; }
    const body = f.classList.contains('fform') ? f : f.querySelector<HTMLElement>('.fb');
    if (body) wrapSymbols(body);
    f.classList.add('fx'); f.tabIndex = 0; f.setAttribute('role', 'button');
    f.setAttribute('aria-label', 'Explain this formula');
  });
}

// ---------- tooltip + window ----------

interface Payload { html: string; display: boolean; note: string; syms: string[]; week?: number; part?: number; concept?: number; formulaId?: string }

const ctxOf = (el: Element) => {
  const host = el.closest<HTMLElement>('[data-week]');
  const f = el.closest<HTMLElement>('.fx');
  return { week: Number(host?.dataset.week) || undefined, part: Number(f?.dataset.part) || undefined };
};

function payloadFrom(target: HTMLElement): Payload | null {
  const fx = target.closest<HTMLElement>('.fx');
  if (fx) {
    const body = fx.classList.contains('fform') ? fx : fx.querySelector<HTMLElement>('.fb');
    const { week } = ctxOf(fx);
    return {
      html: body?.innerHTML ?? fx.innerHTML, display: false,
      note: fx.querySelector('.fn')?.textContent ?? '',
      syms: [...new Set([...(body ?? fx).querySelectorAll<HTMLElement>('[data-sym]')].map((s) => s.dataset.sym!))],
      week, part: Number(fx.dataset.part) || undefined, concept: Number(fx.dataset.concept) || undefined,
    };
  }
  const k = target.closest<HTMLElement>('.katex');
  if (!k || k.closest('.flip, button, a, label, [role=button], .fx-modal, .calc')) return null;
  const display = !!k.closest('.katex-display');
  const text = k.querySelector('.katex-mathml annotation')?.textContent ?? '';
  if (!display && !/=|\\pm|\\approx|\\sim|<|>|\\le|\\ge/.test(text)) return null;
  const { week } = ctxOf(k);
  return {
    html: (k.closest('.katex-display') ?? k).outerHTML, display: true, note: '',
    syms: [...new Set([...k.querySelectorAll<HTMLElement>('[data-sym]')].map((s) => s.dataset.sym!))],
    week, formulaId: k.closest<HTMLElement>('[data-formula]')?.dataset.formula,
  };
}

/** Global layer: symbol tooltip on hover/focus, formula window on click/Enter. Mount once (Layout). */
export function FormulaLayer() {
  const [tip, setTip] = useState<{ x: number; y: number; name: string; desc: string; here?: string; sym: string } | null>(null);
  const [open, setOpen] = useState<Payload | null>(null);
  const tipFor = useRef<Element | null>(null);

  useEffect(() => {
    const show = (el: HTMLElement) => {
      const key = el.dataset.sym!, { week, part } = ctxOf(el), s = symFor(key, week, part);
      if (!s) return;
      const notes = el.closest('.formula')?.querySelector('.fn')?.textContent;
      const here = notes ? parseNote(notes).vars[key] : undefined;
      const r = el.getBoundingClientRect();
      tipFor.current = el;
      setTip({ x: r.left + r.width / 2, y: r.top, sym: key.replace('_', ''), ...s, here });
    };
    const over = (e: Event) => {
      const el = (e.target as HTMLElement).closest?.<HTMLElement>('[data-sym]');
      if (el) show(el); else if (tipFor.current) { tipFor.current = null; setTip(null); }
    };
    const click = (e: MouseEvent) => {
      const p = payloadFrom(e.target as HTMLElement);
      if (p) { setTip(null); setOpen(p); }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'Enter' && (e.target as HTMLElement).classList?.contains('fx')) { const p = payloadFrom(e.target as HTMLElement); if (p) setOpen(p); }
    };
    const hide = () => { tipFor.current = null; setTip(null); };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', over);
    document.addEventListener('click', click);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('mouseover', over); document.removeEventListener('focusin', over);
      document.removeEventListener('click', click); document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  return (
    <>
      {tip && (
        <div className="symtip" role="tooltip" style={{ left: Math.max(150, Math.min(window.innerWidth - 150, tip.x)), top: tip.y }}>
          <b>{tip.sym}</b> · {tip.name}<span>{tip.desc}</span>{tip.here && <span><i>Here:</i> {tip.here}</span>}
        </div>
      )}
      {open && <FormulaWindow p={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function FormulaWindow({ p, onClose }: { p: Payload; onClose: () => void }) {
  const wk = p.week ? getWeek(p.week) : undefined;
  const part = wk && p.part ? wk.parts[p.part - 1] : undefined;
  const c = part && p.concept ? part.concepts[p.concept - 1] : undefined;
  const item = p.formulaId ? FORMULAS.flatMap((g) => g.items).find((i) => i.id === p.formulaId) : undefined;
  const { vars, rest } = parseNote(p.note);
  const excel = c?.keys.filter((k) => k[2]) ?? [];
  const row = (label: string, html?: string) => html ? <div className="crow"><div className="clabel">{label}</div><div className="cbody" dangerouslySetInnerHTML={{ __html: html }} /></div> : null;
  const goLesson = () => {
    onClose();
    navigate(`/week/${p.week}/learn`);
    setTimeout(() => jumpTo(conceptAnchor(p.part! - 1, p.concept! - 1)), 80);
  };
  return (
    <div className="fx-back" onClick={onClose}>
      <section className="fx-modal lab" role="dialog" aria-modal="true" aria-label="Formula explained" onClick={(e) => e.stopPropagation()}>
        <div className="drow">
          <span className="eyebrow" style={{ flex: 1 }}>{c && wk ? `Week ${wk.num} · ${p.part}.${p.concept} ${c.name}` : item ? item.name : 'Formula'}</span>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close" autoFocus>✕</button>
        </div>
        <div className={`fx-big ${p.display ? 'tex' : ''}`} dangerouslySetInnerHTML={{ __html: p.html }} />
        {(rest.length > 0 || item) && <p className="sub" style={{ marginTop: 8 }}>{item ? `${item.meaning} · ${item.use}` : rest.join(' · ')}</p>}

        <h4 className="fx-h">What each symbol means</h4>
        {p.syms.length ? (
          <dl className="fx-vars">
            {p.syms.map((k) => {
              const s = symFor(k, p.week, p.part);
              return s ? <div key={k}><dt className={/\s|^[a-z]{4,}$/.test(k) ? 'word' : undefined}>{k.replace('_', '')}</dt><dd><b>{s.name}</b> — {s.desc}{vars[k] && <><br /><i>Here:</i> {vars[k]}</>}</dd></div> : null;
            })}
          </dl>
        ) : <p className="sub">No symbols to explain in this formula.</p>}

        {c ? (
          <div style={{ marginTop: 10 }}>
            {row('Idea', c.idea)}{row('Steps', c.steps)}{row('Example', c.example)}{row('Watch out', c.watch)}
            {excel.length > 0 && row('Excel', excel.map((k) => `${k[0]}: ${xl(k[2])}`).join('<br>'))}
          </div>
        ) : item ? (
          <div style={{ marginTop: 10 }}>
            {row('Meaning', item.meaning)}{row('When to use', item.use)}{row('Assumptions', item.assumptions)}{row('df', item.df)}
          </div>
        ) : null}

        {c && <div className="actions" style={{ marginTop: 16 }}><button type="button" className="btn ghost" onClick={goLesson}>Open in the lesson →</button></div>}
      </section>
    </div>
  );
}
