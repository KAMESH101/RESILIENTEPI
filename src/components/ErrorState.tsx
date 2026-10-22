import { AlertCircle, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

export function ErrorState({
  title = 'Could not load this section',
  error,
  onRetry,
  className,
}: {
  title?: string
  error?: unknown
  onRetry: () => void
  className?: string
}) {
  const message = error instanceof Error ? error.message : undefined
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-2 px-4 py-8 text-center', className)}>
      <AlertCircle className="size-8 text-risk-veryhigh" aria-hidden />
      <p className="font-semibold text-navy-900">{title}</p>
      {message && <p className="max-w-md text-sm text-ink-muted">{message}</p>}
      <Button variant="outline" onClick={onRetry} className="mt-2">
        <RotateCw aria-hidden />
        Try again
      </Button>
    </div>
  )
}
