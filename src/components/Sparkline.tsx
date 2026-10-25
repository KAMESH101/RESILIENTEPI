import { Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { monsoonRanges } from '@/lib/chart'
import { formatInt, formatMonth, formatMonthShort } from '@/lib/format'

/** Observed case trend (solid line). Missing months break the line — never drawn as 0. */
export function Sparkline({ data, height = 96 }: { data: { month: string; reported_cases: number | null }[]; height?: number }) {
  const monsoon = monsoonRanges(data.map((d) => d.month))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
        {monsoon.map(([a, b]) => (
          <ReferenceArea key={a} x1={a} x2={b} fill="#0E8A8A" fillOpacity={0.08} stroke="none" ifOverflow="extendDomain" />
        ))}
        <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} interval="preserveStartEnd" minTickGap={16} />
        <YAxis hide domain={[0, 'auto']} />
        <Tooltip
          formatter={(v) => [formatInt(typeof v === 'number' ? v : null), 'Reported cases']}
          labelFormatter={(l) => formatMonth(String(l))}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E2E8F0' }}
        />
        <Line type="monotone" dataKey="reported_cases" stroke="#0F2A4A" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
