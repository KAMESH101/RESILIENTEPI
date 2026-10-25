import type { DataSource, Horizon, RiskCategory, YearMonth } from './common'

/** LightGBM probability that cases exceed the district's outbreak threshold
 *  (seasonal P75 for that calendar month), plus the NB expected count. */
export interface HorizonForecast {
  horizon: Horizon
  target_month: YearMonth
  /** 0–1. Displayed as a whole percentage with a word, e.g. "Likely (62%)". */
  probability: number
  category: RiskCategory
  /** Negative-binomial expected cases; null when the count model has no output. */
  expected_cases: number | null
  /** Only present when the backend provides an interval — never fabricated. */
  expected_cases_interval: { lower: number; upper: number } | null
  /** The threshold (case count) this probability refers to. */
  outbreak_threshold_cases: number | null
  source: DataSource
}

export type BaselineKind = 'seasonal_naive' | 'persistence' | 'historical_average'

/** One baseline's case-count prediction for a target month. */
export interface BaselinePoint {
  kind: BaselineKind
  horizon: Horizon
  target_month: YearMonth
  expected_cases: number | null
  source: DataSource
}

/** One observed district-month. `null` always means "No data", never 0. */
export interface MonthlyObservation {
  month: YearMonth
  reported_cases: number | null
  tests: number | null
  tests_per_100k: number | null
  /** 0–1 share of tests positive. */
  test_positivity: number | null
  fever_admissions: number | null
  /** 0–1 share of expected reporting units that reported on time. */
  reporting_completeness: number | null
  rainfall_mm: number | null
  temperature_c: number | null
  humidity_pct: number | null
  source: DataSource
}

export type ShapDirection = 'increases_risk' | 'decreases_risk'

/** One plain-language SHAP reason, e.g. "Rainfall 2 months ago was 38% above normal". */
export interface ShapReason {
  feature: string
  direction: ShapDirection
  /** Plain-language sentence shown first. */
  text: string
  /** Raw SHAP value — shown only behind "How is this calculated?". */
  shap_value: number
  source: DataSource
}

/** GET /districts/{id}/explanations?horizon= */
export type ExplanationResponse =
  | { status: 'available'; horizon: Horizon; reasons: ShapReason[]; source: DataSource }
  | { status: 'not_available'; horizon: Horizon; message: string }
