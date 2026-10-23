/**
 * Seeded synthetic dataset. Everything here is SYNTHETIC DEMO DATA and every
 * record carries `source: "synthetic"`. Values are derived from transparent
 * per-district parameters so that evidence text, scores and charts agree.
 */
import { DECISION_MATRIX } from '@/config/actions'
import {
  BLIND_SPOT_COMPONENT_ORDER,
  BLIND_SPOT_WEIGHTS,
  blindSpotBand,
} from '@/config/blindspot'
import { DEMO_SEED, DEMO_SERIES_START } from '@/config/demo'
import { categorize, isHighOrAbove, likelihoodWord, OUTBREAK_PERCENTILE, riskBand, STALE_AFTER_MONTHS } from '@/config/risk'
import { addMonths, calendarMonth, formatInt, formatMonthShort, monthsBetween } from '@/lib/format'
import type {
  ActionTask,
  BaselinePoint,
  BlindSpotAssessment,
  BlindSpotComponent,
  BlindSpotComponentKey,
  DataFreshness,
  DecisionQuadrant,
  DistrictRef,
  DistrictSummary,
  Horizon,
  HorizonForecast,
  MonthlyObservation,
  ShapReason,
  YearMonth,
} from '@/types'
import { HORIZONS } from '@/types'
import { DEFAULT_RAIN_MONTHS, DISTRICTS, STATE_PEAK_MONTH, STATE_RAIN_MONTHS, type DistrictProfile } from './districts'
import { clamp, gaussian, rngFor, sigmoid } from './random'

const SRC = 'synthetic' as const
const METROS = new Set(['Chennai', 'Mumbai', 'Kolkata', 'Bengaluru Urban', 'Hyderabad', 'Pune', 'Ahmedabad', 'Lucknow', 'Jaipur', 'Thane', 'Surat'])
const SOUTH = new Set(['Tamil Nadu', 'Kerala', 'Karnataka', 'Telangana'])

interface Params {
  base: number
  population: number
  reportFactor: number
  testRate: number
  completeness: number
  riskLogit: number
  feverMult: number
  peakMonth: number
  rainMonths: number[]
}

export interface DistrictData {
  ref: DistrictRef
  profile: DistrictProfile
  params: Params
  months: YearMonth[]
  history: MonthlyObservation[]
  /** Latent "true" cases (never shown) and the climate/neighbour model's expectation. */
  latent: number[]
  expected: number[]
}

export interface Dataset {
  asOf: YearMonth
  lastRunAt: string
  districts: DistrictData[]
  byId: Map<string, DistrictData>
}

/* ------------------------------------------------------------------ */
/* Series                                                              */
/* ------------------------------------------------------------------ */

function seasonalShape(ym: YearMonth, peakMonth: number): number {
  const m = calendarMonth(ym)
  const raw = Math.abs(m - peakMonth)
  const d = Math.min(raw, 12 - raw)
  // The season has been starting earlier and lasting longer in recent years.
  const sigma = Number(ym.slice(0, 4)) >= 2025 ? 2.0 : 1.6
  return 0.06 + 0.94 * Math.exp(-(d * d) / (2 * sigma * sigma))
}

function buildParams(p: DistrictProfile): Params {
  const r = rngFor(DEMO_SEED, p.id, 'params')
  const s = p.story ?? {}
  const population = Math.round((METROS.has(p.name) ? 4_000_000 : 1_200_000) + r() * 5_000_000)
  return {
    // Peak-month incidence of 4–12 per 100k, so positivity responds to testing levels.
    base: (population / 1e5) * (4 + r() * 8),
    population,
    reportFactor: s.reportFactor ?? 0.86 + r() * 0.12,
    testRate: s.testRate ?? 28 + r() * 30,
    completeness: s.completeness ?? 0.9 + r() * 0.08,
    riskLogit: -2.1 + r() * 2.2,
    feverMult: 4 + r() * 2,
    peakMonth: STATE_PEAK_MONTH[p.state] ?? 9,
    rainMonths: STATE_RAIN_MONTHS[p.state] ?? DEFAULT_RAIN_MONTHS,
  }
}

