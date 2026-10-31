import { useEffect, useRef, useState, type ReactNode } from 'react';

// Floating tool window (tables, calculator): drag by the title bar, resize from any edge or corner,
// maximise with the button or a double-click. Position and size persist per window.

export interface Box { x: number; y: number; w: number; h: number }
type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };

/** keep at least the title bar on screen */
const fit = (b: Box, minW: number, minH: number): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.max(Math.min(minW, vw), Math.min(b.w, vw)), h = Math.max(Math.min(minH, vh), Math.min(b.h, vh));
  return { w, h, x: Math.max(80 - w, Math.min(b.x, vw - 80)), y: Math.max(0, Math.min(b.y, vh - 48)) };
};

// the window used last sits on top
let topZ = 55;

/** True when a key press should count as a window shortcut (not typing into a field). */
export const isShortcut = (e: KeyboardEvent, key: string) =>
  e.key.toLowerCase() === key && !e.metaKey && !e.ctrlKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) && !(e.target as HTMLElement).isContentEditable;

export function FloatWindow({ id, title, label, defaultBox, minW = 320, minH = 240, onClose, head, children }: {
  id: string; title: ReactNode; label: string; defaultBox: () => Box; minW?: number; minH?: number;
  onClose: () => void; head?: ReactNode; children: ReactNode;
}) {
  const key = `sq-win-${id}`;
  const [box, setBox] = useState<Box>(() => fit(load(key, defaultBox()), minW, minH));
  const [max, setMax] = useState(false);
  const [mode, setMode] = useState<'' | 'dragging' | 'resizing'>('');
  const [z, setZ] = useState(() => ++topZ);
  const front = () => { if (z !== topZ) setZ(++topZ); };
  const ref = useRef<HTMLElement>(null);
  // focus the new window (unless something inside, e.g. an input, already took it) so Esc and keys apply to it
  useEffect(() => { if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    const onResize = () => setBox((b) => fit(b, minW, minH));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [minW, minH]);

  /** shared pointer tracking for moving and resizing */
  const track = (e: React.PointerEvent, kind: 'dragging' | 'resizing', apply: (dx: number, dy: number, start: Box) => Box) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const start = max ? { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight } : box, sx = e.clientX, sy = e.clientY;
    if (max) setMax(false);
    setMode(kind);
    let last = start;
    const move = (ev: PointerEvent) => { last = fit(apply(ev.clientX - sx, ev.clientY - sy, start), minW, minH); setBox(last); };
    const up = () => {
      setMode(''); save(key, last);
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const interactive = (t: EventTarget) => !!(t as HTMLElement).closest('button, .seg, input, select, textarea');
  const startDrag = (e: React.PointerEvent) => { if (!interactive(e.target)) track(e, 'dragging', (dx, dy, s) => ({ ...s, x: s.x + dx, y: s.y + dy })); };
  const startResize = (edge: Edge) => (e: React.PointerEvent) => track(e, 'resizing', (dx, dy, s) => {
    let { x, y, w, h } = s;
    if (edge.includes('e')) w = Math.max(minW, s.w + dx);
    if (edge.includes('s')) h = Math.max(minH, s.h + dy);
    if (edge.includes('w')) { w = Math.max(minW, s.w - dx); x = s.x + s.w - w; }
    if (edge.includes('n')) { h = Math.max(minH, s.h - dy); y = s.y + s.h - h; }
    return { x, y, w, h };
  });

  const style = max ? { left: 0, top: 0, width: '100vw', height: '100vh', zIndex: z } : { left: box.x, top: box.y, width: box.w, height: box.h, zIndex: z };
  return (
    <section className={`twin no-print lab ${max ? 'max' : ''} ${mode}`} style={style} role="dialog" aria-label={label} onPointerDownCapture={front} ref={ref} tabIndex={-1}>
      <div className="dhead" onPointerDown={startDrag} onDoubleClick={(e) => { if (!interactive(e.target)) setMax((m) => !m); }} title="Drag to move · double-click to maximise">
        <div className="drow"><b>{title}</b>
          {head}
          <button type="button" className="iconbtn" onClick={() => setMax((m) => !m)} aria-label={max ? 'Restore window size' : 'Maximise window'} title={max ? 'Restore' : 'Maximise'}>{max ? '❐' : '□'}</button>
          <button type="button" className="iconbtn" onClick={onClose} aria-label={`Close ${label.toLowerCase()}`}>✕</button>
        </div>
      </div>
      {children}
      {!max && EDGES.map((d) => <div key={d} className={`rz ${d}`} onPointerDown={startResize(d)} aria-hidden="true" />)}
    </section>
  );
}

/** pill button in the bottom-right dock */
export function DockButton({ open, onClick, icon, label, kbd }: { open: boolean; onClick: () => void; icon: ReactNode; label: string; kbd: string }) {
  return (
    <button className="tbtn" type="button" aria-expanded={open} aria-pressed={open} onClick={onClick}>
      {icon}{label} <kbd>{kbd}</kbd>
    </button>
  );
}
