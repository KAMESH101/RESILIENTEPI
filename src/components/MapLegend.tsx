import { EyeOff, HelpCircle } from 'lucide-react'
import { RISK_BANDS } from '@/config/risk'
import { formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ExperimentalChip } from './Chips'
import { RISK_STYLE } from './riskStyle'

export function MapLegend({ showBlindSpot = true, className }: { showBlindSpot?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink', className)} aria-label="Map legend">
      {RISK_BANDS.map((b) => {
        const { icon: Icon, fill, ink } = RISK_STYLE[b.category]
        return (
          <span key={b.category} className="inline-flex items-center gap-1.5">
            <span className="inline-flex size-4 items-center justify-center rounded-sm" style={{ background: fill, color: ink }} aria-hidden>
              <Icon className="size-3" />
            </span>
            {b.label}
            <span className="text-ink-muted tabular-nums">
              ({formatPct(b.min)}–{b.max === 1 ? '100%' : formatPct(b.max)})
            </span>
          </span>
        )
      })}
      <span className="inline-flex items-center gap-1.5">
        <span className="pattern-nodata inline-flex size-4 items-center justify-center rounded-sm border border-slate-300" aria-hidden>
          <HelpCircle className="size-3 text-ink-muted" />
        </span>
        No data
      </span>
      {showBlindSpot && (
        <span className="inline-flex items-center gap-1.5">
          <span className="pattern-hatch inline-flex size-4 items-center justify-center rounded-sm border border-navy-900" aria-hidden />
          <EyeOff className="size-3.5 text-navy-900" aria-hidden />
          Potential blind spot
          <ExperimentalChip />
        </span>
      )}
    </div>
  )
}
