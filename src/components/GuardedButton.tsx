import type { ComponentProps } from 'react'
import { READ_ONLY_REASON, useCanEdit } from '@/app/session'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

/**
 * A button that changes data. For Evaluators it is disabled but stays
 * focusable (via its wrapper) and explains why in a tooltip.
 */
export function GuardedButton({ label, ...props }: ComponentProps<typeof Button> & { label: string }) {
  const canEdit = useCanEdit()
  if (canEdit) return <Button {...props} />
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-lg" aria-label={`${label} unavailable. ${READ_ONLY_REASON}`}>
          <Button {...props} disabled tabIndex={-1} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{READ_ONLY_REASON}</TooltipContent>
    </Tooltip>
  )
}
