import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, ChevronDown, Clock, FlaskRound, MapPinOff, TrendingDown, TrendingUp } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useDistrictPanel, useFilters, withFilters } from '@/app/filters'
import { HUMAN_REVIEW_NOTE } from '@/config/actions'
import { riskBand } from '@/config/risk'
import { CreateActionButton } from '@/features/actions/CreateActionButton'
import { prefillFor } from '@/features/actions/createActionStore'
import { useNoBoundaryNotes } from '@/features/map/useNoBoundaryNotes'
import { formatInt, formatMonth, formatPct } from '@/lib/format'
import { MQ, useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'
import { getRiskMap } from '@/services/endpoints'
import type { DistrictSummary } from '@/types'
import { BlindSpotBadge } from './BlindSpotBadge'
import { ChartCard } from './ChartCard'
import { ErrorState } from './ErrorState'
import { InfoTooltip } from './InfoTooltip'
import { RiskBadge } from './RiskBadge'
import { ListSkeleton } from './Skeletons'
import { Sparkline } from './Sparkline'
import { SyntheticTag } from './SyntheticTag'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet'

/**
 * One district, one consistent panel. Mounted once in the layout and opened by
 * `?district=<id>` from any page, so it behaves identically everywhere.
 */
export function DistrictPanel() {
  const { openId, close } = useDistrictPanel()
  const { horizon } = useFilters()
  const tablet = useMediaQuery(MQ.tablet)
  const q = useQuery({ queryKey: ['risk-map', horizon], queryFn: () => getRiskMap(horizon), enabled: !!openId })
  const summary = q.data?.districts.find((d) => d.district.id === openId)

  return (
    <Sheet open={!!openId} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side={tablet ? 'right' : 'bottom'}
        className={cn('gap-0 p-0', tablet ? 'w-full sm:max-w-md' : 'max-h-[88dvh] rounded-t-2xl')}
      >
        {q.isLoading || (!summary && !q.isError && q.isFetching) ? (
          <>
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>Loading district…</SheetTitle>
              <SheetDescription className="sr-only">Loading</SheetDescription>
            </SheetHeader>
            <ListSkeleton rows={6} />
          </>
        ) : q.isError ? (
          <>
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>District</SheetTitle>
              <SheetDescription className="sr-only">Error</SheetDescription>
            </SheetHeader>
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          </>
        ) : !summary ? (
          <>
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>District not found</SheetTitle>
              <SheetDescription>This district is not in the current dataset.</SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <Button variant="outline" onClick={close}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <DistrictPanelBody summary={summary} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function DistrictPanelBody({ summary: s }: { summary: DistrictSummary }) {
  const [params] = useSearchParams()
  const f = s.forecast
  const noBoundary = useNoBoundaryNotes().get(s.district.id)
  const band = f ? riskBand(f.category) : null

  return (
    <>
      {/* 1. Header */}
      <SheetHeader className="gap-2 border-b px-4 pt-4 pb-3 pr-12">
        <SheetTitle className="text-xl text-navy-900">{s.district.name}</SheetTitle>
        <SheetDescription className="text-sm text-ink-muted">{s.district.state}</SheetDescription>
        {noBoundary && (
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <MapPinOff className="size-3.5 shrink-0" aria-hidden />
            {noBoundary} — not drawn on the map.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <RiskBadge category={f?.category ?? null} probability={f?.probability} />
          {s.blind_spot && <BlindSpotBadge band={s.blind_spot.band} score={s.blind_spot.score} />}
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        {/* 2. Plain-language summary */}
        <section className="border-b px-4 py-3">
          <p className="text-base text-ink">{s.summary_sentence}</p>
          {f && band && (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
              <span>
                {band.word} ({formatPct(f.probability)}) to exceed the outbreak threshold in {formatMonth(f.target_month)}
              </span>
              <InfoTooltip term="outbreak_threshold" />
              <SyntheticTag source={f.source} />
            </p>
          )}
        </section>

        {/* 3. Top 3 reasons */}
        <section className="border-b px-4 py-3" aria-labelledby="dp-reasons">
          <h3 id="dp-reasons" className="flex items-center gap-1 text-sm font-semibold text-navy-900">
            Top reasons
            <InfoTooltip term="shap" />
          </h3>
          {s.top_reasons.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Explanation not yet available.</p>
          ) : (
            <>
              <ul className="mt-2 flex flex-col gap-2">
                {s.top_reasons.map((r) => {
                  const up = r.direction === 'increases_risk'
                  const Icon = up ? TrendingUp : TrendingDown
                  return (
                    <li key={r.feature} className="flex items-start gap-2 text-sm">
                      <span className={cn('mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full', up ? 'bg-[#fdecea] text-risk-veryhigh' : 'bg-[#e8f5e9] text-risk-low')}>
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <span>
                        {r.text}
                        <span className="sr-only">{up ? ' (raises risk)' : ' (lowers risk)'}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <details className="group mt-2 text-sm">
                <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-teal-600">
                  <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180" aria-hidden />
                  How is this calculated?
                </summary>
                <p className="mt-2 text-ink-muted">
                  SHAP values show how much each input pushed this forecast up (+) or down (−) on the model’s log-odds scale.
                </p>
                <table className="mt-2 w-full text-xs">
                  <thead>
                    <tr className="text-left text-ink-muted">
                      <th className="py-1 font-medium">Feature</th>
                      <th className="py-1 text-right font-medium">SHAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.top_reasons.map((r) => (
                      <tr key={r.feature} className="border-t">
                        <td className="py-1 font-mono">{r.feature}</td>
                        <td className="py-1 text-right tabular-nums">{r.shap_value > 0 ? '+' : ''}{r.shap_value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <SyntheticTag className="mt-2" source={s.top_reasons[0]!.source} />
              </details>
            </>
          )}
        </section>

        {/* 4. Case trend */}
        <section className="border-b px-4 py-3">
          <ChartCard
            compact
            title="Reported cases, last 12 months"
            caption="Observed (solid line). Monsoon months shaded."
            synthetic
            summary={trendSummary(s)}
            table={{
              columns: ['Month', 'Reported cases'],
              rows: s.case_trend.map((p) => [formatMonth(p.month), formatInt(p.reported_cases)]),
            }}
          >
            <Sparkline data={s.case_trend} />
          </ChartCard>
        </section>

        {/* 5. Testing and freshness */}
        <section className="border-b px-4 py-3" aria-labelledby="dp-testing">
          <h3 id="dp-testing" className="text-sm font-semibold text-navy-900">
            Testing and data freshness
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="flex items-center gap-1 text-ink-muted">
                <FlaskRound className="size-3.5" aria-hidden /> Tests per 100k
              </dt>
              <dd className="font-semibold tabular-nums">{formatInt(s.latest_tests_per_100k)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-ink-muted">
                Test positivity <InfoTooltip term="test_positivity" className="size-5" />
              </dt>
              <dd className="font-semibold tabular-nums">{formatPct(s.latest_test_positivity)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="flex items-center gap-1 text-ink-muted">
                <Clock className="size-3.5" aria-hidden /> Latest report
              </dt>
              <dd className="font-semibold">{formatMonth(s.freshness.last_reported_month)}</dd>
            </div>
          </dl>
          {s.freshness.confidence === 'low' && (
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-[#fff4e5] p-2 text-sm text-[#7a3d00]">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Low confidence:{' '}
                {s.freshness.months_stale >= 3
                  ? `data ${s.freshness.months_stale} months old.`
                  : `${s.freshness.missing_months.length} of the last 12 months have no report.`}{' '}
                Missing months show as “No data”, never 0.
              </span>
            </p>
          )}
          <SyntheticTag className="mt-2" />
        </section>

        {/* 6. Recommended action */}
        <section className="px-4 py-3">
          <h3 className="text-sm font-semibold text-navy-900">Recommended action</h3>
          <p className="mt-1 text-sm">{s.recommended_action}</p>
          <p className="mt-2 text-xs text-ink-muted">{HUMAN_REVIEW_NOTE}</p>
        </section>
      </div>

      {/* 7. Buttons — sticky at the bottom so they stay in thumb reach */}
      <div className="flex flex-wrap gap-2 border-t bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button asChild className="flex-1">
          <Link to={withFilters(`/district/${s.district.id}`, params)}>
            Open district page
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        <CreateActionButton className="flex-1" prefill={prefillFor(s.district, f?.category ?? null, s.blind_spot?.flagged ?? false, s.summary_sentence)} />
      </div>
    </>
  )
}

function trendSummary(s: DistrictSummary): string {
  const vals = s.case_trend.filter((p) => p.reported_cases != null)
  const missing = s.case_trend.length - vals.length
  if (!vals.length) return `${s.district.name} has no reported cases data for the last 12 months.`
  const peak = vals.reduce((a, b) => (b.reported_cases! > a.reported_cases! ? b : a))
  const last = vals[vals.length - 1]!
  return `${s.district.name} reported ${formatInt(last.reported_cases)} cases in ${formatMonth(last.month)}; the 12-month peak was ${formatInt(peak.reported_cases)} in ${formatMonth(peak.month)}.${missing ? ` ${missing} month${missing > 1 ? 's have' : ' has'} no data.` : ''}`
}
