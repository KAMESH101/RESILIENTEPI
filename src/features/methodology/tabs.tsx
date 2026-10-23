import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CircleDashed, Database, FlaskConical, Hourglass, Radio, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { ExperimentalNotice } from '@/components/ExperimentalNotice'
import { ErrorState } from '@/components/ErrorState'
import { RISK_STYLE } from '@/components/riskStyle'
import { SectionCard } from '@/components/SectionCard'
import { ListSkeleton } from '@/components/Skeletons'
import { HUMAN_REVIEW_NOTE } from '@/config/actions'
import {
  BLIND_SPOT_COMPONENT_LABELS,
  BLIND_SPOT_COMPONENT_ORDER,
  BLIND_SPOT_COMPONENT_SIGNALS,
  BLIND_SPOT_THRESHOLD_NOTE,
  BLIND_SPOT_WEIGHTS,
} from '@/config/blindspot'
import { GLOSSARY } from '@/config/glossary'
import {
  BLIND_SPOT_VALIDATION,
  DATA_REALITY,
  FEATURES,
  METRIC_ORDER,
  METRICS,
  MODEL_LABELS,
  MODEL_ORDER,
  SOURCE_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
  VALIDATION_STEPS,
} from '@/config/methodology'
import { OUTBREAK_PERCENTILE, RISK_BANDS } from '@/config/risk'
import { formatDateTime, formatMonth, formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getDataSources, getModelPerformance } from '@/services/endpoints'
import type { DataSourceHealth, DataSourceTypeTag, MetricRow, ModelPerformanceResponse } from '@/types'
import { HORIZONS } from '@/types'

