import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Enables sorting on this column. */
  sortValue?: (row: T) => number | string | null
  align?: 'left' | 'right'
  className?: string
  /** Hidden in the stacked mobile card (e.g. already shown as the card title). */
  hideInCard?: boolean
}

/**
 * Sticky header, sortable columns, row click, 25-row pages. On mobile, rows
 * become stacked cards. The first column is the row's accessible button.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowLabel,
  initialSort,
  pageSize = 25,
  caption,
  empty,
  toolbar,
  maxHeight = 'max-h-[640px]',
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  /** Accessible label for the row's open button. */
  rowLabel?: (row: T) => string
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  pageSize?: number
  caption: string
  empty?: ReactNode
  /** Filter chip bar or other controls shown above the table. */
  toolbar?: ReactNode
  maxHeight?: string
}) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const sv = col.sortValue
    return [...rows].sort((a, b) => {
      const x = sv(a)
      const y = sv(b)
      // Missing values always sort last, regardless of direction.
      if (x == null && y == null) return 0
      if (x == null) return 1
      if (y == null) return -1
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return sort.dir === 'asc' ? c : -c
    })
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setPage(0)
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  if (rows.length === 0) return <>{toolbar}{empty}</>

  const first = columns[0]!
  return (
    <div className="flex min-w-0 flex-col">
      {toolbar}
      {/* Desktop / tablet table */}
      <div className={cn('hidden overflow-auto md:block', maxHeight)}>
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key
                const ariaSort = active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={c.sortValue ? ariaSort : undefined}
                    className={cn(
                      'sticky top-0 z-10 border-b border-border bg-[#f8fafd] px-3.5 py-2.5 font-medium whitespace-nowrap text-xs uppercase tracking-wider text-ink-muted',
                      c.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn('inline-flex items-center gap-1.5 rounded hover:text-ink transition-colors', active && 'text-[#1a73e8] font-semibold', c.align === 'right' && 'flex-row-reverse')}
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === 'asc' ? <ArrowUp className="size-3.5 text-[#1a73e8]" aria-hidden /> : <ArrowDown className="size-3.5 text-[#1a73e8]" aria-hidden />
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-75" aria-hidden />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('border-b border-border/80 last:border-b-0 transition-colors duration-150', onRowClick && 'cursor-pointer hover:bg-[#e8f0fe]/70')}
              >
                {columns.map((c, i) => (
                  <td key={c.key} className={cn('px-3.5 py-2.5 align-middle', c.align === 'right' && 'text-right tabular-nums', c.className)}>
                    {i === 0 && onRowClick ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowClick(r)
                        }}
                        aria-label={rowLabel?.(r)}
                        className="text-left font-medium text-ink hover:text-[#1a73e8] hover:underline transition-colors"
                      >
                        {c.cell(r)}
                      </button>
                    ) : (
                      c.cell(r)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="flex flex-col gap-2 p-3 md:hidden" aria-label={caption}>
        {visible.map((r) => (
          <li key={rowKey(r)}>
            <button
              type="button"
              disabled={!onRowClick}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              aria-label={rowLabel?.(r)}
              className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left shadow-card transition-all duration-150 hover:bg-[#e8f0fe]/60 hover:border-[#1a73e8]/30 disabled:cursor-default"
            >
              <span className="font-medium text-ink">{first.cell(r)}</span>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                {columns.slice(1).filter((c) => !c.hideInCard).map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-ink-muted">{c.header}</dt>
                    <dd className="min-w-0 tabular-nums">{c.cell(r)}</dd>
                  </div>
                ))}
              </dl>
            </button>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-sm text-ink-muted">
          <span className="tabular-nums">
            {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
              <ChevronLeft aria-hidden />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label="Next page">
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
