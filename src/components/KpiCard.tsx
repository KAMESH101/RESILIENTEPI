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
        'group flex min-w-0 flex-col rounded-[26px] p-5.5 transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(20,30,45,0.04)] hover:shadow-[0_12px_32px_rgba(20,30,45,0.08)]',
        isOrange
          ? 'bg-gradient-to-br from-orange-100/90 via-[#fff8f2] to-amber-100/70 border border-orange-200 text-slate-900'
          : isBlue
            ? 'bg-gradient-to-br from-blue-50/90 via-white to-blue-100/50 border border-blue-200/80 text-slate-900'
            : 'bg-white border border-slate-200/70 text-slate-900 hover:border-slate-300',
      )}
    >
      {/* Top row: Icon badge + Label + 3-dots / Synthetic tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-2xs',
              isOrange
                ? 'bg-orange-500 text-white'
                : isBlue
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/70',
            )}
          >
            {IconComponent ? <IconComponent className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
          </div>
          <span className="truncate text-sm font-semibold text-slate-800">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SyntheticTag source={kpi.source} />
          <span className="text-slate-400 group-hover:text-slate-600 p-0.5">
            <MoreVertical className="size-4" aria-hidden />
          </span>
        </div>
      </div>

      {/* Middle: Big metric number + Denominator + Percentage pill */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatInt(kpi.value)}
          </span>
          {kpi.previous != null && (
            <span className="text-sm font-medium text-slate-500 tabular-nums">
              / {formatInt(kpi.previous)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/90 border border-slate-200/80 text-slate-700 shadow-2xs">
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
                    ? 'bg-slate-900'
                    : isBlue
                      ? 'bg-blue-600'
                      : 'bg-slate-900'
                  : isOrange
                    ? 'border border-dashed border-orange-300 bg-transparent'
                    : 'bg-slate-200/70',
              )}
            />
          )
        })}
      </div>

      {/* Trend & Meaning */}
      <div className="mt-3 flex flex-col gap-1 text-xs sm:text-sm text-slate-500">
        {delta != null && <Trend delta={delta} />}
        <span className="leading-relaxed line-clamp-2">{meaning}</span>
      </div>

      {/* Bottom link: View → */}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs font-semibold">
        <span
          className={cn(
            'flex items-center gap-1 transition-colors',
            isOrange ? 'text-orange-900 group-hover:text-orange-700' : 'text-blue-600 group-hover:text-blue-700',
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