function buildDistrict(profile: DistrictProfile, asOf: YearMonth): DistrictData {
  const params = buildParams(profile)
  const story = profile.story ?? {}
  const total = monthsBetween(DEMO_SERIES_START, asOf) + 1
  const months: YearMonth[] = []
  const history: MonthlyObservation[] = []
  const latent: number[] = []
  const expected: number[] = []
  const yearFactor = new Map<string, number>()
  const south = SOUTH.has(profile.state)

  for (let i = 0; i < total; i++) {
    const ym = addMonths(DEMO_SERIES_START, i)
    const year = ym.slice(0, 4)
    const m = calendarMonth(ym)
    const r = rngFor(DEMO_SEED, profile.id, ym)
    if (!yearFactor.has(year)) {
      const ry = rngFor(DEMO_SEED, profile.id, 'year', year)
      yearFactor.set(year, Math.exp(0.35 * gaussian(ry)))
    }
    const shape = seasonalShape(ym, params.peakMonth)
    const trueCases = params.base * shape * yearFactor.get(year)! * Math.exp(0.22 * gaussian(r))
    const exp = trueCases * Math.exp(0.1 * gaussian(r))

    const offset = monthsBetween(ym, asOf)
    const missing =
      (story.missingOffsets?.includes(offset) ?? false) || offset < (story.staleMonths ?? 0)

    const tests = (params.population / 1e5) * params.testRate * (0.55 + 0.9 * shape) * Math.exp(0.1 * gaussian(r))
    const reported = Math.min(trueCases * params.reportFactor * Math.exp(0.08 * gaussian(r)), tests * 0.5)
    const completeness = clamp(params.completeness + 0.035 * gaussian(r), 0.3, 1)
    const fever = trueCases * params.feverMult + (params.population / 1e5) * 22 * (0.7 + 0.3 * shape) * Math.exp(0.06 * gaussian(r))

    const rainy = params.rainMonths.includes(m)
    const rainfall = rainy ? 110 + r() * 260 : 4 + r() * 38
    const temp = (south ? 27.5 : 25.5) + (south ? 2.5 : 7) * Math.cos((2 * Math.PI * (m - 5)) / 12) + 0.8 * gaussian(r)
    const humidity = clamp((rainy ? 80 : 55) + 6 * gaussian(r), 30, 96)

    months.push(ym)
    latent.push(trueCases)
    expected.push(exp)
    history.push({
      month: ym,
      reported_cases: missing ? null : Math.round(reported),
      tests: missing ? null : Math.round(tests),
      tests_per_100k: missing ? null : Math.round((tests / params.population) * 1e5),
      test_positivity: missing ? null : Math.round((reported / tests) * 1000) / 1000,
      fever_admissions: missing ? null : Math.round(fever),
      reporting_completeness: missing ? null : Math.round(completeness * 100) / 100,
      rainfall_mm: Math.round(rainfall),
      temperature_c: Math.round(temp * 10) / 10,
      humidity_pct: Math.round(humidity),
      source: SRC,
    })
  }

  return {
    ref: { id: profile.id, name: profile.name, state: profile.state, lgd_code: null },
    profile,
    params,
    months,
    history,
    latent,
    expected,
  }
}

const cache = new Map<YearMonth, Dataset>()

function lastRunAt(asOf: YearMonth): string {
  // The batch for month M finishes around the 5th of M+1, but never in the future.
  const next = addMonths(asOf, 1)
  const planned = new Date(`${next}-05T06:00:00+05:30`)
  const now = new Date()
  const d = planned < now ? planned : new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000)
  return d.toISOString()
}

