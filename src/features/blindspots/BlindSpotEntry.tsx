import { AlertTriangle, CheckCircle2, ChevronDown, Flag, History, LineChart, PanelRight, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { READ_ONLY_REASON, ROLE_LABELS, useCanEdit } from '@/app/session'
import { BlindSpotBadge } from '@/components/BlindSpotBadge'
import { ExperimentalNotice } from '@/components/ExperimentalNotice'
import { RiskBadge } from '@/components/RiskBadge'
import { SyntheticTag } from '@/components/SyntheticTag'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { REVIEW_DECISIONS } from '@/config/blindspot'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BlindSpotAssessment, DistrictSummary, ReviewDecision } from '@/types'
import { ReviewDialog } from './ReviewDialog'
import { ScoreBreakdown } from './ScoreBreakdown'

const DECISION_ICON = { acknowledge: CheckCircle2, flag_for_audit: Flag, dismiss: XCircle } as const

export function BlindSpotEntry({
  assessment: a,
  summary,
  rank,
  focused,
  defaultExpanded,
  onOpenPanel,
  onShowTrends,
}: {
  assessment: BlindSpotAssessment
  summary?: DistrictSummary
  rank: number
  focused: boolean
  defaultExpanded: boolean
  onOpenPanel: () => void
  onShowTrends: () => void
}) {
  const canEdit = useCanEdit()
  const [expanded, setExpanded] = useState(defaultExpanded || focused)
  const [decision, setDecision] = useState<ReviewDecision | null>(null)
  const ref = useRef<HTMLElement>(null)
  const latest = a.reviews[a.reviews.length - 1]

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [focused])

  const bodyId = `${a.id}-body`
  return (
    <article
      ref={ref}
      id={a.id}
      aria-labelledby={`${a.id}-title`}
      className={cn(
        'scroll-mt-32 rounded-xl border bg-surface shadow-card',
        a.band === 'flagged' && 'border-l-4 border-l-navy-900',
        focused && 'ring-2 ring-teal-600 ring-offset-2',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-4 pb-2">
        <div className="min-w-0">
          <h3 id={`${a.id}-title`} className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold text-navy-900">
            <span className="text-sm font-medium text-ink-muted tabular-nums">#{rank}</span>
            {a.district.name}
            <span className="text-sm font-normal text-ink-muted">{a.district.state}</span>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <BlindSpotBadge band={a.band} score={a.score} showChip={false} />
            {a.band === 'none' && <span className="text-sm text-ink-muted tabular-nums">No blind-spot signal · score {a.score}</span>}
            {summary?.forecast && <RiskBadge size="md" category={summary.forecast.category} probability={summary.forecast.probability} />}
            {latest && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-sm font-medium text-ink">
                {(() => {
                  const Icon = DECISION_ICON[latest.decision]
                  return <Icon className="size-4" aria-hidden />
                })()}
                {REVIEW_DECISIONS[latest.decision].past}
              </span>
            )}
            <SyntheticTag source={a.source} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onShowTrends} className="text-teal-600">
            <LineChart aria-hidden /> Trends
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenPanel} className="text-teal-600">
            <PanelRight aria-hidden /> District
          </Button>
        </div>
      </header>

      <div className="px-4">
        <ExperimentalNotice />
      </div>

      {expanded ? (
        <div id={bodyId} className="grid gap-x-6 gap-y-4 p-4 lg:grid-cols-2">
          <section aria-label="Score breakdown">
            <h4 className="mb-1 text-sm font-semibold text-navy-900">Breakdown of the five parts</h4>
            <ScoreBreakdown components={a.components} score={a.score} />
          </section>
          <div className="flex flex-col gap-4">
            <section aria-label="Evidence">
              <h4 className="mb-1 text-sm font-semibold text-navy-900">Evidence behind the alert</h4>
              {a.evidence.length ? (
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
                  {a.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No part of the score is strongly raised.</p>
              )}
            </section>
            <section aria-label="Data-quality warnings">
              <h4 className="mb-1 text-sm font-semibold text-navy-900">Data quality</h4>
              {a.data_quality_warnings.length ? (
                <ul className="flex flex-col gap-1.5">
                  {a.data_quality_warnings.map((w) => (
                    <li key={w} className="flex items-start gap-2 rounded-lg bg-[#fff4e5] px-2.5 py-1.5 text-sm text-[#7a3d00]">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No data-quality warnings for the months used.</p>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-2">
          <Button variant="link" size="sm" className="h-auto px-0 text-teal-600" aria-expanded={false} onClick={() => setExpanded(true)}>
            <ChevronDown aria-hidden /> Show breakdown and evidence
          </Button>
        </div>
      )}

      <footer className="flex flex-col gap-3 border-t p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-ink-muted">Review:</span>
          {(Object.keys(REVIEW_DECISIONS) as ReviewDecision[]).map((k) => {
            const Icon = DECISION_ICON[k]
            const button = (
              <Button key={k} variant="outline" size="sm" disabled={!canEdit} onClick={() => setDecision(k)} tabIndex={canEdit ? undefined : -1}>
                <Icon aria-hidden /> {REVIEW_DECISIONS[k].label}
              </Button>
            )
            if (canEdit) return button
            return (
              <Tooltip key={k}>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex rounded-lg" aria-label={`${REVIEW_DECISIONS[k].label} unavailable. ${READ_ONLY_REASON}`}>
                    {button}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{READ_ONLY_REASON}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        {a.reviews.length > 0 && (
          <ol className="flex flex-col gap-1" aria-label={`Review history for ${a.district.name}`}>
            {[...a.reviews].reverse().map((r) => (
              <li key={r.id} className="flex items-start gap-1.5 text-xs text-ink-muted">
                <History className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium text-ink">{REVIEW_DECISIONS[r.decision].past}</span> · {r.reviewer_name} ({ROLE_LABELS[r.reviewer_role]}) ·{' '}
                  <span className="tabular-nums">{formatDateTime(r.created_at)}</span>
                  {r.reason && <> — “{r.reason}”</>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </footer>

      <ReviewDialog assessment={a} decision={decision} onClose={() => setDecision(null)} />
    </article>
  )
}
