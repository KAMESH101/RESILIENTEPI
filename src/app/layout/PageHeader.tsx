import { Activity, Clock, Compass, Eye, FileText, Layers, Settings2, ShieldAlert, Sparkles, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { InfoTooltip } from '@/components/InfoTooltip'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatMonth } from '@/lib/format'
import { useSession } from '../session'

/**
 * Premium Favicon Badge:
 * Replaces generic emojis with software favicon marks (elevated squircles in
 * signature blue and orange palettes, with vector SVG icons and dark mode glow).
 */
function FaviconBadge({
  variant,
  children,
  label,
}: {
  variant: 'blue' | 'orange'
  children: ReactNode
  label?: string
}) {
  const isBlue = variant === 'blue'
  return (
    <span
      className={`inline-flex items-center justify-center align-middle mx-1.5 sm:mx-2.5 my-0.5 size-9 sm:size-11.5 lg:size-13.5 rounded-xl sm:rounded-2xl border transition-all duration-200 select-none ${
        isBlue
          ? 'bg-gradient-to-b from-blue-50/90 to-blue-100/70 dark:from-blue-950/60 dark:to-blue-900/40 border-blue-200/90 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-[0_2px_10px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_0_18px_rgba(59,130,246,0.22)]'
          : 'bg-gradient-to-b from-orange-50/90 to-orange-100/70 dark:from-orange-950/60 dark:to-orange-900/40 border-orange-200/90 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-[0_2px_10px_rgba(249,115,22,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_0_18px_rgba(249,115,22,0.22)]'
      }`}
      aria-hidden="true"
      title={label}
    >
      {children}
    </span>
  )
}

/**
 * Editorial Heading with inline graphic favicon marks (No generic emojis, clean vector SVGs)
 * in the signature Blue & Orange palette, matching the reference typography scale:
 * "Managing [favicon] Your Team and [favicon] Workflows"
 */
function EditorialTitle({ title }: { title: string }) {
  const headingClass =
    'text-3xl sm:text-5xl lg:text-[56px] xl:text-[62px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12] sm:leading-[1.08]'
  const subHeadingClass = 'block text-slate-800 dark:text-slate-200 mt-1 sm:mt-1.5'

  if (title.includes('Overview') || title.includes('Surveillance Overview')) {
    return (
      <h1 className={headingClass}>
        <span className="block">
          India Dengue
          <FaviconBadge variant="blue" label="Activity">
            <Activity className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Surveillance
        </span>
        <span className={subHeadingClass}>
          and
          <FaviconBadge variant="orange" label="Forecast">
            <Sparkles className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Early Warning
        </span>
      </h1>
    )
  }

  if (title.includes('Risk Map') || title.includes('Map')) {
    return (
      <h1 className={headingClass}>
        <span className="block">
          National
          <FaviconBadge variant="blue" label="Map">
            <Compass className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Risk Map
        </span>
        <span className={subHeadingClass}>
          and
          <FaviconBadge variant="orange" label="Forecasts">
            <Sparkles className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Outbreak Forecasts
        </span>
      </h1>
    )
  }

  if (title.includes('Undetected') || title.includes('Blind')) {
    return (
      <h1 className={headingClass}>
        <span className="block">
          Where Dengue
          <FaviconBadge variant="blue" label="Risk">
            <ShieldAlert className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Goes Undetected
        </span>
        <span className={subHeadingClass}>
          and
          <FaviconBadge variant="orange" label="Detection">
            <Eye className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Blind-Spot Surveillance
        </span>
      </h1>
    )
  }

  if (title.includes('Action')) {
    return (
      <h1 className={headingClass}>
        <span className="block">
          Action Centre
          <FaviconBadge variant="blue" label="Operations">
            <Layers className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Interventions
        </span>
        <span className={subHeadingClass}>
          and
          <FaviconBadge variant="orange" label="Response">
            <Zap className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Field Operations
        </span>
      </h1>
    )
  }

  if (title.includes('Reports') || title.includes('Bulletins')) {
    return (
      <h1 className={headingClass}>
        <span className="block">
          Surveillance
          <FaviconBadge variant="blue" label="Reports">
            <FileText className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Reports & Bulletins
        </span>
        <span className={subHeadingClass}>
          and
          <FaviconBadge variant="orange" label="Briefings">
            <Sparkles className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Monthly Briefings
        </span>
      </h1>
    )
  }

  if (title.includes('Methodology') || title.includes('Data')) {
    return (
      <h1 className={headingClass}>
        <span className="block">
          Methodology
          <FaviconBadge variant="blue" label="Model">
            <Settings2 className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          & Model Base
        </span>
        <span className={subHeadingClass}>
          and
          <FaviconBadge variant="orange" label="Evidence">
            <Sparkles className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Evidence Framework
        </span>
      </h1>
    )
  }

  // Dynamic / fallback handling for district or custom titles
  const words = title.split(' ')
  if (words.length <= 2) {
    return (
      <h1 className={headingClass}>
        <span>
          {title}
          <FaviconBadge variant="blue" label="Surveillance">
            <Activity className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
          </FaviconBadge>
          Surveillance
        </span>
      </h1>
    )
  }

  const mid = Math.ceil(words.length / 2)
  const part1 = words.slice(0, mid).join(' ')
  const part2 = words.slice(mid).join(' ')

  return (
    <h1 className={headingClass}>
      <span className="block">
        {part1}
        <FaviconBadge variant="blue" label="Status">
          <Activity className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
        </FaviconBadge>
      </span>
      <span className={subHeadingClass}>
        and
        <FaviconBadge variant="orange" label="Forecast">
          <Sparkles className="size-4.5 sm:size-6 lg:size-7" strokeWidth={2.2} />
        </FaviconBadge>
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
        <div className="min-w-0 max-w-4xl">
          <EditorialTitle title={title} />
          <p className="mt-3 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">{purpose}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
              <Clock className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden />
              {lastRunAt ? (
                <span>
                  Last monthly run: <span className="font-semibold text-slate-900 dark:text-slate-200 tabular-nums">{formatDateTime(lastRunAt)}</span>
                  {asOf && (
                    <>
                      {' · '}
                      <span>
                        Data up to <span className="font-semibold text-slate-900 dark:text-slate-200">{formatMonth(asOf)}</span>
                      </span>
                    </>
                  )}
                  <InfoTooltip term="last_run" className="-my-1 ml-1 size-4 align-middle text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
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
            className="size-11 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs transition-all"
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
