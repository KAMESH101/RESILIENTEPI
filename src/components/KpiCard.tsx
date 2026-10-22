import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react'
import { Link } from 'react-router'
import { formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/types'
import { SyntheticTag } from './SyntheticTag'

/** Whole card is one link: label, big number, valid-only trend, meaning, "View →". */
export function KpiCard({
  label,
  kpi,
  meaning,
  to,
  emphasis = false,
}: {
  label: string
  kpi: Kpi
  meaning: string
  to: string
  emphasis?: boolean
}) {
  const delta = kpi.previous == null ? null : kpi.value - kpi.previous
  return (
    <Link
      to={to}
      className={cn(
        'group flex min-w-0 flex-col rounded-xl border bg-surface p-4 shadow-card transition-colors duration-150 hover:border-teal-600 hover:bg-cyan-50/50',
        emphasis && 'border-l-4 border-l-risk-veryhigh',
      )}
    >
      <span className="flex items-start justify-between gap-2 text-sm font-medium text-ink-muted">
        <span>{label}</span>
        <SyntheticTag source={kpi.source} />
      </span>
      <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold text-navy-900 tabular-nums">{formatInt(kpi.value)}</span>
        {delta != null && <Trend delta={delta} />}
      </span>
      <span className="mt-1 text-sm text-ink-muted">{meaning}</span>
      <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-medium text-teal-600 group-hover:underline">
        View
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}

function Trend({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus
  const text = delta === 0 ? 'No change vs last month' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} vs last month`
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-ink-muted tabular-nums">
      <Icon className="size-4" aria-hidden />
      {text}
    </span>
  )
}
