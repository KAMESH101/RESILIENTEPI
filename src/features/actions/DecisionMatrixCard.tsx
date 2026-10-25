import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DECISION_MATRIX, MATRIX_COLUMNS, MATRIX_ROWS, TEAM_LABELS } from '@/config/actions'
import { BLIND_SPOT_THRESHOLD_NOTE } from '@/config/blindspot'
import type { ActionTask, DecisionQuadrant } from '@/types'
import { PriorityPill } from './PriorityPill'

const CELLS: Record<'high' | 'low', Record<'bs' | 'none', DecisionQuadrant>> = {
  high: { bs: 'high_risk_blind_spot', none: 'high_risk_no_blind_spot' },
  low: { bs: 'low_risk_blind_spot', none: 'low_risk_no_blind_spot' },
}

/** How recommendations are generated, with the count of open matrix tasks per cell. */
export function DecisionMatrixCard({ tasks }: { tasks: ActionTask[] }) {
  const { t } = useTranslation()
  const open = (q: DecisionQuadrant) => tasks.filter((x) => x.origin === 'decision_matrix' && x.quadrant === q && x.status !== 'completed').length
  return (
    <details className="group rounded-2xl border border-border bg-surface shadow-card" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
        <span>
          <h2 className="text-base font-semibold text-ink">{t('actions.matrix')}</h2>
          <span className="block text-sm text-ink-muted">How each district’s recommendation and priority are chosen.</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-ink-muted transition-transform duration-150 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-border p-4 sm:p-5">
        <table className="w-full table-fixed border-separate border-spacing-2 text-sm max-md:block">
          <caption className="sr-only">Decision matrix: risk by blind-spot status</caption>
          <thead className="max-md:hidden">
            <tr>
              <td className="w-28" />
              {MATRIX_COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="text-left font-semibold text-ink">
                  {c.label}
                  <span className="block text-xs font-normal text-ink-muted">{c.hint}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-md:flex max-md:flex-col max-md:gap-2">
            {MATRIX_ROWS.map((r) => (
              <tr key={r.key} className="max-md:flex max-md:flex-col max-md:gap-2">
                <th scope="row" className="text-left align-top font-semibold text-ink">
                  {r.label}
                  <span className="block text-xs font-normal text-ink-muted">{r.hint}</span>
                </th>
                {MATRIX_COLUMNS.map((c) => {
                  const q = CELLS[r.key][c.key]
                  const rule = DECISION_MATRIX[q]
                  const n = open(q)
                  return (
                    <td key={c.key} className="rounded-xl border border-border bg-[#f8fafd] p-3 align-top transition-colors hover:border-[#1a73e8]/30 hover:bg-[#e8f0fe]/50">
                      <span className="mb-1 block text-xs font-medium text-ink-muted md:hidden">
                        {r.label} · {c.label}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <PriorityPill priority={rule.priority} />
                        <span className="text-xs text-ink-muted tabular-nums">
                          {q === 'low_risk_no_blind_spot' ? 'No task created' : `${n} open`}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-ink">{rule.action}</span>
                      <span className="mt-1 block text-xs text-ink-muted">{TEAM_LABELS[rule.team]}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-muted">
          <li>Watch band (score 35–49) counts as no blind spot, and adds a P3 task to verify data completeness.</li>
          <li>Dismissed on the Blind-Spot page → treated as no blind spot; the task notes who dismissed it and when.</li>
          <li>Flag for audit on the Blind-Spot page → creates one audit task for that district.</li>
          <li>Risk uses the highest forecast across the 1–3 month horizons. {BLIND_SPOT_THRESHOLD_NOTE}</li>
        </ul>
      </div>
    </details>
  )
}
