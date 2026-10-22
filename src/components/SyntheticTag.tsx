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
            'inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-1.5 text-xs leading-none font-medium whitespace-nowrap',
            synthetic
              ? 'border border-dashed border-[#9a6b00] bg-[#fff8e1] text-[#6b4a00]'
              : 'border border-teal-600 bg-cyan-50 text-[#0b6b6b]',
            className,
          )}
          aria-label={synthetic ? 'Synthetic demo data' : label}
        >
          {synthetic ? <FlaskConical className="size-3" aria-hidden /> : <Radio className="size-3" aria-hidden />}
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}
