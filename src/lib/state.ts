// Persisted app state shape (everything lives in localStorage + JSON export).
import type { TopicId } from '../content/types';
import type { PlanOverrides } from './plan';
import type { CardState } from './srs';

export interface AttemptRecord { attempts: number; correct: number; firstTry: number; lastCorrect?: string }

export interface MockAttempt {
  id: string;
  mockId: number | 'gen';
  title: string;
  date: string;
  finishedAt: string;
  grade: number; // 0–20
  points: number;
  max: number;
  durationSec: number;
  last6Only: boolean;
  perTopic: Partial<Record<TopicId, [number, number]>>;
  wrong: string[]; // question ids
}

export interface MistakeCard { id: string; topic: TopicId; front: string; back: string; created: string; source: string }

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  sound: boolean;
  unlockAll: boolean;
  minutesPerDay: number;
  restDays: number[];
  catchUpPerDay: number;
  mockDurationMin: number;
  strictDecimals: boolean;
  name: string;
}

export interface GameState {
  version: 1;
  createdAt: string;
  xp: number;
  dailyXp: Record<string, number>;
  day: Record<string, Record<string, number>>; // per-day counters for quests
  streak: { current: number; best: number; last: string | null; freezes: string[] };
  theoryRead: Record<string, string>;
  examplesDone: Record<string, string>;
  vizDone: Record<string, string>;
  interpDone: Record<string, string>;
  cards: Record<string, CardState>;
  mistakes: MistakeCard[];
  exercises: Record<string, AttemptRecord>;
  topicEx: Partial<Record<TopicId, [number, number]>>;
  topicMock: Partial<Record<TopicId, [number, number]>>;
  bosses: Record<number, { best: number; passed: boolean; date: string; attempts: number }>;
  mocks: MockAttempt[];
  tables: { correct: number; total: number };
  sprint: { best: number; runs: number; history: { date: string; score: number }[] };
  decisionRun: number;
  decisionBest: number;
  badges: Record<string, string>;
  questsClaimed: Record<string, string>;
  tasksDone: Record<string, string>;
  plan: PlanOverrides;
  flags: Record<string, boolean>;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sound: false,
  unlockAll: false,
  minutesPerDay: 120,
  restDays: [],
  catchUpPerDay: 2,
  mockDurationMin: 90,
  strictDecimals: false,
  name: '',
};

export const initialState = (): GameState => ({
  version: 1,
  createdAt: new Date().toISOString(),
  xp: 0,
  dailyXp: {},
  day: {},
  streak: { current: 0, best: 0, last: null, freezes: [] },
  theoryRead: {},
  examplesDone: {},
  vizDone: {},
  interpDone: {},
  cards: {},
  mistakes: [],
  exercises: {},
  topicEx: {},
  topicMock: {},
  bosses: {},
  mocks: [],
  tables: { correct: 0, total: 0 },
  sprint: { best: 0, runs: 0, history: [] },
  decisionRun: 0,
  decisionBest: 0,
  badges: {},
  questsClaimed: {},
  tasksDone: {},
  plan: { custom: {}, removed: [] },
  flags: {},
  settings: DEFAULT_SETTINGS,
});
