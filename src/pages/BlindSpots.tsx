import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronDown, EyeOff, Quote } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDistrictPanel, useFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ExperimentalNotice } from '@/components/ExperimentalNotice'
import { FilterBar, type FilterChip } from '@/components/FilterBar'
import { AttentionSkeleton, ListSkeleton } from '@/components/Skeletons'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BLIND_SPOT_COMPONENT_LABELS,
  BLIND_SPOT_COMPONENT_ORDER,
  BLIND_SPOT_COMPONENT_SIGNALS,
  BLIND_SPOT_THRESHOLD_NOTE,
  BLIND_SPOT_WEIGHTS,
} from '@/config/blindspot'
import { CORE_MESSAGE } from '@/config/demo'
import { BlindSpotEntry } from '@/features/blindspots/BlindSpotEntry'
import { DistrictTrendCharts, ReportedVsExpectedChart } from '@/features/blindspots/charts'
import { getRiskMap, listBlindSpots } from '@/services/endpoints'
import type { BlindSpotAssessment } from '@/types'

type BandFilter = 'flagged' | 'watch' | 'all'
const BAND_LABELS: Record<BandFilter | 'signals', string> = {
  signals: 'Potential blind spots and watch',
  flagged: 'Potential blind spots only',
  watch: 'Watch only',
  all: 'All districts',
}

