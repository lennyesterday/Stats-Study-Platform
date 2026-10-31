import { useCallback, useEffect, useRef, useState } from 'react';
import { CourseTable, DIST_LABEL, type Cell } from '../components/CourseTables';
import { DensityPlot } from '../components/DensityPlot';
import { Rich } from '../components/Rich';
import { Button, Card, PageHeader, Pill, Tabs } from '../components/ui';
import { F_TABLE } from '../content/tables';
import { makeRng, randomSeed } from '../lib/rng';
import { TASKS, type TableTask } from '../lib/tabletasks';
import type { Dist } from '../lib/tables';
import { navigate } from '../router';
import { useStore } from '../store';

type Mode = Dist | 'sprint';
const newTask = (d: Dist) => TASKS[d](makeRng(randomSeed()));
const SPRINT_SEC = 60;

export default function Tables({ mode }: { mode?: string }) {
  const current = (['z', 't', 'chi2', 'f', 'sprint'].includes(mode ?? '') ? mode : 'z') as Mode;
  const tables = useStore((s) => s.tables);
  const best = useStore((s) => s.sprint.best);
  return (
    <div>
      <PageHeader title="Table Trainer" subtitle="The four course tables in their exact layout — click the right cell" right={<div className="flex gap-2"><Pill tone="accent">accuracy {tables.total ? Math.round((tables.correct / tables.total) * 100) : 0}% · {tables.total} cells</Pill><Pill tone="xp">⚡ sprint best {best}</Pill></div>} />
      <div className="mb-4">
        <Tabs<Mode> value={current} onChange={(m) => navigate(`/tables/${m}`)} tabs={[
          { id: 'z', label: 'Z table' }, { id: 't', label: 't table' }, { id: 'chi2', label: 'χ² table' }, { id: 'f', label: 'F table' }, { id: 'sprint', label: '⚡ 60-s Sprint' },
        ]} />
      </div>
      {current === 'sprint' ? <Sprint /> : <Trainer key={current} dist={current} />}
    </div>
  );
}

function useTaskClick(task: TableTask, onResult: (ok: boolean) => void) {
  const [block, setBlock] = useState(task.dist === 'f' ? F_TABLE.ns.indexOf(30) : 0);
  const [marks, setMarks] = useState<Record<string, 'good' | 'bad'>>({});
  const [done, setDone] = useState<null | boolean>(null);
  useEffect(() => { setMarks({}); setDone(null); }, [task]);
  const click = (c: Cell) => {
    if (done !== null) return;
    const ok = (task.dist !== 'f' || block === task.block) && task.answerCells.some((a) => a.row === c.row && a.col === c.col);
    const m: Record<string, 'good' | 'bad'> = { [`${c.row}:${c.col}`]: ok ? 'good' : 'bad' };
    if (!ok && (task.dist !== 'f' || block === task.block)) task.answerCells.forEach((a) => (m[`${a.row}:${a.col}`] = 'good'));
    setMarks(m);
    setDone(ok);
    onResult(ok);
  };
  return { block, setBlock, marks, done, click };
}

