// The study plan from 28 Oct to the exam on 9 Dec 2026. Edit freely: each entry is one day.
// Task kinds map to quests and XP; `to` is the in-app route the task opens.
import type { WorldId } from './types';

export type TaskKind = 'theory' | 'examples' | 'exercises' | 'cards' | 'tables' | 'sprint' | 'boss' | 'mock' | 'review' | 'viz' | 'formulas' | 'rest' | 'exam' | 'custom';

export interface TaskTemplate { kind: TaskKind; title: string; minutes: number; to: string; world?: WorldId; target?: number }

export interface Phase { id: string; from: string; to: string; title: string; focus: string }

export const PHASES: Phase[] = [
  { id: 'w1', from: '2026-10-28', to: '2026-11-01', title: 'Week 1', focus: 'Foundations, descriptive statistics, daily table training' },
  { id: 'w23', from: '2026-11-02', to: '2026-11-08', title: 'Weeks 2 + 3', focus: 'CLT, confidence intervals (μ, π), hypothesis tests' },
  { id: 'w4', from: '2026-11-09', to: '2026-11-15', title: 'Week 4', focus: 'ANOVA + spaced review of Weeks 1–3' },
  { id: 'w56', from: '2026-11-16', to: '2026-11-22', title: 'Weeks 5 + 6', focus: 'Chi-square and regression, all boss fights' },
  { id: 'm1', from: '2026-11-23', to: '2026-11-29', title: 'Mock phase I', focus: 'Mocks 1–5 (focus on the last 6 questions), error analysis, weakness training' },
  { id: 'm2', from: '2026-11-30', to: '2026-12-06', title: 'Mock phase II', focus: 'Mocks 6–9, mixed exam problems, finalise & print notes + formula sheet' },
  { id: 'dress', from: '2026-12-07', to: '2026-12-07', title: 'Dress rehearsal', focus: 'Mock 10 under exam conditions (timer, printed notes + tables + physical calculator only)' },
  { id: 'polish', from: '2026-12-08', to: '2026-12-08', title: 'Final polish', focus: 'Only Mock 10 errors + due flashcards. Sleep early.' },
  { id: 'exam', from: '2026-12-09', to: '2026-12-09', title: 'Exam day', focus: '15-min warm-up, then the exam at 14:30' },
];

const th = (w: WorldId, part: string, min = 40): TaskTemplate => ({ kind: 'theory', title: `Week ${w} lesson · ${part}`, minutes: min, to: `/week/${w}/learn`, world: w });
const ex = (w: WorldId, part: string, min = 35): TaskTemplate => ({ kind: 'examples', title: `Week ${w} worked examples: ${part}`, minutes: min, to: `/week/${w}/examples`, world: w });
const pr = (w: WorldId, n: number, min = 45): TaskTemplate => ({ kind: 'exercises', title: `Solve ${n} Week ${w} exercises`, minutes: min, to: `/week/${w}/exercises`, world: w, target: n });
const boss = (w: WorldId): TaskTemplate => ({ kind: 'boss', title: `Boss fight: Week ${w}`, minutes: 30, to: `/week/${w}/boss`, world: w });
const mock = (n: number, last6 = true): TaskTemplate => ({ kind: 'mock', title: n === 10 ? 'Mock 10 — Official Mock under exam conditions' : `Mock ${n}${last6 ? ' (focus: last 6 questions)' : ''}`, minutes: n === 10 ? 120 : 75, to: `/mocks/${n}` });
const viz = (title: string, to: string): TaskTemplate => ({ kind: 'viz', title, minutes: 15, to });
const tables = (which: string): TaskTemplate => ({ kind: 'tables', title: `Table trainer: ${which}`, minutes: 15, to: '/tables' });
const review = (title: string, to = '/practice', min = 40): TaskTemplate => ({ kind: 'review', title, minutes: min, to });

