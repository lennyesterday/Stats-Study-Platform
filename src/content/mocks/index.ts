// Mock exams. Official mocks can be dropped in as src/content/mocks/mockNN.json (see README / mock-template.example.json);
// every mock without a JSON file is generated deterministically from the verified exercise generators.
import { makeRng, type Rng } from '../../lib/rng';
import type { ExerciseDef, MockExam, MockQuestion } from '../types';
import { ALL_EXERCISES } from '../worlds';
import { EARLY, LATE } from './concepts';

export const DEFAULT_DURATION = 90; // official: 90 min + 10 min grace period

const files = import.meta.glob<{ default: MockExam }>('./*.json', { eager: true });
export const OFFICIAL: Record<number, MockExam> = Object.fromEntries(
  Object.entries(files)
    .map(([path, mod]) => [Number(/mock(\d\d)\.json$/.exec(path)?.[1]), mod.default] as const)
    .filter(([id]) => id > 0),
);

/** exam slots: [exercise ids to pick from]; the last six are the "late" questions (worlds 4–6) */
const SLOTS: string[][] = [
  ['w1-sample-var', 'w1-pop-sample', 'w1-mean-median'],
  ['w1-standardize', 'w1-z-tails', 'w1-z-above', 'w1-t-prob'],
  ['w2-clt-prob', 'w2-se'],
  ['w2-ci-t', 'w2-ci-z', 'w2-reverse'],
  ['w2-ci-prop', 'w2-sample-size', 'w2-width'],
  ['w3-t-two', 'w3-t-right', 'w3-t-left', 'w3-z-test'],
  ['w3-prop-test', 'w3-pvalue-z', 'w3-power', 'w3-p-bounds'],
  // ---- last 6 ----
  ['w4-fill', 'w4-complete', 'w4-decide'],
  ['w4-summ', 'w4-raw', 'w4-pbounds'],
  ['w5-rc', 'w5-22', 'w5-expected', 'w5-contrib'],
  ['w5-22', 'w5-pbounds', 'w5-condition', 'w5-dataset'],
  ['w6-raw', 'w6-summary', 'w6-predict', 'w6-anova'],
  ['w6-output', 'w6-ttest', 'w6-ci', 'w6-ft'],
];

const byId = (id: string) => ALL_EXERCISES.find((e) => e.id === id) as ExerciseDef;

function fromExercise(def: ExerciseDef, rng: Rng, qid: string): MockQuestion {
  const inst = def.generate(rng);
  return { id: qid, topic: def.topic, type: 'cloze', prompt: inst.prompt, inputs: inst.inputs, output: inst.output, solution: inst.solution, points: def.difficulty >= 3 ? 2 : 1.5 };
}

/** 16 questions: 3 concept + 7 computational (worlds 1–3), then the last 6 (worlds 4–6; Mock 10 style = 6 computational). */
export function generateExam(seed: number, opts: { id: number; title: string; official?: boolean; mock10Style?: boolean }): MockExam {
  const rng = makeRng(seed);
  const early = rng.shuffle(EARLY).slice(0, 3).map((q) => ({ ...q, points: 1 }));
  const late = rng.shuffle(LATE).slice(0, 1).map((q) => ({ ...q, points: 1 }));
  const comp = SLOTS.map((ids, i) => fromExercise(byId(rng.pick(ids)), rng, `q${i + 1}`));
  const lateComp = comp.slice(7);
  const last6 = opts.mock10Style ? lateComp.slice(0, 6) : [late[0], ...rng.shuffle(lateComp).slice(0, 5)];
  const questions = [...early, ...comp.slice(0, 7), ...last6];
  return {
    id: opts.id,
    title: opts.title,
    official: !!opts.official,
    generated: true,
    note: 'Generated equivalent in Moodle format (numbers verified by the stats engine). Replace with the official mock by adding src/content/mocks/' + `mock${String(opts.id).padStart(2, '0')}.json.`,
    durationMin: DEFAULT_DURATION,
    questions,
  };
}

export function getMock(id: number): MockExam {
  if (OFFICIAL[id]) return { ...OFFICIAL[id], id, generated: false, durationMin: OFFICIAL[id].durationMin ?? DEFAULT_DURATION };
  return id === 10
    ? generateExam(10_000_10, { id: 10, title: 'Mock 10 — Official Mock: Final Boss', official: true, mock10Style: true })
    : generateExam(1000 + id * 7717, { id, title: `Mock ${id}` });
}

export const MOCK_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** maximum points of one question */
export const questionPoints = (q: MockQuestion) => q.points ?? 1;

/** number of inputs that can be scored (for partial credit) */
export const questionParts = (q: MockQuestion) => (q.type === 'cloze' ? q.inputs.length : q.type === 'gaps' ? q.gaps.length : 1);

export const isLast6 = (exam: MockExam, index: number) => index >= exam.questions.length - 6;

