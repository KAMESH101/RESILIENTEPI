import type { YearMonth } from '@/types'

const LOCALE = 'en-IN'

const intFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })

/** 123456 → "1,23,456". Null → "No data" (never 0). */
export function formatInt(n: number | null | undefined): string {
  return n == null ? 'No data' : intFmt.format(Math.round(n))
}

/** 0.623 → "62%". Whole percentages only — the data doesn't support more. */
export function formatPct(fraction: number | null | undefined): string {
  return fraction == null ? 'No data' : `${Math.round(fraction * 100)}%`
}

/** "2026-10" → "Oct 2026" */
export function formatMonth(ym: YearMonth | null | undefined): string {
  if (!ym) return 'No data'
  const [y, m] = ym.split('-').map(Number)
  return monthFmt.format(new Date(y!, m! - 1, 1))
}

/** "2026-10" → "Oct" */
export function formatMonthShort(ym: YearMonth): string {
  const [y, m] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat(LOCALE, { month: 'short' }).format(new Date(y!, m! - 1, 1))
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

/* ---- Year-month arithmetic ---- */

export function ymToIndex(ym: YearMonth): number {
  const [y, m] = ym.split('-').map(Number)
  return y! * 12 + (m! - 1)
}

export function indexToYm(i: number): YearMonth {
  const y = Math.floor(i / 12)
  const m = (i % 12) + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  return indexToYm(ymToIndex(ym) + n)
}

export function monthsBetween(from: YearMonth, to: YearMonth): number {
  return ymToIndex(to) - ymToIndex(from)
}

/** 1-based calendar month of a YearMonth. */
export function calendarMonth(ym: YearMonth): number {
  return Number(ym.slice(5, 7))
}

/** Monsoon season (Jun–Sep), shaded on time-series charts. */
export function isMonsoon(ym: YearMonth): boolean {
  const m = calendarMonth(ym)
  return m >= 6 && m <= 9
}
