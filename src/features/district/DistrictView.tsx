import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, MapPinOff, PanelRight, TrendingDown, TrendingUp } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useDistrictPanel, useFilters, withFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useRunInfo } from '@/app/useRunInfo'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { ExperimentalChip, ForecastChip } from '@/components/Chips'
import { ErrorState } from '@/components/ErrorState'
import { ExperimentalNotice } from '@/components/ExperimentalNotice'
import { FilterBar } from '@/components/FilterBar'
import { InfoTooltip } from '@/components/InfoTooltip'
import { RiskBadge } from '@/components/RiskBadge'
import { SectionCard } from '@/components/SectionCard'
import { ListSkeleton } from '@/components/Skeletons'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { HUMAN_REVIEW_NOTE, STATUS_LABELS, TEAM_LABELS } from '@/config/actions'
import { STALE_AFTER_MONTHS, riskBand } from '@/config/risk'
import { CreateActionButton } from '@/features/actions/CreateActionButton'
import { prefillFor } from '@/features/actions/createActionStore'
import { PriorityPill } from '@/features/actions/PriorityPill'
import { ScoreBreakdown } from '@/features/blindspots/ScoreBreakdown'
import { useNoBoundaryNotes } from '@/features/map/useNoBoundaryNotes'
import { formatMonth, formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getDistrict, getExplanations } from '@/services/endpoints'
import type { DistrictDetail } from '@/types'
import { ClimateChart, FeverChart, ForecastChart, HistoryChart, TestingChart } from './charts'

