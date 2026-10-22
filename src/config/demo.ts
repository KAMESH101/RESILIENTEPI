import type { YearMonth } from '@/types'

export type ApiMode = 'mock' | 'live'

// `?? {}` lets scripts (e.g. data checks run with tsx) import config outside Vite.
const env: Partial<ImportMetaEnv> = import.meta.env ?? {}

/** The only switch needed to move from mock data to the real backend. */
export const API_MODE: ApiMode = env.VITE_API_MODE === 'live' ? 'live' : 'mock'

export const API_BASE_URL: string = env.VITE_API_BASE_URL ?? '/api/v1'

function currentMonth(): YearMonth {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Demo "as-of" month. Defaults to the current month; override with VITE_DEMO_AS_OF=YYYY-MM. */
export const DEMO_AS_OF: YearMonth = /^\d{4}-\d{2}$/.test(env.VITE_DEMO_AS_OF ?? '')
  ? (env.VITE_DEMO_AS_OF as YearMonth)
  : currentMonth()

/** Synthetic monthly series start here. */
export const DEMO_SERIES_START: YearMonth = '2018-01'

/** Fixed seed so the demo (and the guided tour) always tells the same story. */
export const DEMO_SEED = 20260722

/** Mock latency range in ms (prompt §9). */
export const MOCK_DELAY_MS = { min: 300, max: 800 } as const

/** Real HMIS district-month data ends here; the demo timeline beyond it is synthetic. */
export const HMIS_DATA_ENDS = 2022

export const DEMO_BANNER_TEXT = 'Demo mode — synthetic data. Not for operational use.'

export const DEMO_NOT_SENT_TEXT = 'Demo mode: not sent to a real system'

export const CORE_MESSAGE =
  "Low reported dengue doesn't always mean low dengue — sometimes it means low testing."

export const CONTEXT_STAT = {
  text: '23,952 dengue cases in India, Jan–Jun 2026; the dengue season is now starting earlier and lasting longer.',
  source: 'MoHFW, Rajya Sabha, July 2026',
} as const
