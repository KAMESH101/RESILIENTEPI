import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react'
import { Link } from 'react-router'
import { formatInt } from '@/lib/format'
import type { Kpi } from '@/types'
import { SyntheticTag } from './SyntheticTag'

/** Whole card is one link: label, big number, valid-only trend, meaning, "View →". */
export function KpiCard({
  label,
  kpi,
  meaning,
  to,
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
      className="group flex min-w-0 flex-col rounded-2xl border border-white/80 bg-surface/75 backdrop-blur-xl p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:border-white hover:shadow-elevated"
    >
      <span className="flex items-start justify-between gap-2 text-sm font-medium text-slate-500">
        <span>{label}</span>
        <SyntheticTag source={kpi.source} />
      </span>
      <span className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{formatInt(kpi.value)}</span>
        {delta != null && <Trend delta={delta} />}
      </span>
      <span className="mt-1 text-sm text-slate-500 leading-relaxed">{meaning}</span>
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
        View
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
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
