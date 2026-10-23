import { readFileSync, statSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import { STATES } from '../src/services/mock/districts'

/**
 * Guards the committed boundary file: it may contain ONLY districts of the 12
 * demo states, so no all-India outline or disputed border is ever drawn.
 */
const FILE = 'public/geo/india_districts.topojson'
const FORBIDDEN = /jammu|kashmir|ladakh|arunachal|arunanchal/i

test('boundary file contains only the 12 demo states', () => {
  const topo = JSON.parse(readFileSync(FILE, 'utf8')) as Topology
  const fc = feature(topo, topo.objects.districts!) as GeoJSON.FeatureCollection
  const states = new Set<string>()
  const outside: string[] = []
  for (const f of fc.features) {
    const p = f.properties as { district?: string; state?: string }
    expect(p.district, 'every feature has a district name').toBeTruthy()
    expect(p.state, 'every feature has a state name').toBeTruthy()
    states.add(p.state!)
    if (!STATES.includes(p.state!) || FORBIDDEN.test(`${p.state} ${p.district}`)) outside.push(`${p.district}, ${p.state}`)
  }
  expect(outside, 'features outside the demo states').toEqual([])
  expect([...states].sort()).toEqual([...STATES].sort())
})

/** Arc indices referenced by a TopoJSON geometry (negative = reversed arc ~i). */
function arcIds(arcs: unknown): number[] {
  if (typeof arcs === 'number') return [arcs < 0 ? ~arcs : arcs]
  return Array.isArray(arcs) ? arcs.flatMap(arcIds) : []
}

test('only internal district borders are stroked — no outer or international edge', () => {
  const topo = JSON.parse(readFileSync(FILE, 'utf8')) as Topology
  const districts = topo.objects.districts as unknown as { geometries: { arcs: unknown }[] }
  const inner = topo.objects.innerlines as unknown as { geometries: { arcs: unknown }[] } | undefined
  expect(inner, 'innerlines layer present').toBeTruthy()

  // An arc used by exactly one district polygon is an outer edge.
  const uses = new Map<number, number>()
  for (const g of districts.geometries) for (const a of new Set(arcIds(g.arcs))) uses.set(a, (uses.get(a) ?? 0) + 1)
  const innerArcs = inner!.geometries.flatMap((g) => arcIds(g.arcs))
  expect(innerArcs.length).toBeGreaterThan(0)
  const outer = innerArcs.filter((a) => (uses.get(a) ?? 0) < 2)
  expect(outer, 'inner lines must only use arcs shared by two districts').toEqual([])
})

test('boundary file stays under 3 MB and ships with its licence notice', () => {
  expect(statSync(FILE).size).toBeLessThan(3 * 1024 * 1024)
  const notice = readFileSync('public/geo/NOTICE.md', 'utf8')
  expect(notice).toContain('DataMeet')
  expect(notice).toContain('CC BY 2.5 IN')
  expect(notice).toContain('indicative, not official')
})
