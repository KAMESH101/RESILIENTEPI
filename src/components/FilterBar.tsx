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
            <span id="horizon-label" className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-white">
              {t('filters.horizon')}
              <InfoTooltip term="forecast_horizon" className="size-5" />
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={String(horizon)}
              onValueChange={(v) => v && setHorizon(Number(v) as Horizon)}
              aria-labelledby="horizon-label"
              className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 p-1 shadow-2xs gap-1"
            >
              {HORIZONS.map((h) => (
                <ToggleGroupItem
                  key={h}
                  value={String(h)}
                  aria-label={`${h} month${h > 1 ? 's' : ''} ahead`}
                  className="h-8 min-w-14 rounded-full px-3.5 text-xs font-medium tabular-nums transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/10 data-[state=on]:bg-slate-900 dark:data-[state=on]:bg-white data-[state=on]:text-white dark:data-[state=on]:text-slate-900 data-[state=on]:shadow-xs data-[state=on]:font-semibold"
                >
                  {h}M Ahead
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        {showState && (
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="state-filter" className="text-xs font-medium text-slate-500 dark:text-white">
              {t('filters.state')}
            </label>
            <Select value={state ?? ALL} onValueChange={(v) => setState(v === ALL ? null : v)}>
              <SelectTrigger id="state-filter" className="h-10 w-52 max-w-full rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-2xs text-slate-800 dark:text-white hover:bg-white dark:hover:bg-white/10 transition-all px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#191a22] shadow-elevated">
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
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-orange-200/80 dark:border-orange-500/30 bg-orange-50/90 dark:bg-orange-950/40 pr-2 pl-3.5 text-xs font-medium text-orange-900 dark:text-orange-200 shadow-2xs"
            >
              {c.label}
              <button
                type="button"
                onClick={c.onRemove}
                className="inline-flex size-4.5 items-center justify-center rounded-full text-orange-700 dark:text-orange-400 transition-colors hover:bg-orange-200/60 dark:hover:bg-orange-900/60"
                aria-label={`Remove filter ${c.label}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10"
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
