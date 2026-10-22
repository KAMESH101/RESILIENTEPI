/**
 * Shared primitives used by every API contract (prompt §9).
 * Field names are snake_case to match the planned FastAPI backend 1:1, so
 * switching VITE_API_MODE to "live" needs no mapping layer.
 */

/** Where a value came from. Every synthetic number carries `source: "synthetic"`
 *  and the UI renders a "Synthetic" tag next to it. */
export type DataSource = 'synthetic' | 'observed' | 'model'

/** Calendar month as "YYYY-MM", e.g. "2026-10". */
export type YearMonth = string

/** ISO 8601 timestamp, e.g. "2026-10-01T03:00:00Z". */
export type IsoDateTime = string

/** Forecast horizon in months ahead. */
export type Horizon = 1 | 2 | 3

export const HORIZONS: readonly Horizon[] = [1, 2, 3]

export type RiskCategory = 'low' | 'moderate' | 'high' | 'very_high'

/** Demo roles only. The full RBAC (Admin, State Officer, …) is backend future work. */
export type Role = 'district_officer' | 'evaluator'

export type Language = 'en' | 'hi' | 'ta'

/** Stable district identifier. A slug ("tn-madurai"), NOT an LGD code —
 *  LGD codes are only filled from the team-supplied CSV. */
export type DistrictId = string

export interface DistrictRef {
  id: DistrictId
  name: string
  state: string
  /** Null unless supplied via public/data/lgd_districts.csv. Never invented. */
  lgd_code: string | null
}

/** Freshness of a district's surveillance data relative to the last monthly run. */
export interface DataFreshness {
  /** Last month with a report received; null if never reported. */
  last_reported_month: YearMonth | null
  /** Whole months between last report and the as-of month. */
  months_stale: number
  /** "low" when data is ≥ 3 months old or key months are missing. */
  confidence: 'normal' | 'low'
  /** Months inside the history window with no report (rendered "No data", never 0). */
  missing_months: YearMonth[]
}

/** Metadata returned with every list/overview response. */
export interface RunInfo {
  /** The month the monthly batch treated as "now". */
  as_of: YearMonth
  /** When the last monthly batch finished — not real-time. */
  last_run_at: IsoDateTime
  /** Present on every response so the UI can tag demo data. */
  source: DataSource
}
