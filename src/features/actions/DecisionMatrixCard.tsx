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
    <details className="group rounded-[26px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131418] shadow-[0_4px_24px_rgba(20,30,45,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-200 overflow-hidden" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
        <span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{t('actions.matrix')}</h2>
          <span className="block text-sm text-slate-500 dark:text-slate-400">How each district’s recommendation and priority are chosen.</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-slate-200/50 dark:border-white/10 p-4 sm:p-5">
        <table className="w-full table-fixed border-separate border-spacing-2 text-sm max-md:block">
          <caption className="sr-only">Decision matrix: risk by blind-spot status</caption>
          <thead className="max-md:hidden">
            <tr>
              <td className="w-28" />
              {MATRIX_COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="text-left font-semibold text-slate-800 dark:text-white">
                  {c.label}
                  <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">{c.hint}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-md:flex max-md:flex-col max-md:gap-2">
            {MATRIX_ROWS.map((r) => (
              <tr key={r.key} className="max-md:flex max-md:flex-col max-md:gap-2">
                <th scope="row" className="text-left align-top font-semibold text-slate-800 dark:text-white">
                  {r.label}
                  <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">{r.hint}</span>
                </th>
                {MATRIX_COLUMNS.map((c) => {
                  const q = CELLS[r.key][c.key]
                  const rule = DECISION_MATRIX[q]
                  const n = open(q)
                  return (
                    <td key={c.key} className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-3.5 align-top transition-all hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-2xs">
                      <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 md:hidden">
                        {r.label} · {c.label}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <PriorityPill priority={rule.priority} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {q === 'low_risk_no_blind_spot' ? 'No task created' : `${n} open`}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-slate-800 dark:text-white">{rule.action}</span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{TEAM_LABELS[rule.team]}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Watch band (score 35–49) counts as no blind spot, and adds a P3 task to verify data completeness.</li>
          <li>Dismissed on the Blind-Spot page → treated as no blind spot; the task notes who dismissed it and when.</li>
          <li>Flag for audit on the Blind-Spot page → creates one audit task for that district.</li>
          <li>Risk uses the highest forecast across the 1–3 month horizons. {BLIND_SPOT_THRESHOLD_NOTE}</li>
        </ul>
      </div>
    </details>
  )
}
