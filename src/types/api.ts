/**
 * Response envelopes for each endpoint in prompt §9. Request bodies live in
 * ./schemas.ts (zod-inferred). Query params are typed here.
 */
import type { ActionPriority, ActionStatus, ActionTask } from './actions'
import type { BlindSpotAssessment, BlindSpotReview } from './blindspot'
import type { DataSource, DistrictRef, Horizon, IsoDateTime, Language, RunInfo } from './common'
import type { DistrictSummary } from './district'
import type { HorizonForecast } from './forecast'
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

/** POST /reports/generate */
export interface Bulletin {
  id: string
  generated_at: IsoDateTime
  scope: 'district' | 'state' | 'national'
  scope_label: string
  language: Language
  /** Non-English text is machine-generated → "Translation pending review". */
  translation_status: 'original' | 'machine_pending_review'
  horizon: Horizon
  sections: {
    forecast_summary: string
    risk_categories: { category: HorizonForecast['category']; count: number }[]
    blind_spot_alerts: string[]
    key_factors: string[]
    recommended_actions: string[]
    data_limitations: string[]
  }
  /** "Demonstration bulletin — not an official government communication." */
  footer: string
  source: DataSource
}

/** GET /data-sources */
export interface DataSourcesResponse {
  items: DataSourceStatus[]
}
