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

test('boundary file stays under 3 MB and ships with its licence notice', () => {
  expect(statSync(FILE).size).toBeLessThan(3 * 1024 * 1024)
  const notice = readFileSync('public/geo/NOTICE.md', 'utf8')
  expect(notice).toContain('DataMeet')
  expect(notice).toContain('CC BY 2.5 IN')
  expect(notice).toContain('indicative, not official')
})
