import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, MoreVertical } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/types'
import { SyntheticTag } from './SyntheticTag'

/**
 * KPI Metric Card with reference-inspired capsule progress bar,
 * circular icon pill, percentage indicator, and Blue/Orange variant styling.
 */
export function KpiCard({
  label,
  kpi,
  meaning,
  to,
  emphasis = false,
  variant = 'default',
  icon: IconComponent,
}: {
  label: string
  kpi: Kpi
  meaning: string
  to: string
  emphasis?: boolean
  variant?: 'default' | 'orange' | 'blue'
  icon?: ComponentType<{ className?: string }>
}) {
  const delta = kpi.previous == null ? null : kpi.value - kpi.previous

  // Calculate segments for the 8-capsule indicator bar
  const totalSegments = 8
  const baseRatio = kpi.previous && kpi.previous > 0 ? kpi.value / (kpi.previous * 1.25) : 0.65
  const filledCount = Math.max(1, Math.min(totalSegments, Math.round(baseRatio * totalSegments)))
  const pct = Math.round(Math.min(100, Math.max(15, baseRatio * 100)))

  const isOrange = variant === 'orange' || (emphasis && variant !== 'blue')
  const isBlue = variant === 'blue'

  return (
    <Link
      to={to}
      className={cn(
        'group flex min-w-0 flex-col rounded-[26px] p-5.5 transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(20,30,45,0.04)] hover:shadow-[0_12px_32px_rgba(20,30,45,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
        isOrange
          ? 'bg-gradient-to-br from-orange-100/90 via-[#fff8f2] to-amber-100/70 dark:from-orange-950/40 dark:via-[#1a1412] dark:to-amber-950/30 border border-orange-200 dark:border-orange-500/30 text-slate-900 dark:text-white'
          : isBlue
            ? 'bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 dark:from-blue-950/40 dark:via-[#111624] dark:to-blue-900/30 border border-blue-200/80 dark:border-blue-500/30 text-slate-900 dark:text-white'
            : 'bg-white dark:bg-[#131418] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-white/20',
      )}
    >
      {/* Top row: Icon badge + Label + 3-dots / Synthetic tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex size-8 shrink-0 aspect-square items-center justify-center rounded-full text-xs font-semibold shadow-2xs',
              isOrange
                ? 'bg-orange-500 text-white'
                : isBlue
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/10',
            )}
          >
            {IconComponent ? <IconComponent className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
          </div>
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SyntheticTag source={kpi.source} />
          <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 p-0.5">
            <MoreVertical className="size-4" aria-hidden />
          </span>
        </div>
      </div>

      {/* Middle: Big metric number + Denominator + Percentage pill */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatInt(kpi.value)}
          </span>
          {kpi.previous != null && (
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              / {formatInt(kpi.previous)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/90 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-2xs">
          <span>{pct}%</span>
          <span className="size-2 rounded-full border border-current" />
        </div>
      </div>

      {/* Signature Capsule Progress Indicator (Reference Image Style) */}
      <div className="mt-4 flex items-center gap-1.5 py-1" aria-hidden>
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledCount
          return (
            <div
              key={i}
              className={cn(
                'h-6 w-2.5 rounded-full transition-all duration-300',
                isFilled
                  ? isOrange
                    ? 'bg-slate-900 dark:bg-orange-400'
                    : isBlue
                      ? 'bg-blue-600 dark:bg-blue-400'
                      : 'bg-slate-900 dark:bg-white'
                  : isOrange
                    ? 'border border-dashed border-orange-300 dark:border-orange-800/60 bg-transparent'
                    : 'bg-slate-200/70 dark:bg-white/10',
              )}
            />
          )
        })}
      </div>

      {/* Trend & Meaning */}
      <div className="mt-3 flex flex-col gap-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        {delta != null && <Trend delta={delta} />}
        <span className="leading-relaxed line-clamp-2">{meaning}</span>
      </div>

      {/* Bottom link: View → */}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs font-semibold">
        <span
          className={cn(
            'flex items-center gap-1 transition-colors',
            isOrange
              ? 'text-orange-900 group-hover:text-orange-700 dark:text-orange-400 dark:group-hover:text-orange-300'
              : 'text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300',
          )}
        >
          View details
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

function Trend({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus
  const text = delta === 0 ? 'No change vs last month' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} vs last month`
  return (
    <span className="inline-flex items-center gap-0.5 text-xs sm:text-sm text-slate-500 tabular-nums">
      <Icon className="size-3.5 sm:size-4" aria-hidden />
      {text}
    </span>
  )
}
