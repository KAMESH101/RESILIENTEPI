import { create } from 'zustand'
import { DECISION_MATRIX } from '@/config/actions'
import { isHighOrAbove } from '@/config/risk'
import type { ActionPriority, DistrictRef, ResponsibleTeam, RiskCategory } from '@/types'

export interface CreateActionPrefill {
  district: DistrictRef | null
  suggested_action: string
  priority: ActionPriority
  responsible_team: ResponsibleTeam
  reason?: string
}

interface State {
  open: boolean
  prefill: CreateActionPrefill | null
  /** Changes on every open so the form remounts with fresh state. */
  nonce: number
  openWith: (p: CreateActionPrefill | null) => void
  close: () => void
}

export const useCreateAction = create<State>((set) => ({
  open: false,
  prefill: null,
  nonce: 0,
  openWith: (prefill) => set((s) => ({ open: true, prefill, nonce: s.nonce + 1 })),
  close: () => set({ open: false }),
}))

/** Prefill from the decision matrix for a district's risk and blind-spot status. */
export function prefillFor(district: DistrictRef, category: RiskCategory | null, flagged: boolean, reason?: string): CreateActionPrefill {
  const high = category ? isHighOrAbove(category) : false
  const q = high ? (flagged ? 'high_risk_blind_spot' : 'high_risk_no_blind_spot') : flagged ? 'low_risk_blind_spot' : 'low_risk_no_blind_spot'
  const rule = DECISION_MATRIX[q]
  return { district, suggested_action: rule.action, priority: rule.priority, responsible_team: rule.team, reason }
}
