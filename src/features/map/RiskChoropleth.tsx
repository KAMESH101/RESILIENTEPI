import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Maximize, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, useMap } from 'react-leaflet'
import { RISK_STYLE } from '@/components/riskStyle'
import { Button } from '@/components/ui/button'
import { BOUNDARY_ATTRIBUTION } from '@/config/geo'
import { riskBand } from '@/config/risk'
import { formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DistrictSummary } from '@/types'
import type { BoundaryFeature, InnerLines } from './boundaries'
import type { JoinResult } from './join'
import { PATTERN } from './patterns'

export interface ChoroplethProps {
  features: BoundaryFeature[]
  /** Borders between districts only; outer edges are never stroked. */
  innerLines: InnerLines
  join: JoinResult
  onSelect: (id: string) => void
  showRisk?: boolean
  showBlindSpot?: boolean
  /** District to pin and zoom to (e.g. from search). */
  focusId?: string | null
  /** Records not matching the page filters are dimmed, not hidden. */
  isDimmed?: (s: DistrictSummary) => boolean
  /** Zoom to this state's districts when set. */
  state?: string | null
  compact?: boolean
  className?: string
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function tooltipHtml(f: BoundaryFeature, s: DistrictSummary | null): string {
  const head = `<strong>${esc(f.properties.district)}</strong>, ${esc(f.properties.state)}`
  if (!s?.forecast) return `${head}<br/>No data — not in the current dataset`
  const band = riskBand(s.forecast.category)
  let html = `${head}<br/>${band.label} risk — ${band.word} (${formatPct(s.forecast.probability)})`
  if (s.blind_spot?.band === 'flagged') html += '<br/>Potential blind spot (experimental)'
  else if (s.blind_spot?.band === 'watch') html += '<br/>Blind-spot watch (experimental)'
  return html
}

/**
 * Fills only — no stroke. Outlines would trace coastal and international
 * edges; borders between districts come from the separate inner-lines layer.
 */
function baseStyle(s: DistrictSummary | null, showRisk: boolean, dimmed: boolean): L.PathOptions {
  if (!s?.forecast) return { stroke: false, fillColor: PATTERN.noData, fillOpacity: 1 }
  return {
    stroke: false,
    fillColor: showRisk ? RISK_STYLE[s.forecast.category].fill : '#E2E8F0',
    fillOpacity: dimmed ? 0.18 : showRisk ? 0.88 : 0.9,
  }
}

/** Fixed stacking: fills < blind-spot hatch < inner district borders < pin. */
const PANES = [
  ['re-fills', 400],
  ['re-hatch', 410],
  ['re-lines', 420],
] as const

function ensurePanes(map: L.Map) {
  for (const [name, z] of PANES) {
    if (!map.getPane(name)) map.createPane(name).style.zIndex = String(z)
  }
  // Hatch and lines never take pointer events, so clicks reach the fills.
  map.getPane('re-hatch')!.style.pointerEvents = 'none'
  map.getPane('re-lines')!.style.pointerEvents = 'none'
}

const PIN_ICON = L.divIcon({
  className: 're-pin',
  html: '<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path d="M14 1C7 1 1.5 6.4 1.5 13.2 1.5 22.5 14 35 14 35s12.5-12.5 12.5-21.8C26.5 6.4 21 1 14 1Z" fill="#1A73E8" stroke="#fff" stroke-width="2"/><circle cx="14" cy="13" r="4.5" fill="#fff"/></svg>',
  iconSize: [28, 36],
  iconAnchor: [14, 35],
})

/** Geographic choropleth from the team's boundary file only — no basemap tiles. */
export function RiskChoropleth({
  features,
  innerLines,
  join,
  onSelect,
  showRisk = true,
  showBlindSpot = true,
  focusId,
  isDimmed,
  state,
  compact = false,
  className,
}: ChoroplethProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const fc = useMemo(() => ({ type: 'FeatureCollection' as const, features }), [features])
  const bounds = useMemo(() => L.geoJSON(fc).getBounds(), [fc])

  const fitHome = () => {
    if (!map) return
    const idxs = state ? features.flatMap((_, i) => (join.byFeature[i]?.district.state === state ? [i] : [])) : []
    const b = idxs.length ? L.geoJSON({ type: 'FeatureCollection', features: idxs.map((i) => features[i]!) } as GeoJSON.FeatureCollection).getBounds() : bounds
    map.fitBounds(b, { padding: [12, 12] })
  }

  return (
    <div className={cn('relative isolate overflow-hidden rounded-xl border bg-[#F1F3F4] shadow-card', className)}>
      <MapContainer
        ref={setMap}
        bounds={bounds}
        boundsOptions={{ padding: [12, 12] }}
        zoomControl={false}
        scrollWheelZoom={!compact}
        zoomSnap={0.25}
        minZoom={3}
        maxZoom={10}
        maxBounds={bounds.pad(0.5)}
        className={cn('re-map w-full', compact ? 'h-[26rem]' : 'h-[min(70dvh,640px)] min-h-[360px]')}
        attributionControl
        keyboard
      >
        <Layers
          fc={fc}
          innerLines={innerLines}
          join={join}
          onSelect={onSelect}
          showRisk={showRisk}
          showBlindSpot={showBlindSpot}
          focusId={focusId ?? null}
          isDimmed={isDimmed}
        />
        <Attribution />
        <FitOnStateChange state={state ?? null} fit={fitHome} />
      </MapContainer>
      <div className="absolute top-3 left-3 z-[1000] flex flex-col overflow-hidden rounded-lg border bg-surface shadow-card">
        <Button variant="ghost" size="icon" className="rounded-none" aria-label="Zoom in" onClick={() => map?.zoomIn()}>
          <Plus aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-none border-t" aria-label="Zoom out" onClick={() => map?.zoomOut()}>
          <Minus aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-none border-t" aria-label="Reset view" onClick={fitHome}>
          <Maximize aria-hidden />
        </Button>
      </div>
    </div>
  )
}

function Attribution() {
  const map = useMap()
  useEffect(() => {
    const ctl = map.attributionControl
    ctl.setPrefix(false)
    const a = BOUNDARY_ATTRIBUTION
    const text = `District boundaries © <a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.holder}</a> (<a href="${a.licenseUrl}" target="_blank" rel="noopener noreferrer">${a.license}</a>) · indicative, not official`
    ctl.addAttribution(text)
    return () => {
      ctl.removeAttribution(text)
    }
  }, [map])
  return null
}

/** Refits only when the state filter changes (initial view comes from `bounds`). */
function FitOnStateChange({ state, fit }: { state: string | null; fit: () => void }) {
  const fitRef = useRef(fit)
  const first = useRef(true)
  useEffect(() => {
    fitRef.current = fit
  })
  useEffect(() => {
    if (first.current) {
      first.current = false
      if (!state) return
    }
    fitRef.current()
  }, [state])
  return null
}

function Layers({
  fc,
  innerLines,
  join,
  onSelect,
  showRisk,
  showBlindSpot,
  focusId,
  isDimmed,
}: {
  fc: GeoJSON.FeatureCollection
  innerLines: InnerLines
  join: JoinResult
  onSelect: (id: string) => void
  showRisk: boolean
  showBlindSpot: boolean
  focusId: string | null
  isDimmed?: (s: DistrictSummary) => boolean
}) {
  const map = useMap()
  const layersRef = useRef<L.Path[]>([])
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  // Forecast-risk fills (interactive).
  useEffect(() => {
    ensurePanes(map)
    const layers: L.Path[] = []
    const styleOf = (i: number) => {
      const s = join.byFeature[i] ?? null
      return baseStyle(s, showRisk, !!(s && isDimmed?.(s)))
    }
    let i = 0
    const layer = L.geoJSON(fc, {
      pane: 're-fills',
      onEachFeature: (feature, l) => {
        const idx = i++
        const path = l as L.Path
        layers[idx] = path
        const s = join.byFeature[idx] ?? null
        path.bindTooltip(tooltipHtml(feature as BoundaryFeature, s), { sticky: true, direction: 'top', className: 're-map-tooltip' })
        // Hover darkens the fill instead of outlining the shape.
        path.on('mouseover', () => path.getElement()?.classList.add('re-hover'))
        path.on('mouseout', () => path.getElement()?.classList.remove('re-hover'))
        if (s) path.on('click', () => onSelectRef.current(s.district.id))
      },
    })
    // Style once every path has its feature index.
    layers.forEach((p, idx) => p.setStyle(styleOf(idx)))
    layer.addTo(map)
    layersRef.current = layers
    return () => {
      layer.remove()
    }
  }, [map, fc, join, showRisk, isDimmed])

  // Experimental blind-spot overlay (non-interactive so clicks reach the risk layer).
  useEffect(() => {
    if (!showBlindSpot) return
    const bandOf = new Map<GeoJSON.Feature, string>()
    join.byFeature.forEach((s, i) => {
      if (s?.blind_spot && s.blind_spot.band !== 'none') bandOf.set(fc.features[i]!, s.blind_spot.band)
    })
    ensurePanes(map)
    const overlay = L.geoJSON(
      { type: 'FeatureCollection', features: [...bandOf.keys()] } as GeoJSON.FeatureCollection,
      {
        pane: 're-hatch',
        interactive: false,
        style: (f) => ({
          stroke: false,
          fillColor: bandOf.get(f as GeoJSON.Feature) === 'flagged' ? PATTERN.hatch : PATTERN.hatchLight,
          fillOpacity: 1,
        }),
      },
    )
    overlay.addTo(map)
    return () => {
      overlay.remove()
    }
  }, [map, fc, join, showBlindSpot])

  // Borders BETWEEN districts only.
  useEffect(() => {
    if (!innerLines) return
    ensurePanes(map)
    const lines = L.geoJSON(innerLines as GeoJSON.GeoJsonObject, {
      pane: 're-lines',
      interactive: false,
      style: { color: '#FFFFFF', weight: 1, opacity: 0.95 },
    })
    lines.addTo(map)
    return () => {
      lines.remove()
    }
  }, [map, innerLines])

  // Zoom to the focused district and drop a pin on it (no outline).
  useEffect(() => {
    if (!focusId) return
    const idx = join.featureOf.get(focusId)
    const path = idx === undefined ? undefined : layersRef.current[idx]
    if (!path || !('getBounds' in path)) return
    const poly = path as L.Polygon
    map.flyToBounds(poly.getBounds(), { maxZoom: 7, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.6 })
    const pin = L.marker(poly.getCenter(), { icon: PIN_ICON, interactive: false, keyboard: false }).addTo(map)
    return () => {
      pin.remove()
    }
  }, [map, focusId, join])

  return null
}
