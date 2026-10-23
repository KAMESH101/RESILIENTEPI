import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { withFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useRunInfo } from '@/app/useRunInfo'
import { DistrictSearch } from '@/components/DistrictSearch'
import { ErrorState } from '@/components/ErrorState'
import { SectionCard } from '@/components/SectionCard'
import { ListSkeleton } from '@/components/Skeletons'
import { DistrictView } from '@/features/district/DistrictView'
import { listDistricts } from '@/services/endpoints'

export default function DistrictDetail() {
  const { id } = useParams()
  return id ? <DistrictView id={id} /> : <DistrictPicker />
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
