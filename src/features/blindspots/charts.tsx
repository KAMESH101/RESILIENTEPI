import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { ExperimentalChip } from '@/components/Chips'
import { ErrorState } from '@/components/ErrorState'
import { BlockSkeleton } from '@/components/Skeletons'
import { PATTERN } from '@/features/map/patterns'
import { monsoonRanges } from '@/lib/chart'
import { formatInt, formatMonth, formatMonthShort, formatPct } from '@/lib/format'
import { getDistrict } from '@/services/endpoints'
import type { BlindSpotAssessment, BlindSpotBand, MonthlyObservation } from '@/types'

const NAVY = '#0F2A4A'
const TEAL = '#0E8A8A'
const MUTED = '#475569'
const GRID = '#E2E8F0'
const AXIS = { fontSize: 11, fill: MUTED }
const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8, borderColor: GRID }

/* ------------------------------------------------------------------ */
/* Reported vs expected, by testing level                              */
/* ------------------------------------------------------------------ */

interface Point {
  id: string
  name: string
  x: number
  y: number
  band: BlindSpotBand
  reported: number
  expected: number
}

const DOT: Record<BlindSpotBand, { fill: string; stroke: string; r: number }> = {
  flagged: { fill: PATTERN.hatch, stroke: NAVY, r: 8 },
  watch: { fill: PATTERN.hatchLight, stroke: NAVY, r: 7 },
  none: { fill: '#CBD5E1', stroke: '#94A3B8', r: 5 },
}

