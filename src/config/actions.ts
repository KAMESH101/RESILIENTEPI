import type { ActionPriority, DecisionQuadrant, ResponsibleTeam } from '@/types'

/** Decision matrix that generates Action Centre recommendations (prompt §8 Phase 4). */
export const DECISION_MATRIX: Record<
  DecisionQuadrant,
  { action: string; priority: ActionPriority; team: ResponsibleTeam }
> = {
  high_risk_blind_spot: {
    action:
      'Prioritise field surveillance, testing teams, test-kit allocation and vector-control assessment',
    priority: 'urgent',
    team: 'rapid_response_team',
  },
  high_risk_no_blind_spot: {
    action: 'Strengthen preparedness, clinical readiness and vector control',
    priority: 'high',
    team: 'hospital_preparedness',
  },
  low_risk_blind_spot: {
    action: 'Audit testing and reporting, check completeness, investigate possible under-reporting',
    priority: 'medium',
    team: 'data_quality',
  },
  low_risk_no_blind_spot: {
    action: 'Routine surveillance; monitor for changes',
    priority: 'low',
    team: 'district_surveillance_unit',
  },
}

export const HUMAN_REVIEW_NOTE =
  'Recommendations need human review and approval. ResilientEpi does not start interventions.'
