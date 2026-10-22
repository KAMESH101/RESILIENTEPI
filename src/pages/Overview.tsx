import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowRight, Megaphone, Quote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useDistrictPanel, useFilters, withFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { DataTable } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/KpiCard'
import { RiskBadge } from '@/components/RiskBadge'
import { SectionCard } from '@/components/SectionCard'
import { AttentionSkeleton, KpiSkeleton, ListSkeleton, LoadingLabel } from '@/components/Skeletons'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { HUMAN_REVIEW_NOTE, PRIORITY_LABELS, STATUS_LABELS, TEAM_LABELS } from '@/config/actions'
import { BLIND_SPOT_LABEL, BLIND_SPOT_THRESHOLD_NOTE } from '@/config/blindspot'
import { CONTEXT_STAT, CORE_MESSAGE } from '@/config/demo'
import { riskBand } from '@/config/risk'
import { CreateActionButton } from '@/features/actions/CreateActionButton'
import { prefillFor } from '@/features/actions/createActionStore'
import { MiniRiskMap } from '@/features/map/MiniRiskMap'
import { formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getOverview } from '@/services/endpoints'
import type { ActionTask, AttentionItem, DistrictSummary, OverviewResponse } from '@/types'

export default function Overview() {
  const { t } = useTranslation()
  const { horizon, state, params, setState } = useFilters()
  const { open } = useDistrictPanel()
  const q = useQuery({
    queryKey: ['overview', horizon, state],
    queryFn: () => getOverview({ horizon, state }),
    placeholderData: keepPreviousData,
  })
  const data = q.data
  const link = (path: string, extra: Record<string, string | number | null> = {}) => withFilters(path, params, extra)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title={t('pages.overview.title')}
        purpose={t('pages.overview.purpose')}
        lastRunAt={data?.last_run_at}
        asOf={data?.as_of}
        filters={<FilterBar />}
      />

      {q.isError && !data ? (
        <div className="rounded-xl border bg-surface shadow-card">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </div>
      ) : (
        <>
          {q.isFetching && <LoadingLabel label="Updating overview" />}

          {/* 1. What needs attention — always first */}
          <section aria-labelledby="attention-title">
            <h2 id="attention-title" className="mb-3 flex items-center gap-2 text-xl font-semibold text-navy-900">
              <Megaphone className="size-5 text-risk-high" aria-hidden />
              {t('overview.attention')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {!data ? (
                [0, 1, 2].map((i) => <AttentionSkeleton key={i} />)
              ) : data.attention.length === 0 ? (
                <div className="rounded-xl border bg-surface shadow-card md:col-span-2 xl:col-span-3">
                  <EmptyState
                    title={t('overview.attentionEmpty')}
                    description="No district in this selection is High risk or a potential blind spot."
                    action={state ? <Button variant="outline" onClick={() => setState(null)}>Show all states</Button> : undefined}
                  />
                </div>
              ) : (
                data.attention.map((a) => <AttentionCard key={a.district.id} item={a} summary={data.map.find((m) => m.district.id === a.district.id)} viewHref={link(`/district/${a.district.id}`)} />)
              )}
            </div>
          </section>

          {/* 2. KPIs */}
          <section aria-labelledby="kpi-title">
            <h2 id="kpi-title" className="sr-only">
              {t('overview.kpis')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {!data ? (
                [0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)
              ) : (
                <>
                  <KpiCard label={t('kpi.monitored')} kpi={data.kpis.districts_monitored} meaning="Demo districts with a forecast this month." to={link('/map')} />
                  <KpiCard
                    label={t('kpi.highRisk')}
                    kpi={data.kpis.high_or_very_high}
                    meaning={`Forecast High or Very High ${horizon} month${horizon > 1 ? 's' : ''} ahead.`}
                    to={link('/map', { risk: 'high' })}
                  />
                  <KpiCard label={t('kpi.blindSpots')} kpi={data.kpis.potential_blind_spots} meaning="Experimental flag: low reports may reflect low testing." to={link('/blind-spots')} />
                  <KpiCard
                    label={t('kpi.immediate')}
                    kpi={data.kpis.needing_immediate_attention}
                    meaning="High risk and a potential blind spot."
                    to={link('/actions', { priority: 'urgent' })}
                    emphasis={data.kpis.needing_immediate_attention.value > 0}
                  />
                </>
              )}
            </div>
          </section>

          {/* 3. Map + top 10 */}
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <MiniRiskMap className="col-span-12 xl:col-span-7" title={t('overview.miniMap')} districts={data?.map} onSelect={open} />
            <SectionCard
              id="top-risk"
              className="col-span-12 xl:col-span-5"
              title={
                <>
                  {t('overview.topRisk')}
                  <SyntheticTag />
                </>
              }
              caption={`Highest chance of exceeding the outbreak threshold in ${horizon} month${horizon > 1 ? 's' : ''}.`}
              footer={
                <Link to={link('/map')} className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
                  See all districts <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            >
              {!data ? <ListSkeleton rows={10} /> : <TopRiskTable rows={data.top_risk} onSelect={open} />}
            </SectionCard>
          </div>

          {/* 4. Blind spots + actions */}
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <SectionCard
              id="bs-alerts"
              className="col-span-12 md:col-span-6"
              title={
                <>
                  {t('overview.blindSpotAlerts')}
                  <SyntheticTag />
                </>
              }
              caption={BLIND_SPOT_LABEL}
              footer={
                <Link to={link('/blind-spots')} className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
                  Open Blind-Spot Analysis <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            >
              <CoreMessage />
              {!data ? <ListSkeleton rows={4} /> : <BlindSpotList rows={data.blind_spot_alerts} onSelect={open} onClearState={state ? () => setState(null) : undefined} />}
              <p className="px-4 pb-3 text-xs text-ink-muted">{BLIND_SPOT_THRESHOLD_NOTE}</p>
            </SectionCard>
            <SectionCard
              id="rec-actions"
              className="col-span-12 md:col-span-6"
              title={
                <>
                  {t('overview.recommendedActions')}
                  <SyntheticTag />
                </>
              }
              caption={HUMAN_REVIEW_NOTE}
              footer={
                <Link to={link('/actions')} className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
                  Open Action Centre <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            >
              {!data ? <ListSkeleton rows={5} /> : <ActionList rows={data.recommended_actions} linkFor={(a) => link('/actions', { focus: a.district.id })} />}
            </SectionCard>
          </div>

          {/* 5. Context statistic (sourced, not synthetic) */}
          <ContextStat data={data} />
        </>
      )}
    </div>
  )
}

function AttentionCard({ item, summary, viewHref }: { item: AttentionItem; summary?: DistrictSummary; viewHref: string }) {
  const tone = { very_high: 'border-l-risk-veryhigh', high: 'border-l-risk-high', moderate: 'border-l-risk-moderate', low: 'border-l-risk-low' }[item.severity]
  return (
    <article className={cn('flex flex-col gap-3 rounded-xl border border-l-4 bg-surface p-4 shadow-card', tone)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <RiskBadge category={item.severity} probability={summary?.forecast?.probability} />
        {summary?.blind_spot && <BlindSpotBadge band={summary.blind_spot.band} score={summary.blind_spot.score} />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-navy-900">{item.headline}</h3>
        {/* The headline already names the district, so drop the sentence's "Name: " prefix. */}
        {summary && <p className="mt-1 text-sm text-ink">{summary.summary_sentence.replace(`${item.district.name}: `, '')}</p>}
        <p className="mt-1 text-sm font-medium text-teal-600">{item.suggestion}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button asChild className="flex-1 sm:flex-none">
          <Link to={viewHref}>View district</Link>
        </Button>
        <CreateActionButton className="flex-1 sm:flex-none" prefill={prefillFor(item.district, item.severity, item.blind_spot_flagged, summary?.summary_sentence)} />
      </div>
    </article>
  )
}

function TopRiskTable({ rows, onSelect }: { rows: DistrictSummary[]; onSelect: (id: string) => void }) {
  return (
    <DataTable
      caption="Top 10 districts by forecast risk"
      rows={rows}
      rowKey={(r) => r.district.id}
      onRowClick={(r) => onSelect(r.district.id)}
      rowLabel={(r) => `Open ${r.district.name} details`}
      initialSort={{ key: 'p', dir: 'desc' }}
      empty={<EmptyState title="No districts in this selection" description="Try another state." />}
      columns={[
        {
          key: 'name',
          header: 'District',
          sortValue: (r) => r.district.name,
          cell: (r) => (
            <span className="flex flex-col">
              <span>{r.district.name}</span>
              <span className="text-xs font-normal text-ink-muted">{r.district.state}</span>
            </span>
          ),
        },
        { key: 'risk', header: 'Risk', cell: (r) => <RiskBadge size="sm" category={r.forecast?.category ?? null} probability={r.forecast?.probability} /> },
        {
          key: 'p',
          header: 'Likelihood',
          align: 'right',
          sortValue: (r) => r.forecast?.probability ?? null,
          className: 'whitespace-nowrap',
          cell: (r) => (r.forecast ? `${riskBand(r.forecast.category).word} (${formatPct(r.forecast.probability)})` : 'No data'),
        },
        {
          key: 'bs',
          header: 'Blind spot',
          cell: (r) => (r.blind_spot && r.blind_spot.band !== 'none' ? <BlindSpotBadge size="sm" band={r.blind_spot.band} showChip={false} /> : <span className="text-ink-muted">—</span>),
        },
      ]}
    />
  )
}

function CoreMessage() {
  return (
    <blockquote className="m-4 mb-2 flex gap-2 rounded-lg bg-cyan-50 p-3 text-sm font-medium text-navy-900">
      <Quote className="size-4 shrink-0 text-teal-600" aria-hidden />
      <p>{CORE_MESSAGE}</p>
    </blockquote>
  )
}

function BlindSpotList({ rows, onSelect, onClearState }: { rows: DistrictSummary[]; onSelect: (id: string) => void; onClearState?: () => void }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No blind spots in this selection"
        description={onClearState ? 'No blind spots in this state. Try another state.' : 'No district is flagged or on watch this month.'}
        action={onClearState ? <Button variant="outline" onClick={onClearState}>Show all states</Button> : undefined}
      />
    )
  }
  return (
    <ul className="flex flex-col px-2 pb-2">
      {rows.map((r) => (
        <li key={r.district.id}>
          <button
            type="button"
            onClick={() => onSelect(r.district.id)}
            className="flex w-full flex-col gap-1.5 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-cyan-50"
          >
            <span className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="font-medium text-navy-900">{r.district.name}</span>
              <span className="text-sm text-ink-muted">{r.district.state}</span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <BlindSpotBadge size="sm" band={r.blind_spot!.band} score={r.blind_spot!.score} showChip={false} />
              <RiskBadge size="sm" category={r.forecast?.category ?? null} probability={r.forecast?.probability} />
            </span>
            <ScoreBar score={r.blind_spot!.score} />
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Experimental score shown hatched, never as a solid confirmed-data bar. */
function ScoreBar({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2" aria-hidden>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <span className="pattern-hatch block h-full rounded-full border border-navy-900" style={{ width: `${score}%` }} />
      </span>
      <span className="w-14 text-right text-xs text-ink-muted tabular-nums">{score} / 100</span>
    </span>
  )
}

const PRIORITY_TONE: Record<ActionTask['priority'], string> = {
  urgent: 'bg-risk-veryhigh text-white',
  high: 'bg-risk-high text-ink',
  medium: 'bg-risk-moderate text-ink',
  low: 'bg-muted text-ink',
}

function ActionList({ rows, linkFor }: { rows: ActionTask[]; linkFor: (a: ActionTask) => string }) {
  if (rows.length === 0) return <EmptyState title="No open actions" description="Nothing is waiting for review in this selection." />
  return (
    <ul className="flex flex-col px-2 py-2">
      {rows.map((a) => (
        <li key={a.id}>
          <Link to={linkFor(a)} className="flex flex-col gap-1 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-cyan-50">
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex h-5 items-center rounded-full px-2 text-xs font-semibold', PRIORITY_TONE[a.priority])}>{PRIORITY_LABELS[a.priority]}</span>
              <span className="font-medium text-navy-900">{a.district.name}</span>
              <span className="ml-auto text-xs text-ink-muted">{STATUS_LABELS[a.status]}</span>
            </span>
            <span className="line-clamp-2 text-sm text-ink">{a.suggested_action}</span>
            <span className="text-xs text-ink-muted">{TEAM_LABELS[a.responsible_team]}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ContextStat({ data }: { data: OverviewResponse | undefined }) {
  const { t } = useTranslation()
  const [num, ...rest] = CONTEXT_STAT.text.split(' ')
  return (
    <section aria-labelledby="ctx-title" className={cn('rounded-xl border bg-surface p-4 shadow-card md:p-6', !data && 'opacity-90')}>
      <h2 id="ctx-title" className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
        {t('overview.context')}
      </h2>
      <p className="mt-2 text-base text-ink">
        <span className="mr-1 text-3xl font-semibold text-navy-900 tabular-nums">{num}</span> {rest.join(' ')}
      </p>
      <p className="mt-2 text-xs text-ink-muted">Source: {CONTEXT_STAT.source}. National reported figure — not part of the synthetic demo data.</p>
    </section>
  )
}