export function ReportedVsExpectedChart({ items, onSelect }: { items: BlindSpotAssessment[]; onSelect: (id: string) => void }) {
  const points: Point[] = items.flatMap((a) => {
    const m = a.metrics
    if (m.tests_per_100k == null || m.reported_cases == null || !m.expected_cases) return []
    return [{ id: a.district.id, name: a.district.name, x: m.tests_per_100k, y: Math.round((m.reported_cases / m.expected_cases) * 100), band: a.band, reported: m.reported_cases, expected: m.expected_cases }]
  })
  const low = points.filter((p) => p.y < 50).sort((a, b) => a.y - b.y)
  const summary = points.length
    ? low.length
      ? `${low.length} of ${points.length} districts reported less than half the cases the model expected. Lowest: ${low
          .slice(0, 2)
          .map((p) => `${p.name} (${p.y}% of expected, ${formatInt(p.x)} tests per 100k)`)
          .join(' and ')}.`
      : `All ${points.length} districts reported at least half the cases the model expected.`
    : 'No districts have enough recent data for this chart.'
  const yMax = Math.ceil(Math.max(125, ...points.map((p) => p.y + 10)) / 25) * 25
  const yTicks = Array.from({ length: yMax / 25 + 1 }, (_, i) => i * 25)
  // Labelled dots often sit close together (low testing, low reporting):
  // alternate their labels above and below so names never overlap.
  const labelBelow = new Set(
    points
      .filter((p) => p.band !== 'none')
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .filter((_, i) => i % 2 === 0)
      .map((p) => p.id),
  )

  return (
    <ChartCard
      title="Reported vs expected cases, by testing level"
      caption="Each dot is a district (last 3 reported months). Low testing and far below the expected line can mean missed cases."
      synthetic
      chips={<ExperimentalChip />}
      summary={summary}
      legend={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
          <LegendDot band="flagged" label="Potential blind spot" />
          <LegendDot band="watch" label="Blind-spot watch" />
          <LegendDot band="none" label="Other districts" />
          <li className="inline-flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden>
              <line x1="0" y1="4" x2="20" y2="4" stroke={NAVY} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            Expected (model) = 100%
          </li>
        </ul>
      }
      table={{
        columns: ['District', 'Tests per 100k', 'Reported', 'Expected (model)', '% of expected', 'Blind spot'],
        rows: [...points].sort((a, b) => a.y - b.y).map((p) => [p.name, formatInt(p.x), formatInt(p.reported), formatInt(p.expected), `${p.y}%`, p.band === 'flagged' ? 'Potential' : p.band === 'watch' ? 'Watch' : '—']),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID} />
          <XAxis type="number" dataKey="x" name="Tests per 100k" tick={AXIS} tickLine={false} label={{ value: 'Tests per 100k per month', position: 'insideBottom', offset: -4, fontSize: 11, fill: MUTED }} height={36} />
          <YAxis type="number" dataKey="y" name="% of expected" unit="%" domain={[0, yMax]} ticks={yTicks} tick={AXIS} tickLine={false} width={44} />
          <ReferenceLine y={100} stroke={NAVY} strokeDasharray="4 3" strokeWidth={2} label={{ value: 'Expected (model)', position: 'insideTopRight', fontSize: 11, fill: NAVY }} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={TOOLTIP_STYLE}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as Point | undefined
              if (!p) return null
              return (
                <div className="rounded-lg border bg-surface px-3 py-2 text-xs shadow-card">
                  <p className="font-semibold text-navy-900">{p.name}</p>
                  <p>
                    {formatInt(p.reported)} reported vs {formatInt(p.expected)} expected ({p.y}%)
                  </p>
                  <p>{formatInt(p.x)} tests per 100k per month</p>
                </div>
              )
            }}
          />
          <Scatter
            data={points}
            isAnimationActive={false}
            onClick={(d) => onSelect((d as unknown as { payload: Point }).payload.id)}
            shape={(props: unknown) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: Point }
              const dot = DOT[payload.band]
              return (
                <g style={{ cursor: 'pointer' }}>
                  <circle cx={cx} cy={cy} r={dot.r} fill="#fff" />
                  <circle cx={cx} cy={cy} r={dot.r} fill={dot.fill} stroke={dot.stroke} strokeWidth={1.5} />
                  {payload.band !== 'none' && (
                    <text x={cx + dot.r + 3} y={labelBelow.has(payload.id) ? cy + dot.r + 11 : cy - dot.r - 3} fontSize={11} fill={NAVY} fontWeight={600} paintOrder="stroke" stroke="#fff" strokeWidth={3}>
                      {payload.name}
                    </text>
                  )}
                </g>
              )
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function LegendDot({ band, label }: { band: BlindSpotBand; label: string }) {
  const d = DOT[band]
  return (
    <li className="inline-flex items-center gap-1.5">
      <svg width="16" height="16" aria-hidden>
        <circle cx="8" cy="8" r="6" fill="#fff" />
        <circle cx="8" cy="8" r="6" fill={d.fill} stroke={d.stroke} strokeWidth="1.5" />
      </svg>
      {label}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Selected-district trends                                            */
/* ------------------------------------------------------------------ */

const TREND_MONTHS = 24

export function DistrictTrendCharts({ assessment }: { assessment: BlindSpotAssessment }) {
  const id = assessment.district.id
  const q = useQuery({ queryKey: ['district', id], queryFn: () => getDistrict(id) })
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} className="rounded-xl border bg-surface" />
  if (!q.data) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <BlockSkeleton className="h-80" />
        <BlockSkeleton className="h-80" />
      </div>
    )
  }
  const history = q.data.history.slice(-TREND_MONTHS)
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <TestingCompletenessChart name={assessment.district.name} history={history} assessment={assessment} />
      <FeverVsReportsChart name={assessment.district.name} history={history} assessment={assessment} />
    </div>
  )
}

function MonsoonShading({ months }: { months: string[] }) {
  return (
    <>
      {monsoonRanges(months).map(([a, b]) => (
        <ReferenceArea key={a} yAxisId="left" x1={a} x2={b} fill={TEAL} fillOpacity={0.07} stroke="none" ifOverflow="extendDomain" />
      ))}
    </>
  )
}

