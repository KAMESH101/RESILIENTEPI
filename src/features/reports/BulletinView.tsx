import type { ReactNode } from 'react'
import { LogoMark } from '@/app/layout/Logo'
import { RISK_STYLE } from '@/components/riskStyle'
import { BULLETIN_DISCLAIMER_EN, BULLETIN_REVIEWED, BULLETIN_STRINGS, bulletinDateTime, bulletinMonth } from '@/i18n/bulletin'
import { formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Bulletin } from '@/types'

/**
 * Printable bulletin. A table frame makes the browser repeat the header
 * (with the generation date) and the footer (with the disclaimer) on every
 * printed A4 page. All facts come from `b`; only labels come from templates.
 */
export function BulletinView({ b }: { b: Bulletin }) {
  const t = BULLETIN_STRINGS[b.language]
  const pending = !BULLETIN_REVIEWED[b.language]
  const month = bulletinMonth(b.target_month, b.language)
  const high = b.risk_counts.filter((r) => r.category === 'high' || r.category === 'very_high').reduce((a, r) => a + r.count, 0)
  const flagged = b.blind_spots.filter((x) => x.band === 'flagged').length
  const pct = (p: number) => `${Math.round(p * 100)}%`

  return (
    <article lang={b.language} className="bulletin rounded-xl border bg-white text-ink shadow-card print:rounded-none print:border-0 print:shadow-none" aria-label={t.title(b.scope_label)}>
      {/* table-fixed: the single column stays at 100% width; wide inner tables scroll instead of widening the page. */}
      <table className="bulletin-frame w-full table-fixed border-collapse">
        <thead>
          <tr>
            <td className="px-4 pt-5 pb-3 sm:px-6 sm:pt-6 print:px-0 print:pt-0">
              <div className="flex flex-col gap-3 border-b-2 border-navy-900 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 print:flex-row print:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <LogoMark className="size-9" />
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-[#1a73e8] uppercase">ResilientEpi · {t.scopeKind[b.scope]}</p>
                    <h2 className="text-xl font-semibold text-ink">{t.title(b.scope_label)}</h2>
                    <p className="text-sm text-ink-muted">{t.horizonLine(month, b.horizon)}</p>
                  </div>
                </div>
                <div className="min-w-0 text-xs text-ink-muted sm:max-w-[45%] sm:text-right print:max-w-[45%] print:text-right">
                  <p>
                    {t.generated}: <span className="font-medium text-ink tabular-nums">{bulletinDateTime(b.generated_at, b.language)}</span>
                  </p>
                  <p>
                    {t.dataUpTo}: <span className="font-medium text-ink">{bulletinMonth(b.as_of, b.language)}</span>
                  </p>
                  <p className="mt-1 inline-block rounded border border-dashed border-[#9a6b00] bg-[#fff8e1] px-1.5 text-[#6b4a00]">{t.synthetic}</p>
                  {pending && (
                    <p className="mt-1 inline-block rounded border border-navy-900 px-1.5 font-semibold text-navy-900" data-testid="translation-pending">
                      {t.translationPending} · Translation pending review
                    </p>
                  )}
                </div>
              </div>
            </td>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td className="px-4 pt-3 pb-5 sm:px-6 sm:pb-6 print:px-0 print:pb-0">
              <div className="bulletin-footer border-t pt-2 text-xs text-ink-muted" data-testid="bulletin-footer">
                <p className="font-semibold text-ink">{BULLETIN_DISCLAIMER_EN}</p>
                {b.language !== 'en' && <p>{t.disclaimer}</p>}
                <p>
                  {t.synthetic} · ResilientEpi · {bulletinDateTime(b.generated_at, b.language)}
                </p>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td className="flex min-w-0 flex-col gap-5 px-4 py-2 sm:px-6 print:block print:px-0">
              <Section title={t.sections.summary}>
                <p className="text-base">{t.summary({ high, total: b.districts_covered, month })}</p>
                {flagged > 0 && <p className="mt-1">{t.summaryBlindSpots(flagged)}</p>}
                <p className="mt-2 text-sm text-ink-muted">{t.humanReview}</p>
              </Section>

              <Section title={t.sections.risk}>
                <table className="w-full max-w-md text-sm">
                  <thead>
                    <tr className="border-b text-left text-ink-muted">
                      <th className="py-1 font-medium">{t.col.category}</th>
                      <th className="py-1 text-right font-medium">{t.col.count}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.risk_counts.map((r) => (
                      <tr key={r.category} className="border-b last:border-b-0">
                        <td className="py-1">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={cn('inline-block size-3 rounded-sm print-exact', r.category === 'no_data' && 'pattern-nodata border border-slate-300')}
                              style={r.category === 'no_data' ? undefined : { background: RISK_STYLE[r.category].fill }}
                              aria-hidden
                            />
                            {t.categories[r.category]}
                          </span>
                        </td>
                        <td className="py-1 text-right font-semibold tabular-nums">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              {b.top_risk.length > 0 && (
                <Section title={t.sections.topRisk}>
                  <DataRows
                    head={[t.col.district, t.col.state, t.col.category, t.col.probability, t.col.expected]}
                    rows={b.top_risk.map((r) => [r.district.name, r.district.state, t.categories[r.category], pct(r.probability), formatInt(r.expected_cases)])}
                    numeric={[3, 4]}
                  />
                </Section>
              )}

              <Section title={t.sections.blindSpots}>
                <p className="mb-2 text-sm font-medium text-navy-900">{t.experimental}</p>
                {b.blind_spots.length ? (
                  <DataRows
                    head={[t.col.district, t.col.state, t.col.score, t.col.band, t.col.review]}
                    rows={b.blind_spots.map((x) => [x.district.name, x.district.state, `${x.score} / 100`, t.band[x.band], t.review[x.latest_review ?? 'none']])}
                    numeric={[2]}
                  />
                ) : (
                  <p className="text-sm">{t.noBlindSpots}</p>
                )}
              </Section>

              <Section title={t.sections.factors}>
                {b.key_factors.length ? (
                  <ul className="list-disc pl-5 text-sm">
                    {b.key_factors.map((f) => (
                      <li key={`${f.factor}-${f.direction}`}>{t.factorLine(t.factor[f.factor], t.direction[f.direction], f.districts)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">{t.noFactors}</p>
                )}
              </Section>

              <Section title={t.sections.actions}>
                {b.actions.length ? (
                  <DataRows
                    head={[t.col.priority, t.col.district, t.col.action, t.col.status]}
                    rows={b.actions.map((a) => [
                      a.priority.toUpperCase(),
                      a.district.name,
                      a.action_key === 'manual' ? `${a.action_text} ${t.manualNote}` : t.actions[a.action_key],
                      t.status[a.status],
                    ])}
                  />
                ) : (
                  <p className="text-sm">{t.noActions}</p>
                )}
              </Section>

              <Section title={t.sections.limitations}>
                <ul className="list-disc pl-5 text-sm">
                  {b.limitations.map((l) => (
                    <li key={l.key}>{t.limitations[l.key](l.count ?? 0)}</li>
                  ))}
                </ul>
              </Section>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bulletin-section">
      <h3 className="mb-1.5 border-b pb-1 text-base font-semibold text-navy-900">{title}</h3>
      {children}
    </section>
  )
}

function DataRows({ head, rows, numeric = [] }: { head: string[]; rows: (string | number)[][]; numeric?: number[] }) {
  // On narrow screens the table scrolls inside its own box instead of widening the page.
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[32rem] text-sm print:min-w-0">
        <thead>
          <tr className="border-b text-left text-ink-muted">
            {head.map((h, i) => (
              <th key={h} className={cn('py-1 pr-3 font-medium', numeric.includes(i) && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b align-top last:border-b-0">
              {r.map((c, j) => (
                <td key={j} className={cn('py-1 pr-3', numeric.includes(j) && 'text-right tabular-nums')}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
