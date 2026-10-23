/**
 * Mock backend entry point. Loaded with a dynamic import only when
 * VITE_API_MODE=mock, so it never ships in a live build's main chunk.
 */
import { DEMO_AS_OF, MOCK_DELAY_MS } from '@/config/demo'
import type { Role } from '@/types'
import { resetMockDb } from './db'
import { getDataset } from './generate'
import * as h from './handlers'
import { applyLgdCodes } from './lgd'

type Handler = (req: h.MockRequest) => unknown

const routes: [method: string, pattern: string, handler: Handler][] = [
  ['GET', '/overview', h.getOverview],
  ['GET', '/risk-map', h.getRiskMap],
  ['GET', '/districts', h.listDistricts],
  ['GET', '/districts/:id', h.getDistrict],
  ['GET', '/districts/:id/explanations', h.getExplanations],
  ['GET', '/blind-spots', h.listBlindSpots],
  ['POST', '/blind-spots/:id/review', h.reviewBlindSpot],
  ['GET', '/actions', h.listActions],
  ['POST', '/actions', h.createAction],
  ['PATCH', '/actions/:id', h.updateAction],
  ['GET', '/model-performance', h.getModelPerformance],
  ['GET', '/data-sources', h.getDataSources],
]

function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/')
  const b = path.split('/')
  if (a.length !== b.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.startsWith(':')) params[a[i]!.slice(1)] = decodeURIComponent(b[i]!)
    else if (a[i] !== b[i]) return null
  }
  return params
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export { MockHttpError } from './handlers'

export async function handleMock(
  method: string,
  path: string,
  query: URLSearchParams,
  body: unknown,
  role: Role,
): Promise<unknown> {
  await Promise.all([
    sleep(MOCK_DELAY_MS.min + Math.random() * (MOCK_DELAY_MS.max - MOCK_DELAY_MS.min)),
    applyLgdCodes(getDataset(DEMO_AS_OF)),
  ])
  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue
    const params = match(pattern, path)
    if (params) return structuredClone(handler({ query, body, params, role }))
  }
  throw new h.MockHttpError(404, `No mock route for ${method} ${path}`)
}

export function resetDemo(): void {
  resetMockDb()
}