function Trainer({ dist }: { dist: Dist }) {
  const record = useStore((s) => s.recordTable);
  const [task, setTask] = useState(() => newTask(dist));
  const [streak, setStreak] = useState(0);
  const { block, setBlock, marks, done, click } = useTaskClick(task, (ok) => { record(ok); setStreak((s) => (ok ? s + 1 : 0)); });
  const next = () => setTask(newTask(dist));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && done !== null) next(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="order-2 lg:order-1">
        <CourseTable dist={dist} marks={marks} onCell={click} block={block} onBlock={setBlock} maxHeight={560} />
      </div>
      <div className="order-1 space-y-3 lg:order-2">
        <Card className="p-4">
          <div className="mb-1 flex items-center justify-between text-sm text-muted"><span>{DIST_LABEL[dist]}</span>{streak > 1 && <Pill tone="good">🔥 {streak} in a row</Pill>}</div>
          <div className="text-lg"><Rich text={task.prompt} /></div>
          <div className="mt-3"><DensityPlot {...task.curve} /></div>
          {done !== null && (
            <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${done ? 'bg-good-soft' : 'bg-bad-soft'}`}>
              <div className="font-semibold">{done ? '✓ Correct' : '✗ Not quite'}</div>
              {!done && task.dist === 'f' && block !== task.block && <div>Wrong block: you need n = {F_TABLE.ns[task.block!]}.</div>}
              <Rich text={task.explain} />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button onClick={next} variant={done === null ? 'ghost' : 'primary'}>{done === null ? 'Skip' : 'Next (Enter)'}</Button>
          </div>
        </Card>
        <Card className="p-4 text-sm text-muted">
          <div className="mb-1 font-semibold text-ink">How the course tables work</div>
          {dist === 'z' && 'Rows: z to one decimal; columns: second decimal. Cells: P(Z < z). For negative z use symmetry: P(Z < −z) = 1 − P(Z < z).'}
          {dist === 't' && 'Rows: df (last row ∞ = z values); columns: P(T < t). Two-sided 95 % → column 0.975. Right tail α → column 1 − α.'}
          {dist === 'chi2' && 'Rows: df; columns: left-tail P(X < x). Critical value at α → column 1 − α (e.g. 0.950).'}
          {dist === 'f' && 'Blocks: n = denominator df; inside a block rows are P(F < f) and columns m = numerator df. ANOVA: m = k − 1, n = n − k.'}
        </Card>
      </div>
    </div>
  );
}

function Sprint() {
  const finish = useStore((s) => s.finishSprint);
  const best = useStore((s) => s.sprint.best);
  const [phase, setPhase] = useState<'ready' | 'run' | 'over'>('ready');
  const [end, setEnd] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [task, setTask] = useState(() => newTask('z'));
  const scoreRef = useRef(0);
  const pick = useCallback(() => setTask(newTask((['z', 't', 'chi2', 't', 'z'] as Dist[])[Math.floor(Math.random() * 5)])), []);
  const { block, setBlock, marks, click } = useTaskClick(task, (ok) => {
    if (ok) { scoreRef.current += 1; setScore(scoreRef.current); } else setEnd((e) => e - 3000);
    setTimeout(pick, ok ? 250 : 900);
  });
  useEffect(() => {
    if (phase !== 'run') return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [phase]);
  const left = Math.max(0, (end - now) / 1000);
  useEffect(() => {
    if (phase === 'run' && left <= 0) { setPhase('over'); finish(scoreRef.current); }
  }, [left, phase, finish]);

  if (phase !== 'run') {
    return (
      <Card className="mx-auto max-w-lg p-6 text-center">
        <div className="text-5xl">⚡</div>
        <h2 className="mt-2 text-2xl font-semibold">60-second Table Sprint</h2>
        {phase === 'over' && <p className="mt-2 text-lg">Score: <b>{score}</b> {score > 0 && score >= best && <Pill tone="xp">🏆 highscore!</Pill>}</p>}
        <p className="mt-2 text-muted">Click as many correct cells as you can in 60 seconds (Z, t and χ² tables). A wrong click costs 3 seconds. Highscore: {best}.</p>
        <Button className="mt-4" onClick={() => { scoreRef.current = 0; setScore(0); pick(); setEnd(Date.now() + SPRINT_SEC * 1000); setNow(Date.now()); setPhase('run'); }}>{phase === 'over' ? 'Again' : 'Start'}</Button>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="order-2 lg:order-1"><CourseTable dist={task.dist} marks={marks} onCell={click} block={block} onBlock={setBlock} maxHeight={560} /></div>
      <Card className="order-1 h-fit p-4 lg:order-2">
        <div className="flex items-center justify-between"><span className={`font-mono text-2xl font-bold ${left < 10 ? 'text-bad' : ''}`}>{left.toFixed(1)}s</span><span className="text-2xl font-bold text-xp">{score}</span></div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface2"><div className="h-full bg-accent" style={{ width: `${(left / SPRINT_SEC) * 100}%` }} /></div>
        <div className="mt-3 text-sm text-muted">{DIST_LABEL[task.dist]}</div>
        <div className="text-lg"><Rich text={task.prompt} /></div>
      </Card>
    </div>
  );
}
