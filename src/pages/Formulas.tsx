import { useState } from 'react';
import { TableBrowser } from '../components/CourseTables';
import { FormulaSheet } from '../components/FormulaSheet';
import { CourseFormulaSheet } from '../course/FormulaSheet';
import { Button, Callout, PageHeader, Tabs } from '../components/ui';
import { useStore } from '../store';

export default function Formulas() {
  const setFlag = useStore((s) => s.setFlag);
  const [tab, setTab] = useState<'course' | 'sheet' | 'tables'>('course');
  const print = () => { setTab('sheet'); setFlag('printed'); setTimeout(() => window.print(), 50); };
  return (
    <div>
      <div className="no-print">
        <PageHeader eyebrow="Reference" title="Formula sheet" subtitle="Every formula, grouped by week and part, with the matching Excel function. The printable tab adds meaning, assumptions and df on two A4 pages." right={<Button variant="ghost" onClick={print}>Print / PDF (A4, 2 pages)</Button>} />
        <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'course', label: 'By week' }, { id: 'sheet', label: 'Printable sheet' }, { id: 'tables', label: 'Course tables' }]} /></div>
      </div>
      <div className="print-only mb-2 text-[11pt] font-bold">Statistical Analysis (2966) — formula sheet · Stats Quest</div>
      {tab === 'course' ? <div className="no-print mt-6"><CourseFormulaSheet /></div> : tab === 'sheet' ? <div className="print-sheet"><FormulaSheet /></div> : <TableBrowser maxHeight={640} />}
      <div className="no-print mt-5"><Callout tone="tip" title="Open-book tip">Print this sheet and annotate it by hand: add the critical values you use most (1.645 · 1.960 · 2.576; χ²₀.₉₅ for df 1–4: 3.841 · 5.991 · 7.815 · 9.488) and your own interpretation templates from “Which Method?”.</Callout></div>
    </div>
  );
}
