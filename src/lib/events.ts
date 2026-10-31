// Tiny pub/sub for celebrations (toasts, confetti, sounds).

export type GameEvent =
  | { type: 'xp'; amount: number; reason: string }
  | { type: 'levelup'; level: number; title: string }
  | { type: 'badge'; icon: string; title: string }
  | { type: 'quest'; title: string }
  | { type: 'boss'; world: number }
  | { type: 'info'; text: string };

type Listener = (e: GameEvent) => void;
const listeners = new Set<Listener>();

export const onGameEvent = (l: Listener) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export const emit = (e: GameEvent) => listeners.forEach((l) => l(e));
