/**
 * POST /reports/generate (mock). Builds language-neutral bulletin facts from the
 * same dataset, reviews and tasks as every other page.
 */
import { STALE_AFTER_MONTHS, RISK_ORDER, isHighOrAbove } from '@/config/risk'
import { addMonths } from '@/lib/format'
import type { Bulletin, BulletinActionKey, FactorKey, GenerateReportRequest, LimitationKey, ShapDirection } from '@/types'
import { blindSpotState, buildActions } from './actions'
import type { useMockDb } from './db'
import { blindSpotFor, summaryFor, type Dataset } from './generate'

type DbState = ReturnType<typeof useMockDb.getState>

const SRC = 'synthetic' as const

export function factorKey(feature: string): FactorKey {
  if (feature.startsWith('rainfall')) return 'rainfall'
  if (feature === 'cases_lag1') return 'recent_cases'
  if (feature === 'neighbour_cases') return 'neighbour_cases'
  if (feature === 'month_season') return 'season'
  if (feature.startsWith('temperature')) return 'temperature'
  if (feature.startsWith('humidity')) return 'humidity'
  if (feature === 'testing_level') return 'testing_level'
  return 'other'
}

export function buildBulletin(data: Dataset, db: DbState, req: GenerateReportRequest): Bulletin {
  const h = req.horizon
  const inScope = data.districts.filter((d) =>
    req.scope === 'district' ? d.ref.id === req.district_id : req.scope === 'state' ? d.ref.state === req.state : true,
  )
  const ids = new Set(inScope.map((d) => d.ref.id))

  const assessed = inScope.map((d) => {
    const bs = blindSpotFor(data, d, data.asOf)
    const reviews = db.reviews[bs.id] ?? []
    const st = blindSpotState(bs, reviews)
    return { d, bs, latest: reviews[reviews.length - 1]?.decision ?? null, summary: summaryFor(data, d, h, st.status === 'dismissed') }
  })

  const counts = new Map<string, number>()
  for (const { summary } of assessed) {
    const k = summary.forecast?.category ?? 'no_data'
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  // Key factors: across High/Very High districts (or all, if none are), count
  // how many districts each factor pushes up or down.
  const high = assessed.filter((a) => a.summary.forecast && isHighOrAbove(a.summary.forecast.category))
  const factorBase = high.length ? high : assessed
  const factorCounts = new Map<string, { factor: FactorKey; direction: ShapDirection; districts: number }>()
  for (const { summary } of factorBase) {
    const seen = new Set<string>()
    for (const r of summary.top_reasons) {
      const k = `${factorKey(r.feature)}|${r.direction}`
      if (seen.has(k)) continue
      seen.add(k)
      const cur = factorCounts.get(k) ?? { factor: factorKey(r.feature), direction: r.direction, districts: 0 }
      cur.districts++
      factorCounts.set(k, cur)
    }
  }

  const rows = assessed.map(({ summary: s, bs }) => ({
    district: s.district,
    target_month: s.forecast?.target_month ?? null,
    probability: s.forecast?.probability ?? null,
    category: s.forecast?.category ?? null,
    expected_cases: s.forecast?.expected_cases ?? null,
    blind_spot_score: bs.score,
    blind_spot_band: bs.band,
    last_reported_month: s.freshness.last_reported_month,
    months_stale: s.freshness.months_stale,
    missing_months: s.freshness.missing_months.length,
    source: SRC,
  }))

  const limitations: Bulletin['limitations'] = (
    ['synthetic_demo', 'hmis_ends_2022', 'monthly_batch', 'blind_spot_experimental', 'boundaries_indicative'] as LimitationKey[]
  ).map((key) => ({ key }))
  const withGaps = rows.filter((r) => r.missing_months > 0).length
  const stale = rows.filter((r) => r.months_stale >= STALE_AFTER_MONTHS).length
  if (withGaps) limitations.push({ key: 'missing_reports', count: withGaps })
  if (stale) limitations.push({ key: 'stale_reports', count: stale })

  const scopeLabel = req.scope === 'district' ? (inScope[0]?.ref.name ?? '') : req.scope === 'state' ? (req.state ?? '') : 'India'

  return {
    id: `bul-${req.scope}-${req.district_id ?? req.state ?? 'in'}-${h}-${req.language}`,
    generated_at: new Date().toISOString(),
    as_of: data.asOf,
    scope: req.scope,
    scope_label: scopeLabel,
    language: req.language,
    translation_status: req.language === 'en' ? 'original' : 'machine_pending_review',
    horizon: h,
    target_month: addMonths(data.asOf, h),
    districts_covered: inScope.length,
    risk_counts: [
      ...[...RISK_ORDER].reverse().map((category) => ({ category, count: counts.get(category) ?? 0 })),
      ...(counts.get('no_data') ? [{ category: 'no_data' as const, count: counts.get('no_data')! }] : []),
    ],
    top_risk: assessed
      .flatMap(({ summary: s }) => (s.forecast ? [{ district: s.district, category: s.forecast.category, probability: s.forecast.probability, expected_cases: s.forecast.expected_cases }] : []))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10),
    blind_spots: assessed
      .filter((a) => a.bs.band !== 'none')
      .sort((a, b) => b.bs.score - a.bs.score)
      .map((a) => ({ district: a.d.ref, score: a.bs.score, band: a.bs.band, latest_review: a.latest })),
    key_factors: [...factorCounts.values()].sort((a, b) => b.districts - a.districts).slice(0, 5),
    actions: buildActions(data, db)
      .filter((t) => ids.has(t.district.id) && t.status !== 'completed')
      .slice(0, 10)
      .map((t) => ({
        district: t.district,
        priority: t.priority,
        status: t.status,
        action_key: (t.origin === 'decision_matrix' ? t.quadrant : t.origin) as BulletinActionKey,
        action_text: t.suggested_action,
      })),
    limitations,
    rows,
    source: SRC,
  }
}
