import { useState } from 'react';
import { PHASES } from '../content/studyplan';
import { Button, Card, PageHeader, Pill, Progress, Tabs } from '../components/ui';
import { fromKey, prettyDate, todayKey } from '../lib/dates';
import { agenda, buildPlan, type PlanTask } from '../lib/plan';
import { navigate } from '../router';
import { planSettings, useStore } from '../store';

const KIND_ICON: Record<string, string> = {
  theory: '📖', examples: '🧩', exercises: '✏️', cards: '🃏', tables: '📊', sprint: '⏱️', boss: '⚔️', mock: '📝', review: '🔁', viz: '🔬', formulas: '∑', rest: '😴', exam: '🎓', custom: '📌',
};

export function PlanTaskRow({ task, editable = false }: { task: PlanTask; editable?: boolean }) {
  const done = useStore((s) => !!s.tasksDone[task.id]);
  const toggle = useStore((s) => s.toggleTask);
  const remove = useStore((s) => s.removeTask);
  return (
    <div className={`group flex items-center gap-3 rounded-xl border px-3 py-2 ${done ? 'border-good/30 bg-good-soft/50' : 'border-line bg-surface'}`}>
      <input type="checkbox" checked={done} onChange={() => toggle(task.id)} className="h-4 w-4 accent-[var(--good)]" aria-label={`Mark "${task.title}" as done`} />
      <span aria-hidden>{KIND_ICON[task.kind] ?? '•'}</span>
      <button className={`flex-1 text-left text-[15px] ${done ? 'text-muted line-through' : ''}`} onClick={() => navigate(task.to)} title="Open">
        {task.title}
      </button>
      {task.catchUp && <Pill tone="warn">catch-up · {prettyDate(task.date, { day: 'numeric', month: 'short' })}</Pill>}
      {task.minutes > 0 && <span className="hidden text-xs text-muted sm:inline">{task.minutes} min</span>}
      {editable && !task.routine && <button onClick={() => remove(task.id)} className="text-muted opacity-0 transition hover:text-bad group-hover:opacity-100" aria-label="Remove task">✕</button>}
    </div>
  );
}

export default function Plan() {
  const s = useStore();
  const addCustom = useStore((st) => st.addCustomTask);
  const restore = useStore((st) => st.restoreTasks);
  const today = todayKey();
  const plan = buildPlan(planSettings(s), s.plan);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [sel, setSel] = useState(today >= plan[0].date && today <= plan[plan.length - 1].date ? today : plan[0].date);
  const [title, setTitle] = useState('');
  const totalTasks = plan.flatMap((d) => d.tasks).filter((t) => !t.routine);
  const doneCount = totalTasks.filter((t) => s.tasksDone[t.id]).length;
  const day = plan.find((d) => d.date === sel)!;
  const dayTasks = agenda(plan, sel, today, s.tasksDone, planSettings(s));

  return (
    <div>
      <PageHeader title="Study plan" subtitle="28 Oct → 9 Dec 2026 · missed tasks are redistributed automatically (catch-up)"
        right={<Tabs tabs={[{ id: 'list', label: 'List' }, { id: 'calendar', label: 'Calendar' }]} value={view} onChange={setView} />} />
      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{doneCount} / {totalTasks.length} plan tasks done</span><span className="text-muted">Settings → minutes/day, rest days, catch-up rate</span></div>
        <Progress value={doneCount / totalTasks.length} className="mt-2" color="var(--good)" />
        <div className="mt-3 flex flex-wrap gap-2">{PHASES.map((p) => <Pill key={p.id} tone={today >= p.from && today <= p.to ? 'accent' : 'neutral'}>{p.title}: {prettyDate(p.from, { day: 'numeric', month: 'short' })}{p.to !== p.from && `–${prettyDate(p.to, { day: 'numeric', month: 'short' })}`}</Pill>)}</div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {view === 'calendar' ? (
          <Card className="p-4">
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}</div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: (fromKey(plan[0].date).getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
              {plan.map((d) => {
                const own = d.tasks.filter((t) => !t.routine);
                const dn = own.filter((t) => s.tasksDone[t.id]).length;
                const past = d.date < today;
                return (
                  <button key={d.date} onClick={() => setSel(d.date)}
                    className={`min-h-[74px] rounded-xl border p-1.5 text-left text-[11px] transition ${sel === d.date ? 'border-accent ring-2 ring-accent/30' : 'border-line'} ${d.date === today ? 'bg-accent-soft' : 'bg-surface'} ${d.rest ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between font-semibold"><span>{fromKey(d.date).getDate()}</span>{own.length > 0 && <span className={dn === own.length ? 'text-good' : past ? 'text-bad' : 'text-muted'}>{dn}/{own.length}</span>}</div>
                    <div className="mt-0.5 line-clamp-3 text-muted">{d.date === '2026-12-09' ? '🎓 EXAM' : d.rest ? 'rest' : own.map((t) => KIND_ICON[t.kind]).join(' ')}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {plan.map((d) => {
              const own = d.tasks.filter((t) => !t.routine);
              return (
                <button key={d.date} onClick={() => setSel(d.date)} className={`block w-full rounded-2xl border p-3 text-left transition ${sel === d.date ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-surface2'}`}>
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold">{prettyDate(d.date)}{d.date === today && ' · today'}</span><span className="text-muted">{d.phase}</span></div>
                  <div className="mt-1 text-sm text-muted">{d.rest ? 'Rest day (tasks moved to the next day)' : own.map((t) => `${KIND_ICON[t.kind]} ${t.title}`).join(' · ') || 'Routine only'}</div>
                </button>
              );
            })}
          </div>
        )}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="text-lg font-semibold">{prettyDate(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <div className="mb-3 text-sm text-muted">{day.phase}{day.rest && ' · rest day'}</div>
            <div className="space-y-1.5">{dayTasks.map((t) => <PlanTaskRow key={t.id + (t.catchUp ? 'c' : '')} task={t} editable />)}</div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { addCustom(sel, title.trim(), 20); setTitle(''); } }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a custom task…" className="flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm" />
              <Button size="sm" type="submit">Add</Button>
            </form>
            {s.plan.removed.length > 0 && <button onClick={restore} className="mt-2 text-xs text-accent hover:underline">Restore {s.plan.removed.length} removed task(s)</button>}
          </Card>
        </div>
      </div>
    </div>
  );
}
