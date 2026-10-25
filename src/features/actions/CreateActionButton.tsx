import { ClipboardPlus } from 'lucide-react'
import { READ_ONLY_REASON, useCanEdit } from '@/app/session'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCreateAction, type CreateActionPrefill } from './createActionStore'

/** Opens the shared Create-action dialog; disabled with an explanation for Evaluators. */
export function CreateActionButton({
  prefill,
  variant = 'outline',
  className,
}: {
  prefill: CreateActionPrefill
  variant?: 'outline' | 'default'
  className?: string
}) {
  const canEdit = useCanEdit()
  const openWith = useCreateAction((s) => s.openWith)
  if (canEdit) {
    return (
      <Button variant={variant} className={className} onClick={() => openWith(prefill)}>
        <ClipboardPlus aria-hidden />
        Create action
      </Button>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn('inline-flex rounded-lg', className)} aria-label={`Create action unavailable. ${READ_ONLY_REASON}`}>
          <Button variant={variant} className="w-full" disabled tabIndex={-1}>
            <ClipboardPlus aria-hidden />
            Create action
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{READ_ONLY_REASON}</TooltipContent>
    </Tooltip>
  )
}
