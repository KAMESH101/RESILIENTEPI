import { HelpCircle } from 'lucide-react'
import { riskBand } from '@/config/risk'
import { formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RiskCategory } from '@/types'
import { RISK_STYLE } from './riskStyle'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

const SIZE = {
  sm: 'h-5 gap-1 px-1.5 text-xs [&_svg]:size-3',
  md: 'h-7 gap-1.5 px-2.5 text-sm [&_svg]:size-4',
}

/** Risk is never colour alone: fill + icon + text. Probability on hover. */
export function RiskBadge({
  category,
  probability,
  size = 'md',
  className,
}: {
  category: RiskCategory | null
  probability?: number | null
  size?: 'sm' | 'md'
  className?: string
}) {
  if (!category) {
    return (
      <span className={cn('pattern-nodata inline-flex shrink-0 items-center rounded-full border border-slate-300 font-medium text-ink', SIZE[size], className)}>
        <HelpCircle aria-hidden />
        No data
      </span>
    )
  }
  const band = riskBand(category)
  const { icon: Icon, className: tone } = RISK_STYLE[category]
  const badge = (
    <span
      className={cn('inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap', tone, SIZE[size], className)}
      aria-label={probability != null ? `${band.label} risk, ${band.word} (${formatPct(probability)})` : `${band.label} risk`}
    >
      <Icon aria-hidden />
      {band.label}
    </span>
  )
  if (probability == null) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        {band.word} ({formatPct(probability)}) that cases exceed the outbreak threshold
      </TooltipContent>
    </Tooltip>
  )
}
