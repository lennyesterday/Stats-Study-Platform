import { useRef, useState } from 'react';
import { Button, Callout, Card, PageHeader } from '../components/ui';
import type { GameState, Settings as S } from '../lib/state';
import { exportState, useStore } from '../store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <div><div className="font-medium">{label}</div>{hint && <div className="text-sm text-muted">{hint}</div>}</div>
      <div>{children}</div>
    </div>
  );
}

export default function Settings() {
  const s = useStore();
  const set = (p: Partial<S>) => s.updateSettings(p);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const toggle = (k: keyof S) => <input type="checkbox" className="h-5 w-5" checked={!!s.settings[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<S>)} />;

  const doExport = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stats-quest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as GameState;
      if (typeof data !== 'object' || data === null || typeof data.xp !== 'number') throw new Error('not a Stats Quest backup');
      s.importState(data);
      setMsg('✓ Backup imported.');
    } catch (e) {
      setMsg(`✗ Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" />
      <Card className="mb-4 px-5 py-2">
        <Row label="Your name" hint="Used on the dashboard greeting"><input value={s.settings.name} onChange={(e) => set({ name: e.target.value })} className="rounded-xl border border-line bg-surface px-3 py-1.5" /></Row>
        <Row label="Sound effects" hint="Off by default">{toggle('sound')}</Row>
      </Card>
      <Card className="mb-4 px-5 py-2">
        <div className="pt-3 font-semibold">Study plan</div>
        <Row label="Minutes per day" hint="Scales the daily tasks"><input type="number" min={30} max={480} step={15} value={s.settings.minutesPerDay} onChange={(e) => set({ minutesPerDay: Number(e.target.value) || 90 })} className="w-24 rounded-xl border border-line bg-surface px-3 py-1.5" /></Row>
        <Row label="Rest days" hint="Tasks move to the next study day">
          <div className="flex gap-1">{DAYS.map((d, i) => <button key={d} onClick={() => set({ restDays: s.settings.restDays.includes(i) ? s.settings.restDays.filter((x) => x !== i) : [...s.settings.restDays, i] })} className={`rounded-lg px-2 py-1 text-sm ${s.settings.restDays.includes(i) ? 'bg-accent text-accent-ink' : 'bg-surface2'}`}>{d}</button>)}</div>
        </Row>
        <Row label="Catch-up tasks per day" hint="Overdue tasks added to the next days"><input type="number" min={0} max={6} value={s.settings.catchUpPerDay} onChange={(e) => set({ catchUpPerDay: Number(e.target.value) })} className="w-20 rounded-xl border border-line bg-surface px-3 py-1.5" /></Row>
        <Row label="Unlock all weeks and mocks" hint="Ignore the plan’s unlock dates">{toggle('unlockAll')}</Row>
      </Card>
      <Card className="mb-4 px-5 py-2">
        <div className="pt-3 font-semibold">Exam mode</div>
        <Row label="Mock duration (minutes)" hint="Real exam: 90 min (+10 min grace period for technical problems)"><input type="number" min={10} max={240} step={5} value={s.settings.mockDurationMin} onChange={(e) => set({ mockDurationMin: Number(e.target.value) || 90 })} className="w-24 rounded-xl border border-line bg-surface px-3 py-1.5" /></Row>
        <Row label="Moodle-strict decimals" hint="Answers must have exactly the requested number of decimals">{toggle('strictDecimals')}</Row>
      </Card>
      <Card className="mb-4 px-5 py-4">
        <div className="mb-2 font-semibold">Backup</div>
        <p className="mb-3 text-sm text-muted">Progress is stored in this browser (localStorage). Export a JSON backup regularly — especially before clearing browser data or switching devices.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport}>⬇ Export JSON</Button>
          <Button variant="ghost" onClick={() => file.current?.click()}>⬆ Import JSON</Button>
          <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </Card>
      <Callout tone="warn" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-2"><span>Reset all progress (XP, cards, mocks, plan changes).</span><Button variant="bad" onClick={() => { if (window.confirm('Really reset all progress? Export a backup first.')) s.reset(); }}>Reset</Button></div>
      </Callout>
    </div>
  );
}
