// Global store (zustand) persisted to localStorage, with JSON export/import.
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { TopicId } from './content/types';
import { todayKey } from './lib/dates';
import { emit } from './lib/events';
import { BADGES, levelInfo, newBadges, questsFor, touchStreak, XP } from './lib/game';
import { agenda, buildPlan } from './lib/plan';
import { newCard, review, type Rating } from './lib/srs';
import { initialState, type GameState, type MistakeCard, type MockAttempt, type Settings } from './lib/state';

const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage full or blocked */ } },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

interface Gain { xp: number; reason: string; counters?: Record<string, number> }

interface Actions {
  gain: (g: Gain) => void;
  markTheory: (id: string) => void;
  markExample: (id: string) => void;
  markViz: (id: string) => void;
  markInterpretation: (id: string) => void;
  reviewCard: (id: string, rating: Rating, mistake?: boolean) => void;
  recordExercise: (id: string, topic: TopicId, difficulty: 1 | 2 | 3, correct: boolean, firstTry: boolean, decision?: boolean) => void;
  recordTable: (correct: boolean) => void;
  finishSprint: (score: number) => void;
  recordBoss: (world: number, score: number, passed: boolean) => void;
  finishMock: (a: MockAttempt, mistakes: Omit<MistakeCard, 'created'>[]) => void;
  toggleTask: (id: string) => void;
  addCustomTask: (date: string, title: string, minutes: number) => void;
  removeTask: (id: string) => void;
  restoreTasks: () => void;
  deleteMistake: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  setFlag: (k: string) => void;
  importState: (s: GameState) => void;
  reset: () => void;
}

export type Store = GameState & Actions;

export const planSettings = (s: GameState) => ({ minutesPerDay: s.settings.minutesPerDay, restDays: s.settings.restDays, catchUpPerDay: s.settings.catchUpPerDay });

