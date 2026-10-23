/**
 * Plain-language content for the Methodology & Data page (prompt §2, §8 Phase 6).
 * Describes the method only — no results. Model results come from
 * GET /model-performance and are "Validation pending" in demo mode.
 */
import type { DataSourceHealth, DataSourceTypeTag, MetricKey, ModelName } from '@/types'

export const MODEL_LABELS: Record<ModelName, { name: string; role: string }> = {
  lightgbm_pooled: {
    name: 'National pooled LightGBM classifier',
    role: 'Main model: the chance that cases exceed the outbreak threshold. One model for all districts, so districts with few cases still get forecasts.',
  },
  negative_binomial: {
    name: 'Negative-binomial count model',
    role: 'Expected number of cases, and a second opinion to compare against.',
  },
  seasonal_naive: { name: 'Seasonal naive baseline', role: 'Same month last year.' },
  persistence: { name: 'Persistence baseline', role: 'Last month’s value.' },
  historical_average: { name: 'Historical average baseline', role: 'Average of the same calendar month in past years.' },
}

export const MODEL_ORDER: ModelName[] = ['lightgbm_pooled', 'negative_binomial', 'seasonal_naive', 'persistence', 'historical_average']

export const METRICS: Record<MetricKey, { label: string; plain: string; better: 'higher' | 'lower'; countOnly?: boolean }> = {
  auprc: {
    label: 'AUPRC',
    plain: 'How well the model ranks real outbreaks above non-outbreaks (0–1). Suited to rare events.',
    better: 'higher',
  },
  precision_top20: {
    label: 'Precision of the top-20 alerts',
    plain: 'Of the 20 highest-risk alerts each month, the share that were real outbreaks.',
    better: 'higher',
  },
  lead_time_months: {
    label: 'Lead time',
    plain: 'Months of warning before the peak of an outbreak.',
    better: 'higher',
  },
  brier_score: {
    label: 'Brier score (calibration)',
    plain: 'Whether forecast chances match how often outbreaks really happen. Lower is better.',
    better: 'lower',
  },
  mae: { label: 'MAE', plain: 'Average size of the error in the case count (count model only).', better: 'lower', countOnly: true },
  rmse: { label: 'RMSE', plain: 'Like MAE, but large misses count more (count model only).', better: 'lower', countOnly: true },
}

export const METRIC_ORDER: MetricKey[] = ['auprc', 'precision_top20', 'lead_time_months', 'brier_score', 'mae', 'rmse']

export const FEATURES: { name: string; detail: string }[] = [
  { name: 'Past cases', detail: 'Cases 1, 2 and 3 months ago, and in the same month last year.' },
  { name: 'Rainfall, temperature and humidity', detail: 'Each 1, 2 and 3 months ago (IMD gridded data via imdlib, Open-Meteo for recent months).' },
  { name: 'El Niño index (ONI)', detail: 'The ocean–climate signal that shifts monsoon patterns.' },
  { name: 'Cases in neighbouring districts', detail: 'Spread from nearby districts (spatial lag).' },
  { name: 'Testing level and fever admissions', detail: 'How much testing happens, and fever cases seen at facilities.' },
  { name: 'Month and season', detail: 'Dengue follows the monsoon; the season is starting earlier and lasting longer.' },
]

export const VALIDATION_STEPS: string[] = [
  'Walk-forward backtest: the model is trained only on months before each forecast, then scored on what actually happened — never on data it has already seen.',
  'Every metric is reported next to the three baselines, so the model must beat simple rules to be useful.',
  'Results are shown by horizon (1, 2, 3 months) and by state, with the model version and evaluation date.',
]

/**
 * Three independent tests are planned (prompt §2); only one is specified so far.
 * Add the other two here when the team defines them — never invent them.
 */
export const BLIND_SPOT_VALIDATION = {
  planned: 3,
  defined: ['A synthetic test that hides real reports and checks whether the indicator flags the gap.'],
}

export const DATA_REALITY: string[] = [
  'HMIS district-month data ends in 2022, so the district model is retrospective.',
  'A live state-level view comes from IDSP outbreak records.',
  'All sources are joined on LGD district codes.',
  'The pipeline runs as a monthly batch for 700+ districts. “Last updated” means the last monthly run, not real time.',
  'The demo timeline after 2022 is synthetic and labelled as such everywhere in the app.',
]

export const SOURCE_TYPE_LABELS: Record<DataSourceTypeTag, string> = {
  live: 'Live',
  imported_historical: 'Imported historical',
  delayed: 'Delayed',
  synthetic_demo: 'Synthetic demo',
}

export const SOURCE_STATUS_LABELS: Record<DataSourceHealth, string> = {
  ok: 'Available',
  degraded: 'Degraded',
  unavailable: 'Unavailable',
  not_connected: 'Not connected (demo)',
}
