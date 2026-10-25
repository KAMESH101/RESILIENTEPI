import { CheckCircle2, EyeOff, History, MessageSquarePlus, PlayCircle, RotateCcw, StickyNote, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { ROLE_LABELS } from '@/app/session'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { GuardedButton } from '@/components/GuardedButton'
import { RiskBadge } from '@/components/RiskBadge'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { ORIGIN_LABELS, PRIORITY_LABELS, STATUS_LABELS, TEAM_LABELS } from '@/config/actions'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ActionHistoryEntry, ActionStatus, ActionTask } from '@/types'
import { PriorityPill } from './PriorityPill'
import { TaskChangeDialog, type TaskChange } from './TaskChangeDialog'

const STATUS_TONE: Record<ActionStatus, string> = {
  pending: 'border-border bg-surface text-ink-muted',
  in_progress: 'border-[#1a73e8]/40 bg-[#e8f0fe] text-[#1967d2]',
  completed: 'border-[#1e8e3e]/40 bg-[#e6f4ea] text-[#1e8e3e]',
}

const HISTORY_PREVIEW = 3

function historyText(h: ActionHistoryEntry): string {
  const label = (s: string | null) => (s && s in STATUS_LABELS ? STATUS_LABELS[s as ActionStatus] : (s ?? '—'))
  switch (h.change) {
    case 'created':
      return 'Task created'
    case 'assigned':
      return h.to ? `Assigned to ${h.to}` : 'Unassigned'
    case 'status':
      return `Status ${label(h.from)} → ${label(h.to)}`
    case 'note':
      return 'Note added'
    case 'priority':
      return `Priority ${PRIORITY_LABELS[h.from as keyof typeof PRIORITY_LABELS] ?? h.from} → ${PRIORITY_LABELS[h.to as keyof typeof PRIORITY_LABELS] ?? h.to}`
    case 'recommendation':
      return `Recommendation updated ${h.from} → ${h.to}: blind spot dismissed`
  }
}

