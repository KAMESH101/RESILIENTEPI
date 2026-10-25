import { cn } from '@/lib/utils'
import { Skeleton } from './ui/skeleton'

/** Skeletons mirror the final layout so content doesn't jump when it loads. */

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border bg-surface p-4 shadow-card" aria-hidden>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-12" />
    </div>
  )
}

export function AttentionSkeleton() {
  return (
    <div className="rounded-xl border bg-surface p-4 shadow-card" aria-hidden>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-5/6" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 p-4', className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function BlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-64 w-full rounded-lg', className)} aria-hidden />
}

/** Screen-reader announcement while a section loads. */
export function LoadingLabel({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="sr-only" role="status">
      {label}…
    </span>
  )
}
