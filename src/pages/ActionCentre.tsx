import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ClipboardList, Eye, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDistrictPanel, useFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useCanEdit } from '@/app/session'
import { useRunInfo } from '@/app/useRunInfo'
import { DistrictSearch } from '@/components/DistrictSearch'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { FilterBar, type FilterChip } from '@/components/FilterBar'
import { AttentionSkeleton, ListSkeleton } from '@/components/Skeletons'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HUMAN_REVIEW_NOTE, PRIORITY_LABELS, PRIORITY_RULES, STATUS_LABELS } from '@/config/actions'
import { CreateActionButton } from '@/features/actions/CreateActionButton'
import { DecisionMatrixCard } from '@/features/actions/DecisionMatrixCard'
import { TaskCard } from '@/features/actions/TaskCard'
import { listActions, listDistricts } from '@/services/endpoints'
import type { ActionPriority, ActionStatus, ActionTask } from '@/types'

const ALL = '__all__'
const PAGE = 25

export default function ActionCentre() {
  const { t } = useTranslation()
  const { state, params, setParam } = useFilters()
  const { open } = useDistrictPanel()
  const canEdit = useCanEdit()
  const run = useRunInfo()
  const [limit, setLimit] = useState(PAGE)

  const priorityParam = params.get('priority')
  const priority = priorityParam && priorityParam in PRIORITY_LABELS ? (priorityParam as ActionPriority) : null
  const statusParam = params.get('status')
  const status = statusParam && statusParam in STATUS_LABELS ? (statusParam as ActionStatus) : null
  const dist = params.get('dist')
  const unassigned = params.get('unassigned') === '1'

  // All tasks in the state (for counts and the matrix); filters apply client-side so counts stay stable.
  const q = useQuery({ queryKey: ['actions', state], queryFn: () => listActions({ state }), placeholderData: keepPreviousData })
  const districts = useQuery({ queryKey: ['districts', 'all'], queryFn: () => listDistricts(), staleTime: Infinity })
  const distRef = districts.data?.districts.find((d) => d.id === dist)

  const all = useMemo(() => q.data?.items ?? [], [q.data])
  const visible = all.filter(
    (a) =>
      (!priority || a.priority === priority) &&
      (!status || a.status === status) &&
      (!dist || a.district.id === dist) &&
      (!unassigned || (!a.assignee && a.status !== 'completed')),
  )

  const chips: FilterChip[] = [
    ...(priority ? [{ key: 'priority', label: `Priority: ${PRIORITY_LABELS[priority]}`, onRemove: () => setParam({ priority: null }) }] : []),
    ...(status ? [{ key: 'status', label: `Status: ${STATUS_LABELS[status]}`, onRemove: () => setParam({ status: null }) }] : []),
    ...(dist ? [{ key: 'dist', label: `District: ${distRef?.name ?? dist}`, onRemove: () => setParam({ dist: null }) }] : []),
    ...(unassigned ? [{ key: 'unassigned', label: 'Unassigned only', onRemove: () => setParam({ unassigned: null }) }] : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('pages.actions.title')}
        purpose={t('pages.actions.purpose')}
        lastRunAt={run.lastRunAt}
        asOf={run.asOf}
        actions={<CreateActionButton variant="default" prefill={{ district: distRef ?? null, suggested_action: '', priority: 'p3', responsible_team: 'district_surveillance_unit' }} />}
        filters={
          <FilterBar showHorizon={false} extraChips={chips}>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="priority-filter" className="text-xs font-medium text-ink-muted">
                Priority
              </label>
              <Select value={priority ?? ALL} onValueChange={(v) => setParam({ priority: v === ALL ? null : v })}>
                <SelectTrigger id="priority-filter" className="h-9 w-40 max-w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All priorities</SelectItem>
                  {(Object.keys(PRIORITY_LABELS) as ActionPriority[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {PRIORITY_LABELS[k]} — {PRIORITY_RULES[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="status-filter" className="text-xs font-medium text-ink-muted">
                Status
              </label>
              <Select value={status ?? ALL} onValueChange={(v) => setParam({ status: v === ALL ? null : v })}>
                <SelectTrigger id="status-filter" className="h-9 w-40 max-w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-medium text-ink-muted">District</span>
              <DistrictSearch className="w-56 max-w-full" label="Filter by district" placeholder="Filter by district…" onSelect={(d) => setParam({ dist: d.id })} />
            </div>
          </FilterBar>
        }
      />

      {/* Permanent: never dismissible. */}
      {/* Permanent: never dismissible. */}
      <p role="note" className="flex items-start gap-2.5 rounded-2xl border border-blue-200/50 bg-blue-50/70 backdrop-blur-sm px-4.5 py-3.5 text-sm font-medium text-blue-800 shadow-2xs">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
        {HUMAN_REVIEW_NOTE}
      </p>
      {!canEdit && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Eye className="size-4 shrink-0" aria-hidden />
          Read-only view (Evaluator): tasks can be viewed but not changed.
        </p>
      )}

      {q.isError && !q.data ? (
        <div className="rounded-2xl border border-white/80 bg-surface/75 backdrop-blur-xl shadow-card">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </div>
      ) : !q.data ? (
        <>
          <AttentionSkeleton />
          <ListSkeleton rows={6} className="rounded-2xl border border-white/80 bg-surface/75 backdrop-blur-xl" />
        </>
      ) : (
        <>
          <AttentionStrip tasks={all} onFilter={(u) => setParam(u)} />
          <DecisionMatrixCard tasks={all} />
          <section aria-labelledby="tasks-title" className="flex flex-col gap-3">
            <h2 id="tasks-title" className="flex flex-wrap items-baseline gap-x-2 text-xl font-semibold text-slate-900 tracking-tight">
              {t('actions.tasks')}
              <span className="text-sm font-normal text-slate-500 tabular-nums" role="status">
                Showing {Math.min(visible.length, limit)} of {visible.length}
                {visible.length !== all.length && ` (${all.length} in total)`}
              </span>
            </h2>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-white/80 bg-surface/75 backdrop-blur-xl shadow-card">
                <EmptyState
                  icon={ClipboardList}
                  title="No tasks match these filters"
                  description="Try another priority, status or district."
                  action={
                    <Button variant="outline" onClick={() => setParam({ priority: null, status: null, dist: null, unassigned: null, state: null })}>
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {visible.slice(0, limit).map((a) => (
                  <TaskCard key={a.id} task={a} highlighted={!!dist && a.district.id === dist} onOpenDistrict={() => open(a.district.id)} />
                ))}
                {visible.length > limit && (
                  <Button variant="outline" className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
                    Show {Math.min(PAGE, visible.length - limit)} more
                  </Button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

/** "What needs my attention?" first: open P1s, unassigned and in-progress counts. */
function AttentionStrip({ tasks, onFilter }: { tasks: ActionTask[]; onFilter: (u: Record<string, string | null>) => void }) {
  const openTasks = tasks.filter((t) => t.status !== 'completed')
  const p1 = openTasks.filter((t) => t.priority === 'p1').length
  const unassigned = openTasks.filter((t) => !t.assignee).length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const items = [
    { label: 'P1 tasks open', value: p1, filter: { priority: 'p1', status: null, unassigned: null } },
    { label: 'unassigned open tasks', value: unassigned, filter: { unassigned: '1', status: null, priority: null } },
    { label: 'in progress', value: inProgress, filter: { status: 'in_progress', priority: null, unassigned: null } },
  ]
  return (
    <section aria-label="Needs attention" className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/80 bg-surface/75 backdrop-blur-xl p-4.5 shadow-card transition-all duration-200">
      {items.map((i) => (
        <button
          key={i.label}
          type="button"
          onClick={() => onFilter(i.filter)}
          className="inline-flex items-baseline gap-1.5 rounded-full border border-white/90 bg-white/80 backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 hover:bg-white hover:border-blue-200 hover:text-slate-900 hover:shadow-xs"
        >
          <strong className="text-sm font-bold text-slate-900 tabular-nums">{i.value}</strong>
          <span>{i.label}</span>
        </button>
      ))}
    </section>
  )
}
