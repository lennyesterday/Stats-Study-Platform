import { useEffect, useMemo, useState } from 'react';
import { checkNumber, type CheckResult } from '../lib/check';
import { makeRng, randomSeed } from '../lib/rng';
import { useStore } from '../store';
import type { ExerciseDef, ExerciseInput, ExerciseInstance } from '../content/types';
import { Rich } from './Rich';
import { Button, Card, OutputTable, Pill } from './ui';

const REASON: Record<string, string> = {
  empty: 'missing', format: 'not a number', decimals: 'right value, wrong number of decimals', value: 'incorrect',
};

export function checkInput(inp: ExerciseInput, raw: string, strict: boolean): CheckResult {
  if (inp.kind === 'choice') return raw === '' ? { ok: false, reason: 'empty' } : { ok: Number(raw) === inp.answer, reason: 'value' };
  return checkNumber(raw, inp.answer, inp.decimals, inp.tol, strict);
}

export const answerText = (inp: ExerciseInput) => (inp.kind === 'choice' ? inp.options[inp.answer] : inp.answer.toFixed(inp.decimals));

export function InputField({ inp, value, onChange, result, disabled }: { inp: ExerciseInput; value: string; onChange: (v: string) => void; result?: CheckResult; disabled?: boolean }) {
  const ring = result ? (result.ok ? 'border-good ring-2 ring-good/30' : 'border-bad ring-2 ring-bad/25') : 'border-line';
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-muted">{inp.label}{inp.kind !== 'choice' && <span className="ml-1 text-xs">({inp.decimals} dec.)</span>}</span>
      {inp.kind === 'choice' ? (
        <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`rounded-xl border bg-surface px-3 py-2 ${ring}`}>
          <option value="">— choose —</option>
          {inp.options.map((o, i) => <option key={i} value={i}>{o}</option>)}
        </select>
      ) : (
        <input inputMode="decimal" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder="Answer"
          className={`w-full rounded-xl border bg-surface px-3 py-2 font-mono ${ring}`} />
      )}
      {result && !result.ok && <span className="text-xs text-bad">{REASON[result.reason ?? 'value']}</span>}
    </label>
  );
}

/** Renders one generated exercise: inputs, tolerance check, tiered hints, full solution, new numbers. */
export function ExerciseRunner({ def, onDone, compact = false }: { def: ExerciseDef; onDone?: (correct: boolean) => void; compact?: boolean }) {
  const strict = useStore((s) => s.settings.strictDecimals);
  const record = useStore((s) => s.recordExercise);
  const [seed, setSeed] = useState(() => randomSeed());
  const inst: ExerciseInstance = useMemo(() => def.generate(makeRng(seed)), [def, seed]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, CheckResult> | null>(null);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => { setVals({}); setResults(null); setTries(0); setHints(0); setShowSol(false); setSolved(false); }, [seed, def]);

  const check = () => {
    const r = Object.fromEntries(inst.inputs.map((i) => [i.id, checkInput(i, vals[i.id] ?? '', strict)]));
    setResults(r);
    const ok = Object.values(r).every((x) => x.ok);
    const first = tries === 0 && hints === 0;
    setTries((t) => t + 1);
    if (ok && !solved) {
      setSolved(true);
      record(def.id, def.topic, def.difficulty, true, first, def.decision);
      onDone?.(true);
    } else if (!ok && tries === 0) {
      record(def.id, def.topic, def.difficulty, false, false, def.decision);
    }
  };

  const reveal = () => {
    setShowSol(true);
    if (!solved && tries === 0) record(def.id, def.topic, def.difficulty, false, false, def.decision);
    onDone?.(false);
  };

  return (
    <Card className={compact ? 'p-4' : 'p-5'}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{def.title}</h3>
          <Pill tone={def.difficulty === 1 ? 'good' : def.difficulty === 2 ? 'warn' : 'bad'}>{'★'.repeat(def.difficulty)}</Pill>
          {solved && <Pill tone="good">✓ solved</Pill>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSeed(randomSeed())} title="Generate new numbers">🎲 New numbers</Button>
      </div>
      <Rich text={inst.prompt} />
      {inst.output && <OutputTable output={inst.output} />}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {inst.inputs.map((i) => (
          <InputField key={i.id} inp={i} value={vals[i.id] ?? ''} result={results?.[i.id]} disabled={solved}
            onChange={(v) => { setVals((s) => ({ ...s, [i.id]: v })); setResults(null); }} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={check} disabled={solved}>Check</Button>
        {hints < inst.hints.length && !solved && <Button variant="soft" onClick={() => setHints((h) => h + 1)}>💡 Hint {hints + 1}/{inst.hints.length}</Button>}
        <Button variant="ghost" onClick={reveal}>{showSol ? 'Solution shown' : 'Show full solution'}</Button>
        {solved && <Button variant="good" onClick={() => setSeed(randomSeed())}>Next one →</Button>}
      </div>
      {strict && <p className="mt-2 text-xs text-muted">Moodle-strict mode: the number of decimals must match exactly.</p>}
      {hints > 0 && (
        <div className="mt-4 space-y-2">
          {inst.hints.slice(0, hints).map((h, i) => <div key={i} className="rounded-xl bg-warn-soft px-3 py-2 text-sm"><Rich text={`💡 ${h}`} /></div>)}
        </div>
      )}
      {showSol && (
        <div className="mt-4 rounded-xl border border-line bg-surface2 p-4">
          <div className="mb-2 text-sm font-semibold">Solution</div>
          <ol className="space-y-2">
            {inst.solution.map((s, i) => <li key={i} className="flex gap-2"><span className="mt-0.5 text-xs text-muted">{i + 1}.</span><Rich text={s} className="flex-1" /></li>)}
          </ol>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {inst.inputs.map((i) => <Pill key={i.id} tone="accent">{i.label}: {answerText(i)}</Pill>)}
          </div>
        </div>
      )}
    </Card>
  );
}
