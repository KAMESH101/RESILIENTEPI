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

/** Shared chart colours and axis styling (design tokens as hex for SVG). */
export const CHART = {
  navy: '#0F2A4A',
  teal: '#0E8A8A',
  slate: '#64748B',
  muted: '#475569',
  grid: '#E2E8F0',
  axis: { fontSize: 11, fill: '#475569' },
  tooltip: { fontSize: 12, borderRadius: 8, borderColor: '#E2E8F0' },
} as const

/** Date-range choices for time-series charts; null = all months. */
export const RANGE_OPTIONS = [12, 24, 36, null] as const
export type RangeOption = (typeof RANGE_OPTIONS)[number]
