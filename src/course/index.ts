// Typed access to the Stats Study Lab engine (engine.ts). The weeks, parts and concepts there are
// the theoretical reference of the app; stats-quest's examples, cards, exercises and bosses sit beside them.
import type { TopicId, WorldId } from '../content/types';
import * as E from './engine';

export interface Concept {
  name: string;
  tag: string;
  idea?: string;
  formula?: string;
  steps?: string;
  example?: string;
  watch?: string;
  widgets?: string[];
  /** formula-sheet rows: [name, html, excel] */
  keys: [string, string, string][];
}

export interface PracticeQ {
  q: string;
  ans: number | string;
  dp?: number;
  alts?: number[];
  choices?: string[];
  steps: string;
  excel?: string;
  table?: string;
  viz?: Record<string, unknown>;
}

export interface PracticeType { key: string; label: string; mode: 'general' | 'data'; gen: () => PracticeQ }

export interface Part {
  title: string;
  intro: string;
  buildsOn: string;
  bridge?: string;
  table?: string;
  summary: string[];
  concepts: Concept[];
  practice: PracticeType[];
}

export interface Week { id: string; num: WorldId; title: string; blurb: string; parts: Part[] }
export interface CourseTable { id: string; name: string; pages: string[]; how: string }

export const WEEKS = E.WEEKS as Week[];
export const TABLES = E.TABLES as CourseTable[];
export const WIDGETS = E.WIDGETS as Record<string, (el: HTMLElement) => void>;
export const makeCurve = E.makeCurve as (host: HTMLElement, getOpts: () => Record<string, unknown>) => void;
export const { M, RAW, COLS, LETTERS, NUMERIC, col, f, g4, xl, esc, pick } = E as unknown as {
  M: { mean: (v: number[]) => number; median: (v: number[]) => number; varS: (v: number[]) => number; sdS: (v: number[]) => number };
  RAW: (string | number)[][];
  COLS: string[];
  LETTERS: string;
  NUMERIC: { i: number; name: string }[];
  col: (i: number) => number[];
  f: (x: number, dp: number) => string;
  g4: (x: number) => string;
  xl: (s: string) => string;
  esc: (s: string) => string;
  pick: <T>(a: T[]) => T;
};

export const getWeek = (n: number) => WEEKS.find((w) => w.num === n);

/** id used for "part read" progress (store.theoryRead) */
export const partId = (week: number, pi: number) => `w${week}-p${pi + 1}`;
export const conceptAnchor = (pi: number, ci: number) => `c-${pi + 1}-${ci + 1}`;

/** which stats-quest topic each lesson part belongs to (drives mastery per topic) */
const PART_TOPICS: Record<number, TopicId[]> = {
  1: ['variables', 'descriptives', 'distributions', 'distributions', 'sampling', 'tables', 'tables'],
  2: ['sampling', 'ci-mean', 'ci-prop'],
  3: ['errors', 'testing', 'test-prop'],
  4: ['anova', 'anova'],
  5: ['chisq', 'chisq'],
  6: ['regression', 'reg-inference', 'regression'],
};

export const partTopic = (week: number, pi: number): TopicId => PART_TOPICS[week]?.[pi] ?? PART_TOPICS[week][0];

/** lesson parts as theory entries for progress, badges and the dashboard */
export const theoryFor = (week: WorldId) => {
  const w = getWeek(week)!;
  return w.parts.map((p, pi) => ({ id: partId(week, pi), title: p.title, topic: partTopic(week, pi) }));
};

export const allPractice = (w: Week) => w.parts.flatMap((p, i) => p.practice.map((t) => ({ ...t, part: i })));
