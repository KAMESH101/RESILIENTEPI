import { DECISION_MATRIX } from '@/config/actions'
import { DEMO_AS_OF, HMIS_DATA_ENDS } from '@/config/demo'
import { BOUNDARY_NOTES } from '@/config/geo'
import { isHighOrAbove, likelihoodWord, riskBand } from '@/config/risk'
import { addMonths } from '@/lib/format'
import type {
  ActionListResponse,
  ActionMutationResponse,
  ActionTask,
  AttentionItem,
  BlindSpotListResponse,
  BlindSpotReviewResponse,
  DataSourcesResponse,
  DecisionQuadrant,
  DistrictDetail,
  DistrictListResponse,
  DistrictSummary,
  ExplanationResponse,
  Horizon,
  Kpi,
  ModelPerformanceResponse,
  OverviewResponse,
  RiskMapResponse,
  Role,
} from '@/types'
import { blindSpotReviewSchema, createActionSchema, generateReportSchema, HORIZONS, updateActionSchema, type Bulletin } from '@/types'
import { buildBulletin } from './reports'
import { blindSpotState, buildActions } from './actions'
import { ensureAsOf, useMockDb, type ActionEdit } from './db'
import { STATES } from './districts'
import {
  baselinesFor,
  blindSpotFor,
  forecastFor,
  freshnessFor,
  getDataset,
  peakForecast,
  quadrantFor,
  reasonsFor,
  summaryFor,
  summarySentence,
  type Dataset,
} from './generate'

export class MockHttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface MockRequest {
  query: URLSearchParams
  body: unknown
  params: Record<string, string>
  role: Role
}

const SRC = 'synthetic' as const

const actorName = (role: Role) => (role === 'evaluator' ? 'Demo Evaluator' : 'Demo District Officer')

function ds(): Dataset {
  ensureAsOf(DEMO_AS_OF)
  return getDataset(DEMO_AS_OF)
}

function parseHorizon(q: URLSearchParams): Horizon {
  const h = Number(q.get('horizon'))
  return (HORIZONS as readonly number[]).includes(h) ? (h as Horizon) : 1
}

function stateFilter(q: URLSearchParams): string | null {
  const s = q.get('state')
  return s && STATES.includes(s) ? s : null
}

function districtsIn(data: Dataset, state: string | null) {
  return data.districts.filter((d) => !state || d.ref.state === state)
}

function getDistrictOr404(data: Dataset, id: string | undefined) {
  const d = id ? data.byId.get(id) : undefined
  if (!d) throw new MockHttpError(404, 'District not found')
  return d
}

function requireOfficer(role: Role) {
  if (role === 'evaluator') throw new MockHttpError(403, 'Evaluators have read-only access.')
}

function allActions(data: Dataset): ActionTask[] {
  return buildActions(data, useMockDb.getState())
}

