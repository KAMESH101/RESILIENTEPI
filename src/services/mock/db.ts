/**
 * Browser-persisted state for demo edits (blind-spot reviews, action changes).
 * Seed data is regenerated from the fixed seed; only the user's changes live here.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ActionTask, BlindSpotReview, YearMonth } from '@/types'

interface MockDbState {
  /** As-of month the stored edits belong to; edits from another month are discarded. */
  asOf: YearMonth | null
  /** Null until the first change, then the full edited task list. */
  actions: ActionTask[] | null
  reviews: Record<string, BlindSpotReview[]>
}

const empty: MockDbState = { asOf: null, actions: null, reviews: {} }

export const useMockDb = create<MockDbState>()(
  persist(() => empty, {
    name: 'resilientepi-demo-db',
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
)

export function ensureAsOf(asOf: YearMonth): void {
  if (useMockDb.getState().asOf !== asOf) useMockDb.setState({ ...empty, asOf })
}

export function resetMockDb(): void {
  useMockDb.setState({ ...empty })
}
