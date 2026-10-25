/**
 * Typed API client. VITE_API_MODE decides whether requests go to the seeded
 * mock backend or to the FastAPI service — nothing else changes.
 */
import { API_BASE_URL, API_MODE } from '@/config/demo'
import type { Role } from '@/types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Query = Record<string, string | number | null | undefined>

let getRole: () => Role = () => 'district_officer'

/** Lets the session store supply the demo role without a circular import. */
export function configureApi(opts: { getRole: () => Role }): void {
  getRole = opts.getRole
}

function toParams(query?: Query): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v != null && v !== '') p.set(k, String(v))
  return p
}

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  opts: { query?: Query; body?: unknown } = {},
): Promise<T> {
  const params = toParams(opts.query)

  if (API_MODE === 'mock') {
    const mock = await import('./mock')
    try {
      return (await mock.handleMock(method, path, params, opts.body, getRole())) as T
    } catch (e) {
      if (e instanceof mock.MockHttpError) throw new ApiError(e.status, e.message)
      throw e
    }
  }

  const qs = params.toString()
  const res = await fetch(`${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
    method,
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const j = (await res.json()) as { detail?: string }
      if (j.detail) message = j.detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
}

/** Demo only: clears browser-stored reviews and action edits. No-op in live mode. */
export async function resetDemoData(): Promise<void> {
  if (API_MODE !== 'mock') return
  const mock = await import('./mock')
  mock.resetDemo()
}

export const isDemoMode = API_MODE === 'mock'
