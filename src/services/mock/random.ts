/** Deterministic PRNG (mulberry32) so the demo always tells the same story. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable 32-bit hash of a string, for per-district sub-seeds. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** A PRNG seeded from the global seed plus any number of keys. */
export function rngFor(seed: number, ...keys: (string | number)[]): () => number {
  return mulberry32(seed ^ hashString(keys.join('|')))
}

/** Standard normal via Box–Muller. */
export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
