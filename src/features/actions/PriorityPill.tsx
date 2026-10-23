import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PRIORITY_LABELS, PRIORITY_RULES } from '@/config/actions'
import { cn } from '@/lib/utils'
import type { ActionPriority } from '@/types'

const TONE: Record<ActionPriority, string> = {
  p1: 'bg-risk-veryhigh text-white',
  p2: 'bg-risk-high text-ink',
  p3: 'bg-muted text-ink border border-slate-300',
}

/** P1/P2/P3 with the rule that produced it on hover. Never colour alone: the label is text. */
export function PriorityPill({ priority, className }: { priority: ActionPriority; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-bold tracking-wide', TONE[priority], className)}
          aria-label={`Priority ${PRIORITY_LABELS[priority]}: ${PRIORITY_RULES[priority]}`}
        >
          {PRIORITY_LABELS[priority]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{PRIORITY_RULES[priority]}</TooltipContent>
    </Tooltip>
  )
}
