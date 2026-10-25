import { ArrowRight, Map as MapIcon, Table2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { withFilters } from '@/app/filters'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { DataTable } from '@/components/DataTable'
import { RiskBadge } from '@/components/RiskBadge'
import { SectionCard } from '@/components/SectionCard'
import { BlockSkeleton } from '@/components/Skeletons'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { formatPct } from '@/lib/format'
import type { DistrictSummary } from '@/types'
import { DistrictMap } from './DistrictMap'

/** Overview mini map (geographic or schematic) with a table alternative. */
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
        <DistrictMap compact districts={districts} onSelect={onSelect} className="p-4" />
      )}
    </SectionCard>
  )
}
