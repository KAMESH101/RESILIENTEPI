/**
 * Joins forecast records to boundary features. LGD codes are the join key; a
 * name match (with known historical spellings) is used only when LGD codes are
 * missing, and callers must label it as such.
 */
import { DISTRICT_NAME_ALIASES, STATE_NAME_ALIASES } from '@/config/geo'
import { normaliseName } from '@/lib/names'
import type { DistrictRef, DistrictSummary } from '@/types'
import type { BoundaryFeature } from './boundaries'

export interface JoinResult<T extends { district: DistrictRef } = DistrictSummary> {
  /** Record for each feature index, or null → rendered "No data". */
  byFeature: (T | null)[]
  /** Feature index for each district id that found a shape. */
  featureOf: Map<string, number>
  method: 'lgd' | 'name' | 'mixed'
  /** Records with data but no matching shape (shown in the table only). */
  unmatched: T[]
}

function variants(name: string, aliases: Record<string, string[]>): string[] {
  const n = normaliseName(name)
  return [n, ...(aliases[n] ?? []).map(normaliseName)]
}

export function joinBoundaries<T extends { district: DistrictRef }>(features: BoundaryFeature[], summaries: T[]): JoinResult<T> {
  const byFeature: (T | null)[] = features.map(() => null)
  const featureOf = new Map<string, number>()

  const byLgd = new Map<string, number>()
  const byStateName = new Map<string, number>()
  const byName = new Map<string, number[]>()
  features.forEach((f, i) => {
    const p = f.properties
    if (p.lgd_code) byLgd.set(p.lgd_code, i)
    const n = normaliseName(p.district)
    byStateName.set(`${normaliseName(p.state)}|${n}`, i)
    byName.set(n, [...(byName.get(n) ?? []), i])
  })

  let viaLgd = 0
  let viaName = 0
  const unmatched: T[] = []

  for (const s of summaries) {
    let idx: number | undefined
    if (s.district.lgd_code) {
      idx = byLgd.get(s.district.lgd_code)
      if (idx !== undefined) viaLgd++
    }
    if (idx === undefined) {
      const states = variants(s.district.state, STATE_NAME_ALIASES)
      const names = variants(s.district.name, DISTRICT_NAME_ALIASES)
      outer: for (const st of states) {
        for (const nm of names) {
          idx = byStateName.get(`${st}|${nm}`)
          if (idx !== undefined) break outer
        }
      }
      // Last resort: a district name that is unique nationally.
      if (idx === undefined) {
        for (const nm of names) {
          const hits = byName.get(nm)
          if (hits?.length === 1) {
            idx = hits[0]
            break
          }
        }
      }
      if (idx !== undefined) viaName++
    }
    if (idx === undefined || byFeature[idx]) {
      unmatched.push(s)
      continue
    }
    byFeature[idx] = s
    featureOf.set(s.district.id, idx)
  }

  return { byFeature, featureOf, method: viaName === 0 ? 'lgd' : viaLgd === 0 ? 'name' : 'mixed', unmatched }
}