export function getDataset(asOf: YearMonth): Dataset {
  const hit = cache.get(asOf)
  if (hit) return hit
  const districts = DISTRICTS.map((p) => buildDistrict(p, asOf))
  const ds: Dataset = { asOf, lastRunAt: lastRunAt(asOf), districts, byId: new Map(districts.map((d) => [d.ref.id, d])) }
  cache.set(asOf, ds)
  return ds
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Index of a month in every district's aligned series. */
function idx(ym: YearMonth): number {
  return monthsBetween(DEMO_SERIES_START, ym)
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const pos = (p / 100) * (s.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo)
}

function median(values: number[]): number | null {
  return percentile(values, 50)
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Reported cases for the same calendar month in years before `issue`. */
function sameMonthHistory(d: DistrictData, target: YearMonth, issue: YearMonth): number[] {
  const out: number[] = []
  for (let k = 12; ; k += 12) {
    const ym = addMonths(target, -k)
    if (monthsBetween(DEMO_SERIES_START, ym) < 0) break
    if (monthsBetween(ym, issue) < 0) continue
    const v = d.history[idx(ym)]?.reported_cases
    if (v != null) out.push(v)
  }
  return out
}

/** Last `n` non-missing observations at or before `issue`, searching back `window` months. */
function recentObs(d: DistrictData, issue: YearMonth, n = 3, window = 8): { obs: MonthlyObservation; i: number }[] {
  const out: { obs: MonthlyObservation; i: number }[] = []
  for (let k = 0; k < window && out.length < n; k++) {
    const i = idx(addMonths(issue, -k))
    const obs = d.history[i]
    if (obs && obs.reported_cases != null) out.push({ obs, i })
  }
  return out
}

const MONTH_START = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/
/** Lower-case the first letter for mid-sentence use, except month names. */
const lowerFirst = (s: string) => (MONTH_START.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

/* ------------------------------------------------------------------ */
/* Forecasts & baselines                                               */
/* ------------------------------------------------------------------ */

export function forecastFor(d: DistrictData, issue: YearMonth, h: Horizon, asOf: YearMonth): HorizonForecast {
  const target = addMonths(issue, h)
  const threshold = percentile(sameMonthHistory(d, target, issue), OUTBREAK_PERCENTILE)
  const fixed = d.profile.story?.probabilities
  let p: number
  if (fixed) {
    // Scripted demo story; the previous run is shown slightly lower so trends are stable.
    p = fixed[h - 1]! - (issue === asOf ? 0 : 0.06)
  } else {
    const r = rngFor(DEMO_SEED, d.ref.id, 'fc', issue, h)
    p = sigmoid(d.params.riskLogit + 2.4 * (seasonalShape(target, d.params.peakMonth) - 0.45) + 0.35 * gaussian(r))
  }
  p = Math.round(clamp(p, 0.02, 0.97) * 100) / 100
  return {
    horizon: h,
    target_month: target,
    probability: p,
    category: categorize(p),
    expected_cases: threshold == null ? null : Math.round(threshold * (0.55 + 0.9 * p)),
    expected_cases_interval: null,
    outbreak_threshold_cases: threshold == null ? null : Math.round(threshold),
    source: SRC,
  }
}

export function baselinesFor(d: DistrictData, issue: YearMonth): BaselinePoint[] {
  const out: BaselinePoint[] = []
  const last = recentObs(d, issue, 1)[0]?.obs.reported_cases ?? null
  for (const h of HORIZONS) {
    const target = addMonths(issue, h)
    const lastYear = d.history[idx(addMonths(target, -12))]?.reported_cases ?? null
    out.push(
      { kind: 'seasonal_naive', horizon: h, target_month: target, expected_cases: lastYear, source: SRC },
      { kind: 'persistence', horizon: h, target_month: target, expected_cases: last, source: SRC },
      {
        kind: 'historical_average',
        horizon: h,
        target_month: target,
        expected_cases: (() => {
          const a = avg(sameMonthHistory(d, target, issue))
          return a == null ? null : Math.round(a)
        })(),
        source: SRC,
      },
    )
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Freshness                                                           */
/* ------------------------------------------------------------------ */

export function freshnessFor(d: DistrictData, asOf: YearMonth): DataFreshness {
  let last: YearMonth | null = null
  const missing: YearMonth[] = []
  for (let k = 0; k < 12; k++) {
    const ym = addMonths(asOf, -k)
    const v = d.history[idx(ym)]?.reported_cases
    if (v == null) missing.push(ym)
    else if (!last) last = ym
  }
  const stale = last ? monthsBetween(last, asOf) : 12
  return {
    last_reported_month: last,
    months_stale: stale,
    confidence: stale >= STALE_AFTER_MONTHS || missing.length >= 3 ? 'low' : 'normal',
    missing_months: missing.reverse(),
  }
}

/* ------------------------------------------------------------------ */
/* Blind-spot indicator                                                */
/* ------------------------------------------------------------------ */

function stateTestingMedian(ds: Dataset, state: string, issue: YearMonth): number | null {
  const vals = ds.districts
    .filter((x) => x.ref.state === state)
    .map((x) => avg(recentObs(x, issue).map((o) => o.obs.tests_per_100k!)))
    .filter((v): v is number => v != null)
  return median(vals)
}

export function blindSpotFor(ds: Dataset, d: DistrictData, issue: YearMonth): BlindSpotAssessment {
  const recent = recentObs(d, issue)
  const prev = recent.length
    ? recentObs(d, addMonths(recent[recent.length - 1]!.obs.month, -1))
    : []
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const reported = sum(recent.map((o) => o.obs.reported_cases!))
  const expected = sum(recent.map((o) => d.expected[o.i]!))
  const tp = avg(recent.map((o) => o.obs.tests_per_100k!))
  const stateMed = stateTestingMedian(ds, d.ref.state, issue)
  const pos = avg(recent.map((o) => o.obs.test_positivity!))
  const comp = avg(recent.map((o) => o.obs.reporting_completeness!))
  const feverNow = sum(recent.map((o) => o.obs.fever_admissions!))
  const feverPrev = sum(prev.map((o) => o.obs.fever_admissions!))
  const repPrev = sum(prev.map((o) => o.obs.reported_cases!))

  const gap = expected > 0 ? 1 - reported / expected : 0
  const testDeficit = tp != null && stateMed ? (stateMed - tp) / stateMed : 0
  const feverChange = feverPrev > 0 ? feverNow / feverPrev - 1 : 0
  const repChange = repPrev > 0 ? reported / repPrev - 1 : 0

  const signals: Record<BlindSpotComponentKey, number> = {
    expected_gap: clamp((gap - 0.15) / 0.45),
    low_testing: clamp((testDeficit - 0.1) / 0.55),
    high_positivity: clamp(((pos ?? 0) - 0.15) / 0.25),
    low_completeness: clamp((0.92 - (comp ?? 1)) / 0.32),
    fever_divergence: clamp((feverChange - repChange) / 0.5),
  }
  const pct = (x: number) => `${Math.round(Math.abs(x) * 100)}%`
  const evidence: Record<BlindSpotComponentKey, string> = {
    expected_gap: `Model expected about ${formatInt(expected)} cases over the last ${plural(recent.length, 'reported month')}; ${formatInt(reported)} were reported (${pct(gap)} ${gap >= 0 ? 'fewer' : 'more'}).`,
    low_testing:
      tp == null || stateMed == null
        ? 'Testing data not available.'
        : `${formatInt(tp)} tests per 100k per month vs state median ${formatInt(stateMed)} (${pct(testDeficit)} ${testDeficit >= 0 ? 'below' : 'above'}).`,
    high_positivity: pos == null ? 'Positivity not available.' : `${pct(pos)} of dengue tests were positive (signal starts above 15%).`,
    low_completeness: comp == null ? 'Completeness not reported.' : `${pct(comp)} of facilities reported on time.`,
    fever_divergence: `Fever admissions changed ${feverChange >= 0 ? '+' : '−'}${pct(feverChange)} while dengue reports changed ${repChange >= 0 ? '+' : '−'}${pct(repChange)} vs the previous 3 months.`,
  }

  const components: BlindSpotComponent[] = BLIND_SPOT_COMPONENT_ORDER.map((key) => {
    const weight = BLIND_SPOT_WEIGHTS[key]
    return {
      key,
      signal: Math.round(signals[key] * 100) / 100,
      weight,
      contribution: Math.round(signals[key] * weight * 100),
      evidence: evidence[key],
    }
  })
  const score = Math.min(100, components.reduce((a, c) => a + c.contribution, 0))
  const band = blindSpotBand(score)

  const fresh = freshnessFor(d, issue)
  const warnings: string[] = []
  if (fresh.months_stale >= STALE_AFTER_MONTHS)
    warnings.push(`Low confidence: latest report is ${plural(fresh.months_stale, 'month')} old.`)
  if (fresh.missing_months.length)
    warnings.push(`${fresh.missing_months.length} of the last 12 months have no report (shown as "No data", not 0).`)
  if (comp != null && comp < 0.8) warnings.push('Reporting completeness is below 80%, so totals may be incomplete.')
  if (recent.length < 3) warnings.push('Fewer than 3 recent months available; score uses what exists.')

  return {
    id: `bs-${d.ref.id}`,
    district: d.ref,
    score,
    band,
    flagged: band === 'flagged',
    components,
    metrics: {
      months_used: recent.map((o) => o.obs.month).reverse(),
      reported_cases: recent.length ? reported : null,
      expected_cases: recent.length ? Math.round(expected) : null,
      tests_per_100k: tp == null ? null : Math.round(tp),
      state_median_tests_per_100k: stateMed == null ? null : Math.round(stateMed),
      test_positivity: pos == null ? null : Math.round(pos * 1000) / 1000,
      reporting_completeness: comp == null ? null : Math.round(comp * 100) / 100,
      fever_admissions_change: feverPrev > 0 ? Math.round(feverChange * 100) / 100 : null,
      reported_cases_change: repPrev > 0 ? Math.round(repChange * 100) / 100 : null,
    },
    evidence: components.filter((c) => c.signal >= 0.3).map((c) => c.evidence),
    data_quality_warnings: warnings,
    reviews: [],
    source: SRC,
  }
}

/* ------------------------------------------------------------------ */
/* SHAP-style reasons (synthetic)                                      */
/* ------------------------------------------------------------------ */

interface Candidate {
  feature: string
  text: string
  up: boolean
  mag: number
}

function climateNormal(d: DistrictData, ym: YearMonth, key: 'rainfall_mm'): number | null {
  const vals: number[] = []
  const m = calendarMonth(ym)
  for (const o of d.history) if (calendarMonth(o.month) === m && o[key] != null) vals.push(o[key]!)
  return avg(vals)
}

export function reasonsFor(ds: Dataset, d: DistrictData, issue: YearMonth, f: HorizonForecast): ShapReason[] {
  if (d.profile.story?.noExplanation) return []
  const cands: Candidate[] = []

  // Rainfall anomaly 1–3 months ago.
  let best: Candidate | null = null
  for (const lag of [1, 2, 3]) {
    const ym = addMonths(issue, -lag)
    const obs = d.history[idx(ym)]
    const normal = climateNormal(d, ym, 'rainfall_mm')
    if (!obs?.rainfall_mm || !normal || normal < 40) continue
    const anom = obs.rainfall_mm / normal - 1
    if (Math.abs(anom) < 0.12) continue
    const when = lag === 1 ? 'last month' : `${lag} months ago`
    const c = { feature: `rainfall_lag${lag}`, text: `Rainfall ${when} was ${Math.round(Math.abs(anom) * 100)}% ${anom > 0 ? 'above' : 'below'} normal`, up: anom > 0, mag: Math.min(1.2, Math.abs(anom) * 0.9) }
    if (!best || c.mag > best.mag) best = c
  }
  if (best) cands.push(best)

  // Recent cases vs usual level.
  const last = recentObs(d, issue, 1, 2)[0]
  if (last) {
    const usual = median(sameMonthHistory(d, last.obs.month, addMonths(last.obs.month, -1)))
    if (usual && usual > 0) {
      const ratio = last.obs.reported_cases! / usual
      const mon = formatMonthShort(last.obs.month)
      if (ratio > 1.15)
        cands.push({ feature: 'cases_lag1', text: `Cases last month were ${ratio.toFixed(1)}× the usual level for ${mon}`, up: true, mag: Math.min(1.3, Math.log(ratio)) * (f.horizon === 1 ? 1.3 : 1) })
      else if (ratio < 0.85)
        cands.push({ feature: 'cases_lag1', text: `Cases last month were ${Math.round((1 - ratio) * 100)}% below the usual level for ${mon}`, up: false, mag: Math.min(1, -Math.log(ratio)) })
    }
  }

  // Neighbouring districts (spatial lag; state peers in the demo).
  const peers = ds.districts.filter((x) => x.ref.state === d.ref.state && x !== d)
  const pNow = peers.reduce((a, x) => a + (x.history[idx(issue)]?.reported_cases ?? 0), 0)
  const pPrev = peers.reduce((a, x) => a + (x.history[idx(addMonths(issue, -1))]?.reported_cases ?? 0), 0)
  if (pPrev > 0) {
    const g = pNow / pPrev - 1
    if (Math.abs(g) > 0.15)
      cands.push({ feature: 'neighbour_cases', text: `Cases in neighbouring districts ${g > 0 ? 'rose' : 'fell'} ${Math.round(Math.abs(g) * 100)}% last month`, up: g > 0, mag: Math.min(1, Math.abs(g) * 0.7) })
  }

  // Season of the target month.
  const shape = seasonalShape(f.target_month, d.params.peakMonth)
  const mon = formatMonthShort(f.target_month)
  const seasonWeight = f.horizon === 3 ? 1.4 : 1
  if (shape > 0.55) cands.push({ feature: 'month_season', text: `${mon} is usually a peak dengue month here`, up: true, mag: shape * 0.8 * seasonWeight })
  else if (shape < 0.25) cands.push({ feature: 'month_season', text: `${mon} is usually a low dengue month here`, up: false, mag: (1 - shape) * 0.6 * seasonWeight })

  // Temperature and humidity last month.
  const prevObs = d.history[idx(addMonths(issue, -1))]
  if (prevObs?.temperature_c != null) {
    const t = prevObs.temperature_c
    if (t >= 25 && t <= 31) cands.push({ feature: 'temperature_lag1', text: `Average temperature last month (${Math.round(t)}°C) favoured mosquito breeding`, up: true, mag: 0.35 })
    else if (t < 19) cands.push({ feature: 'temperature_lag1', text: `Cool temperatures last month (${Math.round(t)}°C) slow mosquito breeding`, up: false, mag: 0.45 })
  }
  if (prevObs?.humidity_pct != null && prevObs.humidity_pct >= 78)
    cands.push({ feature: 'humidity_lag1', text: `Humidity last month was high (${prevObs.humidity_pct}%)`, up: true, mag: 0.3 })

  // Testing level.
  if ((d.profile.story?.testRate ?? 99) < 12)
    cands.push({ feature: 'testing_level', text: 'Testing was low, so recent reported counts may understate cases', up: true, mag: 0.5 })

  const wantUp = isHighOrAbove(f.category) || f.category === 'moderate'
  cands.sort((a, b) => (a.up === b.up ? b.mag - a.mag : a.up === wantUp ? -1 : 1))

  return cands.slice(0, 3).map((c) => ({
    feature: c.feature,
    direction: c.up ? 'increases_risk' : 'decreases_risk',
    text: c.text,
    shap_value: Math.round((c.up ? 1 : -1) * c.mag * 0.12 * 100) / 100,
    source: SRC,
  }))
}

/* ------------------------------------------------------------------ */
/* Summaries, sentences, actions                                       */
/* ------------------------------------------------------------------ */

export function summarySentence(name: string, f: HorizonForecast, reasons: ShapReason[], fresh: DataFreshness): string {
  const band = riskBand(f.category)
  let s = `${name}: ${band.label} risk in ${plural(f.horizon, 'month')}.`
  s += reasons[0] ? ` Main reason: ${lowerFirst(reasons[0].text)}.` : ' Explanation not yet available.'
  if (fresh.months_stale >= STALE_AFTER_MONTHS) s += ` Low confidence: data ${plural(fresh.months_stale, 'month')} old.`
  return s
}

export function quadrantFor(highRisk: boolean, flagged: boolean): DecisionQuadrant {
  if (highRisk) return flagged ? 'high_risk_blind_spot' : 'high_risk_no_blind_spot'
  return flagged ? 'low_risk_blind_spot' : 'low_risk_no_blind_spot'
}

export function summaryFor(ds: Dataset, d: DistrictData, h: Horizon): DistrictSummary {
  const f = forecastFor(d, ds.asOf, h, ds.asOf)
  const bs = blindSpotFor(ds, d, ds.asOf)
  const reasons = reasonsFor(ds, d, ds.asOf, f)
  const fresh = freshnessFor(d, ds.asOf)
  const latest = recentObs(d, ds.asOf, 1)[0]?.obs
  const q = quadrantFor(isHighOrAbove(f.category), bs.flagged)
  return {
    district: d.ref,
    forecast: f,
    blind_spot: { id: bs.id, score: bs.score, band: bs.band, flagged: bs.flagged, source: SRC },
    summary_sentence: summarySentence(d.ref.name, f, reasons, fresh),
    top_reasons: reasons,
    case_trend: Array.from({ length: 12 }, (_, k) => {
      const ym = addMonths(ds.asOf, k - 11)
      return { month: ym, reported_cases: d.history[idx(ym)]?.reported_cases ?? null }
    }),
    latest_tests_per_100k: latest?.tests_per_100k ?? null,
    latest_test_positivity: latest?.test_positivity ?? null,
    freshness: fresh,
    recommended_action: DECISION_MATRIX[q].action,
  }
}

/** Highest-probability forecast across horizons, for action generation. */
export function peakForecast(ds: Dataset, d: DistrictData): HorizonForecast {
  return HORIZONS.map((h) => forecastFor(d, ds.asOf, h, ds.asOf)).reduce((a, b) => (b.probability > a.probability ? b : a))
}

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const

export function seedActions(ds: Dataset): ActionTask[] {
  const at = ds.lastRunAt
  const tasks: ActionTask[] = []
  for (const d of ds.districts) {
    const f = peakForecast(ds, d)
    const bs = blindSpotFor(ds, d, ds.asOf)
    const q = quadrantFor(isHighOrAbove(f.category), bs.flagged)
    if (q === 'low_risk_no_blind_spot') continue
    const rule = DECISION_MATRIX[q]
    const band = riskBand(f.category)
    const riskText = `${band.label} risk in ${plural(f.horizon, 'month')} (${likelihoodWord(f.probability)}, ${Math.round(f.probability * 100)}%)`
    const reason = bs.flagged ? `${riskText} and a potential blind spot (experimental score ${bs.score}).` : `${riskText}.`
    tasks.push({
      id: `act-${d.ref.id}`,
      district: d.ref,
      severity: f.category,
      blind_spot_flagged: bs.flagged,
      quadrant: q,
      reason,
      suggested_action: rule.action,
      priority: rule.priority,
      responsible_team: rule.team,
      assignee: null,
      status: 'pending',
      notes: [],
      history: [
        { id: `h-${d.ref.id}-0`, change: 'created', from: null, to: 'pending', actor_name: 'Monthly batch run', actor_role: 'district_officer', created_at: at },
      ],
      created_at: at,
      updated_at: at,
      source: SRC,
    })
  }
  // A couple of tasks already under way so the list isn't uniform.
  for (const t of tasks) {
    if (t.district.name === 'Ernakulam' || t.district.name === 'Mumbai') {
      t.status = 'in_progress'
      t.assignee = t.district.name === 'Mumbai' ? 'Vector control unit' : 'Hospital preparedness cell'
      t.history.push(
        { id: `h-${t.id}-1`, change: 'assigned', from: null, to: t.assignee, actor_name: 'Demo District Officer', actor_role: 'district_officer', created_at: at },
        { id: `h-${t.id}-2`, change: 'status', from: 'pending', to: 'in_progress', actor_name: 'Demo District Officer', actor_role: 'district_officer', created_at: at },
      )
    }
  }
  return tasks.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || Number(b.blind_spot_flagged) - Number(a.blind_spot_flagged))
}

export { PRIORITY_RANK }
