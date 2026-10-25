/**
 * Response envelopes for each endpoint in prompt §9. Request bodies live in
 * ./schemas.ts (zod-inferred). Query params are typed here.
 */
import type { ActionPriority, ActionStatus, ActionTask, DecisionQuadrant } from './actions'
import type { BlindSpotAssessment, BlindSpotBand, BlindSpotReview, ReviewDecision } from './blindspot'
import type { DataSource, DistrictRef, Horizon, IsoDateTime, Language, RiskCategory, RunInfo, YearMonth } from './common'
import type { DistrictSummary } from './district'
import type { HorizonForecast, ShapDirection } from './forecast'
import type { DataSourceStatus } from './system'

export interface Kpi {
  value: number
  /** Previous month's value; null when a trend isn't valid (then no arrow is shown). */
  previous: number | null
  source: DataSource
}

/** "Needs attention this month" card. */
export interface AttentionItem {
  district: DistrictRef
  severity: HorizonForecast['category']
  blind_spot_flagged: boolean
  /** "Madurai, Tamil Nadu — High risk + potential blind spot." */
  headline: string
  /** "Suggested: send testing team." */
  suggestion: string
}

/** GET /overview?horizon=&state= */
export interface OverviewResponse extends RunInfo {
  horizon: Horizon
  state: string | null
  kpis: {
    districts_monitored: Kpi
    high_or_very_high: Kpi
    potential_blind_spots: Kpi
    needing_immediate_attention: Kpi
  }
  attention: AttentionItem[]
  top_risk: DistrictSummary[]
  blind_spot_alerts: DistrictSummary[]
  recommended_actions: ActionTask[]
  /** Districts for the mini map (same shape as /risk-map). */
  map: DistrictSummary[]
}

/** GET /risk-map?horizon= */
export interface RiskMapResponse extends RunInfo {
  horizon: Horizon
  districts: DistrictSummary[]
}

export interface OverviewQuery {
  horizon: Horizon
  state?: string | null
}

/** GET /districts?search=&state= */
export interface DistrictListQuery {
  search?: string
  state?: string | null
}
export interface DistrictListResponse {
  districts: DistrictRef[]
  states: string[]
}

/** GET /blind-spots?state= */
export interface BlindSpotListResponse extends RunInfo {
  items: BlindSpotAssessment[]
}

/** POST /blind-spots/{id}/review */
export interface BlindSpotReviewResponse {
  review: BlindSpotReview
  /** Mock mode: true → UI shows "Demo mode: not sent to a real system". */
  demo: boolean
}

/** GET /actions?district=&priority=&status= */
export interface ActionListQuery {
  state?: string | null
  district?: string | null
  priority?: ActionPriority | null
  status?: ActionStatus | null
}
export interface ActionListResponse {
  items: ActionTask[]
}
/** POST /actions, PATCH /actions/{id} */
export interface ActionMutationResponse {
  action: ActionTask
  demo: boolean
}

/** Groups SHAP features for bulletin wording ("rainfall_lag2" → "rainfall"). */
export type FactorKey = 'rainfall' | 'recent_cases' | 'neighbour_cases' | 'season' | 'temperature' | 'humidity' | 'testing_level' | 'other'

/** Fixed data-limitation statements; the bulletin translates each by key. */
export type LimitationKey =
  | 'synthetic_demo'
  | 'hmis_ends_2022'
  | 'monthly_batch'
  | 'blind_spot_experimental'
  | 'boundaries_indicative'
  | 'missing_reports'
  | 'stale_reports'

/** Matrix cell or task origin; the bulletin translates the action by key. */
export type BulletinActionKey = DecisionQuadrant | 'watch_check' | 'audit_flag' | 'manual'

/** One row per district in scope — also the bulletin CSV. */
export interface BulletinRow {
  district: DistrictRef
  target_month: YearMonth | null
  probability: number | null
  category: RiskCategory | null
  expected_cases: number | null
  blind_spot_score: number | null
  blind_spot_band: BlindSpotBand | null
  last_reported_month: YearMonth | null
  months_stale: number
  missing_months: number
  source: DataSource
}

/**
 * POST /reports/generate. Language-neutral facts only: the frontend renders
 * them with fixed-label templates (EN / HI / TA), so a translation can change
 * wording but never a number, a name or an action.
 */
export interface Bulletin {
  id: string
  generated_at: IsoDateTime
  as_of: YearMonth
  scope: 'district' | 'state' | 'national'
  /** District name, state name, or "India". */
  scope_label: string
  language: Language
  /** HI / TA templates are machine-assisted → "Translation pending review". */
  translation_status: 'original' | 'machine_pending_review'
  horizon: Horizon
  target_month: YearMonth
  districts_covered: number
  risk_counts: { category: RiskCategory | 'no_data'; count: number }[]
  /** Highest-probability districts, highest first (max 10). */
  top_risk: { district: DistrictRef; category: RiskCategory; probability: number; expected_cases: number | null }[]
  blind_spots: { district: DistrictRef; score: number; band: BlindSpotBand; latest_review: ReviewDecision | null }[]
  key_factors: { factor: FactorKey; direction: ShapDirection; districts: number }[]
  actions: { district: DistrictRef; priority: ActionPriority; status: ActionStatus; action_key: BulletinActionKey; action_text: string }[]
  limitations: { key: LimitationKey; count?: number }[]
  rows: BulletinRow[]
  source: DataSource
}

/** GET /data-sources */
export interface DataSourcesResponse {
  items: DataSourceStatus[]
}
