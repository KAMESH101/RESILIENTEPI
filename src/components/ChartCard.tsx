import { Table2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SyntheticTag } from './SyntheticTag'
import { Button } from './ui/button'

export interface ChartTable {
  columns: string[]
  rows: (string | number)[][]
}

/**
 * Every chart: title, a one-line caption, legend, accessible summary sentence and
 * a "View as table" toggle. Charts show at most 4 series.
 */
export function ChartCard({
  title,
  caption,
  summary,
  legend,
  table,
  synthetic = false,
  chips,
  actions,
  children,
  compact = false,
  className,
}: {
  title: string
  caption?: string
  /** One-sentence description of what the chart shows, read by screen readers. */
  summary: string
  legend?: ReactNode
  table: ChartTable
  synthetic?: boolean
  chips?: ReactNode
  /** Extra controls beside "View as table", e.g. a date-range selector. */
  actions?: ReactNode
  children: ReactNode
  compact?: boolean
  className?: string
}) {
  const [asTable, setAsTable] = useState(false)
  const id = useId()
  const Heading = compact ? 'h3' : 'h2'
  return (
    <figure className={cn('flex min-w-0 flex-col', !compact && 'rounded-xl border bg-surface p-4 shadow-card', className)} aria-labelledby={`${id}-t`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Heading id={`${id}-t`} className={cn('flex flex-wrap items-center gap-2 font-semibold text-navy-900', compact ? 'text-sm' : 'text-base')}>
            {title}
            {synthetic && <SyntheticTag />}
            {chips}
          </Heading>
          {caption && <p className="mt-0.5 text-xs text-ink-muted">{caption}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="text-teal-600">
            <Table2 aria-hidden />
            {asTable ? 'View as chart' : 'View as table'}
          </Button>
        </div>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
      {asTable ? (
        <div className="mt-2 max-h-72 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-muted">
              <tr>
                {table.columns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2 text-left font-medium text-ink-muted">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {r.map((v, j) => (
                    <td key={j} className="px-3 py-1.5 tabular-nums">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-2" aria-hidden>
          {children}
        </div>
      )}
      {legend && !asTable && <div className="mt-2">{legend}</div>}
      <p className="mt-2 text-xs text-ink-muted">{summary}</p>
    </figure>
  )
}
