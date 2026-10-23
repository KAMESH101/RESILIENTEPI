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

/**
 * Update query params starting from the LIVE URL. React Router's functional
 * updater uses the params from the caller's last render, which can be one
 * navigation behind (e.g. a handler captured before a view switch) and would
 * silently undo that change.
 */
function useUpdateParams() {
  const [, setParams] = useSearchParams()
  return useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(window.location.search)
      mutate(next)
      setParams(next)
    },
    [setParams],
  )
}

export function useFilters() {
  const [params] = useSearchParams()
  const update = useUpdateParams()
  const horizon = parseHorizon(params.get(FILTER_PARAMS.horizon))
  const state = params.get(FILTER_PARAMS.state) || null

  /** Set or clear any query params (null/'' removes). Pushes a history entry. */
  const setParam = useCallback(
    (updates: Record<string, string | number | null | undefined>) =>
      update((next) => {
        for (const [k, v] of Object.entries(updates)) {
          if (v == null || v === '') next.delete(k)
          else next.set(k, String(v))
        }
      }),
    [update],
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
  const [params] = useSearchParams()
  const update = useUpdateParams()
  const openId = params.get(FILTER_PARAMS.district)
  const open = useCallback((id: string) => update((next) => next.set(FILTER_PARAMS.district, id)), [update])
  const close = useCallback(() => update((next) => next.delete(FILTER_PARAMS.district)), [update])
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
