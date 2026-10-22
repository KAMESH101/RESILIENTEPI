import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marks forecast values (shown with dashed lines in charts). */
export function ForecastChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-dashed border-navy-700 bg-white px-1.5 text-xs leading-none font-medium text-navy-900',
        className,
      )}
    >
      <TrendingUp className="size-3" aria-hidden />
      Forecast
    </span>
  )
}

/** Marks experimental outputs (hatched in charts and maps). */
export function ExperimentalChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-navy-900 bg-white px-1.5 text-xs leading-none font-medium text-navy-900',
        className,
      )}
    >
      <span className="pattern-hatch size-2.5 rounded-sm border border-navy-900" aria-hidden />
      Experimental
    </span>
  )
}