/** District ids whose blind-spot flag was dismissed on review (matrix treats as none). */
function dismissedIds(data: Dataset): Set<string> {
  const reviews = useMockDb.getState().reviews
  const out = new Set<string>()
  for (const d of data.districts) {
    const bs = blindSpotFor(data, d, data.asOf)
    if (blindSpotState(bs, reviews[bs.id] ?? []).status === 'dismissed') out.add(d.ref.id)
  }
  return out
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/* ------------------------------------------------------------------ */

const SUGGESTIONS: Record<DecisionQuadrant, string> = {
  high_risk_blind_spot: 'Suggested: send a testing team and allocate test kits.',
  high_risk_no_blind_spot: 'Suggested: alert hospitals and step up vector control.',
  low_risk_blind_spot: 'Suggested: audit testing and reporting.',
  low_risk_no_blind_spot: 'Suggested: continue routine surveillance.',
}

function attentionFor(summaries: DistrictSummary[]): AttentionItem[] {
  const rank = (s: DistrictSummary) => {
    const high = s.forecast ? isHighOrAbove(s.forecast.category) : false
    const flagged = s.blind_spot?.flagged ?? false
    if (high && flagged) return 0
    if (s.forecast?.category === 'very_high') return 1
    if (flagged) return 2
    if (high) return 3
    return 9
  }
  return summaries
    .filter((s) => rank(s) < 9)
    .sort((a, b) => rank(a) - rank(b) || (b.forecast?.probability ?? 0) - (a.forecast?.probability ?? 0))
    .slice(0, 3)
    .map((s) => {
      const f = s.forecast!
      const flagged = s.blind_spot?.flagged ?? false
      const q = quadrantFor(isHighOrAbove(f.category), flagged)
      const label = riskBand(f.category).label
      return {
        district: s.district,
        severity: f.category,
        blind_spot_flagged: flagged,
        headline: `${s.district.name}, ${s.district.state} — ${label} risk${flagged ? ' + potential blind spot' : ''}.`,
        suggestion: SUGGESTIONS[q],
      }
    })
}

function kpi(value: number, previous: number | null): Kpi {
  return { value, previous, source: SRC }
}

export function getOverview(req: MockRequest): OverviewResponse {
  const data = ds()
  const h = parseHorizon(req.query)
  const state = stateFilter(req.query)
  const list = districtsIn(data, state)
  const dismissed = dismissedIds(data)
  const summaries = list.map((d) => summaryFor(data, d, h, dismissed.has(d.ref.id)))
  const prevIssue = addMonths(data.asOf, -1)

  const high = summaries.filter((s) => s.forecast && isHighOrAbove(s.forecast.category))
  const flagged = summaries.filter((s) => s.blind_spot?.flagged)
  const both = high.filter((s) => s.blind_spot?.flagged)

  const prevHigh = list.filter((d) => isHighOrAbove(forecastFor(d, prevIssue, h, data.asOf).category))
  const prevFlagged = list.filter((d) => blindSpotFor(data, d, prevIssue).flagged)
  const prevBoth = prevHigh.filter((d) => prevFlagged.includes(d))

  return {
    as_of: data.asOf,
    last_run_at: data.lastRunAt,
    source: SRC,
    horizon: h,
    state,
    kpis: {
      districts_monitored: kpi(list.length, null),
      high_or_very_high: kpi(high.length, prevHigh.length),
      potential_blind_spots: kpi(flagged.length, prevFlagged.length),
      needing_immediate_attention: kpi(both.length, prevBoth.length),
    },
    attention: attentionFor(summaries),
    top_risk: [...summaries]
      .sort((a, b) => (b.forecast?.probability ?? 0) - (a.forecast?.probability ?? 0))
      .slice(0, 10),
    blind_spot_alerts: summaries
      .filter((s) => s.blind_spot && s.blind_spot.band !== 'none')
      .sort((a, b) => b.blind_spot!.score - a.blind_spot!.score)
      .slice(0, 5),
    recommended_actions: allActions(data)
      .filter((a) => a.status !== 'completed' && (!state || a.district.state === state))
      .slice(0, 5),
    map: summaries,
  }
}

export function getRiskMap(req: MockRequest): RiskMapResponse {
  const data = ds()
  const h = parseHorizon(req.query)
  return {
    as_of: data.asOf,
    last_run_at: data.lastRunAt,
    source: SRC,
    horizon: h,
    districts: (() => {
      const dismissed = dismissedIds(data)
      return data.districts.map((d) => summaryFor(data, d, h, dismissed.has(d.ref.id)))
    })(),
  }
}

export function listDistricts(req: MockRequest): DistrictListResponse {
  const data = ds()
  const q = (req.query.get('search') ?? '').trim().toLowerCase()
  const state = stateFilter(req.query)
  return {
    districts: districtsIn(data, state)
      .map((d) => d.ref)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.state.toLowerCase().includes(q)),
    states: STATES,
  }
}

export function getDistrict(req: MockRequest): DistrictDetail {
  const data = ds()
  const d = getDistrictOr404(data, req.params.id)
  const bs = blindSpotFor(data, d, data.asOf)
  const fresh = freshnessFor(d, data.asOf)
  const forecasts = HORIZONS.map((h) => forecastFor(d, data.asOf, h, data.asOf))
  const f1 = forecasts[0]!
  return {
    district: d.ref,
    population: null,
    summary_sentence: summarySentence(d.ref.name, f1, reasonsFor(data, d, data.asOf, f1), fresh),
    forecasts,
    baselines: baselinesFor(d, data.asOf),
    history: d.history,
    blind_spot: { ...bs, reviews: useMockDb.getState().reviews[bs.id] ?? [] },
    freshness: fresh,
    recommended_actions: allActions(data).filter((a) => a.district.id === d.ref.id),
    default_horizon: 1,
  }
}

export function getExplanations(req: MockRequest): ExplanationResponse {
  const data = ds()
  const d = getDistrictOr404(data, req.params.id)
  const h = parseHorizon(req.query)
  const reasons = reasonsFor(data, d, data.asOf, forecastFor(d, data.asOf, h, data.asOf))
  return reasons.length
    ? { status: 'available', horizon: h, reasons, source: SRC }
    : { status: 'not_available', horizon: h, message: 'Explanation not yet available' }
}

export function listBlindSpots(req: MockRequest): BlindSpotListResponse {
  const data = ds()
  const state = stateFilter(req.query)
  const reviews = useMockDb.getState().reviews
  return {
    as_of: data.asOf,
    last_run_at: data.lastRunAt,
    source: SRC,
    items: districtsIn(data, state)
      .map((d) => {
        const bs = blindSpotFor(data, d, data.asOf)
        return { ...bs, reviews: reviews[bs.id] ?? [] }
      })
      .sort((a, b) => b.score - a.score),
  }
}

