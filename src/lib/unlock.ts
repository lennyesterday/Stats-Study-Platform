import { UNLOCK_DATES } from '../content/worlds';
import type { WorldId } from '../content/types';
import { todayKey } from './dates';
import type { GameState } from './state';

/** A world opens on its plan date, when the previous boss is beaten, or when "unlock all" is on. */
export function isUnlocked(s: GameState, id: WorldId, today = todayKey()) {
  return id === 1 || s.settings.unlockAll || today >= UNLOCK_DATES[id] || !!s.bosses[id - 1]?.passed;
}

/** Mocks 1–9 open in the mock phase (or once all six worlds are unlocked); Mock 10 opens on 30 Nov. */
export function mockUnlocked(s: GameState, id: number, today = todayKey()) {
  if (s.settings.unlockAll) return true;
  if (id === 10) return today >= '2026-11-30' || s.mocks.filter((m) => !m.last6Only).length >= 9;
  return today >= '2026-11-16' || [1, 2, 3, 4, 5, 6].every((w) => isUnlocked(s, w as WorldId, today));
}
