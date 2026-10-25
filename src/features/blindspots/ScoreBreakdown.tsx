import { BLIND_SPOT_COMPONENT_LABELS, BLIND_SPOT_COMPONENT_SIGNALS } from '@/config/blindspot'
import type { BlindSpotComponent } from '@/types'

/**
 * The five parts of the score: each bar is that part's points out of its
 * maximum (its weight). Hatched, because the indicator is experimental.
 */
export function ScoreBreakdown({ components, score }: { components: BlindSpotComponent[]; score: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <table className="w-full text-sm">
        <caption className="sr-only">Blind-spot score breakdown, total {score} of 100</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Part</th>
            <th scope="col">Weight</th>
            <th scope="col">Points</th>
          </tr>
        </thead>
        <tbody>
          {components.map((c) => {
            const max = Math.round(c.weight * 100)
            return (
              <tr key={c.key} className="align-top">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                  <span className="block font-medium text-ink">{BLIND_SPOT_COMPONENT_LABELS[c.key]}</span>
                  <span className="block text-xs text-ink-muted">{BLIND_SPOT_COMPONENT_SIGNALS[c.key]}</span>
                  <span className="mt-1 flex items-center gap-2" aria-hidden>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="pattern-hatch block h-full border-r border-navy-900" style={{ width: `${max ? (c.contribution / max) * 100 : 0}%` }} />
                    </span>
                  </span>
                </th>
                <td className="w-16 py-1.5 text-right text-xs whitespace-nowrap text-ink-muted tabular-nums">{max}% weight</td>
                <td className="w-16 py-1.5 text-right font-semibold whitespace-nowrap tabular-nums">
                  {c.contribution} <span className="font-normal text-ink-muted">/ {max}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t">
            <th scope="row" className="pt-2 text-left font-semibold text-navy-900">
              Score
            </th>
            <td />
            <td className="pt-2 text-right font-semibold text-navy-900 tabular-nums">
              {score} <span className="font-normal text-ink-muted">/ 100</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
