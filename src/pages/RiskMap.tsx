import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, List, Map as MapIcon, Table2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDistrictPanel } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { toast } from '@/app/toast'
import { ExperimentalChip, ForecastChip } from '@/components/Chips'
import { DistrictSearch } from '@/components/DistrictSearch'
import { ErrorState } from '@/components/ErrorState'
import { FilterBar, type FilterChip } from '@/components/FilterBar'
import { InfoTooltip } from '@/components/InfoTooltip'
import { RiskBadge } from '@/components/RiskBadge'
import { SectionCard } from '@/components/SectionCard'
import { BlockSkeleton, ListSkeleton } from '@/components/Skeletons'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isHighOrAbove, riskBand } from '@/config/risk'
import { DistrictMap } from '@/features/map/DistrictMap'
import { BS_FILTER_LABELS, RISK_FILTER_LABELS, useMapFilters, type BlindSpotFilter, type RiskFilter } from '@/features/map/mapFilters'
import { RiskTable } from '@/features/map/RiskTable'
import { formatPct } from '@/lib/format'
import { MQ, useMediaQuery } from '@/lib/useMediaQuery'
import { getRiskMap } from '@/services/endpoints'
import type { DistrictRef, DistrictSummary } from '@/types'

const ALL = '__all__'

export default function RiskMap() {
  const { t } = useTranslation()
  const tablet = useMediaQuery(MQ.tablet)
  const f = useMapFilters()
  const { open } = useDistrictPanel()
  const q = useQuery({ queryKey: ['risk-map', f.horizon], queryFn: () => getRiskMap(f.horizon), placeholderData: keepPreviousData })

  // Mobile opens on the list first (prompt §5.4); larger screens on the map.
  const view = f.params.get('view') === 'map' || f.params.get('view') === 'table' ? f.params.get('view')! : tablet ? 'map' : 'table'
  const showRisk = f.params.get('risk_layer') !== '0'
  const showBlindSpot = f.params.get('bs_layer') !== '0'
  const focusId = f.params.get('focus')

  const { matches, state } = f
  const all = useMemo(() => q.data?.districts ?? [], [q.data])
  const rows = useMemo(() => all.filter(matches), [all, matches])
  const isDimmed = useMemo(() => (s: DistrictSummary) => !matches(s), [matches])
  const inState = useMemo(() => all.filter((s) => !state || s.district.state === state), [all, state])

  const chips: FilterChip[] = [
    ...(f.risk ? [{ key: 'risk', label: `Risk: ${RISK_FILTER_LABELS[f.risk]}`, onRemove: () => f.setParam({ risk: null }) }] : []),
    ...(f.bs ? [{ key: 'bs', label: BS_FILTER_LABELS[f.bs], onRemove: () => f.setParam({ bs: null }) }] : []),
  ]
  const clearFilters = () => f.setParam({ risk: null, bs: null, state: null })

  const findDistrict = (d: DistrictRef) => {
    f.setParam({ focus: d.id, district: d.id })
    if (view === 'map' && !all.some((s) => s.district.id === d.id)) toast({ variant: 'info', title: `${d.name} has no data in this view` })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('pages.map.title')}
        purpose={t('pages.map.purpose')}
        lastRunAt={q.data?.last_run_at}
        asOf={q.data?.as_of}
        filters={
          <FilterBar extraChips={chips}>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="risk-filter" className="text-xs font-medium text-ink-muted">
                Risk level
              </label>
              <Select value={f.risk ?? ALL} onValueChange={(v) => f.setParam({ risk: v === ALL ? null : v })}>
                <SelectTrigger id="risk-filter" className="h-9 w-48 max-w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All risk levels</SelectItem>
                  {(Object.keys(RISK_FILTER_LABELS) as RiskFilter[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {RISK_FILTER_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="bs-filter" className="text-xs font-medium text-ink-muted">
                Blind spot (experimental)
              </label>
              <Select value={f.bs ?? ALL} onValueChange={(v) => f.setParam({ bs: v === ALL ? null : v })}>
                <SelectTrigger id="bs-filter" className="h-9 w-52 max-w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All districts</SelectItem>
                  {(Object.keys(BS_FILTER_LABELS) as BlindSpotFilter[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {BS_FILTER_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
        }
      />

      {q.isError && !q.data ? (
        <div className="rounded-xl border bg-surface shadow-card">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </div>
      ) : (
        <>
          <AttentionStrip districts={q.data ? inState : undefined} horizon={f.horizon} onSelect={open} />

          {/* Toolbar: view switch, search, layers */}
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            {tablet ? (
              <ToggleGroup
                type="single"
                variant="outline"
                value={view}
                onValueChange={(v) => v && f.setParam({ view: v })}
                aria-label="Map or table view"
                className="rounded-2xl border border-white/80 bg-slate-200/50 backdrop-blur-md p-1 shadow-2xs"
              >
                <ToggleGroupItem value="map" className="h-8.5 gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 hover:text-slate-900 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm data-[state=on]:font-semibold">
                  <MapIcon className="size-4" aria-hidden /> Map
                </ToggleGroupItem>
                <ToggleGroupItem value="table" className="h-8.5 gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 hover:text-slate-900 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm data-[state=on]:font-semibold">
                  <Table2 className="size-4" aria-hidden /> Table
                </ToggleGroupItem>
              </ToggleGroup>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => f.setParam({ view: view === 'map' ? 'table' : 'map' })}>
                {view === 'map' ? <List aria-hidden /> : <MapIcon aria-hidden />}
                {view === 'map' ? 'Show list' : 'Show map'}
              </Button>
            )}
            <DistrictSearch
              className="w-full sm:w-72"
              label="Find a district"
              placeholder="Find a district…"
              onSelect={findDistrict}
            />
            {view === 'map' && (
              <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <legend className="sr-only">Map layers</legend>
                <div className="flex items-center gap-2">
                  <Switch id="layer-risk" checked={showRisk} onCheckedChange={(c) => f.setParam({ risk_layer: c ? null : 0 })} />
                  <Label htmlFor="layer-risk" className="text-sm">
                    Forecast risk
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="layer-bs" checked={showBlindSpot} onCheckedChange={(c) => f.setParam({ bs_layer: c ? null : 0 })} />
                  <Label htmlFor="layer-bs" className="text-sm">
                    Blind-spot overlay
                  </Label>
                  <ExperimentalChip />
                </div>
              </fieldset>
            )}
          </div>

          <SectionCard
            id="risk-map"
            title={
              <>
                Forecast risk, {f.horizon} month{f.horizon > 1 ? 's' : ''} ahead
                <ForecastChip />
                <SyntheticTag />
              </>
            }
            caption={
              <span>
                Chance that cases exceed each district’s outbreak threshold.
                <InfoTooltip term="outbreak_threshold" className="-my-1 ml-0.5 size-5 align-middle" />
              </span>
            }
            bodyClassName={view === 'map' ? 'p-4' : undefined}
          >
            {!q.data ? (
              view === 'map' ? <BlockSkeleton className="h-[480px]" /> : <ListSkeleton rows={10} />
            ) : view === 'map' ? (
              <DistrictMap
                districts={all}
                onSelect={open}
                focusId={focusId}
                isDimmed={isDimmed}
                state={f.state}
                showRisk={showRisk}
                showBlindSpot={showBlindSpot}
              />
            ) : (
              <RiskTable rows={rows} total={all.length} onSelect={open} onClearFilters={chips.length || f.state ? clearFilters : undefined} />
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

/** "What needs my attention?" first: counts plus the three highest-risk districts. */
function AttentionStrip({
  districts,
  horizon,
  onSelect,
}: {
  districts: DistrictSummary[] | undefined
  horizon: number
  onSelect: (id: string) => void
}) {
  if (!districts) return <ListSkeleton rows={1} className="rounded-xl border bg-surface" />
  const high = districts.filter((s) => s.forecast && isHighOrAbove(s.forecast.category)).length
  const flagged = districts.filter((s) => s.blind_spot?.flagged).length
  const top = [...districts].sort((a, b) => (b.forecast?.probability ?? 0) - (a.forecast?.probability ?? 0)).slice(0, 3)
  return (
    <section aria-label="Needs attention" className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-surface/75 backdrop-blur-xl p-4.5 shadow-card lg:flex-row lg:items-center lg:justify-between transition-all duration-200">
      <p className="flex items-start gap-2 text-base text-slate-800">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-risk-high" aria-hidden />
        <span>
          <strong className="tabular-nums text-slate-900">{high}</strong> district{high === 1 ? ' is' : 's are'} forecast High or Very High in {horizon} month{horizon > 1 ? 's' : ''}
          {flagged > 0 && (
            <>
              ; <strong className="tabular-nums text-slate-900">{flagged}</strong> potential blind spot{flagged === 1 ? '' : 's'} (experimental)
            </>
          )}
          .
        </span>
      </p>
      {top.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Highest:</span>
          {top.map((s) => (
            <button
              key={s.district.id}
              type="button"
              onClick={() => onSelect(s.district.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 backdrop-blur-sm py-1 pr-3 pl-1 text-xs font-medium text-slate-800 shadow-2xs transition-all duration-150 hover:bg-white hover:border-blue-200 hover:shadow-xs"
              aria-label={`${s.district.name}: ${s.forecast ? `${riskBand(s.forecast.category).label} risk, ${formatPct(s.forecast.probability)}` : 'No data'}`}
            >
              <RiskBadge size="sm" category={s.forecast?.category ?? null} />
              <span className="font-semibold text-slate-800">{s.district.name}</span>
              <span className="text-slate-500 tabular-nums">{formatPct(s.forecast?.probability)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
