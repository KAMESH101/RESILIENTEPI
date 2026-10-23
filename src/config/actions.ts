import type { ActionOrigin, ActionPriority, ActionStatus, DecisionQuadrant, ResponsibleTeam } from '@/types'

/**
 * Priority rules (agreed for the demo):
 *   P1 = High risk + blind spot
 *   P2 = High risk without a blind spot, or Low risk + blind spot
 *   P3 = everything else
 * "High risk" = High or Very High; "Low risk" = Low or Moderate. Watch-band and
 * dismissed blind spots count as "no blind spot".
 */
export function priorityFor(highRisk: boolean, blindSpot: boolean): ActionPriority {
  if (highRisk && blindSpot) return 'p1'
  if (highRisk || blindSpot) return 'p2'
  return 'p3'
}

/** Decision matrix that generates Action Centre recommendations (prompt §8 Phase 4). */
export const DECISION_MATRIX: Record<DecisionQuadrant, { action: string; priority: ActionPriority; team: ResponsibleTeam }> = {
  high_risk_blind_spot: {
    action: 'Prioritise field surveillance, testing teams, test-kit allocation and vector-control assessment',
    priority: priorityFor(true, true),
    team: 'rapid_response_team',
  },
  high_risk_no_blind_spot: {
    action: 'Strengthen preparedness, clinical readiness and vector control',
    priority: priorityFor(true, false),
    team: 'hospital_preparedness',
  },
  low_risk_blind_spot: {
    action: 'Audit testing and reporting, check completeness, investigate possible under-reporting',
    priority: priorityFor(false, true),
    team: 'data_quality',
  },
  low_risk_no_blind_spot: {
    action: 'Routine surveillance; monitor for changes',
    priority: priorityFor(false, false),
    team: 'district_surveillance_unit',
  },
}

export const MATRIX_ROWS = [
  { key: 'high', label: 'High risk', hint: 'High or Very High' },
  { key: 'low', label: 'Low risk', hint: 'Low or Moderate' },
] as const

export const MATRIX_COLUMNS = [
  { key: 'bs', label: 'Potential blind spot', hint: 'Score 50+, not dismissed' },
  { key: 'none', label: 'No blind spot detected', hint: 'Includes watch band and dismissed' },
] as const

/** Extra task for watch-band districts (score 35–49). */
export const WATCH_TASK = {
  action: 'Verify data completeness: check missing or late facility reports and testing records for the last 3 months',
  team: 'data_quality' as ResponsibleTeam,
  priority: 'p3' as ActionPriority,
}

/** Task created when an officer chooses "Flag for audit" on the Blind-Spot page. */
export const AUDIT_TASK = {
  action: 'Audit testing and reporting: compare lab registers, facility reports and IHIP entries for the last 3 months',
  team: 'data_quality' as ResponsibleTeam,
}

export const HUMAN_REVIEW_NOTE =
  'Recommendations need human review and approval. ResilientEpi does not start interventions.'

export const TEAM_LABELS: Record<ResponsibleTeam, string> = {
  district_surveillance_unit: 'District surveillance unit',
  rapid_response_team: 'Rapid response team',
  laboratory: 'Laboratory',
  vector_control: 'Vector control',
  hospital_preparedness: 'Hospital preparedness',
  data_quality: 'Data quality & audit',
}

export const PRIORITY_LABELS: Record<ActionPriority, string> = { p1: 'P1', p2: 'P2', p3: 'P3' }

export const PRIORITY_RULES: Record<ActionPriority, string> = {
  p1: 'High risk + blind spot',
  p2: 'High risk without a blind spot, or Low risk + blind spot',
  p3: 'Everything else (including watch-band data checks)',
}

export const PRIORITY_RANK: Record<ActionPriority, number> = { p1: 0, p2: 1, p3: 2 }

export const STATUS_LABELS: Record<ActionStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export const ORIGIN_LABELS: Record<ActionOrigin, string> = {
  decision_matrix: 'Decision matrix',
  watch_check: 'Data check (watch)',
  audit_flag: 'Audit flag',
  manual: 'Added by officer',
}
