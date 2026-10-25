import { FlaskConical, Radio } from 'lucide-react'
import { GLOSSARY } from '@/config/glossary'
import { cn } from '@/lib/utils'
import type { DataSource } from '@/types'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

/**
 * Provenance tag. Synthetic values always get a tag. Observed/model values are
 * tagged only when `mixed` is set (a view that combines live and synthetic records),
 * so the two are always distinguishable without cluttering an all-live view.
 */
export function SyntheticTag({
  source = 'synthetic',
  mixed = false,
  className,
}: {
  source?: DataSource
  mixed?: boolean
  className?: string
}) {
  if (source !== 'synthetic' && !mixed) return null
  const synthetic = source === 'synthetic'
  const label = synthetic ? 'Synthetic' : source === 'model' ? 'Live model' : 'Live data'
  const tip = synthetic
    ? GLOSSARY.synthetic.definition
    : 'Comes from a connected data source or the production model, not the demo generator.'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-xs leading-none font-medium whitespace-nowrap transition-colors',
            synthetic
              ? 'border border-dashed border-[#f9ab00]/70 bg-[#fef7e0] text-[#b06000]'
              : 'border border-[#1a73e8]/40 bg-[#e8f0fe] text-[#1967d2]',
            className,
          )}
          aria-label={synthetic ? 'Synthetic demo data' : label}
        >
          {synthetic ? <FlaskConical className="size-3 text-[#b06000]" aria-hidden /> : <Radio className="size-3 text-[#1967d2]" aria-hidden />}
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}
