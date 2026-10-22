import type { BlindSpotBand, BlindSpotComponentKey } from '@/types'

/** Default weights of the experimental blind-spot indicator (prompt §2). Must sum to 1. */
export const BLIND_SPOT_WEIGHTS: Record<BlindSpotComponentKey, number> = {
  expected_gap: 0.35,
  low_testing: 0.25,
  high_positivity: 0.15,
  low_completeness: 0.15,
  fever_divergence: 0.1,
}

export const BLIND_SPOT_COMPONENT_ORDER: readonly BlindSpotComponentKey[] = [
  'expected_gap',
  'low_testing',
  'high_positivity',
  'low_completeness',
  'fever_divergence',
]

export const BLIND_SPOT_COMPONENT_LABELS: Record<BlindSpotComponentKey, string> = {
  expected_gap: 'Expected vs reported gap',
  low_testing: 'Low testing per 100k',
  high_positivity: 'High test positivity',
  low_completeness: 'Low reporting completeness',
  fever_divergence: 'Fever admissions vs dengue reports',
}

export const BLIND_SPOT_COMPONENT_SIGNALS: Record<BlindSpotComponentKey, string> = {
  expected_gap: 'The climate and neighbour model expects far more cases than were reported',
  low_testing: 'Testing well below the state median',
  high_positivity: 'Few tests, but a high share positive',
  low_completeness: 'Missing or late reports',
  fever_divergence: 'Fever admissions rising while dengue reports stay flat',
}

/**
 * Score bands (0–100). These cut-offs are a DEMO ASSUMPTION, not a validated
 * threshold — the UI says so wherever a band is shown.
 */
export const BLIND_SPOT_FLAG_THRESHOLD = 50
export const BLIND_SPOT_WATCH_THRESHOLD = 35

export function blindSpotBand(score: number): BlindSpotBand {
  if (score >= BLIND_SPOT_FLAG_THRESHOLD) return 'flagged'
  if (score >= BLIND_SPOT_WATCH_THRESHOLD) return 'watch'
  return 'none'
}

export const BLIND_SPOT_LABEL =
  'Experimental surveillance blind-spot indicator — not proof of under-reporting.'

export const BLIND_SPOT_THRESHOLD_NOTE = `Demo assumption: score ${BLIND_SPOT_FLAG_THRESHOLD}+ = potential blind spot, ${BLIND_SPOT_WATCH_THRESHOLD}–${BLIND_SPOT_FLAG_THRESHOLD - 1} = watch. These cut-offs are not yet validated.`
