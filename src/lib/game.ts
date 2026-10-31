// Gamification rules: XP table, level curve, streaks, badges, daily quests.
import { ALL_THEORY } from '../content/worlds';
import { addDays, daysBetween, weekStart } from './dates';
import type { PlanTask } from './plan';
import type { GameState } from './state';

export const XP = {
  theory: 15,
  example: 20,
  card: { 1: 1, 2: 2, 3: 3, 4: 3 } as Record<number, number>,
  exercise: { 1: 10, 2: 15, 3: 25 } as Record<number, number>,
  firstTryBonus: 5,
  interpretation: 15,
  tableCell: 3,
  sprintPerCorrect: 2,
  quest: 30,
  bossWin: 150,
  bossTry: 30,
  mockBase: 100,
  mockPerGradePoint: 5,
  planTask: 10,
  viz: 10,
};

// ---------- levels ----------

export const LEVEL_TITLES: { from: number; title: string }[] = [
  { from: 1, title: 'Data Rookie' },
  { from: 4, title: 'Sample Collector' },
  { from: 7, title: 'Interval Builder' },
  { from: 10, title: 'Hypothesis Hunter' },
  { from: 13, title: 'Variance Slayer' },
  { from: 16, title: 'Chi-Square Champion' },
  { from: 19, title: 'Regression Master' },
  { from: 23, title: 'Statistical Analyst' },
];

/** Total XP needed to reach level L (L = 1 → 0 XP). */
export const xpForLevel = (L: number) => 50 * L * (L - 1);

export function levelInfo(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level), next = xpForLevel(level + 1);
  const title = [...LEVEL_TITLES].reverse().find((t) => level >= t.from)!.title;
  return { level, title, into: xp - base, span: next - base, progress: (xp - base) / (next - base), next };
}

// ---------- streak ----------

const ACTIVE_XP = 20; // a day counts towards the streak from 20 XP

/** Update the streak for activity on `today` (call after XP was added). */
export function touchStreak(s: GameState['streak'], dayXp: number, today: string): GameState['streak'] {
  if (dayXp < ACTIVE_XP || s.last === today) return s;
  let { current, best, freezes } = s;
  const gap = s.last ? daysBetween(s.last, today) : Infinity;
  if (gap === 1) current += 1;
  else if (gap === 2 && canFreeze(freezes, addDays(today, -1))) {
    freezes = [...freezes, addDays(today, -1)];
    current += 1;
  } else current = 1;
  return { current, best: Math.max(best, current), last: today, freezes };
}

/** One streak freeze per ISO week. */
export const canFreeze = (freezes: string[], missed: string) => !freezes.some((f) => weekStart(f) === weekStart(missed));

/** Streak as displayed today (0 if broken and not rescuable). */
export function displayStreak(s: GameState['streak'], today: string) {
  if (!s.last) return { value: 0, atRisk: false, frozenRescue: false };
  const gap = daysBetween(s.last, today);
  if (gap <= 1) return { value: s.current, atRisk: gap === 1, frozenRescue: false };
  if (gap === 2 && canFreeze(s.freezes, addDays(today, -1))) return { value: s.current, atRisk: true, frozenRescue: true };
  return { value: 0, atRisk: false, frozenRescue: false };
}

// ---------- badges ----------

export interface Badge { id: string; icon: string; title: string; desc: string; check: (s: GameState) => boolean }

const total = (s: GameState, key: string) => Object.values(s.day).reduce((a, d) => a + (d[key] ?? 0), 0);

