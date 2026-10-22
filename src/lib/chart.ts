import { isMonsoon } from './format'

/** Contiguous Jun–Sep runs, as [firstMonth, lastMonth] pairs, for light shading. */
export function monsoonRanges(months: string[]): [string, string][] {
  const out: [string, string][] = []
  let start: string | null = null
  months.forEach((m, i) => {
    if (isMonsoon(m)) {
      start ??= m
      if (i === months.length - 1 || !isMonsoon(months[i + 1]!)) {
        out.push([start, m])
        start = null
      }
    }
  })
  return out
}
