import { useMemo, useState } from 'react';
import { InterpretationView } from '../components/content-views';
import { ExerciseRunner } from '../components/ExerciseRunner';
import { Button, Card, PageHeader, Pill, Tabs } from '../components/ui';
import { TOPICS, topicLabel } from '../content/topics';
import type { ExerciseDef, TopicId, WorldId } from '../content/types';
import { WORLDS } from '../content/worlds';
import { weakestTopics } from '../lib/mastery';
import { isUnlocked } from '../lib/unlock';
import { useRoute } from '../router';
import { useStore } from '../store';

type Tab = 'mixed' | 'weak' | 'browse' | 'interpret';

export default function Practice() {
  const s = useStore();
  const { query } = useRoute();
  const [tab, setTab] = useState<Tab>((query.tab as Tab) ?? 'mixed');
  const [topic, setTopic] = useState<TopicId | ''>((query.topic as TopicId) ?? '');
  const [diff, setDiff] = useState(0);
  const [pick, setPick] = useState<ExerciseDef | null>(null);
  const [round, setRound] = useState(0);
  const open = WORLDS.filter((w) => isUnlocked(s, w.id as WorldId));
  const pool = open.flatMap((w) => w.exercises);
  const weak = weakestTopics(s, 3).filter((t) => open.some((w) => w.topics.includes(t.id)));

  const mixed = useMemo(() => {
    const src = tab === 'weak' && weak.length ? pool.filter((e) => weak.some((t) => t.id === e.topic)) : pool;
    return src[Math.floor(Math.random() * src.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, tab, pool.length]);

  const filtered = pool.filter((e) => (!topic || e.topic === topic) && (!diff || e.difficulty === diff));

  return (
    <div>
      <PageHeader title="Practice" subtitle="Open exercises with tolerance check, tiered hints and full solutions — no multiple choice" />
      <div className="mb-5">
        <Tabs<Tab> value={tab} onChange={(t) => { setTab(t); setPick(null); }} tabs={[
          { id: 'mixed', label: '🎲 Mixed exam problems' }, { id: 'weak', label: '🎯 Weakest topics' }, { id: 'browse', label: '📚 Browse all' }, { id: 'interpret', label: '✍️ Interpretation' },
        ]} />
      </div>

      {(tab === 'mixed' || tab === 'weak') && mixed && (
        <div className="space-y-3">
          {tab === 'weak' && <Card className="p-3 text-sm">Training your lowest-mastery topics: {weak.map((t) => <Pill key={t.id} tone="bad" className="mr-1">{t.label} · {t.total}%</Pill>)}</Card>}
          <div className="flex items-center justify-between text-sm text-muted"><span>From {pool.length} exercise types in your unlocked weeks · {topicLabel(mixed.topic)}</span><Button size="sm" variant="ghost" onClick={() => setRound((r) => r + 1)}>Different exercise →</Button></div>
          <ExerciseRunner key={`${mixed.id}-${round}`} def={mixed} />
        </div>
      )}

      {tab === 'browse' && (
        pick ? (
          <div>
            <Button variant="ghost" size="sm" className="mb-3" onClick={() => setPick(null)}>← All exercises</Button>
            <ExerciseRunner def={pick} />
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <select value={topic} onChange={(e) => setTopic(e.target.value as TopicId | '')} className="rounded-xl border border-line bg-surface px-3 py-1.5">
                <option value="">All topics</option>
                {TOPICS.filter((t) => open.some((w) => w.topics.includes(t.id))).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {[0, 1, 2, 3].map((d) => <button key={d} onClick={() => setDiff(d)} className={`rounded-xl px-3 py-1.5 ${diff === d ? 'bg-accent text-accent-ink' : 'border border-line bg-surface'}`}>{d ? '★'.repeat(d) : 'All levels'}</button>)}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => {
                const r = s.exercises[e.id];
                return (
                  <button key={e.id} onClick={() => setPick(e)} className="rounded-2xl border border-line bg-surface p-3 text-left hover:shadow-md">
                    <div className="font-medium">{e.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1"><Pill>{topicLabel(e.topic)}</Pill><Pill tone={e.difficulty === 1 ? 'good' : e.difficulty === 2 ? 'warn' : 'bad'}>{'★'.repeat(e.difficulty)}</Pill>{r?.correct ? <Pill tone="good">✓ {r.correct}</Pill> : null}</div>
                  </button>
                );
              })}
            </div>
          </>
        )
      )}

      {tab === 'interpret' && (
        <div className="space-y-4">
          <p className="text-muted">Write the sentence yourself first, then compare with the model answer and tick the checklist.</p>
          {open.flatMap((w) => w.interpretations).map((t) => <InterpretationView key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
