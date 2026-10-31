import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { topicLabel } from '../content/topics';
import type { TopicId } from '../content/types';
import { todayKey } from '../lib/dates';
import { intervalLabel, newCard, type Rating } from '../lib/srs';
import { useStore } from '../store';
import { Rich } from './Rich';
import { Button, Empty, Pill, Progress } from './ui';

export interface ReviewCard { id: string; topic: TopicId; front: string; back: string; mistake?: boolean }

const RATINGS: { r: Rating; label: string; cls: string }[] = [
  { r: 1, label: 'Again', cls: 'bg-bad-soft text-bad' },
  { r: 2, label: 'Hard', cls: 'bg-warn-soft text-warn' },
  { r: 3, label: 'Good', cls: 'bg-good-soft text-good' },
  { r: 4, label: 'Easy', cls: 'bg-accent-soft text-accent' },
];

/** Spaced-repetition session over the due cards of `cards` (or all of them in "cram" mode). */
export function FlashcardReviewer({ cards, cram = false, doneMessage }: { cards: ReviewCard[]; cram?: boolean; doneMessage?: ReactNode }) {
  const states = useStore((s) => s.cards);
  const reviewCard = useStore((s) => s.reviewCard);
  const today = todayKey();
  const initial = useMemo(
    () => cards.filter((c) => cram || (states[c.id]?.due ?? today) <= today).map((c) => c.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, cram],
  );
  const [queue, setQueue] = useState<string[]>(initial);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  useEffect(() => { setQueue(initial); setDone(0); setFlipped(false); }, [initial]);

  const card = cards.find((c) => c.id === queue[0]);
  const rate = useCallback((r: Rating) => {
    if (!card) return;
    reviewCard(card.id, r, card.mistake);
    setFlipped(false);
    setDone((d) => d + 1);
    setQueue((q) => (r === 1 ? [...q.slice(1), q[0]] : q.slice(1)));
  }, [card, reviewCard]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) rate(Number(e.key) as Rating);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  if (!card) {
    return (
      <Empty>
        {done ? <>🎉 Session complete — {done} reviews. {doneMessage ?? 'Come back tomorrow for the next due cards.'}</> : <>No cards due right now. ✨ Use “Cram all” to practise anyway.</>}
      </Empty>
    );
  }
  const st = states[card.id] ?? newCard(today);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>{done} done · {queue.length} left</span>
        <span className="flex gap-1"><Pill>{topicLabel(card.topic)}</Pill>{card.mistake && <Pill tone="bad">Mistake</Pill>}{!st.seen && <Pill tone="accent">new</Pill>}</span>
      </div>
      <Progress value={done / (done + queue.length)} className="mb-4" />
      <div className="flip cursor-pointer select-none" onClick={() => setFlipped((f) => !f)} data-week={/^w(\d)-/.exec(card.id)?.[1]}>
        <div className={`flip-inner min-h-[240px] ${flipped ? 'flipped' : ''}`}>
          <div className="flip-face flex min-h-[240px] flex-col justify-center rounded-2xl border border-line bg-surface p-6 text-lg shadow-sm">
            <Rich text={card.front} symbols />
            <div className="mt-6 text-center text-xs text-muted">Click or press <kbd className="rounded border border-line px-1">Space</kbd> to flip</div>
          </div>
          <div className="flip-face flip-back flex flex-col justify-center overflow-auto rounded-2xl border border-accent/40 bg-accent-soft p-6 text-[17px] shadow-sm">
            <Rich text={card.back} symbols />
          </div>
        </div>
      </div>
      <div className={`mt-4 grid grid-cols-4 gap-2 transition ${flipped ? 'opacity-100' : 'pointer-events-none opacity-30'}`}>
        {RATINGS.map(({ r, label, cls }) => (
          <button key={r} onClick={() => rate(r)} className={`rounded-xl px-2 py-2 text-sm font-semibold ${cls} hover:brightness-95`}>
            {label}<span className="block text-[11px] font-normal opacity-75">{r}· {intervalLabel(st, r, today)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 text-center"><Button variant="ghost" size="sm" onClick={() => rate(3)} className={flipped ? '' : 'invisible'}>Skip as “Good”</Button></div>
    </div>
  );
}
