import type { DataSource, DistrictRef, IsoDateTime, Role } from './common'

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

export type ReviewDecision = 'acknowledge' | 'flag_for_audit' | 'dismiss'

export interface BlindSpotReview {
  id: string
  decision: ReviewDecision
  reason: string | null
  reviewer_name: string
  reviewer_role: Role
  created_at: IsoDateTime
}

export interface BlindSpotAssessment {
  id: string
  district: DistrictRef
  /** 0–100. Always labelled experimental; never presented as proof. */
  score: number
  /** score ≥ BLIND_SPOT_FLAG_THRESHOLD */
  flagged: boolean
  components: BlindSpotComponent[]
  evidence: string[]
  data_quality_warnings: string[]
  reviews: BlindSpotReview[]
  source: DataSource
}

/** Compact form embedded in district summaries and map features. */
export interface BlindSpotSummary {
  id: string
  score: number
  flagged: boolean
  source: DataSource
}
