import type { DataSource, DistrictRef, IsoDateTime, RiskCategory, Role } from './common'

export type ActionStatus = 'pending' | 'in_progress' | 'completed'

/**
 * P1 = High risk + blind spot; P2 = High risk alone, or Low risk + blind spot;
 * P3 = everything else (rules in config/actions.ts).
 */
export type ActionPriority = 'p1' | 'p2' | 'p3'

/** Cell of the decision matrix (prompt §8 Phase 4). High = High + Very High; Low = Low + Moderate. */
export type DecisionQuadrant =
  | 'high_risk_blind_spot'
  | 'high_risk_no_blind_spot'
  | 'low_risk_blind_spot'
  | 'low_risk_no_blind_spot'

/** What produced the task. */
export type ActionOrigin =
  | 'decision_matrix'
  /** Blind-spot watch band (35–49): verify data completeness. */
  | 'watch_check'
  /** An officer chose "Flag for audit" on the Blind-Spot page. */
  | 'audit_flag'
  | 'manual'

/** Blind-spot state as the matrix sees it. Watch and dismissed count as "no blind spot". */
export type ActionBlindSpotStatus = 'flagged' | 'dismissed' | 'watch' | 'none'

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

/** Inline history line, e.g. "Status Pending → In Progress · Demo District Officer · 22 Oct 2026, 14:05". */
export interface ActionHistoryEntry {
  id: string
  change: 'created' | 'assigned' | 'status' | 'note' | 'priority' | 'recommendation'
  from: string | null
  to: string | null
  actor_name: string
  actor_role: Role
  created_at: IsoDateTime
}

export interface ActionTask {
  /** Stable: generated tasks are keyed by district + rule, so reloads never duplicate them. */
  id: string
  origin: ActionOrigin
  district: DistrictRef
  severity: RiskCategory
  /** True only when the blind spot counts for the matrix (flagged and not dismissed). */
  blind_spot_flagged: boolean
  blind_spot_status: ActionBlindSpotStatus
  quadrant: DecisionQuadrant
  /** Plain-language reason the task exists. */
  reason: string
  /** e.g. "Blind spot dismissed by District Officer, 23 Oct 2026". */
  context_note: string | null
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