export function DistrictView({ id }: { id: string }) {
  const [params] = useSearchParams()
  const { horizon } = useFilters()
  const { open } = useDistrictPanel()
  const run = useRunInfo()
  const q = useQuery({ queryKey: ['district', id], queryFn: () => getDistrict(id) })
  const noBoundary = useNoBoundaryNotes().get(id)

  if (q.isError) {
    return (
      <div className="rounded-xl border bg-surface shadow-card">
        <ErrorState title="Could not load this district" error={q.error} onRetry={() => void q.refetch()} />
      </div>
    )
  }
  const d = q.data
  const f = d?.forecasts.find((x) => x.horizon === horizon) ?? d?.forecasts[0]
  const stale = d ? d.freshness.months_stale >= STALE_AFTER_MONTHS : false

  return (
    <div className="flex flex-col gap-6">
      <Link to={withFilters('/district', params)} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1a73e8] hover:text-[#174ea6] hover:underline transition-colors">
        <ArrowLeft className="size-4" aria-hidden /> All districts
      </Link>

      {/* 1. Status header */}
      <PageHeader
        title={d ? d.district.name : 'Loading district…'}
        purpose={d ? `${d.district.state} · ${d.summary_sentence.replace(`${d.district.name}: `, '')}` : ''}
        lastRunAt={run.lastRunAt}
        asOf={run.asOf}
        actions={
          d && (
            <>
              <Button variant="outline" onClick={() => open(id)}>
                <PanelRight aria-hidden /> Quick view
              </Button>
              <CreateActionButton prefill={prefillFor(d.district, f?.category ?? null, d.blind_spot?.flagged ?? false, d.summary_sentence)} />
            </>
          )
        }
        filters={<FilterBar showState={false} />}
      />

      {!d ? (
        <ListSkeleton rows={6} className="rounded-xl border bg-surface" />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge category={f?.category ?? null} probability={f?.probability} />
              {d.blind_spot && <BlindSpotBadge band={d.blind_spot.band} score={d.blind_spot.score} />}
            </div>
            {stale && (
              <p role="note" className="flex items-start gap-2 rounded-lg bg-[#fff4e5] px-3 py-2 text-sm text-[#7a3d00]">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                Low confidence: data {d.freshness.months_stale} months old. The latest report is from {formatMonth(d.freshness.last_reported_month)}.
              </p>
            )}
            {noBoundary && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <MapPinOff className="size-4 shrink-0" aria-hidden />
                {noBoundary} — not drawn on the map; all other data is available.
              </p>
            )}
          </div>

          {/* 2. 1/2/3-month forecast */}
          <SectionCard
            id="fc"
            title={
              <>
                Forecast by horizon <ForecastChip /> <SyntheticTag />
              </>
            }
            caption={
              <span>
                Chance that cases exceed this district’s outbreak threshold.
                <InfoTooltip term="outbreak_threshold" className="-my-1 ml-0.5 size-5 align-middle" />
              </span>
            }
          >
            <ul className="grid gap-3 p-4 sm:grid-cols-3">
              {d.forecasts.map((x) => (
                <li key={x.horizon} className={cn('rounded-2xl border p-4 transition-all', x.horizon === horizon ? 'border-blue-400 bg-blue-50/70 shadow-2xs' : 'border-slate-200/80 bg-white')}>
                  <p className="text-xs font-medium text-slate-500">
                    {x.horizon} month{x.horizon > 1 ? 's' : ''} ahead · {formatMonth(x.target_month)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RiskBadge category={x.category} probability={x.probability} />
                    <span className="text-sm font-semibold tabular-nums text-slate-800">
                      {riskBand(x.category).word} ({formatPct(x.probability)})
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Expected cases: <span className="font-medium text-slate-800">{x.expected_cases == null ? 'No data' : x.expected_cases.toLocaleString('en-IN')}</span>
                    {x.expected_cases_interval && ` (${x.expected_cases_interval.lower}–${x.expected_cases_interval.upper})`}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
            <Reasons id={id} name={d.district.name} />
            <Actions d={d} />
          </div>

          <SeriesLegend />

          <ForecastChart name={d.district.name} history={d.history} forecasts={d.forecasts} baselines={d.baselines} horizon={horizon} />
          <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
            <HistoryChart name={d.district.name} history={d.history} />
            <TestingChart name={d.district.name} history={d.history} />
            <FeverChart name={d.district.name} history={d.history} />
            <ClimateChart name={d.district.name} history={d.history} />
          </div>

          <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
            <Freshness d={d} />
            <BlindSpot d={d} />
          </div>
        </>
      )}
    </div>
  )
}

/** Observed / Forecast / Experimental — the three kinds of information (prompt §5.1). */
function SeriesLegend() {
  return (
    <ul aria-label="How to read the charts" className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border bg-surface px-4 py-3 text-sm shadow-card">
      <li className="inline-flex items-center gap-2">
        <svg width="28" height="10" aria-hidden>
          <line x1="0" y1="5" x2="28" y2="5" stroke="#0F2A4A" strokeWidth="2.5" />
        </svg>
        <span>
          <strong>Observed</strong> — solid line
        </span>
      </li>
      <li className="inline-flex items-center gap-2">
        <svg width="28" height="10" aria-hidden>
          <line x1="0" y1="5" x2="28" y2="5" stroke="#0E8A8A" strokeWidth="2.5" strokeDasharray="6 4" />
        </svg>
        <span>
          <strong>Forecast</strong> — dashed line; an uncertainty band appears only when the model provides one
        </span>
        <ForecastChip />
      </li>
      <li className="inline-flex items-center gap-2">
        <span className="pattern-hatch inline-block h-3 w-7 rounded-sm border border-navy-900" aria-hidden />
        <span>
          <strong>Experimental</strong> — hatched
        </span>
        <ExperimentalChip />
      </li>
    </ul>
  )
}

function Reasons({ id, name }: { id: string; name: string }) {
  const { horizon } = useFilters()
  const q = useQuery({ queryKey: ['explanations', id, horizon], queryFn: () => getExplanations(id, horizon) })
  return (
    <SectionCard
      id="reasons"
      title={
        <>
          Top reasons <InfoTooltip term="shap" />
          {q.data?.status === 'available' && <SyntheticTag source={q.data.source} />}
        </>
      }
      caption={`What drives the ${horizon}-month forecast for ${name}, in plain language.`}
    >
      {!q.data ? (
        <ListSkeleton rows={3} />
      ) : q.data.status === 'not_available' ? (
        <p className="p-4 text-sm text-ink-muted">Explanation not yet available.</p>
      ) : (
        <ul className="flex flex-col gap-2 p-4">
          {q.data.reasons.map((r) => {
            const up = r.direction === 'increases_risk'
            const Icon = up ? TrendingUp : TrendingDown
            return (
              <li key={r.feature} className="flex items-start gap-2 text-sm">
                <span className={cn('mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full', up ? 'bg-[#fdecea] text-risk-veryhigh' : 'bg-[#e8f5e9] text-risk-low')}>
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="flex-1">
                  {r.text}
                  <span className="sr-only">{up ? ' (raises risk)' : ' (lowers risk)'}</span>
                </span>
                <span className="text-xs text-ink-muted tabular-nums" title="SHAP value">
                  {r.shap_value > 0 ? '+' : ''}
                  {r.shap_value.toFixed(2)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}

function Actions({ d }: { d: DistrictDetail }) {
  const [params] = useSearchParams()
  const open = d.recommended_actions.filter((a) => a.status !== 'completed')
  return (
    <SectionCard
      id="actions"
      title="Recommended actions"
      caption={HUMAN_REVIEW_NOTE}
      footer={
        <Link to={withFilters('/actions', params, { dist: d.district.id })} className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
          Open in Action Centre <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      {open.length === 0 ? (
        <p className="p-4 text-sm text-ink-muted">No open tasks. Routine surveillance continues.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {open.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <PriorityPill priority={a.priority} />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-medium text-navy-900">{a.suggested_action}</span>
                <span className="block text-xs text-ink-muted">
                  {TEAM_LABELS[a.responsible_team]} · {STATUS_LABELS[a.status]}
                  {a.context_note && ` · ${a.context_note}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function Freshness({ d }: { d: DistrictDetail }) {
  const fr = d.freshness
  const latest = [...d.history].reverse().find((h) => h.reporting_completeness != null)
  return (
    <SectionCard id="freshness" title={<>Reporting completeness and data freshness <SyntheticTag /></>} caption="Missing months are shown as “No data”, never as zero.">
      <dl className="grid grid-cols-2 gap-4 p-4 text-sm">
        <div>
          <dt className="flex items-center gap-1 text-ink-muted">
            Reporting completeness <InfoTooltip term="reporting_completeness" className="size-5" />
          </dt>
          <dd className="text-lg font-semibold tabular-nums">{formatPct(latest?.reporting_completeness)}</dd>
          <dd className="text-xs text-ink-muted">{latest ? formatMonth(latest.month) : 'No data'}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-ink-muted">
            <Clock className="size-3.5" aria-hidden /> Latest report
          </dt>
          <dd className="text-lg font-semibold">{formatMonth(fr.last_reported_month)}</dd>
          <dd className={cn('text-xs', fr.confidence === 'low' ? 'font-medium text-[#7a3d00]' : 'text-ink-muted')}>
            {fr.months_stale === 0 ? 'Up to date' : `${fr.months_stale} month${fr.months_stale > 1 ? 's' : ''} old`}
            {fr.confidence === 'low' && ' · Low confidence'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-muted">Months with no report (last 12)</dt>
          <dd className="mt-1">
            {fr.missing_months.length === 0 ? (
              <span className="text-ink-muted">None</span>
            ) : (
              <ul className="flex flex-wrap gap-1.5" aria-label="Months with no report">
                {fr.missing_months.map((m) => (
                  <li key={m} className="pattern-nodata rounded border border-slate-300 px-2 py-0.5 text-xs font-medium">
                    {formatMonth(m)}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
    </SectionCard>
  )
}

function BlindSpot({ d }: { d: DistrictDetail }) {
  const [params] = useSearchParams()
  const bs = d.blind_spot
  if (!bs) return null
  return (
    <SectionCard
      id="bs"
      title={
        <>
          Blind-spot score <ExperimentalChip />
        </>
      }
      footer={
        <Link to={withFilters('/blind-spots', params, { focus: d.district.id })} className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
          Review on the Blind-Spot page <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      <div className="flex flex-col gap-3 p-4">
        {/* Not a SectionCard caption: captions are <p>, and the notice is a <p> too. */}
        <ExperimentalNotice className="text-xs" />
        <BlindSpotBadge band={bs.band} score={bs.score} showChip={false} />
        {bs.band === 'none' && <p className="text-sm text-ink-muted">No blind-spot signal (score {bs.score} / 100).</p>}
        <ScoreBreakdown components={bs.components} score={bs.score} />
        {bs.evidence.length > 0 && (
          <ul className="list-disc pl-5 text-sm">
            {bs.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  )
}
