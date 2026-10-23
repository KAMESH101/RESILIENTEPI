/**
 * Action Centre tasks, rebuilt from the seeded data and the stored reviews on
 * every request. Generated tasks have stable ids (district + rule), and user
 * edits are layered on by id, so reloads and filter changes never duplicate.
 *
 * Rules (agreed for the demo):
 * - Matrix rows: High + Very High = high risk; Low + Moderate = low risk
 *   (peak forecast across the 1–3 month horizons).
 * - Blind spot = flagged (score ≥ 50) and not dismissed. Watch band and
 *   dismissed count as "no blind spot".
 * - Watch band (35–49) also gets a P3 "verify data completeness" task.
 * - "Flag for audit" on the Blind-Spot page creates one audit task.
 * - Dismissed: the matrix task is recomputed without the blind spot and notes
 *   "Blind spot dismissed by <role>, <date>".
 * - Low risk + no blind spot gets no routine task (unless a dismissal moved a
 *   task there, so the officer still sees the outcome).
 */
import { AUDIT_TASK, DECISION_MATRIX, PRIORITY_LABELS, PRIORITY_RANK, WATCH_TASK, priorityFor } from '@/config/actions'
import { ROLE_LABELS } from '@/config/roles'
import { isHighOrAbove, likelihoodWord, riskBand, RISK_ORDER } from '@/config/risk'
import { formatDate } from '@/lib/format'
import type {
  ActionBlindSpotStatus,
  ActionHistoryEntry,
  ActionStatus,
  ActionTask,
  BlindSpotAssessment,
  BlindSpotReview,
  HorizonForecast,
  Role,
} from '@/types'
import type { ActionEdit, useMockDb } from './db'
import { blindSpotFor, peakForecast, quadrantFor, type Dataset } from './generate'

type DbState = ReturnType<typeof useMockDb.getState>

const SRC = 'synthetic' as const
const BATCH = { actor_name: 'Monthly batch run', actor_role: 'district_officer' as Role }
const STATUS_RANK: Record<ActionStatus, number> = { pending: 0, in_progress: 1, completed: 2 }

export interface BlindSpotState {
  status: ActionBlindSpotStatus
  /** The review that dismissed the flag, when status is "dismissed". */
  dismissal: BlindSpotReview | null
}

