import { Activity, Clock, Compass, Eye, FileText, Layers, Settings2, ShieldAlert, Sparkles, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { InfoTooltip } from '@/components/InfoTooltip'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatMonth } from '@/lib/format'
import { useSession } from '../session'

/**
 * Editorial Heading with inline graphic badges (No emojis, clean outline SVGs)
 * in the signature Blue & Orange palette, matching the reference image:
 * "Managing [gear] Your Team and [sparkle] Workflows"
 */
function EditorialTitle({ title }: { title: string }) {
  if (title.includes('Overview') || title.includes('Surveillance Overview')) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span className="block">
          India Dengue
          <span className="inline-badge-blue" aria-hidden><Activity className="size-4 md:size-4.5" /></span>
          Surveillance
        </span>
        <span className="block text-slate-800">
          and
          <span className="inline-badge-orange" aria-hidden><Sparkles className="size-4 md:size-4.5" /></span>
          Early Warning
        </span>
      </h1>
    )
  }

  if (title.includes('Risk Map') || title.includes('Map')) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span className="block">
          National
          <span className="inline-badge-blue" aria-hidden><Compass className="size-4 md:size-4.5" /></span>
          Risk Map
        </span>
        <span className="block text-slate-800">
          and
          <span className="inline-badge-orange" aria-hidden><Sparkles className="size-4 md:size-4.5" /></span>
          Outbreak Forecasts
        </span>
      </h1>
    )
  }

  if (title.includes('Undetected') || title.includes('Blind')) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span className="block">
          Where Dengue
          <span className="inline-badge-blue" aria-hidden><ShieldAlert className="size-4 md:size-4.5" /></span>
          Goes Undetected
        </span>
        <span className="block text-slate-800">
          and
          <span className="inline-badge-orange" aria-hidden><Eye className="size-4 md:size-4.5" /></span>
          Blind-Spot Surveillance
        </span>
      </h1>
    )
  }

  if (title.includes('Action')) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span className="block">
          Action Centre
          <span className="inline-badge-blue" aria-hidden><Layers className="size-4 md:size-4.5" /></span>
          Interventions
        </span>
        <span className="block text-slate-800">
          and
          <span className="inline-badge-orange" aria-hidden><Zap className="size-4 md:size-4.5" /></span>
          Field Operations
        </span>
      </h1>
    )
  }

  if (title.includes('Reports') || title.includes('Bulletins')) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span className="block">
          Surveillance
          <span className="inline-badge-blue" aria-hidden><FileText className="size-4 md:size-4.5" /></span>
          Reports & Bulletins
        </span>
        <span className="block text-slate-800">
          and
          <span className="inline-badge-orange" aria-hidden><Sparkles className="size-4 md:size-4.5" /></span>
          Monthly Briefings
        </span>
      </h1>
    )
  }

  if (title.includes('Methodology') || title.includes('Data')) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span className="block">
          Methodology
          <span className="inline-badge-blue" aria-hidden><Settings2 className="size-4 md:size-4.5" /></span>
          & Model Base
        </span>
        <span className="block text-slate-800">
          and
          <span className="inline-badge-orange" aria-hidden><Sparkles className="size-4 md:size-4.5" /></span>
          Evidence Framework
        </span>
      </h1>
    )
  }

  // Dynamic / fallback handling for district or custom titles
  const words = title.split(' ')
  if (words.length <= 2) {
    return (
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
        <span>
          {title}
          <span className="inline-badge-blue" aria-hidden><Activity className="size-4 md:size-4.5" /></span>
          Surveillance
        </span>
      </h1>
    )
  }

  const mid = Math.ceil(words.length / 2)
  const part1 = words.slice(0, mid).join(' ')
  const part2 = words.slice(mid).join(' ')

  return (
    <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.18]">
      <span className="block">
        {part1}
        <span className="inline-badge-blue" aria-hidden><Activity className="size-4 md:size-4.5" /></span>
      </span>
      <span className="block text-slate-800">
        and
        <span className="inline-badge-orange" aria-hidden><Sparkles className="size-4 md:size-4.5" /></span>
        {part2}
      </span>
    </h1>
  )
}

/** Title, one-line purpose, last-run time and the page's FilterBar. */
export function PageHeader({
  title,
  purpose,
  lastRunAt,
  asOf,
  filters,
  actions,
}: {
  title: string
  purpose: string
  lastRunAt?: string
  asOf?: string
  filters?: ReactNode
  actions?: ReactNode
}) {
  const openTour = useSession((s) => s.openTour)

  return (
    <header className="flex flex-col gap-5 pt-1 pb-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <EditorialTitle title={title} />
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-normal leading-relaxed">{purpose}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-slate-200/80 px-3 py-1 text-xs text-slate-600 shadow-2xs">
              <Clock className="size-3.5 text-blue-600 shrink-0" aria-hidden />
              {lastRunAt ? (
                <span>
                  Last monthly run: <span className="font-semibold text-slate-900 tabular-nums">{formatDateTime(lastRunAt)}</span>
                  {asOf && (
                    <>
                      {' · '}
                      <span>
                        Data up to <span className="font-semibold text-slate-900">{formatMonth(asOf)}</span>
                      </span>
                    </>
                  )}
                  <InfoTooltip term="last_run" className="-my-1 ml-1 size-4 align-middle text-slate-400 hover:text-slate-700" />
                </span>
              ) : (
                <span>Loading last run…</span>
              )}
            </span>
          </div>
        </div>

        {/* Right side controls matching reference: round settings button + pill action button */}
        <div className="flex items-center gap-2.5 shrink-0 self-start">
          <Button
            variant="outline"
            size="icon"
            onClick={openTour}
            className="size-11 rounded-full border border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white hover:text-blue-600 shadow-2xs transition-all"
            aria-label="Settings and Tour"
          >
            <Settings2 className="size-5" aria-hidden />
          </Button>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      {/* Pill tabs row / FilterBar */}
      {filters && <div className="w-full pt-1">{filters}</div>}
    </header>
  )
}