export default function BlindSpots() {
  const { t } = useTranslation()
  const { horizon, state, params, setParam, setState } = useFilters()
  const { open } = useDistrictPanel()
  const bandParam = params.get('band')
  const band: BandFilter | 'signals' = bandParam === 'flagged' || bandParam === 'watch' || bandParam === 'all' ? bandParam : 'signals'
  const focus = params.get('focus')

  const q = useQuery({ queryKey: ['blind-spots', state], queryFn: () => listBlindSpots(state), placeholderData: keepPreviousData })
  const risk = useQuery({ queryKey: ['risk-map', horizon], queryFn: () => getRiskMap(horizon) })
  const summaries = useMemo(() => new Map((risk.data?.districts ?? []).map((s) => [s.district.id, s])), [risk.data])

  const items = useMemo(() => q.data?.items ?? [], [q.data])
  const visible = items.filter((a) => (band === 'signals' ? a.band !== 'none' : band === 'all' ? true : a.band === band))
  const trendId = params.get('trend') ?? focus
  const trend: BlindSpotAssessment | undefined = items.find((a) => a.district.id === trendId) ?? visible[0] ?? items[0]

  const chips: FilterChip[] = band !== 'signals' ? [{ key: 'band', label: `Showing: ${BAND_LABELS[band]}`, onRemove: () => setParam({ band: null }) }] : []

  const showTrends = (id: string) => {
    setParam({ trend: id })
    document.getElementById('bs-trends')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('pages.blindSpots.title')}
        purpose={t('pages.blindSpots.purpose')}
        lastRunAt={q.data?.last_run_at}
        asOf={q.data?.as_of}
        filters={
          <FilterBar extraChips={chips}>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="band-filter" className="text-xs font-medium text-slate-500 dark:text-white">
                Show
              </label>
              <Select value={band} onValueChange={(v) => setParam({ band: v === 'signals' ? null : v })}>
                <SelectTrigger id="band-filter" className="h-10 w-64 max-w-full rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#131418] shadow-2xs text-slate-800 dark:text-white px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#191a22] shadow-elevated">
                  {(Object.keys(BAND_LABELS) as (keyof typeof BAND_LABELS)[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {BAND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
        }
      />

      <Explainer />

      {q.isError && !q.data ? (
        <div className="rounded-xl border bg-surface shadow-card">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </div>
      ) : !q.data ? (
        <>
          <AttentionSkeleton />
          <ListSkeleton rows={6} className="rounded-xl border bg-surface" />
        </>
      ) : (
        <>
          <AttentionStrip items={items} state={state} onFocus={(id) => setParam({ focus: id, trend: id })} />

          <section aria-labelledby="bs-list-title" className="flex flex-col gap-4">
            <h2 id="bs-list-title" className="flex flex-wrap items-baseline gap-x-2 text-xl font-semibold text-slate-900 dark:text-white">
              {t('blindSpots.ranked')}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                {visible.length} {visible.length === 1 ? 'district' : 'districts'}
                {state ? ` in ${state}` : ''}
              </span>
            </h2>
            {visible.length === 0 ? (
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131418] shadow-card dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                <EmptyState
                  icon={EyeOff}
                  title={state ? `No blind spots in ${state}` : 'No districts match this filter'}
                  description={state ? 'No blind spots in this state. Try another state.' : 'Try showing all districts.'}
                  action={
                    state ? (
                      <Button variant="outline" onClick={() => setState(null)}>
                        Show all states
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setParam({ band: 'all' })}>
                        Show all districts
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              visible.map((a) => (
                <BlindSpotEntry
                  key={a.id}
                  assessment={a}
                  summary={summaries.get(a.district.id)}
                  rank={items.indexOf(a) + 1}
                  focused={a.district.id === focus}
                  defaultExpanded={a.band !== 'none'}
                  onOpenPanel={() => open(a.district.id)}
                  onShowTrends={() => showTrends(a.district.id)}
                />
              ))
            )}
          </section>

          <section aria-labelledby="bs-charts-title" className="flex flex-col gap-4">
            <h2 id="bs-charts-title" className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('blindSpots.evidence')}
            </h2>
            {items.length > 0 && <ReportedVsExpectedChart items={items} onSelect={showTrends} />}
            {trend && (
              <div id="bs-trends" className="flex scroll-mt-32 flex-col gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <label htmlFor="trend-district" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      District trends
                    </label>
                    <Select value={trend.district.id} onValueChange={(v) => setParam({ trend: v })}>
                      <SelectTrigger id="trend-district" className="h-9 w-64 max-w-full bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#191a22]">
                        {items.map((a) => (
                          <SelectItem key={a.id} value={a.district.id}>
                            {a.district.name} — score {a.score}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DistrictTrendCharts assessment={trend} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

/** Core message, the experimental label and how the score is built. */
function Explainer() {
  return (
    <section aria-label="About the blind-spot indicator" className="flex flex-col gap-3 rounded-[26px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131418] p-6 shadow-[0_4px_24px_rgba(20,30,45,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] md:p-7 transition-all duration-200">
      <blockquote className="flex gap-2.5 text-lg font-semibold text-slate-800 dark:text-white md:text-xl">
        <Quote className="mt-1 size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
        <p>{CORE_MESSAGE}</p>
      </blockquote>
      <ExperimentalNotice />
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        The score (0–100) adds up five transparent signals from surveillance data. A high score means the data pattern looks like missed cases — a
        person must check the evidence before acting. {BLIND_SPOT_THRESHOLD_NOTE}
      </p>
      <details className="group text-sm">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180" aria-hidden />
          How is this calculated?
        </summary>
        <table className="mt-3 w-full max-w-3xl text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-white/10 text-left text-slate-500 dark:text-slate-400">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Part
              </th>
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Signal
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {BLIND_SPOT_COMPONENT_ORDER.map((k) => (
              <tr key={k} className="border-b border-slate-100/80 dark:border-white/5 last:border-b-0">
                <td className="py-1.5 pr-3 font-medium text-slate-800 dark:text-slate-200">{BLIND_SPOT_COMPONENT_LABELS[k]}</td>
                <td className="py-1.5 pr-3 text-slate-500 dark:text-slate-400">{BLIND_SPOT_COMPONENT_SIGNALS[k]}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-800 dark:text-slate-200">{Math.round(BLIND_SPOT_WEIGHTS[k] * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 max-w-3xl text-slate-500 dark:text-slate-400 leading-relaxed">
          Each part scores 0 to its weight, using the last 3 reported months. Validation plan: three independent tests, including a synthetic test
          that hides real reports and checks whether the indicator flags the gap. Until then, treat every flag as a prompt to look, not a finding.
        </p>
      </details>
    </section>
  )
}

function AttentionStrip({ items, state, onFocus }: { items: BlindSpotAssessment[]; state: string | null; onFocus: (id: string) => void }) {
  const flagged = items.filter((a) => a.band === 'flagged')
  const watch = items.filter((a) => a.band === 'watch')
  const unreviewed = flagged.filter((a) => a.reviews.length === 0).length
  const top = [...flagged, ...watch].slice(0, 3)
  return (
    <section aria-label="Needs review" className="flex flex-col gap-3 rounded-[26px] border border-orange-200/90 dark:border-orange-500/30 bg-gradient-to-r from-orange-50/90 via-white to-amber-50/60 dark:from-orange-950/40 dark:via-[#191512] dark:to-amber-950/30 p-5 shadow-[0_4px_24px_rgba(20,30,45,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] lg:flex-row lg:items-center lg:justify-between transition-all duration-200">
      <p className="flex items-start gap-2 text-base text-slate-800 dark:text-slate-200">
        <EyeOff className="mt-0.5 size-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
        <span>
          <strong className="tabular-nums text-slate-900 dark:text-white font-bold">{flagged.length}</strong> potential blind spot{flagged.length === 1 ? '' : 's'} and{' '}
          <strong className="tabular-nums text-slate-900 dark:text-white font-bold">{watch.length}</strong> on watch{state ? ` in ${state}` : ''}
          {flagged.length > 0 && (
            <>
              {' '}
              · <strong className="tabular-nums text-slate-900 dark:text-white font-bold">{unreviewed}</strong> not yet reviewed
            </>
          )}
          .
        </span>
      </p>
      {top.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Review first:</span>
          {top.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onFocus(a.district.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/10 py-1 pr-3 pl-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-all duration-150 hover:bg-white dark:hover:bg-white/20 hover:border-blue-400 hover:shadow-xs"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">{a.district.name}</span>
              <span className="text-slate-500 dark:text-slate-400 tabular-nums">{a.score}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
