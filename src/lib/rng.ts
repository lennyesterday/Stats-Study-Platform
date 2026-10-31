// Seeded random numbers so every generated exercise / mock is reproducible.

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  float(min: number, max: number, decimals: number): number;
  pick<T>(xs: readonly T[]): T;
  shuffle<T>(xs: readonly T[]): T[];
  seed: number;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    seed,
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max, d) => Math.round((min + next() * (max - min)) * 10 ** d) / 10 ** d,
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    shuffle: (xs) => {
      const c = [...xs];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
  };
  return rng;
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
