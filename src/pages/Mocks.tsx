import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TableBrowser } from '../components/CourseTables';
import { CourseFormulaSheet } from '../course/FormulaSheet';
import { Rich } from '../components/Rich';
import { Button, Callout, Card, Empty, OutputTable, PageHeader, Pill } from '../components/ui';
import { getMock, MOCK_IDS, generateExam } from '../content/mocks';
import { topicLabel, topicWorld } from '../content/topics';
import type { MockExam, MockQuestion, TopicId } from '../content/types';
import { prettyDate, todayKey } from '../lib/dates';
import { gradeQuestion, isAnswered, toGrade, type Answers, type QuestionGrade } from '../lib/grading';
import { randomSeed } from '../lib/rng';
import type { MockAttempt } from '../lib/state';
import { mockUnlocked } from '../lib/unlock';
import { navigate } from '../router';
import { useStore } from '../store';

const PASS = 7.5;

export default function Mocks({ sub }: { sub?: string }) {
  const [run, setRun] = useState<{ exam: MockExam; last6: boolean; key: string } | null>(null);
  const [result, setResult] = useState<{ exam: MockExam; last6: boolean; answers: Record<string, Answers>; grades: QuestionGrade[]; attempt: MockAttempt } | null>(null);

  useEffect(() => { setRun(null); setResult(null); }, [sub]);

  if (result) return <Results {...result} onBack={() => { setResult(null); navigate('/mocks'); }} />;
  if (run) return <Runner exam={run.exam} last6={run.last6} examKey={run.key} onFinish={(r) => { setRun(null); setResult(r); }} onAbort={() => setRun(null)} />;

  if (sub === 'generator') return <Generator onStart={(exam, last6, key) => setRun({ exam, last6, key })} />;
  const id = Number(sub);
  if (id >= 1 && id <= 10) return <MockIntro id={id} onStart={(last6) => setRun({ exam: getMock(id), last6, key: `mock${id}` })} />;
  return <MockList />;
}

function bestOf(mocks: MockAttempt[], id: number | 'gen') {
  const full = mocks.filter((m) => m.mockId === id && !m.last6Only);
  return full.length ? Math.max(...full.map((m) => m.grade)) : null;
}