export function reviewBlindSpot(req: MockRequest): BlindSpotReviewResponse {
  requireOfficer(req.role)
  const parsed = blindSpotReviewSchema.safeParse(req.body)
  if (!parsed.success) throw new MockHttpError(422, parsed.error.issues[0]?.message ?? 'Invalid review')
  const id = req.params.id!
  const data = ds()
  if (!data.districts.some((d) => `bs-${d.ref.id}` === id)) throw new MockHttpError(404, 'Assessment not found')
  const review = {
    id: newId('rev'),
    decision: parsed.data.decision,
    reason: parsed.data.reason,
    reviewer_name: actorName(req.role),
    reviewer_role: req.role,
    created_at: new Date().toISOString(),
  }
  const reviews = useMockDb.getState().reviews
  useMockDb.setState({ reviews: { ...reviews, [id]: [...(reviews[id] ?? []), review] } })
  return { review, demo: true }
}

export function listActions(req: MockRequest): ActionListResponse {
  const data = ds()
  const state = stateFilter(req.query)
  const district = req.query.get('district')
  const priority = req.query.get('priority')
  const status = req.query.get('status')
  return {
    items: allActions(data)
      .filter((a) => !state || a.district.state === state)
      .filter((a) => !district || a.district.id === district)
      .filter((a) => !priority || a.priority === priority)
      .filter((a) => !status || a.status === status),
  }
}

export function createAction(req: MockRequest): ActionMutationResponse {
  requireOfficer(req.role)
  const parsed = createActionSchema.safeParse(req.body)
  if (!parsed.success) throw new MockHttpError(422, parsed.error.issues[0]?.message ?? 'Invalid action')
  const data = ds()
  const d = getDistrictOr404(data, parsed.data.district_id)
  const f = peakForecast(data, d)
  const bs = blindSpotFor(data, d, data.asOf)
  const st = blindSpotState(bs, useMockDb.getState().reviews[bs.id] ?? [])
  const counts = st.status === 'flagged'
  const now = new Date().toISOString()
  const actor = { actor_name: actorName(req.role), actor_role: req.role, created_at: now }
  const q = quadrantFor(isHighOrAbove(f.category), counts)
  const id = newId('act-manual')
  const action: ActionTask = {
    id,
    origin: 'manual',
    district: d.ref,
    severity: f.category,
    blind_spot_flagged: counts,
    blind_spot_status: st.status,
    quadrant: q,
    reason:
      parsed.data.reason ??
      `${riskBand(f.category).label} risk (${likelihoodWord(f.probability)}, ${Math.round(f.probability * 100)}%)${counts ? ' and a potential blind spot (experimental)' : ''}.`,
    context_note: null,
    suggested_action: parsed.data.suggested_action || DECISION_MATRIX[q].action,
    priority: parsed.data.priority,
    responsible_team: parsed.data.responsible_team,
    assignee: parsed.data.assignee,
    status: 'pending',
    notes: [],
    history: [
      { id: `${id}-created`, change: 'created', from: null, to: 'pending', ...actor },
      ...(parsed.data.assignee ? [{ id: `${id}-assigned`, change: 'assigned' as const, from: null, to: parsed.data.assignee, ...actor }] : []),
    ],
    created_at: now,
    updated_at: now,
    source: SRC,
  }
  useMockDb.setState((db) => ({ manualActions: [...db.manualActions, action] }))
  return { action, demo: true }
}

export function updateAction(req: MockRequest): ActionMutationResponse {
  requireOfficer(req.role)
  const parsed = updateActionSchema.safeParse(req.body)
  if (!parsed.success) throw new MockHttpError(422, parsed.error.issues[0]?.message ?? 'Invalid update')
  const data = ds()
  const id = req.params.id!
  const current = allActions(data).find((a) => a.id === id)
  if (!current) throw new MockHttpError(404, 'Action not found')
  const u = parsed.data
  const manual = current.origin === 'manual'
  if (u.priority && u.priority !== current.priority && !manual)
    throw new MockHttpError(422, 'Priority of generated tasks follows the decision-matrix rules.')

  const now = new Date().toISOString()
  const actor = { actor_name: actorName(req.role), actor_role: req.role, created_at: now }
  const edit: ActionEdit = { notes: [], history: [], updated_at: now }
  if (u.status && u.status !== current.status) {
    edit.status = u.status
    edit.history.push({ id: newId('h'), change: 'status', from: current.status, to: u.status, ...actor })
  }
  if (u.assignee !== undefined && u.assignee !== current.assignee) {
    edit.assignee = u.assignee
    edit.history.push({ id: newId('h'), change: 'assigned', from: current.assignee, to: u.assignee, ...actor })
  }
  if (u.note) {
    edit.notes.push({ id: newId('n'), text: u.note, author_name: actor.actor_name, author_role: req.role, created_at: now })
    edit.history.push({ id: newId('h'), change: 'note', from: null, to: u.note, ...actor })
  }

  if (manual) {
    const next: ActionTask = {
      ...current,
      status: edit.status ?? current.status,
      assignee: edit.assignee !== undefined ? edit.assignee : current.assignee,
      priority: u.priority ?? current.priority,
      notes: [...current.notes, ...edit.notes],
      history: [...current.history, ...edit.history],
      updated_at: now,
    }
    useMockDb.setState((db) => ({ manualActions: db.manualActions.map((a) => (a.id === id ? next : a)) }))
  } else {
    useMockDb.setState((db) => {
      const prev = db.actionEdits[id]
      const merged: ActionEdit = {
        status: edit.status ?? prev?.status,
        assignee: edit.assignee !== undefined ? edit.assignee : prev?.assignee,
        notes: [...(prev?.notes ?? []), ...edit.notes],
        history: [...(prev?.history ?? []), ...edit.history],
        updated_at: now,
      }
      return { actionEdits: { ...db.actionEdits, [id]: merged } }
    })
  }
  const action = allActions(data).find((a) => a.id === id)!
  return { action, demo: true }
}

