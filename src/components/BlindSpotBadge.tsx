import { Eye, EyeOff } from 'lucide-react'
import { BLIND_SPOT_LABEL, BLIND_SPOT_THRESHOLD_NOTE } from '@/config/blindspot'
import { cn } from '@/lib/utils'
import type { BlindSpotBand } from '@/types'
import { ExperimentalChip } from './Chips'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

/** Hatch swatch + eye-off icon + text, always with an Experimental chip. */
export function BlindSpotBadge({
  band,
  score,
  size = 'md',
  showChip = true,
  className,
}: {
  band: BlindSpotBand
  score?: number | null
  size?: 'sm' | 'md'
  showChip?: boolean
  className?: string
}) {
  if (band === 'none') return null
  const flagged = band === 'flagged'
  const Icon = flagged ? EyeOff : Eye
  const label = flagged ? 'Potential blind spot' : 'Blind-spot watch'
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border font-medium whitespace-nowrap text-navy-900',
              flagged ? 'border-navy-900 bg-white' : 'border-dashed border-navy-700 bg-white',
              size === 'sm' ? 'h-5 gap-1 pr-1.5 pl-0.5 text-xs [&_svg]:size-3' : 'h-7 gap-1.5 pr-2.5 pl-1 text-sm [&_svg]:size-4',
            )}
            aria-label={`${label}${score != null ? `, experimental score ${score} of 100` : ''}`}
          >
            <span
              className={cn(
                'pattern-hatch shrink-0 rounded-full border border-navy-900',
                flagged ? '' : 'opacity-50',
                size === 'sm' ? 'size-4' : 'size-5',
              )}
              aria-hidden
            />
            <Icon aria-hidden />
            {label}
            {score != null && <span className="tabular-nums text-ink-muted">· {score}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start">
          <span>{BLIND_SPOT_LABEL}</span>
          <span>{BLIND_SPOT_THRESHOLD_NOTE}</span>
        </TooltipContent>
      </Tooltip>
      {showChip && <ExperimentalChip />}
    </span>
  )
}
