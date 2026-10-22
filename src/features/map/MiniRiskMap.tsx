import { AlertCircle, ArrowRight, Map as MapIcon, Table2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { withFilters } from '@/app/filters'
import { MapLegend } from '@/components/MapLegend'
import { RiskBadge } from '@/components/RiskBadge'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { DataTable } from '@/components/DataTable'
import { SectionCard } from '@/components/SectionCard'
import { BlockSkeleton } from '@/components/Skeletons'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { BOUNDARY_ATTRIBUTION, BOUNDARY_MISSING_LABEL } from '@/config/geo'
import { formatPct } from '@/lib/format'
import type { DistrictSummary } from '@/types'
import { useBoundaries } from './boundaries'
import { SchematicTiles } from './SchematicTiles'

/** Overview mini map with a table alternative. Geographic rendering arrives with the full map (Phase 2). */
export function MiniRiskMap({
  districts,
  title,
  onSelect,
  className,
}: {
  districts: DistrictSummary[] | undefined
  title: string
  onSelect: (id: string) => void
  className?: string
}) {
  const [params] = useSearchParams()
  const [asTable, setAsTable] = useState(false)
  const boundaries = useBoundaries()
  const status = boundaries.data?.status

  return (
    <SectionCard
      id="mini-map"
      title={
        <>
          {title}
          <SyntheticTag />
        </>
      }
      caption="Forecast risk by district for the selected horizon. Click a district for details."
      className={className}
      actions={
        <Button variant="ghost" size="sm" className="text-teal-600" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? <MapIcon aria-hidden /> : <Table2 aria-hidden />}
          {asTable ? 'View as map' : 'View as table'}
        </Button>
      }
      footer={
        <Link to={withFilters('/map', params)} className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
          Open National Risk Map <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      {!districts ? (
        <div className="p-4">
          <BlockSkeleton />
        </div>
      ) : asTable ? (
        <DataTable
          caption="Districts by forecast risk"
          rows={districts}
          rowKey={(d) => d.district.id}
          onRowClick={(d) => onSelect(d.district.id)}
          rowLabel={(d) => `Open ${d.district.name}`}
          initialSort={{ key: 'p', dir: 'desc' }}
          maxHeight="max-h-96"
          columns={[
            { key: 'name', header: 'District', cell: (d) => d.district.name, sortValue: (d) => d.district.name },
            { key: 'state', header: 'State', cell: (d) => d.district.state, sortValue: (d) => d.district.state },
            { key: 'risk', header: 'Risk', cell: (d) => <RiskBadge size="sm" category={d.forecast?.category ?? null} probability={d.forecast?.probability} /> },
            { key: 'p', header: 'Probability', align: 'right', cell: (d) => formatPct(d.forecast?.probability), sortValue: (d) => d.forecast?.probability ?? null },
            { key: 'bs', header: 'Blind spot', cell: (d) => (d.blind_spot && d.blind_spot.band !== 'none' ? <BlindSpotBadge size="sm" band={d.blind_spot.band} showChip={false} /> : '—') },
          ]}
        />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {status !== 'loaded' && (
            <p className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/60 px-3 py-2 text-sm text-ink-muted" role="status">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                <strong className="font-semibold text-ink">{BOUNDARY_MISSING_LABEL}.</strong>{' '}
                {status === 'invalid' && boundaries.data?.status === 'invalid'
                  ? `The file could not be used: ${boundaries.data.reason}. `
                  : 'Add the team’s district boundary file to show a geographic map. '}
                Showing a schematic view instead.
              </span>
            </p>
          )}
          {status === 'loaded' && (
            <p className="text-sm text-ink-muted">
              Geographic map: open the National Risk Map. {BOUNDARY_ATTRIBUTION.text} ({BOUNDARY_ATTRIBUTION.license}).
            </p>
          )}
          <SchematicTiles districts={districts} onSelect={onSelect} />
          <MapLegend />
          <p className="text-xs text-ink-muted">
            Only the {districts.length} demo districts are shown. Every other district is “No data”, never Low risk.
          </p>
        </div>
      )}
    </SectionCard>
  )
}
