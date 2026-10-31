import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { makeCurve, TABLES, WIDGETS } from '.';
import { DockButton, FloatWindow, isShortcut, load, save, type Box } from './FloatWindow';
import { enhanceFormulas } from './formulaUi';

/** Lesson HTML from the engine. Mounts the interactive widgets (`.widget[data-w]`) after each render. */
export function Html({ html, className, style, viz }: { html: string; className?: string; style?: CSSProperties; viz?: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('.widget[data-w]').forEach((w) => WIDGETS[w.dataset.w!]?.(w));
    const host = el.querySelector<HTMLElement>('[data-viz]');
    if (host && viz) makeCurve(host, () => ({ ...viz, small: true, aria: 'Solution sketch' }));
    enhanceFormulas(el);
  }, [html, viz]);
  return <div ref={ref} className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------- statistical tables window (images of the course PDFs) ----------

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5];

/** Open the tables window from anywhere: `openTables('t-student')`, or any element with `data-open-table`. */
export const openTables = (id?: string) => window.dispatchEvent(new CustomEvent('sq:tables', { detail: id ?? '' }));

const tablesBox = (): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(680, vw - 32), h = Math.min(Math.round(vh * 0.78), vh - 32);
  return { x: vw - w - 24, y: Math.max(16, Math.round((vh - h) / 2)), w, h };
};

export function TablesDrawer() {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(() => { const v = load('sq-table', 'normal'); return TABLES.some((t) => t.id === v) ? v : TABLES[0].id; });
  const [z, setZ] = useState(() => { const v = load('sq-zoom2', 2); return v >= 0 && v < ZOOMS.length ? v : 2; });
  const body = useRef<HTMLDivElement>(null);
  const tb = TABLES.find((t) => t.id === id)!;

  useEffect(() => {
    const show = (tid?: string | null) => { if (tid) { setId(tid); save('sq-table', tid); } setOpen(true); };
    const onEvt = (e: Event) => show((e as CustomEvent<string>).detail);
    const onClick = (e: MouseEvent) => {
      const ot = (e.target as HTMLElement).closest<HTMLElement>('[data-open-table]');
      if (ot) show(ot.dataset.openTable);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.fx-modal') && document.activeElement?.closest('[aria-label="Statistical tables"]')) return setOpen(false);
      if (isShortcut(e, 't')) setOpen((o) => !o);
    };
    window.addEventListener('sq:tables', onEvt);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('sq:tables', onEvt); document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [id]);

  const zoom = (d: number) => setZ((cur) => { const n = Math.max(0, Math.min(ZOOMS.length - 1, cur + d)); save('sq-zoom2', n); return n; });
  // Ctrl/⌘ + scroll wheel (or trackpad pinch) zooms the table; needs a non-passive listener to stop page zoom
  useEffect(() => {
    const el = body.current;
    if (!open || !el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      acc += e.deltaY;
      if (Math.abs(acc) >= 40) { zoom(acc < 0 ? 1 : -1); acc = 0; }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open]);

  return (
    <>
      <DockButton open={open} onClick={() => setOpen((o) => !o)} label="Tables" kbd="T"
        icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="2.5" y="3" width="15" height="14" rx="2" /><path d="M2.5 7.5h15M2.5 12h15M8 3v14" /></svg>} />
      {open && (
        <FloatWindow id="tables" title="Statistical tables" label="Statistical tables" defaultBox={tablesBox} onClose={() => setOpen(false)}
          head={<div className="zoom"><button type="button" className="iconbtn" onClick={() => zoom(-1)} aria-label="Zoom out">−</button><span>{Math.round(ZOOMS[z] * 100)}%</span><button type="button" className="iconbtn" onClick={() => zoom(1)} aria-label="Zoom in">+</button></div>}>
          <div className="dsub">
            <div className="seg">{TABLES.map((t) => <button key={t.id} type="button" aria-pressed={t.id === id} onClick={() => { setId(t.id); save('sq-table', t.id); }}>{t.name}</button>)}</div>
            <p className="dhow" dangerouslySetInnerHTML={{ __html: tb.how }} />
          </div>
          <div className="dbody" ref={body}>
            {tb.pages.map((p, k) => <img key={p} src={`${import.meta.env.BASE_URL}${p}`} alt={`${tb.name} table, page ${k + 1}`} draggable={false} style={{ width: `${ZOOMS[z] * 100}%` }} />)}
          </div>
        </FloatWindow>
      )}
    </>
  );
}