export function generateReport(req: MockRequest): Bulletin {
  const parsed = generateReportSchema.safeParse(req.body)
  if (!parsed.success) throw new MockHttpError(422, parsed.error.issues[0]?.message ?? 'Invalid report request')
  const data = ds()
  if (parsed.data.scope === 'district') getDistrictOr404(data, parsed.data.district_id)
  if (parsed.data.scope === 'state' && !STATES.includes(parsed.data.state ?? '')) throw new MockHttpError(404, 'State not found')
  return buildBulletin(data, useMockDb.getState(), parsed.data)
}

export function getModelPerformance(): ModelPerformanceResponse {
  return {
    status: 'pending',
    message: 'Validation pending — results will appear after the backtest is run.',
    model_version: null,
    evaluated_at: null,
  }
}

export function getDataSources(): DataSourcesResponse {
  const demo = 'Demo mode: not connected. Figures in the app are synthetic.'
  const data = ds()
  return {
    items: [
      {
        id: 'demo_generator',
        name: 'ResilientEpi demo generator',
        description: 'Seeded synthetic data for 60 districts in 12 states. Everything shown in demo mode comes from here.',
        type_tag: 'synthetic_demo',
        status: 'ok',
        last_success_at: data.lastRunAt,
        coverage: { from: '2018-01', to: data.asOf },
        warnings: ['Synthetic demo data — not real surveillance data. Not for operational use.'],
      },
      {
        id: 'hmis',
        name: 'HMIS',
        description: 'Health Management Information System — district-month dengue, testing and fever data.',
        type_tag: 'imported_historical',
        status: 'not_connected',
        last_success_at: null,
        coverage: { from: '2018-01', to: `${HMIS_DATA_ENDS}-12` },
        warnings: [`District-month data ends in ${HMIS_DATA_ENDS}; the district model is retrospective.`, demo],
      },
      {
        id: 'idsp',
        name: 'IDSP / IHIP outbreak records',
        description: 'Weekly outbreak reports used for the live state-level view.',
        type_tag: 'live',
        status: 'not_connected',
        last_success_at: null,
        coverage: null,
        warnings: ['State-level only.', demo],
      },
      {
        id: 'ncvbdc',
        name: 'NCVBDC',
        description: 'National Center for Vector Borne Diseases Control — state dengue cases and deaths.',
        type_tag: 'delayed',
        status: 'not_connected',
        last_success_at: null,
        coverage: null,
        warnings: ['Published with a delay.', demo],
      },
      {
        id: 'imd',
        name: 'IMD gridded rainfall & temperature (imdlib)',
        description: 'India Meteorological Department gridded data, aggregated to districts.',
        type_tag: 'delayed',
        status: 'not_connected',
        last_success_at: null,
        coverage: null,
        warnings: [demo],
      },
      {
        id: 'open_meteo',
        name: 'Open-Meteo',
        description: 'Recent humidity and temperature to fill the IMD lag.',
        type_tag: 'live',
        status: 'not_connected',
        last_success_at: null,
        coverage: null,
        warnings: [demo],
      },
      {
        id: 'boundaries',
        name: 'District boundaries (map)',
        description: 'DataMeet Census 2011 district shapes, filtered to the demo states. Used only to draw the map; all data joins use LGD codes.',
        type_tag: 'imported_historical',
        status: 'ok',
        last_success_at: null,
        coverage: null,
        coverage_note: 'Census 2011 districts, 12 demo states',
        warnings: BOUNDARY_NOTES,
      },
    ],
  }
}