function Prose({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 p-4 text-sm leading-relaxed text-ink [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
}

/* ------------------------------------------------------------------ */
/* Tab 1: Method                                                       */
/* ------------------------------------------------------------------ */

export function MethodTab() {
  return (
    <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
      <SectionCard id="m-target" title="What ResilientEpi forecasts">
        <Prose>
          <p>
            For every district and month: the <strong>chance that dengue cases will be above that district’s outbreak threshold</strong>, 1, 2 and 3
            months ahead.
          </p>
          <p>
            The outbreak threshold is the district’s usual level for that calendar month: its {OUTBREAK_PERCENTILE}th percentile in past years. A
            district that usually has many cases in October needs more cases to count as an outbreak than one that usually has few.
          </p>
          <p>The chance is turned into a risk category, always shown with an icon and a word, never colour alone:</p>
          <table className="w-full max-w-md text-sm">
            <thead>
              <tr className="border-b text-left text-ink-muted">
                <th className="py-1 font-medium">Category</th>
                <th className="py-1 font-medium">Chance</th>
                <th className="py-1 font-medium">Shown as</th>
              </tr>
            </thead>
            <tbody>
              {RISK_BANDS.map((b) => {
                const s = RISK_STYLE[b.category]
                return (
                  <tr key={b.category} className="border-b last:border-b-0">
                    <td className="py-1">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex size-4 items-center justify-center rounded-sm" style={{ background: s.fill, color: s.ink }} aria-hidden>
                          <s.icon className="size-3" />
                        </span>
                        {b.label}
                      </span>
                    </td>
                    <td className="py-1 tabular-nums">
                      {formatPct(b.min)} to {b.max === 1 ? '100%' : `below ${formatPct(b.max)}`}
                    </td>
                    <td className="py-1">“{b.word}”</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p>A second output is the expected number of cases, from the count model.</p>
        </Prose>
      </SectionCard>

      <SectionCard id="m-models" title="How the forecast is made">
        <Prose>
          <ul>
            {MODEL_ORDER.map((m) => (
              <li key={m}>
                <strong>{MODEL_LABELS[m].name}.</strong> {MODEL_LABELS[m].role}
              </li>
            ))}
          </ul>
          <p>The three baselines are always shown next to the model, so you can see whether it adds value over simple rules.</p>
          <p>
            <strong>Why each alert says why.</strong> For every forecast, SHAP values show which inputs pushed the risk up or down. The top three are shown as
            plain sentences, for example “Rainfall 2 months ago was 38% above normal”. When they are not available, the app says “Explanation not yet
            available”.
          </p>
        </Prose>
      </SectionCard>

      <SectionCard id="m-features" title="What goes into the model">
        <Prose>
          <ul>
            {FEATURES.map((f) => (
              <li key={f.name}>
                <strong>{f.name}:</strong> {f.detail}
              </li>
            ))}
          </ul>
        </Prose>
      </SectionCard>

      <SectionCard id="m-validation" title="How the model is checked">
        <Prose>
          <ul>
            {VALIDATION_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p>Measures used:</p>
          <ul>
            {METRIC_ORDER.map((k) => (
              <li key={k}>
                <strong>{METRICS[k].label}:</strong> {METRICS[k].plain}
              </li>
            ))}
          </ul>
        </Prose>
      </SectionCard>

      <SectionCard id="m-blindspot" title="The blind-spot indicator (experimental)" className="xl:col-span-2">
        <Prose>
          <ExperimentalNotice />
          <p>
            A transparent score from 0 to 100 that flags districts where low reported dengue may reflect low testing or weak reporting, not low disease. It
            adds up five parts, each scored from 0 up to its weight:
          </p>
          <table className="w-full max-w-3xl text-sm">
            <thead>
              <tr className="border-b text-left text-ink-muted">
                <th className="py-1 pr-3 font-medium">Part</th>
                <th className="py-1 pr-3 font-medium">Signal</th>
                <th className="py-1 text-right font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {BLIND_SPOT_COMPONENT_ORDER.map((k) => (
                <tr key={k} className="border-b last:border-b-0">
                  <td className="py-1 pr-3 font-medium">{BLIND_SPOT_COMPONENT_LABELS[k]}</td>
                  <td className="py-1 pr-3">{BLIND_SPOT_COMPONENT_SIGNALS[k]}</td>
                  <td className="py-1 text-right tabular-nums">{Math.round(BLIND_SPOT_WEIGHTS[k] * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{BLIND_SPOT_THRESHOLD_NOTE}</p>
          <p>
            <strong>Validation plan:</strong> {BLIND_SPOT_VALIDATION.planned} independent tests. Defined so far:
          </p>
          <ul>
            {BLIND_SPOT_VALIDATION.defined.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="text-ink-muted">
            The other {BLIND_SPOT_VALIDATION.planned - BLIND_SPOT_VALIDATION.defined.length} tests are still to be specified by the team.
          </p>
        </Prose>
      </SectionCard>

      <SectionCard id="m-reality" title="Data reality">
        <Prose>
          <ul>
            {DATA_REALITY.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </Prose>
      </SectionCard>

      <SectionCard id="m-humans" title="People decide">
        <Prose>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
            ResilientEpi complements IDSP/IHIP; it does not replace them. {HUMAN_REVIEW_NOTE}
          </p>
        </Prose>
      </SectionCard>

      <SectionCard id="m-glossary" title="Glossary" className="xl:col-span-2">
        <dl className="grid gap-x-6 gap-y-3 p-4 text-sm md:grid-cols-2">
          {Object.values(GLOSSARY).map((g) => (
            <div key={g.term}>
              <dt className="font-semibold text-navy-900">{g.term}</dt>
              <dd className="text-ink-muted">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab 2: Model results                                                */
/* ------------------------------------------------------------------ */

export function ResultsTab() {
  const q = useQuery({ queryKey: ['model-performance'], queryFn: getModelPerformance })
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} className="rounded-xl border bg-surface" />
  if (!q.data) return <ListSkeleton rows={6} className="rounded-xl border bg-surface" />
  return q.data.status === 'pending' ? <ResultsPending message={q.data.message} /> : <ResultsAvailable r={q.data} />
}

function ResultsPending({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div role="status" className="flex items-start gap-3 rounded-xl border border-dashed border-navy-700 bg-surface p-5 shadow-card">
        <Hourglass className="mt-0.5 size-6 shrink-0 text-navy-700" aria-hidden />
        <div>
          <p className="text-lg font-semibold text-navy-900">{message}</p>
          <p className="mt-1 text-sm text-ink-muted">
            No accuracy figures are shown until a real walk-forward backtest has been run. The demo never displays example or made-up results.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
        <SectionCard id="r-what" title="What will appear here">
          <Prose>
            <ul>
              {METRIC_ORDER.map((k) => (
                <li key={k}>
                  <strong>{METRICS[k].label}</strong> — {METRICS[k].plain}
                </li>
              ))}
            </ul>
            <p>
              For each of {MODEL_ORDER.length} models (the LightGBM model, the count model and three baselines), by forecast horizon ({HORIZONS.join(', ')}{' '}
              months) and by state.
            </p>
          </Prose>
        </SectionCard>
        <SectionCard id="r-meta" title="Model version and evaluation">
          <dl className="grid grid-cols-2 gap-4 p-4 text-sm">
            <div>
              <dt className="text-ink-muted">Model version</dt>
              <dd className="font-semibold">Not yet evaluated</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Last evaluation</dt>
              <dd className="font-semibold">Not yet evaluated</dd>
            </div>
          </dl>
          <Prose>
            <p className="font-medium text-navy-900">Known limitations</p>
            <ul>
              <li>District data ends in 2022, so evaluation is retrospective.</li>
              <li>Under-reporting affects both the training labels and the evaluation.</li>
              <li>The blind-spot indicator is experimental and evaluated separately.</li>
            </ul>
          </Prose>
        </SectionCard>
      </div>
    </div>
  )
}

const fmtMetric = (k: keyof typeof METRICS, v: number | null | undefined) =>
  v == null ? '—' : k === 'precision_top20' ? formatPct(v) : k === 'lead_time_months' ? `${v.toFixed(1)} mo` : v.toFixed(k === 'mae' || k === 'rmse' ? 1 : 2)

function ResultsAvailable({ r }: { r: Extract<ModelPerformanceResponse, { status: 'available' }> }) {
  const national = r.rows.filter((x) => x.state == null)
  const states = [...new Set(r.rows.flatMap((x) => (x.state ? [x.state] : [])))]
  const table = (rows: MetricRow[], caption: string) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b text-left text-ink-muted">
            <th className="py-1.5 pr-3 font-medium">Model</th>
            {METRIC_ORDER.map((k) => (
              <th key={k} className="py-1.5 pr-3 text-right font-medium">
                {METRICS[k].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODEL_ORDER.flatMap((m) => rows.filter((x) => x.model === m)).map((x) => (
            <tr key={`${x.model}-${x.horizon}-${x.state}`} className={cn('border-b last:border-b-0', x.model === 'lightgbm_pooled' && 'font-semibold')}>
              <td className="py-1.5 pr-3">{MODEL_LABELS[x.model].name}</td>
              {METRIC_ORDER.map((k) => (
                <td key={k} className="py-1.5 pr-3 text-right tabular-nums">
                  {fmtMetric(k, x.values[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <p className="text-sm text-ink-muted">
        Model version <strong className="text-ink">{r.model_version}</strong> · evaluated {formatDateTime(r.evaluated_at)} · walk-forward backtest
      </p>
      {HORIZONS.map((h) => (
        <SectionCard key={h} id={`r-h${h}`} title={`${h}-month horizon — model vs baselines`}>
          <div className="p-4">{table(national.filter((x) => x.horizon === h), `${h}-month horizon`)}</div>
        </SectionCard>
      ))}
      {states.map((s) => (
        <SectionCard key={s} id={`r-${s}`} title={`By state: ${s}`}>
          <div className="p-4">{table(r.rows.filter((x) => x.state === s), s)}</div>
        </SectionCard>
      ))}
      <SectionCard id="r-limits" title="Limitations">
        <Prose>
          <ul>
            {r.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Prose>
      </SectionCard>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab 3: Data sources                                                 */
/* ------------------------------------------------------------------ */

const TYPE_STYLE: Record<DataSourceTypeTag, { icon: typeof Radio; className: string }> = {
  live: { icon: Radio, className: 'border-teal-600 bg-cyan-50 text-[#0b6b6b]' },
  imported_historical: { icon: Database, className: 'border-navy-700 bg-white text-navy-900' },
  delayed: { icon: Hourglass, className: 'border-[#9a6b00] bg-white text-[#6b4a00]' },
  synthetic_demo: { icon: FlaskConical, className: 'border-dashed border-[#9a6b00] bg-[#fff8e1] text-[#6b4a00]' },
}

const STATUS_STYLE: Record<DataSourceHealth, string> = {
  ok: 'text-risk-low',
  degraded: 'text-[#7a3d00]',
  unavailable: 'text-risk-veryhigh',
  not_connected: 'text-ink-muted',
}

export function SourcesTab() {
  const q = useQuery({ queryKey: ['data-sources'], queryFn: getDataSources })
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} className="rounded-xl border bg-surface" />
  if (!q.data) return <ListSkeleton rows={6} className="rounded-xl border bg-surface" />
  return (
    <ul className="grid gap-4 md:gap-6 xl:grid-cols-2" aria-label="Data sources">
      {q.data.items.map((s) => {
        const T = TYPE_STYLE[s.type_tag]
        return (
          <li key={s.id} className="flex flex-col gap-3 rounded-xl border bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-navy-900">{s.name}</h3>
              <span className={cn('inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-semibold', T.className)}>
                <T.icon className="size-3.5" aria-hidden />
                {SOURCE_TYPE_LABELS[s.type_tag]}
              </span>
            </div>
            <p className="text-sm text-ink">{s.description}</p>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-ink-muted">Status</dt>
                <dd className={cn('inline-flex items-center gap-1 font-medium', STATUS_STYLE[s.status])}>
                  <CircleDashed className="size-3.5" aria-hidden />
                  {SOURCE_STATUS_LABELS[s.status]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Last successful update</dt>
                <dd className="font-medium tabular-nums">{s.last_success_at ? formatDateTime(s.last_success_at) : 'Never (not connected)'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Coverage</dt>
                <dd className="font-medium">{s.coverage ? `${formatMonth(s.coverage.from)} – ${formatMonth(s.coverage.to)}` : 'Not known yet'}</dd>
              </div>
            </dl>
            {s.warnings.length > 0 && (
              <ul className="flex flex-col gap-1.5" aria-label={`Warnings for ${s.name}`}>
                {s.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 rounded-lg bg-[#fff4e5] px-2.5 py-1.5 text-sm text-[#7a3d00]">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