export const BADGES: Badge[] = [
  { id: 'first-steps', icon: '👣', title: 'First Steps', desc: 'Earn your first XP.', check: (s) => s.xp > 0 },
  { id: 'table-ninja', icon: '🥷', title: 'Table Ninja', desc: '50 table values read correctly.', check: (s) => s.tables.correct >= 50 },
  { id: 'clt-believer', icon: '🔔', title: 'CLT Believer', desc: 'Read Week 2 Part 1 (sampling) and run the CLT simulator.', check: (s) => !!s.theoryRead['w2-p1'] && !!s.vizDone['clt'] },
  { id: 'no-type-1', icon: '🎯', title: 'No Type I Errors', desc: '10 test decisions correct in a row.', check: (s) => s.decisionBest >= 10 },
  { id: 'mock-survivor', icon: '🛡️', title: 'Mock Survivor', desc: 'Pass any mock exam (≥ 7.5 / 20).', check: (s) => s.mocks.some((m) => !m.last6Only && m.grade >= 7.5) },
  { id: 'dress-rehearsal', icon: '🎭', title: 'Dress Rehearsal', desc: 'Score ≥ 14 / 20 on Mock 10.', check: (s) => s.mocks.some((m) => m.mockId === 10 && !m.last6Only && m.grade >= 14) },
  { id: 'streak-3', icon: '🔥', title: 'Warming Up', desc: '3-day streak.', check: (s) => s.streak.best >= 3 },
  { id: 'streak-7', icon: '🔥', title: '7-Day Streak', desc: 'Study 7 days in a row.', check: (s) => s.streak.best >= 7 },
  { id: 'streak-21', icon: '☄️', title: 'Unstoppable', desc: '21-day streak.', check: (s) => s.streak.best >= 21 },
  { id: 'night-owl', icon: '🦉', title: 'Night Owl', desc: 'Study after 23:00.', check: (s) => !!s.flags['night-owl'] },
  { id: 'early-bird', icon: '🐦', title: 'Early Bird', desc: 'Study before 07:00.', check: (s) => !!s.flags['early-bird'] },
  { id: 'card-shark', icon: '🃏', title: 'Card Shark', desc: '500 flashcard reviews.', check: (s) => total(s, 'cards') >= 500 },
  { id: 'sprinter', icon: '⚡', title: 'Sprinter', desc: '20 correct values in one Table Sprint.', check: (s) => s.sprint.best >= 20 },
  { id: 'grinder', icon: '⚙️', title: 'Grinder', desc: 'Solve 50 exercises.', check: (s) => total(s, 'ex') >= 50 },
  { id: 'boss-1', icon: '🏰', title: 'First Boss Down', desc: 'Defeat any boss.', check: (s) => Object.values(s.bosses).some((b) => b.passed) },
  { id: 'conqueror', icon: '👑', title: 'Course Conqueror', desc: 'Beat all six weekly bosses.', check: (s) => [1, 2, 3, 4, 5, 6].every((w) => s.bosses[w]?.passed) },
  { id: 'all-mocks', icon: '📚', title: 'Mock Marathon', desc: 'Complete all 10 mocks.', check: (s) => new Set(s.mocks.filter((m) => !m.last6Only).map((m) => m.mockId)).size >= 10 },
  { id: 'printer', icon: '🖨️', title: 'Open Book Ready', desc: 'Open the print view of the formula sheet.', check: (s) => !!s.flags['printed'] },
  { id: 'level-10', icon: '🏹', title: 'Hypothesis Hunter', desc: 'Reach level 10.', check: (s) => levelInfo(s.xp).level >= 10 },
  { id: 'scholar', icon: '📖', title: 'Scholar', desc: 'Read every lesson part.', check: (s) => Object.keys(s.theoryRead).length >= ALL_THEORY.length },
];

export const newBadges = (s: GameState) => BADGES.filter((b) => !s.badges[b.id] && b.check(s));

// ---------- daily quests ----------

export interface Quest { id: string; icon: string; title: string; counter: string; target: number; to: string }

export function questsFor(date: string, tasks: PlanTask[], mistakesDue: number): Quest[] {
  const main = tasks.find((t) => !t.routine && !t.catchUp) ?? tasks.find((t) => !t.routine);
  const q = (key: string, icon: string, title: string, counter: string, target: number, to: string): Quest => ({ id: `${date}:${key}`, icon, title, counter, target, to });
  let first: Quest;
  switch (main?.kind) {
    case 'theory': first = q('theory', '📖', 'Read 3 lesson parts', 'theory', 3, main.to); break;
    case 'examples': first = q('examples', '🧩', 'Work through 2 worked examples', 'examples', 2, main.to); break;
    case 'exercises': first = q('ex', '✏️', `Solve ${Math.min(main.target ?? 4, 6)} exercises`, 'ex', Math.min(main.target ?? 4, 6), main.to); break;
    case 'boss': first = q('boss', '⚔️', 'Defeat a boss', 'bossWin', 1, main.to); break;
    case 'mock': first = q('mock', '📝', 'Finish a mock exam', 'mock', 1, main.to); break;
    case 'viz': first = q('viz', '🔬', 'Explore 1 visualization', 'viz', 1, main.to); break;
    default: first = q('ex', '✏️', 'Solve 4 exercises', 'ex', 4, '/practice');
  }
  const cardsTarget = tasks.find((t) => t.routine && t.kind === 'cards')?.target ?? 20;
  const second = mistakesDue >= 3
    ? q('mistakes', '🩹', `Review ${Math.min(10, mistakesDue)} cards from your Mistakes deck`, 'mistakeCards', Math.min(10, mistakesDue), '/cards?deck=mistakes')
    : q('cards', '🃏', `Review ${cardsTarget} flashcards`, 'cards', cardsTarget, '/cards');
  const third = q('sprint', '⏱️', 'Complete 1 Table Sprint', 'sprint', 1, '/tables/sprint');
  return [first, second, third];
}
