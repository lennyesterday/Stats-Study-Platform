import { useState } from 'react';
import { getWeek } from '../course';
import { Learn } from '../course/Learn';
import { Practice } from '../course/Practice';
import { cardsForPart } from '../course/partCards';
import { getWorld } from '../content/worlds';
import { BossFight, ExampleView, InterpretationView } from '../components/content-views';
import { ExerciseRunner } from '../components/ExerciseRunner';
import { FlashcardReviewer } from '../components/FlashcardReviewer';
import { Button, Empty, Tabs } from '../components/ui';
import { navigate } from '../router';
import { useStore } from '../store';

type Tab = 'learn' | 'practice' | 'examples' | 'cards' | 'exercises' | 'boss';
const TABS: Tab[] = ['learn', 'practice', 'examples', 'cards', 'exercises', 'boss'];

/** One course week: the Stats Study Lab lesson (Learn + Practice) plus examples, flashcards, exam exercises and the boss. */
export default function WeekPage({ id, tab }: { id: number; tab?: string }) {
  const w = getWorld(id), wk = getWeek(id);
  const s = useStore();
  const [exId, setExId] = useState<string | null>(null);
  const [cram, setCram] = useState(false);
  const [cardPart, setCardPart] = useState<number | null>(null); // null = whole week
  if (!w || !wk) return <Empty>Unknown week.</Empty>;
  const current = (tab === 'theory' ? 'learn' : TABS.includes(tab as Tab) ? tab : 'learn') as Tab;
  const go = (t: Tab) => navigate(`/week/${w.id}/${t}`);
  const ex = w.exercises.find((e) => e.id === exId);
  return (
    <div data-week={w.id}>
      <div className="lab">
        <div className="head"><span className="eyebrow">Week {wk.num}</span><h1>{wk.title}</h1><p className="lede">{wk.blurb}</p></div>
      </div>
      <div className="mb-8">
        <Tabs<Tab>
          value={current}
          onChange={go}
          tabs={[
            { id: 'learn', label: 'Learn' },
            { id: 'practice', label: 'Practice' },
            { id: 'examples', label: <>Worked examples<small className="ml-1.5 font-mono text-[0.7rem] font-normal text-muted">{w.examples.length}</small></> },
            { id: 'cards', label: <>Flashcards<small className="ml-1.5 font-mono text-[0.7rem] font-normal text-muted">{w.flashcards.length}</small></> },
            { id: 'exercises', label: <>Exam exercises<small className="ml-1.5 font-mono text-[0.7rem] font-normal text-muted">{w.exercises.length}</small></> },
            { id: 'boss', label: s.bosses[w.id]?.passed ? 'Boss ✓' : 'Boss' },
          ]}
        />
      </div>

      {current === 'learn' && <div className="lab"><Learn w={wk} onPractice={() => go('practice')} /></div>}
      {current === 'practice' && <div className="lab"><Practice w={wk} /></div>}

      {current === 'examples' && <div className="space-y-4">{w.examples.map((e) => <ExampleView key={e.id} ex={e} />)}</div>}

      {current === 'cards' && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Which cards">
              <Button variant={cardPart === null ? 'primary' : 'ghost'} size="sm" onClick={() => setCardPart(null)}>Whole week · {w.flashcards.length}</Button>
              {wk.parts.map((p, pi) => (
                <Button key={pi} variant={cardPart === pi ? 'primary' : 'ghost'} size="sm" onClick={() => setCardPart(pi)} title={p.title}>Part {pi + 1} · {cardsForPart(w.id, pi).length}</Button>
              ))}
            </div>
            <Button variant={cram ? 'primary' : 'ghost'} size="sm" onClick={() => setCram((c) => !c)}>{cram ? 'Due cards only' : 'Cram all'}</Button>
          </div>
          {cardPart !== null && <p className="mb-3 text-sm text-muted">Part {cardPart + 1}: {wk.parts[cardPart].title}</p>}
          <FlashcardReviewer cards={cardPart === null ? w.flashcards : cardsForPart(w.id, cardPart)} cram={cram} />
        </div>
      )}

      {current === 'exercises' && (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="space-y-1.5">
            {w.exercises.map((e) => {
              const r = s.exercises[e.id];
              return (
                <button key={e.id} onClick={() => setExId(e.id)} className={`block w-full rounded-[10px] border px-3 py-2 text-left transition ${exId === e.id ? 'border-ink bg-sunk' : 'border-line bg-bg hover:bg-sunk'}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[0.92rem] font-medium">{e.title}</span><span className="font-mono text-[0.7rem] text-muted">{'●'.repeat(e.difficulty)}</span></div>
                  <div className="font-mono text-[0.72rem] text-muted">{r ? `${r.correct}/${r.attempts} correct` : 'not tried yet'}</div>
                </button>
              );
            })}
            {w.interpretations.length > 0 && (
              <button onClick={() => setExId('interp')} className={`block w-full rounded-[10px] border px-3 py-2 text-left ${exId === 'interp' ? 'border-ink bg-sunk' : 'border-dashed border-line2'}`}>
                Interpretation exercises ({w.interpretations.length})
              </button>
            )}
          </div>
          <div>
            {exId === 'interp' ? <div className="space-y-4">{w.interpretations.map((t) => <InterpretationView key={t.id} task={t} />)}</div>
              : ex ? <ExerciseRunner key={ex.id} def={ex} />
              : <Empty>Pick an exercise on the left. Every exercise can be re-rolled with fresh numbers.</Empty>}
          </div>
        </div>
      )}

      {current === 'boss' && <BossFight world={w.id} boss={w.boss} color={w.color} />}
    </div>
  );
}
