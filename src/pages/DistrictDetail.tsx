import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Construction, PanelRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useDistrictPanel, withFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useRunInfo } from '@/app/useRunInfo'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { DistrictSearch } from '@/components/DistrictSearch'
import { ErrorState } from '@/components/ErrorState'
import { RiskBadge } from '@/components/RiskBadge'
import { SectionCard } from '@/components/SectionCard'
import { ListSkeleton } from '@/components/Skeletons'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { riskBand } from '@/config/risk'
import { formatMonth, formatPct } from '@/lib/format'
import { getDistrict, listDistricts } from '@/services/endpoints'

export default function DistrictDetail() {
  const { id } = useParams()
  return id ? <DistrictInterim id={id} /> : <DistrictPicker />
}

/** Sidebar entry point: a searchable district picker. */
function DistrictPicker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const run = useRunInfo()
  const q = useQuery({ queryKey: ['districts', 'all'], queryFn: () => listDistricts(), staleTime: Infinity })
  const byState = new Map<string, { id: string; name: string }[]>()
  for (const d of q.data?.districts ?? []) byState.set(d.state, [...(byState.get(d.state) ?? []), d])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('pages.district.title')} purpose={t('pages.district.purpose')} lastRunAt={run.lastRunAt} asOf={run.asOf} />
      <SectionCard id="picker" title="Choose a district" caption="Search by district or state, or pick from the list.">
        <div className="flex flex-col gap-6 p-4">
          <DistrictSearch
            className="max-w-md"
            label="Search district"
            onSelect={(d) => void navigate(withFilters(`/district/${d.id}`, params))}
          />
          {q.isLoading ? (
            <ListSkeleton rows={6} className="p-0" />
          ) : q.isError ? (
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          ) : (
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...byState.entries()].map(([state, list]) => (
                <div key={state}>
                  <h2 className="text-sm font-semibold text-navy-900">{state}</h2>
                  <ul className="mt-1.5 flex flex-col">
                    {list.map((d) => (
                      <li key={d.id}>
                        <Link to={withFilters(`/district/${d.id}`, params)} className="block rounded-md px-2 py-1.5 text-sm text-ink hover:bg-cyan-50 hover:text-navy-900">
                          {d.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

/** Until Phase 5: status header and the 1/2/3-month forecast, plus the shared panel. */
function DistrictInterim({ id }: { id: string }) {
  const [params] = useSearchParams()
  const { open } = useDistrictPanel()
  const run = useRunInfo()
  const q = useQuery({ queryKey: ['district', id], queryFn: () => getDistrict(id) })

  if (q.isError) {
    return (
      <div className="rounded-xl border bg-surface shadow-card">
        <ErrorState title="Could not load this district" error={q.error} onRetry={() => void q.refetch()} />
      </div>
    )
  }
  const d = q.data
  return (
    <div className="flex flex-col gap-6">
      <Link to={withFilters('/district', params)} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All districts
      </Link>
      <PageHeader
        title={d ? d.district.name : 'Loading district…'}
        purpose={d ? `${d.district.state} · ${d.summary_sentence.replace(`${d.district.name}: `, '')}` : ''}
        lastRunAt={run.lastRunAt}
        asOf={run.asOf}
        actions={
          <Button variant="outline" onClick={() => open(id)}>
            <PanelRight aria-hidden /> Quick view
          </Button>
        }
      />
      {!d ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <SectionCard id="fc" title={<>Forecast by horizon <SyntheticTag /></>} caption="Probability that cases exceed this district’s outbreak threshold.">
            <ul className="grid gap-3 p-4 sm:grid-cols-3">
              {d.forecasts.map((f) => (
                <li key={f.horizon} className="rounded-lg border p-3">
                  <p className="text-sm text-ink-muted">
                    {f.horizon} month{f.horizon > 1 ? 's' : ''} ahead · {formatMonth(f.target_month)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RiskBadge category={f.category} probability={f.probability} />
                    <span className="text-sm tabular-nums">
                      {riskBand(f.category).word} ({formatPct(f.probability)})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {d.blind_spot && d.blind_spot.band !== 'none' && (
              <div className="border-t px-4 py-3">
                <BlindSpotBadge band={d.blind_spot.band} score={d.blind_spot.score} />
              </div>
            )}
          </SectionCard>
          <div className="flex items-start gap-3 rounded-xl border border-dashed bg-surface p-4 text-sm text-ink-muted">
            <Construction className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>Forecast-vs-baseline charts, testing, climate and the blind-spot breakdown arrive in Phase 5. Use “Quick view” for this district’s reasons, trend and recommended action.</p>
          </div>
        </>
      )}
    </div>
  )
}
