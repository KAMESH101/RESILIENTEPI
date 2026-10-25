// Dev check: prints blind-spot scores and forecasts for the seeded demo data.
// Run: npx tsx scripts/check-mock.ts [YYYY-MM ...]
import { getDataset, blindSpotFor, summaryFor } from '../src/services/mock/generate'

const months = process.argv.slice(2)
for (const asOf of months.length ? months : ['2026-10']) {
  const ds = getDataset(asOf)
  console.log(`\n=== as-of ${asOf} ===`)
  const rows = ds.districts.map((d) => {
    const bs = blindSpotFor(ds, d, asOf)
    const s = summaryFor(ds, d, 2)
    return { id: d.ref.id, p2: s.forecast?.probability, cat: s.forecast?.category, bs: bs.score, band: bs.band, comps: bs.components.map((c) => c.contribution).join('/'), stale: s.freshness.months_stale, miss: s.freshness.missing_months.length }
  })
  console.table(rows.sort((a, b) => b.bs - a.bs).slice(0, 14))
  const cats = rows.reduce<Record<string, number>>((a, r) => ((a[r.cat!] = (a[r.cat!] ?? 0) + 1), a), {})
  console.log('categories h2:', cats, 'flagged:', rows.filter((r) => r.band === 'flagged').length, 'watch:', rows.filter((r) => r.band === 'watch').length)
  const m = ds.byId.get('tn-madurai')!
  console.log(summaryFor(ds, m, 2).summary_sentence)
  console.log(summaryFor(ds, ds.byId.get('pb-bathinda')!, 1).summary_sentence)
}
