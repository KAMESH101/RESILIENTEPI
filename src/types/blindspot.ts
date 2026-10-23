import type { DataSource, DistrictRef, IsoDateTime, Role, YearMonth } from './common'

/** The five transparent parts of the experimental blind-spot indicator (prompt §2). */
export type BlindSpotComponentKey =
  | 'expected_gap'
  | 'low_testing'
  | 'high_positivity'
  | 'low_completeness'
  | 'fever_divergence'

export interface BlindSpotComponent {
  key: BlindSpotComponentKey
  /** Normalised signal strength 0–1 before weighting. */
  signal: number
  /** Weight 0–1 from config/blindspot.ts at scoring time. */
  weight: number
  /** signal × weight × 100 — points this part adds to the 0–100 score. */
  contribution: number
  /** Plain-language evidence, e.g. "Tests per 100k are 58% below the state median". */
  evidence: string
}

/** flagged = score ≥ 50 (potential blind spot), watch = 35–49, none = below 35.
 *  Cut-offs live in config/blindspot.ts and are a demo assumption. */
export type BlindSpotBand = 'none' | 'watch' | 'flagged'

export type ReviewDecision = 'acknowledge' | 'flag_for_audit' | 'dismiss'

export interface BlindSpotReview {
  id: string
  decision: ReviewDecision
  reason: string | null
  reviewer_name: string
  reviewer_role: Role
  created_at: IsoDateTime
}

/** The numbers behind the five parts, over the recent months used for scoring. */
export interface BlindSpotMetrics {
  /** Months (with a report) the score was computed from, oldest first. */
  months_used: YearMonth[]
  reported_cases: number | null
  /** Cases the climate-and-neighbour model expected over the same months. */
  expected_cases: number | null
  tests_per_100k: number | null
  state_median_tests_per_100k: number | null
  test_positivity: number | null
  reporting_completeness: number | null
  /** Change vs the previous 3 months, as a fraction (0.2 = +20%). */
  fever_admissions_change: number | null
  reported_cases_change: number | null
}

export interface BlindSpotAssessment {
  id: string
  district: DistrictRef
  /** 0–100. Always labelled experimental; never presented as proof. */
  score: number
  band: BlindSpotBand
  /** band === "flagged" */
  flagged: boolean
  components: BlindSpotComponent[]
  metrics: BlindSpotMetrics
  evidence: string[]
  data_quality_warnings: string[]
  reviews: BlindSpotReview[]
  source: DataSource
}

/** Compact form embedded in district summaries and map features. */
export interface BlindSpotSummary {
  id: string
  score: number
  band: BlindSpotBand
  flagged: boolean
  source: DataSource
}
