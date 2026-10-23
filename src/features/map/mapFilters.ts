import { useMemo } from 'react'
import { useFilters } from '@/app/filters'
import { isHighOrAbove, riskBand } from '@/config/risk'
import type { DistrictSummary } from '@/types'

/** `risk=high` means High or Very High (the Overview KPI links here). */
export type RiskFilter = 'high' | 'very_high' | 'moderate' | 'low'
export type BlindSpotFilter = 'flagged' | 'any'

export const RISK_FILTER_LABELS: Record<RiskFilter, string> = {
  high: 'High or Very High',
  very_high: 'Very High only',
  moderate: 'Moderate',
  low: 'Low',
}

export const BS_FILTER_LABELS: Record<BlindSpotFilter, string> = {
  flagged: 'Potential blind spots',
  any: 'Blind spot or watch',
}

const asRisk = (v: string | null): RiskFilter | null => (v && v in RISK_FILTER_LABELS ? (v as RiskFilter) : null)
const asBs = (v: string | null): BlindSpotFilter | null => (v && v in BS_FILTER_LABELS ? (v as BlindSpotFilter) : null)

export function matchesRisk(s: DistrictSummary, f: RiskFilter | null): boolean {
  if (!f) return true
  const c = s.forecast?.category
  if (!c) return false
  return f === 'high' ? isHighOrAbove(c) : c === f
}

export function matchesBlindSpot(s: DistrictSummary, f: BlindSpotFilter | null): boolean {
  if (!f) return true
  const band = s.blind_spot?.band ?? 'none'
  return f === 'flagged' ? band === 'flagged' : band !== 'none'
}

/** Map-page filters, all URL-backed: horizon & state (shared) plus risk and blind spot. */
export function useMapFilters() {
  const filters = useFilters()
  const risk = asRisk(filters.params.get('risk'))
  const bs = asBs(filters.params.get('bs'))
  const { state } = filters
  const matches = useMemo(
    () => (s: DistrictSummary) => (!state || s.district.state === state) && matchesRisk(s, risk) && matchesBlindSpot(s, bs),
    [state, risk, bs],
  )
  return { ...filters, risk, bs, matches }
}

export function riskLabel(s: DistrictSummary): string {
  return s.forecast ? riskBand(s.forecast.category).label : 'No data'
}
