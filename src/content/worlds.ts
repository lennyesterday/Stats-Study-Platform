import type { Flashcard, World, WorldId } from './types';
import { world1 } from './world1';
import { world2 } from './world2';
import { world3 } from './world3';
import { world4 } from './world4';
import { world5 } from './world5';
import { world6 } from './world6';

export const WORLDS: World[] = [world1, world2, world3, world4, world5, world6];

/** Date from which a world is unlocked by the study plan (also unlocked when the previous boss is beaten). */
export const UNLOCK_DATES: Record<WorldId, string> = {
  1: '2026-10-28', 2: '2026-11-02', 3: '2026-11-05', 4: '2026-11-09', 5: '2026-11-16', 6: '2026-11-18',
};

export const getWorld = (id: number) => WORLDS.find((w) => w.id === id);
export const ALL_CARDS: Flashcard[] = WORLDS.flatMap((w) => w.flashcards);
export const ALL_THEORY = WORLDS.flatMap((w) => w.theory);
export const ALL_EXERCISES = WORLDS.flatMap((w) => w.exercises.map((e) => ({ ...e, world: w.id })));
export const ALL_INTERPRETATIONS = WORLDS.flatMap((w) => w.interpretations.map((e) => ({ ...e, world: w.id })));
