import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useFilters } from '@/app/filters'
import { listDistricts } from '@/services/endpoints'
import type { Horizon } from '@/types'
import { HORIZONS } from '@/types'
import { InfoTooltip } from './InfoTooltip'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

export interface FilterChip {
  key: string
  label: string
  onRemove: () => void
}

const ALL = '__all__'

/** Horizon segmented control, state select, active chips and "Clear all" — all URL-backed. */
export function FilterBar({
  showHorizon = true,
  showState = true,
  extraChips = [],
  children,
}: {
  showHorizon?: boolean
  showState?: boolean
  extraChips?: FilterChip[]
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const { horizon, state, setHorizon, setState, setParam } = useFilters()
  const { data } = useQuery({ queryKey: ['districts', 'all'], queryFn: () => listDistricts(), staleTime: Infinity })

  const chips: FilterChip[] = [
    ...(showHorizon && horizon !== 1
      ? [{ key: 'h', label: `Horizon: ${horizon} months`, onRemove: () => setHorizon(1) }]
      : []),
    ...(showState && state ? [{ key: 'state', label: `State: ${state}`, onRemove: () => setState(null) }] : []),
    ...extraChips,
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {showHorizon && (
          <div className="flex flex-col gap-1">
            <span id="horizon-label" className="flex items-center gap-1 text-xs font-medium text-ink-muted">
              {t('filters.horizon')}
              <InfoTooltip term="forecast_horizon" className="size-5" />
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={String(horizon)}
              onValueChange={(v) => v && setHorizon(Number(v) as Horizon)}
              aria-labelledby="horizon-label"
              className="bg-surface"
            >
              {HORIZONS.map((h) => (
                <ToggleGroupItem
                  key={h}
                  value={String(h)}
                  aria-label={`${h} month${h > 1 ? 's' : ''} ahead`}
                  className="h-9 min-w-12 px-3 tabular-nums data-[state=on]:bg-navy-900 data-[state=on]:text-white"
                >
                  {h}M
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        {showState && (
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="state-filter" className="text-xs font-medium text-ink-muted">
              {t('filters.state')}
            </label>
            <Select value={state ?? ALL} onValueChange={(v) => setState(v === ALL ? null : v)}>
              <SelectTrigger id="state-filter" className="h-9 w-52 max-w-full bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('filters.allStates')}</SelectItem>
                {(data?.states ?? []).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {children}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <span
              key={c.key}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-teal-600 bg-cyan-50 pr-1 pl-2.5 text-xs font-medium text-navy-900"
            >
              {c.label}
              <button
                type="button"
                onClick={c.onRemove}
                className="inline-flex size-5 items-center justify-center rounded-full hover:bg-white"
                aria-label={`Remove filter ${c.label}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
          <Button
            variant="link"
            size="sm"
            className="h-7 px-1 text-teal-600"
            onClick={() => {
              const clear: Record<string, null> = { h: null, state: null }
              for (const c of extraChips) clear[c.key] = null
              setParam(clear)
            }}
          >
            {t('filters.clearAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
