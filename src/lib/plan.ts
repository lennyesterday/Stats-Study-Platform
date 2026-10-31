// Study-plan engine: builds the day-by-day plan from content/studyplan.ts + settings,
// moves tasks off rest days, and redistributes missed tasks ("catch-up").
import { DAY_TASKS, PHASES, type TaskKind, type TaskTemplate } from '../content/studyplan';
import { addDays, daysBetween, PLAN_END, PLAN_START, rangeKeys, weekday } from './dates';

export interface PlanTask extends TaskTemplate { id: string; date: string; routine?: boolean; catchUp?: boolean; custom?: boolean }
export interface PlanDay { date: string; phase: string; tasks: PlanTask[]; rest: boolean }

export interface PlanSettings {
  minutesPerDay: number;
  restDays: number[]; // weekdays (0 = Sunday) without new material
  catchUpPerDay: number;
}

export interface PlanOverrides {
  custom: Record<string, { id: string; title: string; minutes: number }[]>;
  removed: string[];
}

export const phaseFor = (date: string) => PHASES.find((p) => date >= p.from && date <= p.to);

function routine(date: string, s: PlanSettings): PlanTask[] {
  if (date === PLAN_END) return [];
  const cards = Math.max(10, Math.round(s.minutesPerDay / 6));
  return [
    { id: `${date}:routine:cards`, date, kind: 'cards', title: `Review due flashcards (≈${cards})`, minutes: Math.round(cards / 2), to: '/cards', target: cards, routine: true },
    { id: `${date}:routine:sprint`, date, kind: 'sprint', title: '1 Table Sprint (60 s)', minutes: 2, to: '/tables/sprint', routine: true },
  ];
}

export function buildPlan(s: PlanSettings, o: PlanOverrides): PlanDay[] {
  const days = rangeKeys(PLAN_START, PLAN_END);
  const carry: TaskTemplate[] = [];
  const protectedFrom = addDays(PLAN_END, -2); // never skip the last three days
  return days.map((date) => {
    const rest = s.restDays.includes(weekday(date)) && date < protectedFrom;
    const base = DAY_TASKS[date] ?? [];
    let todays: TaskTemplate[];
    if (rest) {
      carry.push(...base);
      todays = [];
    } else {
      todays = [...carry.splice(0), ...base];
    }
    const tasks: PlanTask[] = [
      ...todays.map((t, i) => ({ ...t, id: `${date}:${i}:${t.kind}`, date })),
      ...routine(date, s),
      ...(o.custom[date] ?? []).map((c) => ({ ...c, kind: 'custom' as TaskKind, to: '/plan', date, custom: true })),
    ].filter((t) => !o.removed.includes(t.id));
    return { date, phase: phaseFor(date)?.title ?? '', tasks, rest };
  });
}

/** Tasks shown for `day`, including redistributed overdue tasks (only for days ≥ today). */
export function agenda(plan: PlanDay[], day: string, today: string, done: Record<string, string>, s: PlanSettings): PlanTask[] {
  const own = plan.find((d) => d.date === day)?.tasks ?? [];
  if (day < today) return own;
  const overdue = plan
    .filter((d) => d.date < today)
    .flatMap((d) => d.tasks)
    .filter((t) => !t.routine && !done[t.id] && t.kind !== 'rest' && t.kind !== 'exam');
  const offset = daysBetween(today, day);
  const share = overdue.slice(offset * s.catchUpPerDay, (offset + 1) * s.catchUpPerDay).map((t) => ({ ...t, catchUp: true }));
  return [...share, ...own];
}

export const overdueCount = (plan: PlanDay[], today: string, done: Record<string, string>) =>
  plan.filter((d) => d.date < today).flatMap((d) => d.tasks).filter((t) => !t.routine && !done[t.id] && t.kind !== 'rest').length;