function SeriesKey({ items }: { items: { color: string; label: string; square?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <svg width="22" height="10" aria-hidden>
            <line x1="0" y1="5" x2="22" y2="5" stroke={i.color} strokeWidth="2" />
            {i.square ? <rect x="8" y="2" width="6" height="6" fill={i.color} /> : <circle cx="11" cy="5" r="3" fill={i.color} />}
          </svg>
          {i.label}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded-sm bg-teal-600/10" aria-hidden />
        Monsoon (Jun–Sep)
      </li>
    </ul>
  )
}

const squareDot = (color: string) =>
  function SquareDot(props: unknown) {
    const { cx, cy, value } = props as { cx?: number; cy?: number; value?: number | null }
    if (cx == null || cy == null || value == null) return <g />
    return <rect x={cx - 3} y={cy - 3} width={6} height={6} fill={color} />
  }

function TestingCompletenessChart({ name, history, assessment }: { name: string; history: MonthlyObservation[]; assessment: BlindSpotAssessment }) {
  const data = history.map((h) => ({
    month: h.month,
    tests: h.tests_per_100k,
    completeness: h.reporting_completeness == null ? null : Math.round(h.reporting_completeness * 100),
  }))
  const m = assessment.metrics
  const missing = history.filter((h) => h.tests_per_100k == null).length
  const summary = `${name} tested about ${formatInt(m.tests_per_100k)} per 100k a month recently (state median ${formatInt(m.state_median_tests_per_100k)}); reporting completeness was ${formatPct(m.reporting_completeness)}.${missing ? ` ${missing} month${missing > 1 ? 's have' : ' has'} no report.` : ''}`
  return (
    <ChartCard
      title={`Testing and reporting completeness — ${name}`}
      caption="Observed, last 24 months. Gaps are months with no report (never 0)."
      synthetic
      summary={summary}
      legend={<SeriesKey items={[{ color: NAVY, label: 'Tests per 100k (left)' }, { color: TEAL, label: 'Reporting completeness % (right)', square: true }]} />}
      table={{ columns: ['Month', 'Tests per 100k', 'Completeness'], rows: data.map((d) => [formatMonth(d.month), formatInt(d.tests), d.completeness == null ? 'No data' : `${d.completeness}%`]) }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <MonsoonShading months={data.map((d) => d.month)} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={AXIS} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis yAxisId="left" tick={AXIS} tickLine={false} width={40} domain={[0, 'auto']} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS} tickLine={false} width={40} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => formatMonth(String(l))} formatter={(v, n) => [v == null ? 'No data' : n === 'completeness' ? `${v}%` : formatInt(Number(v)), n === 'completeness' ? 'Completeness' : 'Tests per 100k']} />
          <Line yAxisId="left" type="monotone" dataKey="tests" stroke={NAVY} strokeWidth={2} dot={{ r: 2.5, fill: NAVY }} connectNulls={false} isAnimationActive={false} />
          <Line yAxisId="right" type="monotone" dataKey="completeness" stroke={TEAL} strokeWidth={2} dot={squareDot(TEAL)} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function FeverVsReportsChart({ name, history, assessment }: { name: string; history: MonthlyObservation[]; assessment: BlindSpotAssessment }) {
  const data = history.map((h) => ({ month: h.month, fever: h.fever_admissions, dengue: h.reported_cases }))
  const m = assessment.metrics
  const pct = (x: number | null) => (x == null ? 'no comparison available' : `${x >= 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)}%`)
  const summary = `Over the last reported months, fever admissions in ${name} changed ${pct(m.fever_admissions_change)} while dengue reports changed ${pct(m.reported_cases_change)} compared with the 3 months before.`
  return (
    <ChartCard
      title={`Fever admissions vs dengue reports — ${name}`}
      caption="Observed, last 24 months. Fever rising while dengue reports stay flat can mean missed cases."
      synthetic
      summary={summary}
      legend={<SeriesKey items={[{ color: NAVY, label: 'Fever admissions (left)' }, { color: TEAL, label: 'Dengue cases reported (right)', square: true }]} />}
      table={{ columns: ['Month', 'Fever admissions', 'Dengue reported'], rows: data.map((d) => [formatMonth(d.month), formatInt(d.fever), formatInt(d.dengue)]) }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <MonsoonShading months={data.map((d) => d.month)} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={AXIS} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis yAxisId="left" tick={AXIS} tickLine={false} width={48} domain={[0, 'auto']} tickFormatter={(v: number) => formatInt(v)} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS} tickLine={false} width={40} domain={[0, 'auto']} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => formatMonth(String(l))} formatter={(v, n) => [v == null ? 'No data' : formatInt(Number(v)), n === 'fever' ? 'Fever admissions' : 'Dengue reported']} />
          <Line yAxisId="left" type="monotone" dataKey="fever" stroke={NAVY} strokeWidth={2} dot={{ r: 2.5, fill: NAVY }} connectNulls={false} isAnimationActive={false} />
          <Line yAxisId="right" type="monotone" dataKey="dengue" stroke={TEAL} strokeWidth={2} dot={squareDot(TEAL)} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
