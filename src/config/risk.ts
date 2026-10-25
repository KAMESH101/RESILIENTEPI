import type { RiskCategory } from '@/types'

/** Outbreak = cases above the district's seasonal Nth percentile for that calendar month. */
export const OUTBREAK_PERCENTILE = 75

export interface RiskBand {
  category: RiskCategory
  /** Inclusive lower bound of the probability band. */
  min: number
  /** Exclusive upper bound (1 is inclusive for the top band). */
  max: number
  label: string
  /** Plain-language likelihood word shown with the percentage: "Likely (62%)". */
  word: string
}

/** Single source of truth for risk categories and likelihood words (prompt §2). */
export const RISK_BANDS: readonly RiskBand[] = [
  { category: 'low', min: 0, max: 0.25, label: 'Low', word: 'Unlikely' },
  { category: 'moderate', min: 0.25, max: 0.5, label: 'Moderate', word: 'Possible' },
  { category: 'high', min: 0.5, max: 0.75, label: 'High', word: 'Likely' },
  { category: 'very_high', min: 0.75, max: 1, label: 'Very High', word: 'Very likely' },
]

export const RISK_ORDER: readonly RiskCategory[] = RISK_BANDS.map((b) => b.category)

export function riskBandForProbability(probability: number): RiskBand {
  const p = Math.min(1, Math.max(0, probability))
  return RISK_BANDS.find((b) => p >= b.min && (p < b.max || b.max === 1)) ?? RISK_BANDS[0]!
}

export function riskBand(category: RiskCategory): RiskBand {
  return RISK_BANDS.find((b) => b.category === category) ?? RISK_BANDS[0]!
}

export function categorize(probability: number): RiskCategory {
  return riskBandForProbability(probability).category
}

export function likelihoodWord(probability: number): string {
  return riskBandForProbability(probability).word
}

export function isHighOrAbove(category: RiskCategory): boolean {
  return RISK_ORDER.indexOf(category) >= RISK_ORDER.indexOf('high')
}

/** Data older than this many months is shown as "Low confidence". */
export const STALE_AFTER_MONTHS = 3