function MockList() {
  const s = useStore();
  return (
    <div>
      <PageHeader title="Mock Exams" subtitle="Practice with open answers (harder than the real exam) · real exam: 26 multiple choice, 90 min · no hints in exam mode" right={<Button onClick={() => navigate('/mocks/generator')}>🎲 Exam Generator</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {MOCK_IDS.map((id) => {
          const open = mockUnlocked(s, id);
          const best = bestOf(s.mocks, id);
          const m = getMock(id);
          const final = id === 10;
          return (
            <button key={id} onClick={() => open && navigate(`/mocks/${id}`)} disabled={!open}
              className={`relative rounded-2xl border p-4 text-left transition ${final ? 'border-xp/50 bg-accent-soft lg:col-span-2' : 'border-line bg-surface'} ${open ? 'hover:-translate-y-0.5 hover:shadow-md' : 'opacity-55'}`}>
              <div className="text-3xl">{!open ? '🔒' : best !== null && best >= PASS ? (final ? '👑' : '✅') : final ? '🐉' : '📝'}</div>
              <div className="mt-2 font-semibold">{final ? 'Mock 10 — Official Mock' : `Mock ${id}`}</div>
              {final && <div className="text-sm text-xp">Final Boss · dress rehearsal</div>}
              <div className="mt-2 flex flex-wrap gap-1">
                {best !== null ? <Pill tone={best >= PASS ? 'good' : 'bad'}>best {best.toFixed(1)}</Pill> : <Pill>{open ? 'not taken' : 'locked'}</Pill>}
                {m.generated && <Pill tone="warn">generated</Pill>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">Mocks 1–9 open in the mock phase (16 Nov or once all weeks are unlocked); Mock 10 opens on 30 Nov or after nine full mocks. “Unlock all” in Settings overrides this.</p>
      <History />
    </div>
  );
}

function History() {
  const mocks = useStore((s) => s.mocks);
  const data = mocks.map((m, i) => ({ i: i + 1, grade: m.grade, label: `${m.title}${m.last6Only ? ' (last 6)' : ''} · ${prettyDate(m.date)}` }));
  if (!data.length) return <div className="mt-6"><Empty>No mock attempts yet. Your grade history will appear here.</Empty></div>;
  return (
    <Card className="mt-6 p-4">
      <div className="mb-2 font-semibold">Grade history</div>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="i" stroke="var(--muted)" fontSize={12} />
            <YAxis domain={[0, 20]} stroke="var(--muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }} formatter={(v) => [Number(v).toFixed(2), 'Grade']} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} />
            <ReferenceLine y={PASS} stroke="var(--bad)" strokeDasharray="5 4" label={{ value: 'pass 7.5', fill: 'var(--bad)', fontSize: 11, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="grade" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
        {[...mocks].reverse().map((m) => (
          <div key={m.id} className="flex justify-between gap-2 border-b border-line py-1">
            <span>{m.title}{m.last6Only && ' · last 6'} <span className="text-muted">· {prettyDate(m.date)} · {Math.round(m.durationSec / 60)} min</span></span>
            <span className={m.grade >= PASS ? 'text-good' : 'text-bad'}>{m.grade.toFixed(2)} / 20</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MockIntro({ id, onStart }: { id: number; onStart: (last6: boolean) => void }) {
  const s = useStore();
  const exam = getMock(id);
  if (!mockUnlocked(s, id)) return <Empty>🔒 This mock is still locked. <a className="text-accent" href="#/mocks">Back</a></Empty>;
  const final = id === 10;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={exam.title} subtitle={`${exam.questions.length} questions · ${s.settings.mockDurationMin} min · pass mark 7.5 / 20`} />
      <Card className="space-y-3 p-5">
        {final && <Callout tone="think" title="🐉 Final Boss — dress rehearsal">Do this one under real exam conditions: one sitting, timer on, only your printed notes, tables and a physical calculator. Score ≥ 14 for the “Dress Rehearsal” badge.</Callout>}
        {exam.generated && <Callout tone="warn" title="Generated mock">{exam.note}</Callout>}
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Exam mode: no hints. Formula sheet and course tables are available in the side panel.</li>
          <li>Real exam: 26 multiple-choice questions in 90 min (+10 min grace). Only paper notes, printed tables and a physical calculator; no Excel, no digital materials.</li>
          <li>Navigate freely between questions and flag those you want to revisit.</li>
          <li>Numeric answers: use the requested number of decimals{s.settings.strictDecimals ? ' (Moodle-strict mode is ON: decimals must match exactly)' : ''}.</li>
          <li>Afterwards: points per question, step-by-step solutions, and every mistake goes to your mistakes deck.</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={() => onStart(false)}>▶ Start full exam</Button>
          {!final && <Button variant="soft" onClick={() => onStart(true)}>Only the last 6 questions</Button>}
          <Button variant="ghost" onClick={() => navigate('/mocks')}>Back</Button>
        </div>
      </Card>
    </div>
  );
}

function Generator({ onStart }: { onStart: (exam: MockExam, last6: boolean, key: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Exam Generator" subtitle="A fresh, random exam in the style of Mock 10 — new numbers every time" />
      <Card className="space-y-3 p-5">
        <p>Each generated exam has 16 questions: 3 concept questions and 7 calculations on Weeks 1–3, then the last 6 questions on ANOVA, χ² and regression. All numbers are computed and verified by the built-in stats engine.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { const seed = randomSeed(); onStart(generateExam(seed, { id: 0, title: 'Generated exam', mock10Style: true }), false, `gen${seed}`); }}>🎲 Generate full exam</Button>
          <Button variant="soft" onClick={() => { const seed = randomSeed(); onStart(generateExam(seed, { id: 0, title: 'Generated exam', mock10Style: true }), true, `gen${seed}`); }}>Last 6 only</Button>
          <Button variant="ghost" onClick={() => navigate('/mocks')}>Back</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- runner

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function QuestionInputs({ q, a, onChange, disabled, grade }: { q: MockQuestion; a: Answers; onChange: (k: string, v: string) => void; disabled?: boolean; grade?: QuestionGrade }) {
  const ring = (k: number) => (grade ? (grade.parts[k] ? 'border-good ring-2 ring-good/30' : 'border-bad ring-2 ring-bad/25') : 'border-line');
  if (q.type === 'cloze') {
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {q.inputs.map((i, k) => (
          <label key={i.id} className="flex flex-col gap-1">
            <span className="text-sm text-muted">{i.label}{i.kind !== 'choice' && <span className="ml-1 text-xs">({i.decimals} dec.)</span>}</span>
            {i.kind === 'choice'
              ? <select disabled={disabled} value={a[i.id] ?? ''} onChange={(e) => onChange(i.id, e.target.value)} className={`rounded-xl border bg-surface px-3 py-2 ${ring(k)}`}><option value="">— choose —</option>{i.options.map((o, j) => <option key={j} value={j}>{o}</option>)}</select>
              : <input disabled={disabled} inputMode="decimal" value={a[i.id] ?? ''} onChange={(e) => onChange(i.id, e.target.value)} className={`rounded-xl border bg-surface px-3 py-2 font-mono ${ring(k)}`} />}
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'numeric') {
    return <input disabled={disabled} inputMode="decimal" value={a.v ?? ''} onChange={(e) => onChange('v', e.target.value)} placeholder={`Answer (${q.decimals} dec.)`} className={`mt-4 w-56 rounded-xl border bg-surface px-3 py-2 font-mono ${ring(0)}`} />;
  }
  if (q.type === 'single' || q.type === 'truefalse') {
    const opts = q.type === 'single' ? q.options : ['True', 'False'];
    const vals = q.type === 'single' ? opts.map((_, j) => String(j)) : ['true', 'false'];
    return (
      <div className="mt-4 space-y-2">
        {opts.map((o, j) => (
          <label key={j} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 ${a.v === vals[j] ? 'border-accent bg-accent-soft' : 'border-line'} ${grade && a.v === vals[j] ? ring(0) : ''}`}>
            <input type="radio" disabled={disabled} checked={a.v === vals[j]} onChange={() => onChange('v', vals[j])} />
            <Rich text={o} />
          </label>
        ))}
      </div>
    );
  }
  // gaps: render the sentence with drop-downs at {k}
  const pieces = q.prompt.split(/\{(\d+)\}/);
  return (
    <div className="mt-4 leading-9">
      {pieces.map((p, k) => (k % 2 === 0 ? <span key={k}>{p}</span> : (
        <select key={k} disabled={disabled} value={a[`g${p}`] ?? ''} onChange={(e) => onChange(`g${p}`, e.target.value)} className={`mx-1 rounded-lg border bg-surface px-2 py-1 ${ring(Number(p))}`}>
          <option value="">…</option>
          {q.gaps[Number(p)].options.map((o, j) => <option key={j} value={j}>{o}</option>)}
        </select>
      )))}
    </div>
  );
}

function QuestionBody({ q, index }: { q: MockQuestion; index: number }) {
  return (
    <>
      <div className="mb-2 flex items-center gap-2 text-sm text-muted">
        <span className="font-semibold text-ink">Question {index + 1}</span>
        <span>· {(q.points ?? 1).toFixed(1)} pts</span>
        <Pill>{topicLabel(q.topic)}</Pill>
      </div>
      {q.type !== 'gaps' && <Rich text={q.type === 'truefalse' ? `**True or false?** ${q.prompt}` : q.prompt} />}
      {q.type === 'gaps' && <p className="text-sm text-muted">Select the right option for each gap.</p>}
      {'output' in q && q.output && <OutputTable output={q.output} />}
    </>
  );
}

function Runner({ exam, last6, examKey, onFinish, onAbort }: {
  exam: MockExam; last6: boolean; examKey: string;
  onFinish: (r: { exam: MockExam; last6: boolean; answers: Record<string, Answers>; grades: QuestionGrade[]; attempt: MockAttempt }) => void; onAbort: () => void;
}) {
  const s = useStore();
  const qs = useMemo(() => (last6 ? exam.questions.slice(-6) : exam.questions), [exam, last6]);
  const totalSec = Math.round(s.settings.mockDurationMin * 60 * (last6 ? qs.reduce((a, q) => a + (q.points ?? 1), 0) / exam.questions.reduce((a, q) => a + (q.points ?? 1), 0) : 1));
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answers>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [panel, setPanel] = useState<'none' | 'formulas' | 'tables'>('none');
  const [confirm, setConfirm] = useState(false);
  const left = totalSec - (now - started) / 1000;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { clearInterval(t); window.removeEventListener('beforeunload', warn); };
  }, []);

  const submit = () => {
    const grades = qs.map((q) => gradeQuestion(q, answers[q.id], s.settings.strictDecimals));
    const earned = grades.reduce((a, g) => a + g.earned, 0), max = grades.reduce((a, g) => a + g.max, 0);
    const perTopic: Partial<Record<TopicId, [number, number]>> = {};
    qs.forEach((q, i) => {
      const t = perTopic[q.topic] ?? [0, 0];
      perTopic[q.topic] = [t[0] + grades[i].earned / grades[i].max, t[1] + 1];
    });
    const wrong = qs.filter((_, i) => grades[i].earned < grades[i].max - 1e-9);
    const attempt: MockAttempt = {
      id: `${examKey}-${Date.now()}`, mockId: exam.id === 0 ? 'gen' : exam.id, title: exam.title, date: todayKey(), finishedAt: new Date().toISOString(),
      grade: toGrade(earned, max), points: Math.round(earned * 100) / 100, max, durationSec: Math.round((Date.now() - started) / 1000), last6Only: last6, perTopic, wrong: wrong.map((q) => q.id),
    };
    const mistakes = wrong.map((q) => {
      const i = qs.indexOf(q);
      return {
        id: `${examKey}:${q.id}`, topic: q.topic, source: exam.title,
        front: `**${exam.title} · Q${exam.questions.indexOf(q) + 1}** — ${q.type === 'truefalse' ? 'True or false? ' : ''}${q.prompt.length > 600 ? q.prompt.slice(0, 600) + '…' : q.prompt}`,
        back: `${grades[i].correct.map((c) => `**${c}**`).join(' · ')}\n\n${q.solution.join('\n\n')}`,
      };
    });
    useStore.getState().finishMock(attempt, mistakes);
    onFinish({ exam, last6, answers, grades, attempt });
  };

  useEffect(() => { if (left <= 0) submit(); /* auto-submit when time is up */ }, [left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = qs[cur];
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [q.id]: { ...(a[q.id] ?? {}), [k]: v } }));
  const answered = qs.filter((x) => isAnswered(x, answers[x.id])).length;

  return (
    <div className={panel !== 'none' ? 'lg:grid lg:grid-cols-[1fr_440px] lg:gap-4' : ''}>
      <div>
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
          <div className="font-semibold">{exam.title}{last6 && ' · last 6'}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2 py-1 font-mono text-sm ${left < 300 ? 'bg-bad-soft text-bad' : 'bg-surface2'}`}>⏱ {fmtTime(left)}</span>
            <Button size="sm" variant={panel === 'formulas' ? 'primary' : 'ghost'} onClick={() => setPanel(panel === 'formulas' ? 'none' : 'formulas')}>∑ Formulas</Button>
            <Button size="sm" variant={panel === 'tables' ? 'primary' : 'ghost'} onClick={() => setPanel(panel === 'tables' ? 'none' : 'tables')}>📊 Tables</Button>
            <Button size="sm" variant="good" onClick={() => setConfirm(true)}>Submit</Button>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {qs.map((x, i) => (
            <button key={x.id} onClick={() => setCur(i)}
              className={`relative h-9 w-9 rounded-lg text-sm font-semibold ${i === cur ? 'bg-accent text-accent-ink' : isAnswered(x, answers[x.id]) ? 'bg-accent-soft text-accent' : 'bg-surface2 text-muted'}`}>
              {(last6 ? exam.questions.length - 6 : 0) + i + 1}
              {flags[x.id] && <span className="absolute -right-1 -top-1 text-xs">🚩</span>}
            </button>
          ))}
          <span className="ml-2 self-center text-sm text-muted">{answered}/{qs.length} answered</span>
        </div>
        <Card className="p-5">
          <QuestionBody q={q} index={(last6 ? exam.questions.length - 6 : 0) + cur} />
          <QuestionInputs q={q} a={answers[q.id] ?? {}} onChange={set} />
          {q.type === 'gaps' && <div className="mt-1 text-xs text-muted">Sentence: {q.prompt.replace(/\{\d+\}/g, '___')}</div>}
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}>{flags[q.id] ? '🚩 Unflag' : '🏳️ Flag for review'}</Button>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}>← Previous</Button>
              {cur < qs.length - 1 ? <Button onClick={() => setCur(cur + 1)}>Next →</Button> : <Button variant="good" onClick={() => setConfirm(true)}>Finish</Button>}
            </div>
          </div>
        </Card>
        <div className="mt-3 text-right"><button className="text-sm text-muted underline" onClick={() => { if (window.confirm('Abort this attempt? Nothing will be saved.')) onAbort(); }}>Abort attempt</button></div>
        {confirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirm(false)}>
            <Card className="max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
              <div className="text-lg font-semibold">Submit the exam?</div>
              <p className="mt-1 text-muted">{answered}/{qs.length} answered{Object.values(flags).some(Boolean) ? ` · ${Object.values(flags).filter(Boolean).length} flagged` : ''}.</p>
              <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirm(false)}>Keep working</Button><Button variant="good" onClick={submit}>Submit</Button></div>
            </Card>
          </div>
        )}
      </div>
      {panel !== 'none' && (
        <aside className="mt-4 lg:sticky lg:top-4 lg:mt-0 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between font-semibold">{panel === 'formulas' ? '∑ Formula sheet' : '📊 Course tables'}<button onClick={() => setPanel('none')} className="text-muted">✕</button></div>
            {panel === 'formulas' ? <CourseFormulaSheet compact /> : <TableBrowser maxHeight={460} />}
          </Card>
        </aside>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- results

function Results({ exam, last6, answers, grades, attempt, onBack }: { exam: MockExam; last6: boolean; answers: Record<string, Answers>; grades: QuestionGrade[]; attempt: MockAttempt; onBack: () => void }) {
  const qs = last6 ? exam.questions.slice(-6) : exam.questions;
  const offset = last6 ? exam.questions.length - 6 : 0;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const passed = attempt.grade >= PASS;
  const topics = Object.entries(attempt.perTopic).map(([t, v]) => ({ t: t as TopicId, share: v![0] / v![1] })).sort((a, b) => a.share - b.share);
  return (
    <div>
      <PageHeader title={`${exam.title}${last6 ? ' · last 6' : ''} — results`} subtitle={`${Math.round(attempt.durationSec / 60)} min · ${attempt.points.toFixed(2)} / ${attempt.max.toFixed(1)} points`} right={<Button variant="ghost" onClick={onBack}>Back to mocks</Button>} />
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Card className={`p-5 text-center ${passed ? 'border-good/50' : 'border-bad/40'}`}>
          <div className="text-5xl">{passed ? (attempt.grade >= 14 ? '🏆' : '🎉') : '💪'}</div>
          <div className={`mt-2 text-5xl font-bold ${passed ? 'text-good' : 'text-bad'}`}>{attempt.grade.toFixed(1)}</div>
          <div className="text-muted">out of 20 · pass 7.5</div>
          <p className="mt-3 text-sm">{passed ? 'Passed! Now look at the red questions — every point counts.' : 'Not yet — the mistakes are now in your mistakes deck and steer tomorrow’s quests.'}</p>
          <div className="mt-3 flex flex-col gap-2">
            {attempt.wrong.length > 0 && <Button variant="soft" onClick={() => navigate('/cards?deck=mistakes')}>Review {attempt.wrong.length} mistakes</Button>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-2 font-semibold">By topic</div>
          <div className="space-y-2">
            {topics.map(({ t, share }) => (
              <div key={t} className="flex items-center gap-3 text-sm">
                <span className="w-48 truncate">{topicLabel(t)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface2"><span className="block h-full rounded-full" style={{ width: `${share * 100}%`, background: share >= 0.75 ? 'var(--good)' : share >= 0.4 ? 'var(--warn)' : 'var(--bad)' }} /></span>
                <span className="w-10 text-right">{Math.round(share * 100)}%</span>
                {share < 0.75 && <a className="text-xs text-accent" href={`#/week/${topicWorld(t)}/exercises`}>train →</a>}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-5 space-y-3">
        {qs.map((q, i) => {
          const g = grades[i];
          const full = g.earned >= g.max - 1e-9;
          return (
            <Card key={q.id} className={`p-4 ${full ? '' : g.earned > 0 ? 'border-warn/50' : 'border-bad/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Q{offset + i + 1} · {topicLabel(q.topic)}</span>
                <span className="flex items-center gap-2"><Pill tone={full ? 'good' : g.earned > 0 ? 'warn' : 'bad'}>{g.earned.toFixed(2)} / {g.max.toFixed(1)}</Pill>
                  <Button size="sm" variant="ghost" onClick={() => setOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}>{open[q.id] ? 'Hide' : 'Show'} solution</Button></span>
              </div>
              {(open[q.id] || !full) && (
                <div className="mt-3">
                  <QuestionBody q={q} index={offset + i} />
                  <QuestionInputs q={q} a={answers[q.id] ?? {}} onChange={() => {}} disabled grade={g} />
                  <div className="mt-3 rounded-xl border border-line bg-surface2 p-3">
                    <div className="mb-1 text-sm font-semibold">Correct: {g.correct.join(' · ')}</div>
                    <ol className="space-y-1.5">{q.solution.map((s, k) => <li key={k} className="flex gap-2"><span className="text-xs text-muted">{k + 1}.</span><Rich text={s} className="flex-1" /></li>)}</ol>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
