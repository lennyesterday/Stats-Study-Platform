// SM-2 spaced repetition.
import { addDays } from './dates';

export interface CardState { ef: number; interval: number; reps: number; due: string; lapses: number; seen: number }
export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const newCard = (today: string): CardState => ({ ef: 2.5, interval: 0, reps: 0, due: today, lapses: 0, seen: 0 });

export function review(card: CardState, rating: Rating, today: string): CardState {
  const q = ({ 1: 1, 2: 3, 3: 4, 4: 5 } as const)[rating];
  let { ef, interval, reps, lapses } = card;
  if (q < 3) {
    reps = 0;
    interval = 0; // relearn today
    lapses += 1;
  } else {
    reps += 1;
    if (reps === 1) interval = rating === 4 ? 3 : 1;
    else if (reps === 2) interval = rating === 2 ? 3 : 6;
    else interval = Math.round(interval * (rating === 2 ? 1.2 : rating === 4 ? ef * 1.3 : ef));
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { ef, interval, reps, lapses, due: addDays(today, interval), seen: card.seen + 1 };
}

/** 0..1 memory strength used for mastery (21-day interval = fully learned). */
export const strength = (c?: CardState) => (c && c.seen ? Math.min(1, 0.25 + c.interval / 21) * (c.reps > 0 ? 1 : 0.4) : 0);

export const intervalLabel = (c: CardState, rating: Rating, today: string) => {
  const n = review(c, rating, today).interval;
  return n === 0 ? '<1d' : `${n}d`;
};
