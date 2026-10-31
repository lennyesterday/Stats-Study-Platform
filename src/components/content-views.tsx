import { useMemo, useState } from 'react';
import { checkInput, InputField } from './ExerciseRunner';
import { Rich } from './Rich';
import { Button, Callout, Card, OutputTable, Pill } from './ui';
import type { BossDef, InterpretationTask, WorkedExample } from '../content/types';
import type { CheckResult } from '../lib/check';
import { makeRng, randomSeed } from '../lib/rng';
import { useStore } from '../store';

export function ExampleView({ ex }: { ex: WorkedExample }) {
  const done = useStore((s) => !!s.examplesDone[ex.id]);
  const mark = useStore((s) => s.markExample);
  const [shown, setShown] = useState(done ? ex.steps.length : 0);
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-lg font-semibold">{ex.title}</h3>{done && <Pill tone="good">✓ done</Pill>}</div>
      <Rich text={ex.context} />
      {ex.output && <OutputTable output={ex.output} />}
      <ol className="mt-4 space-y-3">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface2 px-4 py-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Step {i + 1} · {s.label}</div>
            <Rich text={s.body} />
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        {shown < ex.steps.length ? (
          <>
            <Button onClick={() => { setShown((n) => n + 1); if (shown + 1 === ex.steps.length) mark(ex.id); }}>Reveal step {shown + 1}/{ex.steps.length}</Button>
            <Button variant="ghost" onClick={() => { setShown(ex.steps.length); mark(ex.id); }}>Reveal all</Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setShown(0)}>Hide steps & try again</Button>
        )}
      </div>
    </Card>
  );
}

export function InterpretationView({ task }: { task: InterpretationTask }) {
  const done = useStore((s) => !!s.interpDone[task.id]);
  const mark = useStore((s) => s.markInterpretation);
  const [text, setText] = useState('');
  const [compare, setCompare] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(task.checklist.map(() => false));
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-lg font-semibold">✍️ {task.title}</h3>{done && <Pill tone="good">✓ done</Pill>}</div>
      <Rich text={task.prompt} />
      {task.output && <OutputTable output={task.output} />}
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Write your conclusion in full English sentences…"
        className="mt-3 w-full rounded-xl border border-line bg-surface p-3" />
      {!compare ? (
        <Button className="mt-2" disabled={text.trim().length < 15} onClick={() => setCompare(true)}>Compare with model answer</Button>
      ) : (
        <div className="mt-3 space-y-3">
          <Callout tone="tip" title="Model formulation"><Rich text={task.model} /></Callout>
          <div>
            <div className="mb-1 text-sm font-semibold">Self-check — does your answer…</div>
            {task.checklist.map((c, i) => (
              <label key={i} className="flex items-start gap-2 py-0.5 text-[15px]">
                <input type="checkbox" className="mt-1" checked={checks[i]} onChange={() => setChecks((x) => x.map((v, j) => (j === i ? !v : v)))} />
                <Rich text={c} />
              </label>
            ))}
          </div>
          <Button variant="good" onClick={() => mark(task.id)}>Done ({checks.filter(Boolean).length}/{checks.length} ✓) {done ? '' : '+15 XP'}</Button>
        </div>
      )}
    </Card>
  );
}

export function BossFight({ world, boss, color }: { world: number; boss: BossDef; color: string }) {
  const record = useStore((s) => s.recordBoss);
  const result = useStore((s) => s.bosses[world]);
  const strict = useStore((s) => s.settings.strictDecimals);
  const [seed, setSeed] = useState<number | null>(null);
  const inst = useMemo(() => (seed === null ? null : boss.generate(makeRng(seed))), [boss, seed]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [res, setRes] = useState<Record<string, CheckResult> | null>(null);
  const inputs = inst ? inst.parts.flatMap((p) => p.inputs.map((i) => ({ key: `${p.label}.${i.id}`, inp: i }))) : [];
  const submit = () => {
    const r = Object.fromEntries(inputs.map(({ key, inp }) => [key, checkInput(inp, vals[key] ?? '', strict)]));
    setRes(r);
    const score = Object.values(r).filter((x) => x.ok).length / inputs.length;
    record(world, Math.round(score * 100), score >= 0.7);
  };
  if (!inst) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${color}, #111827)` }}>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Boss fight · Week {world}</div>
          <h2 className="mt-1 text-3xl font-bold">⚔️ {boss.title}</h2>
          <p className="mt-2 max-w-xl opacity-90">{boss.story}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="text-sm text-muted">Multi-part exam problem · no hints · ≥ 70 % correct to master the world. {result && <>Best: <b>{result.best} %</b> · attempts: {result.attempts} {result.passed && '· 👑 mastered'}</>}</div>
          <Button onClick={() => { setSeed(randomSeed()); setVals({}); setRes(null); }}>Start the fight</Button>
        </div>
      </Card>
    );
  }
  const score = res ? Object.values(res).filter((x) => x.ok).length : 0;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-semibold">⚔️ {boss.title}</h2>{res && <Pill tone={score / inputs.length >= 0.7 ? 'good' : 'bad'}>{score}/{inputs.length} correct</Pill>}</div>
      <Rich text={inst.intro} />
      {inst.output && <OutputTable output={inst.output} />}
      <div className="mt-4 space-y-5">
        {inst.parts.map((p) => (
          <div key={p.label} className="rounded-xl border border-line p-4">
            <div className="flex gap-2"><span className="font-display font-bold text-accent">({p.label})</span><Rich text={p.prompt} className="flex-1" /></div>
            {p.output && <OutputTable output={p.output} />}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {p.inputs.map((i) => {
                const key = `${p.label}.${i.id}`;
                return <InputField key={key} inp={i} value={vals[key] ?? ''} result={res?.[key]} disabled={!!res} onChange={(v) => setVals((s) => ({ ...s, [key]: v }))} />;
              })}
            </div>
            {res && <div className="mt-3 rounded-lg bg-surface2 p-3 text-[15px]">{p.solution.map((s, i) => <Rich key={i} text={s} className="mb-1" />)}</div>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {!res ? <Button onClick={submit}>Submit all answers</Button> : <Button onClick={() => { setSeed(randomSeed()); setVals({}); setRes(null); }}>Fight again (new numbers)</Button>}
        {res && <Button variant="ghost" onClick={() => setSeed(null)}>Back</Button>}
      </div>
    </Card>
  );
}
