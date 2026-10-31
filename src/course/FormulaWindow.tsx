import { useEffect, useState } from 'react';
import { DockButton, FloatWindow, isShortcut, type Box } from './FloatWindow';
import { CourseFormulaSheet } from './FormulaSheet';

// Floating formula sheet (same window as tables and calculator): all formulas of weeks 1–6,
// filter by week, search, hover a symbol / click a formula for the explanation. Open with F or [data-open-formulas].

const sheetBox = (): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(520, vw - 32), h = Math.min(Math.round(vh * 0.82), vh - 32);
  return { x: Math.max(16, Math.round((vw - w) / 2)), y: Math.max(16, Math.round((vh - h) / 2)), w, h };
};

export function FormulaWindow() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (isShortcut(e, 'f')) { e.preventDefault(); setOpen((o) => !o); } };
    const onClick = (e: MouseEvent) => { if ((e.target as HTMLElement).closest('[data-open-formulas]')) setOpen(true); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);
  return (
    <>
      <DockButton open={open} onClick={() => setOpen((o) => !o)} label="Formulas" kbd="F"
        icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M14.5 4h-9l5 6-5 6h9" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
      {open && (
        <FloatWindow id="formulas" title="Formula sheet" label="Formula sheet" defaultBox={sheetBox} minW={340} onClose={() => setOpen(false)}>
          <div className="dbody fsheet"><CourseFormulaSheet compact weekFilter /></div>
        </FloatWindow>
      )}
    </>
  );
}
