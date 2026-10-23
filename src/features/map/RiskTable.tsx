import { AlertTriangle } from 'lucide-react'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { DataTable } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { RiskBadge } from '@/components/RiskBadge'
import { Button } from '@/components/ui/button'
import { STALE_AFTER_MONTHS, riskBand } from '@/config/risk'
import { formatInt, formatMonth, formatPct } from '@/lib/format'
import type { DistrictSummary } from '@/types'

/** The map's table alternative: always available, sortable, filtered by the page filters. */
export function RiskTable({
  rows,
  total,
  onSelect,
  onClearFilters,
}: {
  rows: DistrictSummary[]
  total: number
  onSelect: (id: string) => void
  onClearFilters?: () => void
}) {
  return (
    <DataTable
      caption="District forecast risk"
      rows={rows}
      rowKey={(r) => r.district.id}
      onRowClick={(r) => onSelect(r.district.id)}
      rowLabel={(r) => `Open ${r.district.name} details`}
      initialSort={{ key: 'p', dir: 'desc' }}
      toolbar={
        <p className="border-b px-4 py-2 text-sm text-ink-muted" role="status">
          Showing <span className="font-medium text-ink tabular-nums">{rows.length}</span> of {total} demo districts
        </p>
      }
      empty={
        <EmptyState
          title="No districts match these filters"
          description="Try a different risk level, blind-spot filter or state."
          action={onClearFilters ? <Button variant="outline" onClick={onClearFilters}>Clear filters</Button> : undefined}
        />
      }
      columns={[
        {
          key: 'name',
          header: 'District',
          sortValue: (r) => r.district.name,
          cell: (r) => (
            <span className="flex flex-col">
              <span>{r.district.name}</span>
              <span className="text-xs font-normal text-ink-muted">{r.district.state}</span>
            </span>
          ),
        },
        {
          key: 'risk',
          header: 'Risk',
          sortValue: (r) => r.forecast?.probability ?? null,
          cell: (r) => <RiskBadge size="sm" category={r.forecast?.category ?? null} probability={r.forecast?.probability} />,
        },
        {
          key: 'p',
          header: 'Likelihood',
          align: 'right',
          className: 'whitespace-nowrap',
          sortValue: (r) => r.forecast?.probability ?? null,
          cell: (r) => (r.forecast ? `${riskBand(r.forecast.category).word} (${formatPct(r.forecast.probability)})` : 'No data'),
        },
        {
          key: 'cases',
          header: 'Expected cases',
          align: 'right',
          hideInCard: true,
          sortValue: (r) => r.forecast?.expected_cases ?? null,
          cell: (r) => formatInt(r.forecast?.expected_cases),
        },
        {
          key: 'bs',
          header: 'Blind spot',
          sortValue: (r) => r.blind_spot?.score ?? null,
          cell: (r) =>
            r.blind_spot && r.blind_spot.band !== 'none' ? (
              <BlindSpotBadge size="sm" band={r.blind_spot.band} score={r.blind_spot.score} showChip={false} />
            ) : (
              <span className="text-ink-muted tabular-nums">{r.blind_spot ? `None (score ${r.blind_spot.score})` : '—'}</span>
            ),
        },
        {
          key: 'fresh',
          header: 'Latest report',
          sortValue: (r) => -r.freshness.months_stale,
          cell: (r) => (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              {formatMonth(r.freshness.last_reported_month)}
              {r.freshness.confidence === 'low' && (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#7a3d00]">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {r.freshness.months_stale >= STALE_AFTER_MONTHS ? `${r.freshness.months_stale} mo old` : 'gaps'}
                </span>
              )}
            </span>
          ),
        },
        {
          key: 'tests',
          header: 'Tests /100k',
          align: 'right',
          hideInCard: true,
          sortValue: (r) => r.latest_tests_per_100k,
          cell: (r) => formatInt(r.latest_tests_per_100k),
        },
      ]}
    />
  )
}
