/**
 * SVG patterns shared by every map in the document. Leaflet paths reference
 * them through PATTERN (./patterns) as `fill="url(#…)"`. Rendered once in the layout.
 */
export function MapPatterns() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        {/* Potential blind spot: navy diagonal hatch over the risk colour. */}
        <pattern id="re-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2.2" height="6" fill="#0F2A4A" />
        </pattern>
        {/* Watch band: sparser, lighter hatch. */}
        <pattern id="re-hatch-light" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1.6" height="9" fill="#0F2A4A" fillOpacity="0.6" />
        </pattern>
        {/* No data: grey dots — never rendered as 0 or Low. */}
        <pattern id="re-nodata" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#F1F5F9" />
          <circle cx="3" cy="3" r="1" fill="#94A3B8" />
        </pattern>
      </defs>
    </svg>
  )
}
