import { AlertCircle, Info } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { MapLegend } from '@/components/MapLegend'
import { BlockSkeleton } from '@/components/Skeletons'
import { BOUNDARY_MISSING_LABEL } from '@/config/geo'
import { cn } from '@/lib/utils'
import type { DistrictSummary } from '@/types'
import { useBoundaries } from './boundaries'
import { joinBoundaries } from './join'
import { SchematicTiles } from './SchematicTiles'

// Leaflet loads only when a boundary file is actually present.
const RiskChoropleth = lazy(() => import('./RiskChoropleth').then((m) => ({ default: m.RiskChoropleth })))

/**
 * Geographic choropleth when the team's boundary file is present and valid;
 * otherwise "Boundary file not loaded" + the labelled schematic tile view.
 */
export function DistrictMap({
  districts,
  onSelect,
  focusId,
  isDimmed,
  state,
  showRisk = true,
  showBlindSpot = true,
  compact = false,
  className,
}: {
  districts: DistrictSummary[]
  onSelect: (id: string) => void
  focusId?: string | null
  isDimmed?: (s: DistrictSummary) => boolean
  state?: string | null
  showRisk?: boolean
  showBlindSpot?: boolean
  compact?: boolean
  className?: string
}) {
  const boundaries = useBoundaries()
  const b = boundaries.data
  const loaded = b?.status === 'loaded' ? b : null
  const join = useMemo(() => (loaded ? joinBoundaries(loaded.features, districts) : null), [loaded, districts])

  if (boundaries.isLoading) return <BlockSkeleton className={compact ? 'h-[26rem]' : 'h-[480px]'} />

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {loaded && join ? (
        <>
          <Suspense fallback={<BlockSkeleton className={compact ? 'h-[26rem]' : 'h-[480px]'} />}>
            <RiskChoropleth
              features={loaded.features}
              join={join}
              onSelect={onSelect}
              focusId={focusId}
              isDimmed={isDimmed}
              state={state}
              showRisk={showRisk}
              showBlindSpot={showBlindSpot}
              compact={compact}
            />
          </Suspense>
          <JoinNote method={join.method} unmatched={join.unmatched.map((u) => u.district.name)} compact={compact} />
        </>
      ) : (
        <>
          <p className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/60 px-3 py-2 text-sm text-ink-muted" role="status">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold text-ink">{BOUNDARY_MISSING_LABEL}.</strong>{' '}
              {b?.status === 'invalid' ? `The file could not be used: ${b.reason}. ` : 'Add the team’s district boundary file to show a geographic map. '}
              Showing a schematic view instead.
            </span>
          </p>
          <SchematicTiles districts={districts} onSelect={onSelect} focusId={focusId} isDimmed={isDimmed} showRisk={showRisk} showBlindSpot={showBlindSpot} />
        </>
      )}
      <MapLegend showBlindSpot={showBlindSpot} />
      <p className="text-xs text-ink-muted">
        Only the {districts.length} demo districts have data. Every other district is “No data”, never Low risk.
      </p>
    </div>
  )
}

function JoinNote({ method, unmatched, compact }: { method: 'lgd' | 'name' | 'mixed'; unmatched: string[]; compact: boolean }) {
  if (method === 'lgd' && unmatched.length === 0) return null
  return (
    <p className="flex items-start gap-2 text-xs text-ink-muted">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {method !== 'lgd' && 'Some districts are matched to shapes by name because LGD codes were not supplied. '}
        {unmatched.length > 0 &&
          (compact
            ? `${unmatched.length} district${unmatched.length > 1 ? 's have' : ' has'} no matching shape (see the table).`
            : `No matching shape for: ${unmatched.join(', ')} — shown in the table only.`)}
      </span>
    </p>
  )
}