/** The latest review decides: a flagged district whose last review is Dismiss counts as dismissed. */
export function blindSpotState(bs: BlindSpotAssessment, reviews: BlindSpotReview[]): BlindSpotState {
  if (bs.band === 'flagged') {
    const latest = reviews[reviews.length - 1]
    return latest?.decision === 'dismiss' ? { status: 'dismissed', dismissal: latest } : { status: 'flagged', dismissal: null }
  }
  return { status: bs.band === 'watch' ? 'watch' : 'none', dismissal: null }
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

function riskText(f: HorizonForecast): string {
  return `${riskBand(f.category).label} risk in ${plural(f.horizon, 'month')} (${likelihoodWord(f.probability)}, ${Math.round(f.probability * 100)}%)`
}

const created = (taskId: string, at: string, actor: { actor_name: string; actor_role: Role } = BATCH): ActionHistoryEntry => ({
  id: `${taskId}-created`,
  change: 'created',
  from: null,
  to: 'pending',
  ...actor,
  created_at: at,
})

/** Generated tasks before any user edits. */
function generate(ds: Dataset, db: DbState): ActionTask[] {
  const out: ActionTask[] = []
  for (const d of ds.districts) {
    const f = peakForecast(ds, d)
    const high = isHighOrAbove(f.category)
    const bs = blindSpotFor(ds, d, ds.asOf)
    const reviews = db.reviews[bs.id] ?? []
    const st = blindSpotState(bs, reviews)
    const counts = st.status === 'flagged'
    const q = quadrantFor(high, counts)
    const rule = DECISION_MATRIX[q]
    const base = {
      district: d.ref,
      severity: f.category,
      blind_spot_flagged: counts,
      blind_spot_status: st.status,
      quadrant: q,
      assignee: null,
      status: 'pending' as const,
      notes: [],
      created_at: ds.lastRunAt,
      updated_at: ds.lastRunAt,
      source: SRC,
    }

    // 1. Decision-matrix task.
    if (q !== 'low_risk_no_blind_spot' || st.status === 'dismissed') {
      const id = `act-${d.ref.id}-matrix`
      const history = [created(id, ds.lastRunAt)]
      let context_note: string | null = null
      let reason = `${riskText(f)}${counts ? ` and a potential blind spot (experimental score ${bs.score}).` : '.'}`
      if (st.dismissal) {
        const r = st.dismissal
        context_note = `Blind spot dismissed by ${ROLE_LABELS[r.reviewer_role]}, ${formatDate(r.created_at)}`
        reason = `${riskText(f)}. Blind-spot flag (score ${bs.score}) was dismissed on review, so it is treated as no blind spot.`
        history.push({
          id: `${id}-rec-${r.id}`,
          change: 'recommendation',
          from: PRIORITY_LABELS[DECISION_MATRIX[quadrantFor(high, true)].priority],
          to: PRIORITY_LABELS[rule.priority],
          actor_name: r.reviewer_name,
          actor_role: r.reviewer_role,
          created_at: r.created_at,
        })
      }
      out.push({
        ...base,
        id,
        origin: 'decision_matrix',
        reason,
        context_note,
        suggested_action: rule.action,
        priority: rule.priority,
        responsible_team: rule.team,
        history,
      })
    }

    // 2. Watch band → verify data completeness (P3).
    if (st.status === 'watch') {
      const id = `act-${d.ref.id}-verify`
      out.push({
        ...base,
        id,
        origin: 'watch_check',
        reason: `Blind-spot watch (experimental score ${bs.score}): reports may be incomplete. ${riskText(f)}.`,
        context_note: null,
        suggested_action: WATCH_TASK.action,
        priority: WATCH_TASK.priority,
        responsible_team: WATCH_TASK.team,
        history: [created(id, ds.lastRunAt)],
      })
    }

    // 3. "Flag for audit" → one audit task (re-flagging never duplicates it).
    const flag = reviews.find((r) => r.decision === 'flag_for_audit')
    if (flag) {
      const id = `act-${d.ref.id}-audit`
      const by = ROLE_LABELS[flag.reviewer_role]
      out.push({
        ...base,
        id,
        origin: 'audit_flag',
        reason: `Flagged for audit by ${by} on ${formatDate(flag.created_at)}${flag.reason ? `: “${flag.reason}”` : '.'}`,
        context_note: null,
        suggested_action: AUDIT_TASK.action,
        priority: priorityFor(high, counts),
        responsible_team: AUDIT_TASK.team,
        history: [created(id, flag.created_at, { actor_name: flag.reviewer_name, actor_role: flag.reviewer_role })],
        created_at: flag.created_at,
        updated_at: flag.created_at,
      })
    }
  }
  return out
}

/** A couple of tasks already under way at the last run, so the list isn't uniform. */
function seedEdits(ds: Dataset): Record<string, ActionEdit> {
  const at = ds.lastRunAt
  const actor = { actor_name: 'Demo District Officer', actor_role: 'district_officer' as Role, created_at: at }
  const started = (id: string, assignee: string): ActionEdit => ({
    status: 'in_progress',
    assignee,
    notes: [],
    history: [
      { id: `${id}-seed-assign`, change: 'assigned', from: null, to: assignee, ...actor },
      { id: `${id}-seed-start`, change: 'status', from: 'pending', to: 'in_progress', ...actor },
    ],
    updated_at: at,
  })
  return {
    'act-mh-mumbai-matrix': started('act-mh-mumbai-matrix', 'Vector control unit'),
    'act-kl-ernakulam-matrix': started('act-kl-ernakulam-matrix', 'Hospital preparedness cell'),
  }
}

function applyEdits(t: ActionTask, ...edits: (ActionEdit | undefined)[]): ActionTask {
  const next = { ...t, notes: [...t.notes], history: [...t.history] }
  for (const e of edits) {
    if (!e) continue
    if (e.status) next.status = e.status
    if (e.assignee !== undefined) next.assignee = e.assignee
    next.notes.push(...e.notes)
    next.history.push(...e.history)
    if (e.updated_at > next.updated_at) next.updated_at = e.updated_at
  }
  next.history.sort((a, b) => a.created_at.localeCompare(b.created_at))
  return next
}

export const sortActions = (a: ActionTask, b: ActionTask) =>
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
  STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
  RISK_ORDER.indexOf(b.severity) - RISK_ORDER.indexOf(a.severity) ||
  a.district.name.localeCompare(b.district.name)

/** Every task (generated + manual), edits applied, sorted P1 → P3. */
export function buildActions(ds: Dataset, db: DbState): ActionTask[] {
  const seeds = seedEdits(ds)
  const generated = generate(ds, db).map((t) => applyEdits(t, seeds[t.id], db.actionEdits[t.id]))
  return [...generated, ...db.manualActions].sort(sortActions)
}
