// Shared content types. Text fields are "rich" strings: $inline math$, $$display math$$,
// **bold**, *italic*, blank-line paragraphs and "- " bullet lists (see components/Rich.tsx).
import type { Rng } from '../lib/rng';

export type WorldId = 1 | 2 | 3 | 4 | 5 | 6;

export type TopicId =
  | 'variables' | 'descriptives' | 'distributions' | 'tables'
  | 'sampling' | 'ci-mean' | 'ci-prop'
  | 'testing' | 'test-prop' | 'errors'
  | 'anova' | 'chisq' | 'regression' | 'reg-inference';

export interface Topic { id: TopicId; label: string; world: WorldId }

/** A lesson part of the week (theory lives in src/course, ported from Stats Study Lab). */
export interface TheoryRef { id: string; title: string; topic: TopicId }

export interface SoftwareOutput { title: string; rows: string[][] }

export interface WorkedExample {
  id: string;
  title: string;
  topic: TopicId;
  context: string;
  output?: SoftwareOutput;
  steps: { label: string; body: string }[];
}

export interface Flashcard { id: string; topic: TopicId; front: string; back: string }

export interface NumberInput { id: string; label: string; kind?: 'number'; answer: number; decimals: number; tol?: number }
export interface ChoiceInput { id: string; label: string; kind: 'choice'; options: string[]; answer: number }
export type ExerciseInput = NumberInput | ChoiceInput;

export interface ExerciseInstance {
  prompt: string;
  output?: SoftwareOutput;
  inputs: ExerciseInput[];
  hints: string[];
  solution: string[];
}

export interface ExerciseDef {
  id: string;
  title: string;
  topic: TopicId;
  difficulty: 1 | 2 | 3;
  /** test decision exercise — counts toward the "No Type I Errors" badge */
  decision?: boolean;
  generate: (rng: Rng) => ExerciseInstance;
}

export interface InterpretationTask {
  id: string;
  topic: TopicId;
  title: string;
  prompt: string;
  output?: SoftwareOutput;
  model: string;
  checklist: string[];
}

export interface BossPart extends ExerciseInstance { label: string }

export interface BossDef {
  title: string;
  story: string;
  generate: (rng: Rng) => { intro: string; output?: SoftwareOutput; parts: BossPart[] };
}

export interface World {
  id: WorldId;
  slug: string;
  title: string;
  subtitle: string;
  week: string;
  icon: string;
  color: string; // tailwind-free hex used for accents
  topics: TopicId[];
  outcomes: string[];
  /** lesson parts from src/course (one entry per part) */
  theory: TheoryRef[];
  examples: WorkedExample[];
  flashcards: Flashcard[];
  exercises: ExerciseDef[];
  interpretations: InterpretationTask[];
  boss: BossDef;
}

// ---------- mock exams ----------

export type MockQuestion = { points?: number } & (
  | { id: string; topic: TopicId; type: 'cloze'; prompt: string; inputs: ExerciseInput[]; output?: SoftwareOutput; solution: string[] }
  | { id: string; topic: TopicId; type: 'numeric'; prompt: string; answer: number; decimals: number; tol?: number; output?: SoftwareOutput; solution: string[] }
  | { id: string; topic: TopicId; type: 'single'; prompt: string; options: string[]; answer: number; output?: SoftwareOutput; solution: string[] }
  | { id: string; topic: TopicId; type: 'truefalse'; prompt: string; answer: boolean; solution: string[] }
  | { id: string; topic: TopicId; type: 'gaps'; prompt: string; gaps: { options: string[]; answer: number }[]; solution: string[] }
);

export interface MockExam {
  id: number;
  title: string;
  official: boolean;
  generated: boolean;
  note: string;
  durationMin: number;
  questions: MockQuestion[];
}