export function TaskCard({ task: t, onOpenDistrict, highlighted = false }: { task: ActionTask; onOpenDistrict: () => void; highlighted?: boolean }) {
  const [change, setChange] = useState<TaskChange | null>(null)
  const [allHistory, setAllHistory] = useState(false)
  const history = [...t.history].reverse()
  const shown = allHistory ? history : history.slice(0, HISTORY_PREVIEW)

  return (
    <article
      id={t.id}
      aria-labelledby={`${t.id}-title`}
      className={cn(
        'flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:shadow-[0_4px_16px_rgba(60,64,67,0.12)] hover:border-[#1a73e8]/40',
        t.status === 'completed' && 'opacity-85',
        highlighted && 'ring-2 ring-[#1a73e8] ring-offset-2',
      )}
    >
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <PriorityPill priority={t.priority} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 id={`${t.id}-title`} className="text-base font-semibold text-ink">
            {t.suggested_action}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
            <button type="button" onClick={onOpenDistrict} className="font-medium text-[#1a73e8] hover:underline">
              {t.district.name}
            </button>
            <span className="text-ink-muted">{t.district.state}</span>
            <RiskBadge size="sm" category={t.severity} />
            {t.blind_spot_status === 'flagged' && <BlindSpotBadge size="sm" band="flagged" />}
            {t.blind_spot_status === 'watch' && <BlindSpotBadge size="sm" band="watch" />}
            {t.blind_spot_status === 'dismissed' && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full border border-dashed border-border px-2 text-xs text-ink-muted">
                <EyeOff className="size-3" aria-hidden /> Blind spot dismissed
              </span>
            )}
            <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-ink-muted">{ORIGIN_LABELS[t.origin]}</span>
            <SyntheticTag source={t.source} />
          </div>
        </div>
        <span className={cn('inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-medium shadow-2xs', STATUS_TONE[t.status])}>
          {STATUS_LABELS[t.status]}
        </span>
      </header>

      <p className="text-sm text-ink leading-relaxed">{t.reason}</p>
      {t.context_note && (
        <p className="flex items-start gap-2 rounded-xl border border-[#1a73e8]/20 bg-[#e8f0fe] px-3.5 py-2.5 text-sm text-[#1967d2]">
          <EyeOff className="mt-0.5 size-4 shrink-0 text-[#1a73e8]" aria-hidden />
          {t.context_note}
        </p>
      )}

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div className="flex gap-1.5">
          <dt className="text-ink-muted">Team:</dt>
          <dd className="font-medium">{TEAM_LABELS[t.responsible_team]}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-muted">Assigned to:</dt>
          <dd className={cn('font-medium', !t.assignee && 'text-ink-muted italic')}>{t.assignee ?? 'Unassigned'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-muted">Updated:</dt>
          <dd className="tabular-nums">{formatDateTime(t.updated_at)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <GuardedButton label={t.assignee ? 'Reassign' : 'Assign'} variant="outline" size="sm" onClick={() => setChange({ kind: 'assign' })}>
          <UserPlus aria-hidden /> {t.assignee ? 'Reassign' : 'Assign'}
        </GuardedButton>
        {t.status === 'pending' && (
          <GuardedButton label="Mark In Progress" variant="outline" size="sm" onClick={() => setChange({ kind: 'status', to: 'in_progress' })}>
            <PlayCircle aria-hidden /> Mark In Progress
          </GuardedButton>
        )}
        {t.status !== 'completed' && (
          <GuardedButton label="Mark Completed" variant="outline" size="sm" onClick={() => setChange({ kind: 'status', to: 'completed' })}>
            <CheckCircle2 aria-hidden /> Mark Completed
          </GuardedButton>
        )}
        {t.status !== 'pending' && (
          <GuardedButton label="Move to Pending" variant="outline" size="sm" onClick={() => setChange({ kind: 'status', to: 'pending' })}>
            <RotateCcw aria-hidden /> {t.status === 'completed' ? 'Reopen' : 'Back to Pending'}
          </GuardedButton>
        )}
        <GuardedButton label="Add note" variant="outline" size="sm" onClick={() => setChange({ kind: 'note' })}>
          <MessageSquarePlus aria-hidden /> Add note
        </GuardedButton>
      </div>

      {t.notes.length > 0 && (
        <section aria-label={`Notes for ${t.district.name}`}>
          <h4 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Notes</h4>
          <ul className="mt-1 flex flex-col gap-1.5">
            {[...t.notes].reverse().map((n) => (
              <li key={n.id} className="flex items-start gap-2 text-sm">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
                <span>
                  <span className="[overflow-wrap:anywhere]">{n.text}</span>
                  <span className="block text-xs text-ink-muted">
                    {n.author_name} ({ROLE_LABELS[n.author_role]}) · <span className="tabular-nums">{formatDateTime(n.created_at)}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t pt-2">
        <ol className="flex flex-col gap-1" aria-label={`History for ${t.district.name}: ${t.suggested_action}`}>
          {shown.map((h) => (
            <li key={h.id} className="flex items-start gap-1.5 text-xs text-ink-muted">
              <History className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium text-ink">{historyText(h)}</span> · {h.actor_name}
                {h.actor_name !== 'Monthly batch run' && ` (${ROLE_LABELS[h.actor_role]})`} · <span className="tabular-nums">{formatDateTime(h.created_at)}</span>
              </span>
            </li>
          ))}
        </ol>
        {history.length > HISTORY_PREVIEW && (
          <Button variant="link" size="sm" className="h-auto px-0 text-xs text-teal-600" onClick={() => setAllHistory((v) => !v)}>
            {allHistory ? 'Show less' : `Show all ${history.length} history lines`}
          </Button>
        )}
      </section>

      <TaskChangeDialog key={change ? JSON.stringify(change) : 'closed'} task={t} change={change} onClose={() => setChange(null)} />
    </article>
  )
}
