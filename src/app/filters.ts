/**
 * Filters live in the URL so views can be shared and the back button works.
 * Zustand is only for session state; never mirror these params into a store.
 */
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Horizon } from '@/types'

export const FILTER_PARAMS = { horizon: 'h', state: 'state', district: 'district' } as const

function parseHorizon(v: string | null): Horizon {
  return v === '2' ? 2 : v === '3' ? 3 : 1
}

export function useFilters() {
  const [params, setParams] = useSearchParams()
  const horizon = parseHorizon(params.get(FILTER_PARAMS.horizon))
  const state = params.get(FILTER_PARAMS.state) || null

  /** Set or clear any query params (null/'' removes). Pushes a history entry. */
  const setParam = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v == null || v === '') next.delete(k)
          else next.set(k, String(v))
        }
        return next
      })
    },
    [setParams],
  )

  return useMemo(
    () => ({
      horizon,
      state,
      params,
      setHorizon: (h: Horizon) => setParam({ [FILTER_PARAMS.horizon]: h === 1 ? null : h }),
      setState: (s: string | null) => setParam({ [FILTER_PARAMS.state]: s }),
      setParam,
    }),
    [horizon, state, params, setParam],
  )
}

/** The shared DistrictPanel is driven by `?district=<id>` on any page. */
export function useDistrictPanel() {
  const [params, setParams] = useSearchParams()
  const openId = params.get(FILTER_PARAMS.district)
  const open = useCallback(
    (id: string) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set(FILTER_PARAMS.district, id)
        return next
      }),
    [setParams],
  )
  const close = useCallback(
    () =>
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete(FILTER_PARAMS.district)
        return next
      }),
    [setParams],
  )
  return { openId, open, close }
}

/** Build a link that keeps the current horizon/state when moving between pages. */
export function withFilters(path: string, current: URLSearchParams, extra: Record<string, string | number | null> = {}): string {
  const next = new URLSearchParams()
  for (const k of [FILTER_PARAMS.horizon, FILTER_PARAMS.state]) {
    const v = current.get(k)
    if (v) next.set(k, v)
  }
  for (const [k, v] of Object.entries(extra)) {
    if (v == null || v === '') next.delete(k)
    else next.set(k, String(v))
  }
  const qs = next.toString()
  return qs ? `${path}?${qs}` : path
}