/** Day-specific tasks. The daily routine (due flashcards + 1 table sprint) is added automatically. */
export const DAY_TASKS: Record<string, TaskTemplate[]> = {
  '2026-10-28': [th(1, 'Parts 1–3 · data & variables, center/spread/shape, random variables'), tables('Standard Normal (Z)')],
  '2026-10-29': [th(1, 'Parts 4–7 · normal & z, sampling distributions, t, χ² and F'), ex(1, 'examples 1–2'), tables('t-Student')],
  '2026-10-30': [ex(1, 'examples 3–5'), pr(1, 6)],
  '2026-10-31': [pr(1, 6), tables('Chi-square and F-Snedecor')],
  '2026-11-01': [boss(1), review('Re-read the Week 1 "Watch out" rows', '/week/1/learn', 20)],
  '2026-11-02': [th(2, 'Part 1 · samples and sampling variability (CLT)'), viz('CLT simulator — try a skewed population', '/lab/clt')],
  '2026-11-03': [th(2, 'Parts 2–3 · confidence intervals for a mean and a proportion'), ex(2, 'all'), viz('CI simulator — 100 intervals', '/lab/ci')],
  '2026-11-04': [pr(2, 8), boss(2)],
  '2026-11-05': [th(3, 'Part 1 · the logic of hypothesis testing'), ex(3, 'examples 1–3')],
  '2026-11-06': [th(3, 'Parts 2–3 · testing a mean, testing a proportion'), ex(3, 'examples 4–5'), viz('Hypothesis test & power curve', '/lab/test')],
  '2026-11-07': [pr(3, 8)],
  '2026-11-08': [boss(3), review('Mixed review: Weeks 1–2 exercises', '/practice', 30)],
  '2026-11-09': [th(4, 'Parts 1–2 · the idea of ANOVA, the ANOVA table'), viz('ANOVA playground', '/lab/anova')],
  '2026-11-10': [ex(4, 'all'), pr(4, 4)],
  '2026-11-11': [pr(4, 6)],
  '2026-11-12': [boss(4), review('Interpretation sentences: CI, test, ANOVA', '/methods', 20)],
  '2026-11-13': [review('Spaced review: Weeks 1–3 mixed exercises')],
  '2026-11-14': [review('Spaced review: Weeks 2–3 + interpretation exercises'), review('Re-fight your weakest boss', '/weeks', 30)],
  '2026-11-15': [review('Light day: decision tree "Which method?"', '/methods', 20)],
  '2026-11-16': [th(5, 'Parts 1–2 · contingency tables, the χ² test'), ex(5, 'all'), viz('χ² heatmap', '/lab/chisq')],
  '2026-11-17': [pr(5, 8), boss(5)],
  '2026-11-18': [th(6, 'Part 1 · the regression line'), viz('Regression playground', '/lab/regression')],
  '2026-11-19': [th(6, 'Parts 2–3 · fit and significance, choosing the method'), ex(6, 'all')],
  '2026-11-20': [pr(6, 8)],
  '2026-11-21': [boss(6), review('Formula sheet: first full read-through', '/formulas', 20)],
  '2026-11-22': [review('Re-fight any boss not yet mastered', '/weeks', 45), review('Decision tree + method matrix', '/methods', 20)],
  '2026-11-23': [mock(1), review('Error analysis: Mock 1 mistakes deck', '/cards?deck=mistakes', 25)],
  '2026-11-24': [mock(2), review('Weakness training (lowest mastery topic)', '/progress', 30)],
  '2026-11-25': [mock(3), review('Error analysis: mistakes deck', '/cards?deck=mistakes', 25)],
  '2026-11-26': [mock(4), review('Weakness training (lowest mastery topic)', '/progress', 30)],
  '2026-11-27': [mock(5), review('Error analysis: mistakes deck', '/cards?deck=mistakes', 25)],
  '2026-11-28': [review('Weakness training: 2 weakest topics', '/progress', 60)],
  '2026-11-29': [{ kind: 'mock', title: 'Exam Generator: random practice exam', minutes: 75, to: '/mocks/generator' }, { kind: 'formulas', title: 'Formula sheet: draft your printed version', minutes: 30, to: '/formulas' }, { kind: 'rest', title: 'Set up Safe Exam Browser on your laptop + check your photo ID is on Moodle', minutes: 15, to: '/' }],
  '2026-11-30': [mock(6), review('Error analysis: mistakes deck', '/cards?deck=mistakes', 25)],
  '2026-12-01': [mock(7), review('Weakness training', '/progress', 30)],
  '2026-12-02': [review('Mixed exam problems (all weeks)', '/practice', 60), review('Interpretation exercises', '/practice', 20)],
  '2026-12-03': [mock(8), review('Error analysis: mistakes deck', '/cards?deck=mistakes', 25)],
  '2026-12-04': [mock(9), review('Weakness training', '/progress', 30)],
  '2026-12-05': [{ kind: 'formulas', title: 'Finalise and PRINT notes + formula sheet (paper only, no page limit)', minutes: 45, to: '/formulas' }, review('Re-fight all bosses below 100 %', '/weeks', 45)],
  '2026-12-06': [review('Mixed exam problems + weakest topics', '/practice', 60), { kind: 'mock', title: 'Exam Generator: one more random exam', minutes: 75, to: '/mocks/generator' }],
  '2026-12-07': [mock(10, false)],
  '2026-12-08': [review('Only Mock 10 mistakes + due flashcards', '/cards?deck=mistakes', 45), { kind: 'rest', title: 'Pack: laptop + charger, printed notes, tables, calculator. Sleep early', minutes: 5, to: '/' }],
  '2026-12-09': [
    { kind: 'sprint', title: 'Warm-up: 1 Table Sprint', minutes: 5, to: '/tables/sprint' },
    review('Warm-up: read the interpretation sentences', '/methods', 10),
    { kind: 'exam', title: '14:30 — Exam (Moodle, campus). You are ready.', minutes: 0, to: '/' },
  ],
};
