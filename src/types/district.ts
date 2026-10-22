import type { ActionTask } from './actions'
import type { BlindSpotAssessment, BlindSpotSummary } from './blindspot'
import type { DataFreshness, DistrictRef, Horizon } from './common'
import type { BaselinePoint, HorizonForecast, MonthlyObservation, ShapReason } from './forecast'

/** One row everywhere a district is listed: tables, map features, overview lists.
 *  Also the data the shared DistrictPanel renders. */
export interface DistrictSummary {
  district: DistrictRef
  /** Forecast for the requested horizon. Null when the district has no forecast (No data). */
  forecast: HorizonForecast | null
  blind_spot: BlindSpotSummary | null
  /** e.g. "Madurai: High risk in 2 months. Main reason: rainfall 2 months ago was 38% above normal." */
  summary_sentence: string
  /** Up to 3 SHAP reasons; empty array → "Explanation not yet available". */
  top_reasons: ShapReason[]
  /** Last 12 months of reported cases for the sparkline (null = No data). */
  case_trend: { month: string; reported_cases: number | null }[]
  latest_tests_per_100k: number | null
  latest_test_positivity: number | null
  freshness: DataFreshness
  recommended_action: string
}

/** GET /districts/{district_id} */
export interface DistrictDetail {
  district: DistrictRef
  population: number | null
  summary_sentence: string
  forecasts: HorizonForecast[]
  baselines: BaselinePoint[]
  history: MonthlyObservation[]
  blind_spot: BlindSpotAssessment | null
  freshness: DataFreshness
  recommended_actions: ActionTask[]
  /** Horizon to preselect. SHAP reasons come from the explanations endpoint. */
  default_horizon: Horizon
}
