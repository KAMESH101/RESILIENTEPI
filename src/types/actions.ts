import type { DataSource, DistrictRef, IsoDateTime, RiskCategory, Role } from './common'

export type ActionStatus = 'pending' | 'in_progress' | 'completed'

export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low'

/** Cell of the decision matrix (prompt §8 Phase 4). */
export type DecisionQuadrant =
  | 'high_risk_blind_spot'
  | 'high_risk_no_blind_spot'
  | 'low_risk_blind_spot'
  | 'low_risk_no_blind_spot'

export type ResponsibleTeam =
  | 'district_surveillance_unit'
  | 'rapid_response_team'
  | 'laboratory'
  | 'vector_control'
  | 'hospital_preparedness'
  | 'data_quality'

export interface ActionNote {
  id: string
  text: string
  author_name: string
  author_role: Role
  created_at: IsoDateTime
}

/** Inline history line, e.g. "Status Pending → In Progress · A. Officer · 22 Oct 2026, 14:05". */
export interface ActionHistoryEntry {
  id: string
  change: 'created' | 'assigned' | 'status' | 'note' | 'priority'
  from: string | null
  to: string | null
  actor_name: string
  actor_role: Role
  created_at: IsoDateTime
}

export interface ActionTask {
  id: string
  district: DistrictRef
  severity: RiskCategory
  blind_spot_flagged: boolean
  quadrant: DecisionQuadrant
  /** Plain-language reason the task exists. */
  reason: string
  suggested_action: string
  priority: ActionPriority
  responsible_team: ResponsibleTeam
  assignee: string | null
  status: ActionStatus
  notes: ActionNote[]
  history: ActionHistoryEntry[]
  created_at: IsoDateTime
  updated_at: IsoDateTime
  source: DataSource
}
