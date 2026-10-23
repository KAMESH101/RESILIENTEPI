/**
 * CSV exports — the Reports page is the single place for all exports.
 * Every file: UTF-8 with BOM, a `source` column, formula-injection guard (lib/csv).
 */
import { ORIGIN_LABELS, PRIORITY_LABELS, STATUS_LABELS, TEAM_LABELS } from '@/config/actions'
import { riskBand } from '@/config/risk'
import { BULLETIN_STRINGS } from '@/i18n/bulletin'
import { downloadCsv, toCsv } from '@/lib/csv'
import type { ActionTask, Bulletin, DistrictSummary } from '@/types'

const pct = (p: number | null) => (p == null ? '' : Math.round(p * 100))

/** The bulletin's district rows, with headers and labels in the bulletin language. */
export function bulletinCsv(b: Bulletin): string {
  const t = BULLETIN_STRINGS[b.language]
  const c = t.col
  return toCsv(
    [c.district, c.state, c.lgd, c.month, c.probability, c.category, c.expected, c.score, c.band, c.lastReport, c.monthsStale, c.missing, c.source],
    b.rows.map((r) => [
      r.district.name,
      r.district.state,
      r.district.lgd_code ?? '',
      r.target_month ?? '',
      pct(r.probability),
      r.category ? t.categories[r.category] : t.noData,
      r.expected_cases ?? '',
      r.blind_spot_score ?? '',
      r.blind_spot_band ? t.band[r.blind_spot_band] : '',
      r.last_reported_month ?? t.noData,
      r.months_stale,
      r.missing_months,
      r.source,
    ]),
  )
}

/** Every district at one horizon (English headers). */
export function districtsCsv(rows: DistrictSummary[]): string {
  return toCsv(
    ['district_id', 'district', 'state', 'lgd_code', 'horizon_months', 'target_month', 'probability_pct', 'risk_category', 'expected_cases', 'blind_spot_score', 'blind_spot_band', 'last_report', 'months_since_report', 'missing_months_last_12', 'source'],
    rows.map((s) => [
      s.district.id,
      s.district.name,
      s.district.state,
      s.district.lgd_code ?? '',
      s.forecast?.horizon ?? '',
      s.forecast?.target_month ?? '',
      pct(s.forecast?.probability ?? null),
      s.forecast ? riskBand(s.forecast.category).label : 'No data',
      s.forecast?.expected_cases ?? '',
      s.blind_spot?.score ?? '',
      s.blind_spot?.band ?? '',
      s.freshness.last_reported_month ?? 'No data',
      s.freshness.months_stale,
      s.freshness.missing_months.length,
      s.forecast?.source ?? s.blind_spot?.source ?? 'synthetic',
    ]),
  )
}

/** Action Centre tasks (English headers). Free text is guarded against formulas. */
export function tasksCsv(tasks: ActionTask[]): string {
  return toCsv(
    ['task_id', 'priority', 'status', 'district', 'state', 'origin', 'suggested_action', 'responsible_team', 'assignee', 'reason', 'note_on_task', 'created_at', 'updated_at', 'source'],
    tasks.map((t) => [
      t.id,
      PRIORITY_LABELS[t.priority],
      STATUS_LABELS[t.status],
      t.district.name,
      t.district.state,
      ORIGIN_LABELS[t.origin],
      t.suggested_action,
      TEAM_LABELS[t.responsible_team],
      t.assignee ?? '',
      t.reason,
      t.context_note ?? '',
      t.created_at,
      t.updated_at,
      t.source,
    ]),
  )
}

export function saveCsv(name: string, csv: string): void {
  downloadCsv(`resilientepi-${name}.csv`, csv)
}
