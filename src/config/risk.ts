import type { RiskCategory } from '@/types'

/** Outbreak = cases above the district's seasonal Nth percentile for that calendar month. */
export const OUTBREAK_PERCENTILE = 75

/** Lower bound (inclusive) of each category's probability band (prompt §2). */
export const RISK_THRESHOLDS: Record<RiskCategory, number> = {
  low: 0,
  moderate: 0.25,
  high: 0.5,
  very_high: 0.75,
}

export const RISK_ORDER: readonly RiskCategory[] = ['low', 'moderate', 'high', 'very_high']

export function categorize(probability: number): RiskCategory {
  if (probability >= RISK_THRESHOLDS.very_high) return 'very_high'
  if (probability >= RISK_THRESHOLDS.high) return 'high'
  if (probability >= RISK_THRESHOLDS.moderate) return 'moderate'
  return 'low'
}

export function isHighOrAbove(category: RiskCategory): boolean {
  return category === 'high' || category === 'very_high'
}

/** Plain-language likelihood word shown next to a probability: "Likely (62%)". */
export function likelihoodWord(probability: number): string {
  if (probability >= 0.75) return 'Very likely'
  if (probability >= 0.5) return 'Likely'
  if (probability >= 0.25) return 'Possible'
  return 'Unlikely'
}

/** Data older than this many months is shown as "Low confidence". */
export const STALE_AFTER_MONTHS = 3
