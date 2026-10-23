import { useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/ChartCard'
import { ForecastChip } from '@/components/Chips'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CHART, monsoonRanges, RANGE_OPTIONS, type RangeOption } from '@/lib/chart'
import { formatInt, formatMonth, formatMonthShort, formatPct } from '@/lib/format'
import type { BaselineKind, BaselinePoint, Horizon, HorizonForecast, MonthlyObservation } from '@/types'

const BASELINE_LABELS: Record<BaselineKind, string> = {
  seasonal_naive: 'Seasonal naive (same month last year)',
  persistence: 'Persistence (last month’s value)',
  historical_average: 'Historical monthly average',
}

const rangeLabel = (r: RangeOption) => (r == null ? 'All months' : `Last ${r} months`)

/** Per-chart date-range selector (prompt §8 Phase 5: every chart has one). */
export function RangeSelect({ value, onChange, label }: { value: RangeOption; onChange: (r: RangeOption) => void; label: string }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(v === 'null' ? null : (Number(v) as RangeOption))}>
      <SelectTrigger className="h-8 w-36 bg-surface text-xs" aria-label={`Date range: ${label}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((r) => (
          <SelectItem key={String(r)} value={String(r)}>
            {rangeLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function useRange(initial: RangeOption) {
  const [range, setRange] = useState<RangeOption>(initial)
  const slice = <T,>(xs: T[]) => (range == null ? xs : xs.slice(-range))
  return { range, setRange, slice }
}

function Monsoon({ months, yAxisId }: { months: string[]; yAxisId?: string }) {
  return (
    <>
      {monsoonRanges(months).map(([a, b]) => (
        <ReferenceArea key={a} x1={a} x2={b} yAxisId={yAxisId} fill={CHART.teal} fillOpacity={0.07} stroke="none" ifOverflow="extendDomain" />
      ))}
    </>
  )
}

/** Inline legend: line style + label, so series are labelled directly. */
function Key({ items }: { items: { label: string; color: string; dash?: string; square?: boolean; band?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <svg width="24" height="10" aria-hidden>
            {i.band ? (
              <rect x="0" y="1" width="24" height="8" fill={i.color} fillOpacity="0.18" />
            ) : (
              <>
                <line x1="0" y1="5" x2="24" y2="5" stroke={i.color} strokeWidth="2" strokeDasharray={i.dash} />
                {i.square ? <rect x="9" y="2" width="6" height="6" fill={i.color} /> : <circle cx="12" cy="5" r="2.5" fill={i.color} />}
              </>
            )}
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

const missingCount = (xs: (number | null)[]) => xs.filter((x) => x == null).length
const gapsNote = (n: number) => (n ? ` ${n} month${n > 1 ? 's have' : ' has'} no report (shown as a gap, not 0).` : '')

/* ------------------------------------------------------------------ */

export function ForecastChart({
  name,
  history,
  forecasts,
  baselines,
  horizon,
}: {
  name: string
  history: MonthlyObservation[]
  forecasts: HorizonForecast[]
  baselines: BaselinePoint[]
  horizon: Horizon
}) {
  const { range, setRange, slice } = useRange(24)
  const [kind, setKind] = useState<BaselineKind>('seasonal_naive')
  const hasBand = forecasts.some((f) => f.expected_cases_interval)

  const past = slice(history)
  const rows: {
    month: string
    actual: number | null
    forecast: number | null
    baseline: number | null
    band: [number, number] | null
    threshold: number | null
  }[] = past.map((h) => ({ month: h.month, actual: h.reported_cases, forecast: null, baseline: null, band: null, threshold: null }))
  // Bridge the dashed forecast line from the last observed month (if it has a report).
  const last = rows[rows.length - 1]
  if (last && last.actual != null) last.forecast = last.actual
  for (const f of forecasts) {
    rows.push({
      month: f.target_month,
      actual: null,
      forecast: f.expected_cases,
      baseline: baselines.find((b) => b.kind === kind && b.horizon === f.horizon)?.expected_cases ?? null,
      band: f.expected_cases_interval ? [f.expected_cases_interval.lower, f.expected_cases_interval.upper] : null,
      threshold: f.outbreak_threshold_cases,
    })
  }
  const sel = forecasts.find((f) => f.horizon === horizon) ?? forecasts[0]
  const selBaseline = sel ? baselines.find((b) => b.kind === kind && b.horizon === sel.horizon)?.expected_cases ?? null : null
  const summary = sel
    ? sel.expected_cases == null
      ? `${name}: no count forecast is available for ${formatMonth(sel.target_month)}.`
      : `${name}: the model expects about ${formatInt(sel.expected_cases)} cases in ${formatMonth(sel.target_month)} (${sel.horizon} month${sel.horizon > 1 ? 's' : ''} ahead), against an outbreak threshold of ${formatInt(sel.outbreak_threshold_cases)}. ${BASELINE_LABELS[kind].split(' (')[0]} baseline: ${formatInt(selBaseline)}.${gapsNote(missingCount(past.map((p) => p.reported_cases)))}`
    : `${name}: no forecast available.`

  return (
    <ChartCard
      title="Forecast vs actual cases"
      caption="Observed cases (solid), model forecast (dashed) and one baseline (dotted). Expected counts come from the negative-binomial model."
      synthetic
      chips={<ForecastChip />}
      summary={summary}
      actions={
        <>
          <Select value={kind} onValueChange={(v) => setKind(v as BaselineKind)}>
            <SelectTrigger className="h-8 w-56 max-w-full bg-surface text-xs" aria-label="Baseline">
              {/* Short name in the trigger (the full description is in the list), so it never clips. */}
              <SelectValue>Baseline: {BASELINE_LABELS[kind].split(' (')[0]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(BASELINE_LABELS) as BaselineKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  Baseline: {BASELINE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RangeSelect value={range} onChange={setRange} label="forecast chart" />
        </>
      }
      legend={
        <Key
          items={[
            { label: 'Reported cases (observed)', color: CHART.navy },
            { label: 'Model forecast', color: CHART.teal, dash: '6 4', square: true },
            { label: `Baseline: ${BASELINE_LABELS[kind].split(' (')[0]}`, color: CHART.slate, dash: '2 3' },
            ...(hasBand ? [{ label: 'Forecast uncertainty (from the model)', color: CHART.teal, band: true }] : []),
          ]}
        />
      }
      table={{
        columns: ['Month', 'Reported', 'Model forecast', 'Baseline', 'Outbreak threshold'],
        rows: rows.map((r, i) => [
          formatMonth(r.month),
          formatInt(r.actual),
          i < past.length ? '—' : formatInt(r.forecast),
          i < past.length ? '—' : formatInt(r.baseline),
          i < past.length ? '—' : formatInt(r.threshold),
        ]),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <Monsoon months={rows.map((r) => r.month)} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={CHART.axis} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
          <YAxis tick={CHART.axis} tickLine={false} width={44} domain={[0, 'auto']} tickFormatter={(v: number) => formatInt(v)} />
          {sel && <ReferenceLine x={sel.target_month} stroke={CHART.teal} strokeDasharray="3 3" label={{ value: `${sel.horizon}M`, position: 'top', fontSize: 11, fill: CHART.teal }} />}
          {hasBand && <Area dataKey="band" stroke="none" fill={CHART.teal} fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />}
          <Tooltip
            contentStyle={CHART.tooltip}
            labelFormatter={(l) => formatMonth(String(l))}
            formatter={(v, n) => {
              const label = { actual: 'Reported', forecast: 'Model forecast', baseline: 'Baseline', band: 'Uncertainty', threshold: 'Outbreak threshold' }[String(n)] ?? String(n)
              return [Array.isArray(v) ? `${formatInt(v[0] as number)}–${formatInt(v[1] as number)}` : formatInt(v == null ? null : Number(v)), label]
            }}
          />
          <Line dataKey="actual" stroke={CHART.navy} strokeWidth={2} dot={{ r: 2, fill: CHART.navy }} connectNulls={false} isAnimationActive={false} className="re-observed" />
          <Line dataKey="forecast" stroke={CHART.teal} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3.5, fill: CHART.teal }} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="baseline" stroke={CHART.slate} strokeWidth={2} strokeDasharray="2 3" dot={{ r: 3, fill: CHART.slate }} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ */

export function HistoryChart({ name, history }: { name: string; history: MonthlyObservation[] }) {
  const { range, setRange, slice } = useRange(36)
  const data = slice(history).map((h) => ({ month: h.month, cases: h.reported_cases }))
  const vals = data.filter((d) => d.cases != null)
  const peak = vals.reduce<(typeof vals)[number] | undefined>((a, b) => (!a || b.cases! > a.cases! ? b : a), undefined)
  const summary = peak
    ? `${name} reported a peak of ${formatInt(peak.cases)} cases in ${formatMonth(peak.month)} over this period.${gapsNote(missingCount(data.map((d) => d.cases)))}`
    : `${name} has no reported cases in this period.`
  return (
    <ChartCard
      title="Historical reported cases"
      caption="Observed monthly dengue reports. Gaps are months with no report — never zero."
      synthetic
      summary={summary}
      actions={<RangeSelect value={range} onChange={setRange} label="historical cases" />}
      legend={<Key items={[{ label: 'Reported cases', color: CHART.navy }]} />}
      table={{ columns: ['Month', 'Reported cases'], rows: data.map((d) => [formatMonth(d.month), formatInt(d.cases)]) }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <Monsoon months={data.map((d) => d.month)} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={CHART.axis} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
          <YAxis tick={CHART.axis} tickLine={false} width={44} domain={[0, 'auto']} tickFormatter={(v: number) => formatInt(v)} />
          <Tooltip contentStyle={CHART.tooltip} labelFormatter={(l) => formatMonth(String(l))} formatter={(v) => [formatInt(v == null ? null : Number(v)), 'Reported cases']} />
          <Line dataKey="cases" stroke={CHART.navy} strokeWidth={2} dot={{ r: 2, fill: CHART.navy }} connectNulls={false} isAnimationActive={false} className="re-observed" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ */

export function TestingChart({ name, history }: { name: string; history: MonthlyObservation[] }) {
  const { range, setRange, slice } = useRange(24)
  const data = slice(history).map((h) => ({ month: h.month, tests: h.tests_per_100k, positivity: h.test_positivity == null ? null : Math.round(h.test_positivity * 100) }))
  const lastObs = [...data].reverse().find((d) => d.tests != null)
  const summary = lastObs
    ? `${name} tested ${formatInt(lastObs.tests)} per 100k in ${formatMonth(lastObs.month)}, with ${lastObs.positivity}% of tests positive.${gapsNote(missingCount(data.map((d) => d.tests)))}`
    : `${name} has no testing data in this period.`
  return (
    <ChartCard
      title="Testing volume and coverage"
      caption="Tests per 100k people per month (left) and the share of tests positive (right)."
      synthetic
      summary={summary}
      actions={<RangeSelect value={range} onChange={setRange} label="testing" />}
      legend={<Key items={[{ label: 'Tests per 100k (left)', color: CHART.navy }, { label: 'Test positivity % (right)', color: CHART.teal, square: true }]} />}
      table={{ columns: ['Month', 'Tests per 100k', 'Positivity'], rows: data.map((d) => [formatMonth(d.month), formatInt(d.tests), d.positivity == null ? 'No data' : `${d.positivity}%`]) }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <Monsoon months={data.map((d) => d.month)} yAxisId="left" />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={CHART.axis} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
          <YAxis yAxisId="left" tick={CHART.axis} tickLine={false} width={40} domain={[0, 'auto']} />
          <YAxis yAxisId="right" orientation="right" tick={CHART.axis} tickLine={false} width={40} domain={[0, 'auto']} unit="%" />
          <Tooltip contentStyle={CHART.tooltip} labelFormatter={(l) => formatMonth(String(l))} formatter={(v, n) => [v == null ? 'No data' : n === 'positivity' ? `${v}%` : formatInt(Number(v)), n === 'positivity' ? 'Positivity' : 'Tests per 100k']} />
          <Line yAxisId="left" dataKey="tests" stroke={CHART.navy} strokeWidth={2} dot={{ r: 2, fill: CHART.navy }} connectNulls={false} isAnimationActive={false} />
          <Line yAxisId="right" dataKey="positivity" stroke={CHART.teal} strokeWidth={2} dot={{ r: 2.5, fill: CHART.teal }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ */

export function FeverChart({ name, history }: { name: string; history: MonthlyObservation[] }) {
  const { range, setRange, slice } = useRange(24)
  const data = slice(history).map((h) => ({ month: h.month, fever: h.fever_admissions }))
  const vals = data.filter((d) => d.fever != null)
  const peak = vals.reduce<(typeof vals)[number] | undefined>((a, b) => (!a || b.fever! > a.fever! ? b : a), undefined)
  const summary = peak
    ? `Fever admissions in ${name} peaked at ${formatInt(peak.fever)} in ${formatMonth(peak.month)} over this period.${gapsNote(missingCount(data.map((d) => d.fever)))}`
    : `${name} has no fever-admission data in this period.`
  return (
    <ChartCard
      title="Fever admissions"
      caption="All fever admissions reported by facilities — rising fever with flat dengue reports can mean missed cases."
      synthetic
      summary={summary}
      actions={<RangeSelect value={range} onChange={setRange} label="fever admissions" />}
      legend={<Key items={[{ label: 'Fever admissions', color: CHART.navy }]} />}
      table={{ columns: ['Month', 'Fever admissions'], rows: data.map((d) => [formatMonth(d.month), formatInt(d.fever)]) }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <Monsoon months={data.map((d) => d.month)} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={CHART.axis} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
          <YAxis tick={CHART.axis} tickLine={false} width={48} domain={[0, 'auto']} tickFormatter={(v: number) => formatInt(v)} />
          <Tooltip contentStyle={CHART.tooltip} labelFormatter={(l) => formatMonth(String(l))} formatter={(v) => [formatInt(v == null ? null : Number(v)), 'Fever admissions']} />
          <Line dataKey="fever" stroke={CHART.navy} strokeWidth={2} dot={{ r: 2, fill: CHART.navy }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ */

/** Three small charts sharing an x-axis: different units are never mixed on one axis. */
export function ClimateChart({ name, history }: { name: string; history: MonthlyObservation[] }) {
  const { range, setRange, slice } = useRange(24)
  const data = slice(history).map((h) => ({ month: h.month, rain: h.rainfall_mm, temp: h.temperature_c, humidity: h.humidity_pct }))
  const months = data.map((d) => d.month)
  const last = data[data.length - 1]
  const summary = last
    ? `In ${formatMonth(last.month)}, ${name} had ${formatInt(last.rain)} mm of rain, an average temperature of ${last.temp ?? '—'}°C and ${formatPct(last.humidity == null ? null : last.humidity / 100)} humidity.`
    : `${name} has no climate data in this period.`
  const panel = (key: 'rain' | 'temp' | 'humidity', label: string, unit: string, bars = false) => (
    <div>
      <p className="text-xs font-medium text-ink-muted">
        {label} ({unit})
      </p>
      <ResponsiveContainer width="100%" height={92}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} syncId="climate">
          <Monsoon months={months} />
          <XAxis dataKey="month" hide={key !== 'humidity'} tickFormatter={formatMonthShort} tick={CHART.axis} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
          <YAxis tick={CHART.axis} tickLine={false} width={40} domain={key === 'temp' ? ['auto', 'auto'] : [0, 'auto']} />
          <Tooltip contentStyle={CHART.tooltip} labelFormatter={(l) => formatMonth(String(l))} formatter={(v) => [v == null ? 'No data' : `${v} ${unit}`, label]} />
          {bars ? (
            <Bar dataKey={key} fill={CHART.teal} isAnimationActive={false} />
          ) : (
            <Line dataKey={key} stroke={CHART.navy} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
  return (
    <ChartCard
      title="Rainfall, temperature and humidity"
      caption="Observed monthly climate. Each measure has its own scale."
      synthetic
      summary={summary}
      actions={<RangeSelect value={range} onChange={setRange} label="climate" />}
      legend={<Key items={[{ label: 'Rainfall (bars)', color: CHART.teal, square: true }, { label: 'Temperature, humidity (lines)', color: CHART.navy }]} />}
      table={{
        columns: ['Month', 'Rainfall (mm)', 'Temperature (°C)', 'Humidity (%)'],
        rows: data.map((d) => [formatMonth(d.month), formatInt(d.rain), d.temp ?? 'No data', d.humidity ?? 'No data']),
      }}
    >
      <div className="flex flex-col gap-1">
        {panel('rain', 'Rainfall', 'mm', true)}
        {panel('temp', 'Temperature', '°C')}
        {panel('humidity', 'Humidity', '%')}
      </div>
    </ChartCard>
  )
}
