/**
 * Browser-persisted state for demo edits (blind-spot reviews, action changes).
 * Generated tasks are rebuilt from the seed on every request; only the user's
 * changes live here, keyed by stable task id, so nothing is ever duplicated.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ActionHistoryEntry, ActionNote, ActionStatus, ActionTask, BlindSpotReview, YearMonth } from '@/types'

/** User changes layered over a generated task. */
export interface ActionEdit {
  status?: ActionStatus
  assignee?: string | null
  notes: ActionNote[]
  history: ActionHistoryEntry[]
  updated_at: string
}

interface MockDbState {
  /** As-of month the stored edits belong to; edits from another month are discarded. */
  asOf: YearMonth | null
  actionEdits: Record<string, ActionEdit>
  /** Tasks created by officers (POST /actions), with their own edits applied. */
  manualActions: ActionTask[]
  reviews: Record<string, BlindSpotReview[]>
}

const empty: MockDbState = { asOf: null, actionEdits: {}, manualActions: [], reviews: {} }

export const useMockDb = create<MockDbState>()(
  persist(() => empty, {
    name: 'resilientepi-demo-db',
    // v2: tasks became generated + edits (v1 stored whole task lists).
    version: 2,
    migrate: () => empty,
    storage: createJSONStorage(() => localStorage),
  }),
)

export function ensureAsOf(asOf: YearMonth): void {
  if (useMockDb.getState().asOf !== asOf) useMockDb.setState({ ...empty, asOf })
}

export function resetMockDb(): void {
  useMockDb.setState({ ...empty })
}
