import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { onGameEvent, type GameEvent } from '../lib/events';
import { useStore } from '../store';

let ctx: AudioContext | null = null;
function chime(freqs: number[]) {
  try {
    ctx ??= new AudioContext();
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx!.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + 0.4);
    });
  } catch { /* audio unavailable */ }
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function burst(big = false) {
  if (reduced()) return;
  confetti({ particleCount: big ? 160 : 70, spread: big ? 100 : 65, origin: { y: 0.7 }, disableForReducedMotion: true });
}

interface Toast { id: number; e: GameEvent }

export function Celebrations() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [xpFloat, setXpFloat] = useState<{ id: number; amount: number } | null>(null);
  useEffect(() => onGameEvent((e) => {
    const sound = useStore.getState().settings.sound;
    if (e.type === 'xp') {
      setXpFloat({ id: Date.now(), amount: e.amount });
      return;
    }
    if (e.type === 'levelup' || e.type === 'boss') { burst(true); if (sound) chime([523, 659, 784, 1047]); }
    else if (e.type === 'badge' || e.type === 'quest') { burst(); if (sound) chime([659, 880]); }
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, e }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }), []);

  useEffect(() => {
    if (!xpFloat) return;
    const t = setTimeout(() => setXpFloat(null), 1100);
    return () => clearTimeout(t);
  }, [xpFloat]);

  return (
    <>
      <AnimatePresence>
        {xpFloat && (
          <motion.div key={xpFloat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed right-6 top-16 z-50 rounded-full bg-xp px-3 py-1 text-sm font-bold text-white shadow-lg">
            +{xpFloat.amount} XP
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map(({ id, e }) => (
            <motion.div key={id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto rounded-2xl border border-line bg-surface p-3 shadow-xl">
              {e.type === 'levelup' && <div><div className="text-xs font-semibold uppercase text-xp">Level up!</div><div className="font-display text-lg font-semibold">Level {e.level} · {e.title}</div></div>}
              {e.type === 'badge' && <div className="flex items-center gap-3"><span className="text-3xl">{e.icon}</span><div><div className="text-xs font-semibold uppercase text-warn">Badge unlocked</div><div className="font-semibold">{e.title}</div></div></div>}
              {e.type === 'quest' && <div><div className="text-xs font-semibold uppercase text-good">Quest complete · +30 XP</div><div className="font-semibold">{e.title}</div></div>}
              {e.type === 'boss' && <div><div className="text-xs font-semibold uppercase text-fire">Boss defeated!</div><div className="font-display text-lg font-semibold">Week {e.world} mastered 👑</div></div>}
              {e.type === 'info' && <div className="text-sm">{e.text}</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
