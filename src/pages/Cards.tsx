import { useMemo, useState } from 'react';
import { FlashcardReviewer, type ReviewCard } from '../components/FlashcardReviewer';
import { Rich } from '../components/Rich';
import { Button, Card, Empty, PageHeader, Pill } from '../components/ui';
import { TOPICS, topicLabel } from '../content/topics';
import type { TopicId, WorldId } from '../content/types';
import { WORLDS } from '../content/worlds';
import { todayKey } from '../lib/dates';
import { isUnlocked } from '../lib/unlock';
import { navigate } from '../router';
import { useStore } from '../store';

export default function Cards({ deck = 'all' }: { deck?: string }) {
  const s = useStore();
  const today = todayKey();
  const [topic, setTopic] = useState<TopicId | ''>('');
  const [cram, setCram] = useState(false);
  const [showList, setShowList] = useState(false);

  const mistakeCards: ReviewCard[] = useMemo(() => s.mistakes.map((m) => ({ id: `m:${m.id}`, topic: m.topic, front: m.front, back: m.back, mistake: true })), [s.mistakes]);
  const open = WORLDS.filter((w) => isUnlocked(s, w.id as WorldId));
  const cards: ReviewCard[] = useMemo(() => {
    let list: ReviewCard[] = deck === 'mistakes' ? mistakeCards
      : deck.startsWith('w') ? (WORLDS.find((w) => `w${w.id}` === deck)?.flashcards ?? [])
      : [...open.flatMap((w) => w.flashcards), ...mistakeCards];
    if (topic) list = list.filter((c) => c.topic === topic);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, topic, mistakeCards, open.length]);
  const due = (list: ReviewCard[]) => list.filter((c) => (s.cards[c.id]?.due ?? today) <= today).length;

  const decks = [
    { id: 'all', label: 'All unlocked', n: due([...open.flatMap((w) => w.flashcards), ...mistakeCards]) },
    { id: 'mistakes', label: '❌ Mistakes', n: due(mistakeCards) },
    ...WORLDS.map((w) => ({ id: `w${w.id}`, label: `${w.icon} W${w.id}`, n: isUnlocked(s, w.id as WorldId) ? due(w.flashcards) : -1 })),
  ];

  return (
    <div>
      <PageHeader title="Flashcards" subtitle="Spaced repetition (SM-2) · Space = flip · 1–4 = Again / Hard / Good / Easy" />
      <div className="mb-4 flex flex-wrap gap-2">
        {decks.map((d) => (
          <button key={d.id} disabled={d.n < 0} onClick={() => navigate(d.id === 'all' ? '/cards' : `/cards?deck=${d.id}`)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium ${deck === d.id ? 'bg-accent text-accent-ink' : 'border border-line bg-surface hover:bg-surface2'} disabled:opacity-40`}>
            {d.label} {d.n >= 0 ? <span className="ml-1 opacity-75">{d.n} due</span> : '🔒'}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <select value={topic} onChange={(e) => setTopic(e.target.value as TopicId | '')} className="rounded-xl border border-line bg-surface px-3 py-1.5">
          <option value="">All topics</option>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={cram} onChange={(e) => setCram(e.target.checked)} /> Cram all (ignore due dates)</label>
        <span className="text-muted">{cards.length} cards in this selection</span>
      </div>
      {cards.length ? <FlashcardReviewer cards={cards} cram={cram} /> : <Empty>{deck === 'mistakes' ? 'No mistakes yet — they are collected automatically from mocks.' : 'No cards in this selection.'}</Empty>}

      {deck === 'mistakes' && s.mistakes.length > 0 && (
        <div className="mt-8">
          <Button variant="ghost" size="sm" onClick={() => setShowList(!showList)}>{showList ? 'Hide' : 'Manage'} mistakes deck ({s.mistakes.length})</Button>
          {showList && (
            <div className="mt-3 space-y-2">
              {s.mistakes.map((m) => (
                <Card key={m.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0 flex-1"><div className="mb-1 flex gap-1"><Pill>{topicLabel(m.topic)}</Pill><Pill tone="neutral">{m.source}</Pill></div><Rich text={m.front.slice(0, 220) + (m.front.length > 220 ? '…' : '')} /></div>
                  <Button size="sm" variant="ghost" onClick={() => s.deleteMistake(m.id)}>Remove</Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
