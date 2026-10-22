import { HelpCircle } from 'lucide-react'
import { RISK_STYLE } from '@/components/riskStyle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SCHEMATIC_LABEL } from '@/config/geo'
import { riskBand } from '@/config/risk'
import { formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DistrictSummary } from '@/types'

/**
 * Fallback when the boundary file is missing: one square per district, grouped
 * under state headings, coloured by risk (with icon), hatched for blind spots.
 */
export function SchematicTiles({
  districts,
  onSelect,
  showBlindSpot = true,
  className,
}: {
  districts: DistrictSummary[]
  onSelect: (id: string) => void
  showBlindSpot?: boolean
  className?: string
}) {
  const byState = new Map<string, DistrictSummary[]>()
  for (const d of districts) {
    const list = byState.get(d.district.state) ?? []
    list.push(d)
    byState.set(d.district.state, list)
  }
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{SCHEMATIC_LABEL}</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-x-4 gap-y-3">
        {[...byState.entries()].map(([state, list]) => (
          <div key={state} className="min-w-0">
            <h3 className="truncate text-xs font-medium text-ink" title={state}>
              {state}
            </h3>
            <ul className="mt-1 flex flex-wrap gap-1">
              {list.map((d) => (
                <li key={d.district.id}>
                  <Tile summary={d} onSelect={onSelect} showBlindSpot={showBlindSpot} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tile({ summary: s, onSelect, showBlindSpot }: { summary: DistrictSummary; onSelect: (id: string) => void; showBlindSpot: boolean }) {
  const cat = s.forecast?.category ?? null
  const style = cat ? RISK_STYLE[cat] : null
  const Icon = style?.icon ?? HelpCircle
  const flagged = showBlindSpot && s.blind_spot?.flagged
  const riskText = cat ? `${riskBand(cat).label} risk (${formatPct(s.forecast!.probability)})` : 'No data'
  const label = `${s.district.name}, ${s.district.state}: ${riskText}${flagged ? ', potential blind spot (experimental)' : ''}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect(s.district.id)}
          aria-label={label}
          className={cn(
            'relative inline-flex size-8 items-center justify-center overflow-hidden rounded-md border transition-transform duration-150 hover:scale-110 focus-visible:scale-110',
            cat ? 'border-transparent' : 'pattern-nodata border-slate-300',
          )}
          style={style ? { background: style.fill, color: style.ink } : undefined}
        >
          {flagged && <span className="pattern-hatch absolute inset-0 opacity-60" aria-hidden />}
          <span className={cn('relative inline-flex items-center justify-center rounded-full', flagged && 'size-5 bg-white text-navy-900')}>
            <Icon className={cn(flagged ? 'size-3.5' : 'size-4', !cat && 'text-ink-muted')} aria-hidden />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
