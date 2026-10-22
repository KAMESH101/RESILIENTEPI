import { Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { InfoTooltip } from '@/components/InfoTooltip'
import { formatDateTime, formatMonth } from '@/lib/format'

/** Title, one-line purpose, last-run time and the page's FilterBar. */
export function PageHeader({
  title,
  purpose,
  lastRunAt,
  asOf,
  filters,
  actions,
}: {
  title: string
  purpose: string
  lastRunAt?: string
  asOf?: string
  filters?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-navy-900 md:text-3xl">{title}</h1>
          <p className="mt-1 text-base text-ink-muted">{purpose}</p>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-muted">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {lastRunAt ? (
              <span>
                Last monthly run: <span className="font-medium whitespace-nowrap text-ink tabular-nums">{formatDateTime(lastRunAt)}</span>
                {asOf && (
                  <>
                    {' · '}
                    <span className="whitespace-nowrap">
                      Data up to <span className="font-medium text-ink">{formatMonth(asOf)}</span>
                    </span>
                  </>
                )}
                <InfoTooltip term="last_run" className="-my-1 ml-0.5 size-5 align-middle" />
              </span>
            ) : (
              <span>Loading last run…</span>
            )}
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {filters}
    </header>
  )
}
