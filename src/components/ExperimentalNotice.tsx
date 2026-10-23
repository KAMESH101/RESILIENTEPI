import { BLIND_SPOT_LABEL } from '@/config/blindspot'
import { cn } from '@/lib/utils'
import { ExperimentalChip } from './Chips'

/**
 * "Experimental … — not proof of under-reporting." Shown on every blind-spot
 * entry and in every review dialog.
 */
export function ExperimentalNotice({ className }: { className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-1.5 text-sm text-navy-900', className)} data-testid="experimental-notice">
      <ExperimentalChip />
      <span>{BLIND_SPOT_LABEL}</span>
    </p>
  )
}
