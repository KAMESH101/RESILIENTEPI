import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marks forecast values (shown with dashed lines in charts). */
export function ForecastChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-dashed border-[#1a73e8]/70 bg-[#e8f0fe]/80 px-2 text-xs leading-none font-medium text-[#1967d2]',
        className,
      )}
    >
      <TrendingUp className="size-3 text-[#1a73e8]" aria-hidden />
      Forecast
    </span>
  )
}

/** Marks experimental outputs (hatched in charts and maps). */
export function ExperimentalChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-[#dadce0] bg-surface px-2 text-xs leading-none font-medium text-ink shadow-2xs',
        className,
      )}
    >
      <span className="pattern-hatch size-2.5 rounded-xs border border-ink/40" aria-hidden />
      Experimental
    </span>
  )
}