export function todaysQuests(s: GameState, today = todayKey()) {
  const plan = buildPlan(planSettings(s), s.plan);
  const tasks = agenda(plan, today, today, s.tasksDone, planSettings(s));
  const mistakesDue = s.mistakes.filter((m) => (s.cards[`m:${m.id}`]?.due ?? today) <= today).length;
  return questsFor(today, tasks, mistakesDue);
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      gain: ({ xp, reason, counters = {} }) => {
        const today = todayKey();
        const before = get();
        const lvlBefore = levelInfo(before.xp).level;
        const hour = new Date().getHours();
        set((s) => {
          const day = { ...(s.day[today] ?? {}) };
          Object.entries(counters).forEach(([k, v]) => (day[k] = (day[k] ?? 0) + v));
          const dailyXp = { ...s.dailyXp, [today]: (s.dailyXp[today] ?? 0) + xp };
          return {
            xp: s.xp + xp,
            dailyXp,
            day: { ...s.day, [today]: day },
            streak: touchStreak(s.streak, dailyXp[today], today),
            flags: { ...s.flags, ...(hour >= 23 || hour < 4 ? { 'night-owl': true } : {}), ...(hour >= 4 && hour < 7 ? { 'early-bird': true } : {}) },
          };
        });
        if (xp > 0) emit({ type: 'xp', amount: xp, reason });
        // quests
        const s1 = get();
        const dayCounters = s1.day[today] ?? {};
        const done = todaysQuests(s1, today).filter((q) => !s1.questsClaimed[q.id] && (dayCounters[q.counter] ?? 0) >= q.target);
        if (done.length) {
          set((s) => ({
            xp: s.xp + XP.quest * done.length,
            dailyXp: { ...s.dailyXp, [today]: (s.dailyXp[today] ?? 0) + XP.quest * done.length },
            questsClaimed: { ...s.questsClaimed, ...Object.fromEntries(done.map((q) => [q.id, today])) },
          }));
          done.forEach((q) => emit({ type: 'quest', title: q.title }));
        }
        // badges
        const fresh = newBadges(get());
        if (fresh.length) {
          set((s) => ({ badges: { ...s.badges, ...Object.fromEntries(fresh.map((b) => [b.id, today])) } }));
          fresh.forEach((b) => emit({ type: 'badge', icon: b.icon, title: b.title }));
        }
        const after = levelInfo(get().xp);
        if (after.level > lvlBefore) emit({ type: 'levelup', level: after.level, title: after.title });
      },

      markTheory: (id) => {
        if (get().theoryRead[id]) return;
        set((s) => ({ theoryRead: { ...s.theoryRead, [id]: todayKey() } }));
        get().gain({ xp: XP.theory, reason: 'Theory section read', counters: { theory: 1 } });
      },
      markExample: (id) => {
        if (get().examplesDone[id]) return;
        set((s) => ({ examplesDone: { ...s.examplesDone, [id]: todayKey() } }));
        get().gain({ xp: XP.example, reason: 'Worked example completed', counters: { examples: 1 } });
      },
      markViz: (id) => {
        const first = !get().vizDone[id];
        set((s) => ({ vizDone: { ...s.vizDone, [id]: todayKey() } }));
        if (first) get().gain({ xp: XP.viz, reason: 'Visualization explored', counters: { viz: 1 } });
        else get().gain({ xp: 0, reason: '', counters: { viz: 1 } });
      },
      markInterpretation: (id) => {
        const first = !get().interpDone[id];
        set((s) => ({ interpDone: { ...s.interpDone, [id]: todayKey() } }));
        get().gain({ xp: first ? XP.interpretation : 5, reason: 'Interpretation written', counters: { interp: 1, ex: 1 } });
      },
      reviewCard: (id, rating, mistake) => {
        const today = todayKey();
        set((s) => ({ cards: { ...s.cards, [id]: review(s.cards[id] ?? newCard(today), rating, today) } }));
        get().gain({ xp: XP.card[rating], reason: 'Flashcard', counters: { cards: 1, ...(mistake ? { mistakeCards: 1 } : {}) } });
      },
      recordExercise: (id, topic, difficulty, correct, firstTry, decision) => {
        const today = todayKey();
        set((s) => {
          const r = s.exercises[id] ?? { attempts: 0, correct: 0, firstTry: 0 };
          const t = s.topicEx[topic] ?? [0, 0];
          const run = decision ? (correct ? s.decisionRun + 1 : 0) : s.decisionRun;
          return {
            exercises: { ...s.exercises, [id]: { attempts: r.attempts + 1, correct: r.correct + (correct ? 1 : 0), firstTry: r.firstTry + (correct && firstTry ? 1 : 0), lastCorrect: correct ? today : r.lastCorrect } },
            topicEx: { ...s.topicEx, [topic]: [t[0] + (correct ? 1 : 0), t[1] + 1] },
            decisionRun: run,
            decisionBest: Math.max(s.decisionBest, run),
          };
        });
        if (correct) get().gain({ xp: XP.exercise[difficulty] + (firstTry ? XP.firstTryBonus : 0), reason: 'Exercise solved', counters: { ex: 1 } });
      },
      recordTable: (correct) => {
        set((s) => ({ tables: { correct: s.tables.correct + (correct ? 1 : 0), total: s.tables.total + 1 }, topicEx: { ...s.topicEx, tables: [(s.topicEx.tables?.[0] ?? 0) + (correct ? 1 : 0), (s.topicEx.tables?.[1] ?? 0) + 1] } }));
        if (correct) get().gain({ xp: XP.tableCell, reason: 'Table value', counters: { tables: 1 } });
      },
      finishSprint: (score) => {
        const best = get().sprint.best;
        set((s) => ({ sprint: { best: Math.max(s.sprint.best, score), runs: s.sprint.runs + 1, history: [...s.sprint.history, { date: todayKey(), score }].slice(-200) }, tables: { correct: s.tables.correct + score, total: s.tables.total + score } }));
        get().gain({ xp: score * XP.sprintPerCorrect + 5, reason: score > best ? 'New sprint highscore!' : 'Table Sprint', counters: { sprint: 1 } });
      },
      recordBoss: (world, score, passed) => {
        const prev = get().bosses[world];
        const firstWin = passed && !prev?.passed;
        set((s) => ({ bosses: { ...s.bosses, [world]: { best: Math.max(prev?.best ?? 0, score), passed: passed || !!prev?.passed, date: todayKey(), attempts: (prev?.attempts ?? 0) + 1 } } }));
        if (firstWin) emit({ type: 'boss', world });
        get().gain({ xp: firstWin ? XP.bossWin : passed ? XP.bossTry * 2 : XP.bossTry, reason: passed ? 'Boss defeated' : 'Boss attempt', counters: passed ? { bossWin: 1 } : { bossTry: 1 } });
      },
      finishMock: (a, mistakes) => {
        const today = todayKey();
        set((s) => {
          const topicMock = { ...s.topicMock };
          Object.entries(a.perTopic).forEach(([t, v]) => {
            const cur = topicMock[t as TopicId] ?? [0, 0];
            topicMock[t as TopicId] = [cur[0] + v![0], cur[1] + v![1]];
          });
          const existing = new Set(s.mistakes.map((m) => m.id));
          const added = mistakes.filter((m) => !existing.has(m.id)).map((m) => ({ ...m, created: today }));
          return { mocks: [...s.mocks, a], topicMock, mistakes: [...s.mistakes, ...added] };
        });
        get().gain({ xp: XP.mockBase + Math.round(a.grade * XP.mockPerGradePoint), reason: `${a.title} finished`, counters: { mock: 1 } });
      },
      toggleTask: (id) => {
        const was = !!get().tasksDone[id];
        set((s) => {
          const tasksDone = { ...s.tasksDone };
          if (was) delete tasksDone[id]; else tasksDone[id] = todayKey();
          return { tasksDone };
        });
        if (!was) get().gain({ xp: XP.planTask, reason: 'Plan task done', counters: { tasks: 1 } });
      },
      addCustomTask: (date, title, minutes) =>
        set((s) => ({ plan: { ...s.plan, custom: { ...s.plan.custom, [date]: [...(s.plan.custom[date] ?? []), { id: `custom:${date}:${Date.now()}`, title, minutes }] } } })),
      removeTask: (id) =>
        set((s) => {
          if (id.startsWith('custom:')) {
            const custom = Object.fromEntries(Object.entries(s.plan.custom).map(([d, ts]) => [d, ts.filter((t) => t.id !== id)]));
            return { plan: { ...s.plan, custom } };
          }
          return { plan: { ...s.plan, removed: [...s.plan.removed, id] } };
        }),
      restoreTasks: () => set((s) => ({ plan: { ...s.plan, removed: [] } })),
      deleteMistake: (id) => set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) })),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setFlag: (k) => {
        set((s) => ({ flags: { ...s.flags, [k]: true } }));
        get().gain({ xp: 0, reason: '' });
      },
      importState: (s) => set({ ...initialState(), ...s, settings: { ...initialState().settings, ...s.settings } }),
      reset: () => set(initialState()),
    }),
    {
      name: 'stats-quest-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')) as GameState,
      merge: (persisted, current) => {
        const p = persisted as Partial<GameState> | undefined;
        const settings = { ...current.settings, ...(p?.settings ?? {}) };
        // 120 min was a placeholder before the official exam rules (90 min) were known
        if (settings.mockDurationMin === 120) settings.mockDurationMin = 90;
        return { ...current, ...p, settings };
      },
    },
  ),
);

export const exportState = (): string => {
  const s = useStore.getState();
  return JSON.stringify(Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')), null, 2);
};

export const BADGE_COUNT = BADGES.length;
