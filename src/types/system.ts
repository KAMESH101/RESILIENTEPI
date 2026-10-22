import type { DataSource, Horizon, IsoDateTime, YearMonth } from './common'

export type MetricKey =
  | 'auprc'
  | 'precision_top20'
  | 'lead_time_months'
  | 'brier_score'
  | 'mae'
  | 'rmse'

export type ModelName =
  | 'lightgbm_pooled'
  | 'negative_binomial'
  | 'seasonal_naive'
  | 'persistence'
  | 'historical_average'

export interface MetricRow {
  model: ModelName
  horizon: Horizon
  /** Null for metrics that don't apply (MAE/RMSE are count-model only). */
  values: Partial<Record<MetricKey, number | null>>
  state: string | null
}

/** GET /model-performance. In demo mode this is always `pending` — no example
 *  accuracy is ever shown (prompt §7). */
export type ModelPerformanceResponse =
  | { status: 'pending'; message: string; model_version: null; evaluated_at: null }
  | {
      status: 'available'
      model_version: string
      evaluated_at: IsoDateTime
      backtest: 'walk_forward'
      rows: MetricRow[]
      limitations: string[]
      source: DataSource
    }

export type DataSourceTypeTag = 'live' | 'imported_historical' | 'delayed' | 'synthetic_demo'

export type DataSourceHealth = 'ok' | 'degraded' | 'unavailable' | 'not_connected'

/** GET /data-sources — one entry per upstream source. */
export interface DataSourceStatus {
  id: 'hmis' | 'idsp' | 'ncvbdc' | 'imd' | 'open_meteo'
  name: string
  description: string
  type_tag: DataSourceTypeTag
  status: DataSourceHealth
  last_success_at: IsoDateTime | null
  coverage: { from: YearMonth; to: YearMonth } | null
  warnings: string[]
}
