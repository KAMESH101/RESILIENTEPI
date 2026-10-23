/**
 * Loads the team-supplied district boundary file. Never fetches boundaries from
 * anywhere else. Missing or invalid → callers show the schematic fallback.
 */
import { useQuery } from '@tanstack/react-query'
import type { Feature, FeatureCollection, Geometry, MultiLineString } from 'geojson'
import { feature, mesh } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import { BOUNDARY_PROPERTY_ALIASES, BOUNDARY_URLS } from '@/config/geo'

export interface BoundaryProps {
  lgd_code: string | null
  district: string
  state: string
  census2011_code: string | null
}

export type BoundaryFeature = Feature<Geometry, BoundaryProps>

export type BoundaryResult =
  | { status: 'missing' }
  | { status: 'invalid'; reason: string; url: string }
  | { status: 'loaded'; url: string; features: BoundaryFeature[]; withoutLgd: number; innerLines: InnerLines }

/**
 * Borders BETWEEN districts only — the map never strokes an outer (coastal,
 * state-union or international) edge. Null for plain GeoJSON: no lines drawn.
 */
export type InnerLines = FeatureCollection | MultiLineString | null

function pick(props: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = props[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}

export function normaliseBoundaries(json: unknown): { features: BoundaryFeature[]; withoutLgd: number; innerLines: InnerLines } {
  let fc: FeatureCollection
  let innerLines: InnerLines = null
  const obj = json as { type?: string; objects?: Record<string, unknown> }
  if (obj?.type === 'Topology' && obj.objects) {
    const topo = json as Topology
    const name = 'districts' in topo.objects ? 'districts' : Object.keys(topo.objects)[0]
    if (!name) throw new Error('TopoJSON has no objects')
    const districtsObj = topo.objects[name]!
    const out = feature(topo, districtsObj)
    fc = out.type === 'FeatureCollection' ? out : { type: 'FeatureCollection', features: [out] }
    const lines = topo.objects.innerlines
    if (lines) {
      const l = feature(topo, lines)
      innerLines = l.type === 'FeatureCollection' ? l : { type: 'FeatureCollection', features: [l] }
    } else {
      // Arcs shared by two different districts = interior borders only.
      innerLines = mesh(topo, districtsObj as Parameters<typeof mesh>[1], (a, b) => a !== b)
    }
  } else if (obj?.type === 'FeatureCollection') {
    fc = json as FeatureCollection
  } else {
    throw new Error('Not a TopoJSON or GeoJSON FeatureCollection')
  }
  if (!fc.features.length) throw new Error('File contains no district features')

  let withoutLgd = 0
  const features = fc.features.map((f, i) => {
    const p = (f.properties ?? {}) as Record<string, unknown>
    const district = pick(p, BOUNDARY_PROPERTY_ALIASES.district)
    const state = pick(p, BOUNDARY_PROPERTY_ALIASES.state)
    if (!district || !state) throw new Error(`Feature ${i + 1} is missing a district or state name`)
    const lgd = pick(p, BOUNDARY_PROPERTY_ALIASES.lgd_code)
    if (!lgd) withoutLgd++
    return {
      ...f,
      properties: { lgd_code: lgd, district, state, census2011_code: pick(p, BOUNDARY_PROPERTY_ALIASES.census2011_code) },
    } as BoundaryFeature
  })
  return { features, withoutLgd, innerLines }
}

async function loadBoundaries(): Promise<BoundaryResult> {
  for (const url of BOUNDARY_URLS) {
    let res: Response
    try {
      res = await fetch(url)
    } catch {
      continue
    }
    // The dev server answers unknown paths with index.html, so check the type too.
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || type.includes('text/html')) continue
    try {
      const { features, withoutLgd, innerLines } = normaliseBoundaries(await res.json())
      return { status: 'loaded', url, features, withoutLgd, innerLines }
    } catch (e) {
      return { status: 'invalid', url, reason: e instanceof Error ? e.message : 'Could not read the file' }
    }
  }
  return { status: 'missing' }
}

export function useBoundaries() {
  return useQuery({ queryKey: ['boundaries'], queryFn: loadBoundaries, staleTime: Infinity, retry: false })
}
