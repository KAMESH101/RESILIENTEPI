import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Printer } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useRunInfo } from '@/app/useRunInfo'
import { toast } from '@/app/toast'
import { DistrictSearch } from '@/components/DistrictSearch'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { FilterBar } from '@/components/FilterBar'
import { SectionCard } from '@/components/SectionCard'
import { BlockSkeleton } from '@/components/Skeletons'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BulletinView } from '@/features/reports/BulletinView'
import { bulletinCsv, districtsCsv, saveCsv, tasksCsv } from '@/features/reports/exports'
import { BULLETIN_LANGUAGES, BULLETIN_REVIEWED } from '@/i18n/bulletin'
import { generateReport, getRiskMap, listActions, listDistricts } from '@/services/endpoints'
import type { GenerateReportRequest, Language } from '@/types'
import { generateReportSchema } from '@/types'

type Scope = GenerateReportRequest['scope']
const SCOPES: { value: Scope; label: string }[] = [
  { value: 'district', label: 'District' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
]

export default function Reports() {
  const { t } = useTranslation()
  const { horizon, params, setParam } = useFilters()
  const run = useRunInfo()
  const qc = useQueryClient()
  const districts = useQuery({ queryKey: ['districts', 'all'], queryFn: () => listDistricts(), staleTime: Infinity })

  // The URL holds the request, so a bulletin link (or the demo tour) regenerates it.
  const scope = (params.get('scope') as Scope | null) ?? 'district'
  const target = params.get('target')
  const lang = (params.get('lang') as Language | null) ?? null
  const request = generateReportSchema.safeParse({
    scope,
    district_id: scope === 'district' ? (target ?? undefined) : undefined,
    state: scope === 'state' ? (target ?? undefined) : undefined,
    language: lang ?? undefined,
    horizon,
  })
  const ready = request.success

  const [formError, setFormError] = useState<string | null>(null)
  const bulletin = useQuery({
    queryKey: ['bulletin', scope, target, lang, horizon],
    queryFn: () => generateReport(request.data!),
    enabled: ready,
    staleTime: 0,
  })
  const b = bulletin.data

  const districtName = districts.data?.districts.find((d) => d.id === target)?.name
  const [formLang, setFormLang] = useState<Language>(lang ?? 'en')

  const generate = () => {
    const next = generateReportSchema.safeParse({
      scope,
      district_id: scope === 'district' ? (target ?? undefined) : undefined,
      state: scope === 'state' ? (target ?? undefined) : undefined,
      language: formLang,
      horizon,
    })
    if (!next.success) {
      setFormError(next.error.issues[0]?.message ?? 'Check the form')
      return
    }
    setFormError(null)
    setParam({ lang: formLang })
    void qc.invalidateQueries({ queryKey: ['bulletin'] })
  }

  const exportAllDistricts = async () => {
    const data = await qc.fetchQuery({ queryKey: ['risk-map', horizon], queryFn: () => getRiskMap(horizon) })
    saveCsv(`districts-h${horizon}-${data.as_of}`, districtsCsv(data.districts))
    toast({ variant: 'success', title: 'CSV downloaded', description: `${data.districts.length} districts, ${horizon}-month horizon.` })
  }
  const exportTasks = async () => {
    const data = await qc.fetchQuery({ queryKey: ['actions', null], queryFn: () => listActions({}) })
    saveCsv('tasks', tasksCsv(data.items))
    toast({ variant: 'success', title: 'CSV downloaded', description: `${data.items.length} Action Centre tasks.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 print:hidden">
        <PageHeader title={t('pages.reports.title')} purpose={t('pages.reports.purpose')} lastRunAt={run.lastRunAt} asOf={run.asOf} filters={<FilterBar showState={false} />} />

        <SectionCard id="bulletin-form" title={t('reports.generate')} caption="Bulletins use the same data as the rest of the app. Only fixed labels are translated.">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-4 p-4">
            <div className="flex flex-col gap-1">
              <span id="scope-label" className="text-xs font-medium text-ink-muted">
                Bulletin for
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                value={scope}
                onValueChange={(v) => v && setParam({ scope: v, target: null })}
                aria-labelledby="scope-label"
                className="bg-surface"
              >
                {SCOPES.map((s) => (
                  <ToggleGroupItem key={s.value} value={s.value} className="h-9 px-3 data-[state=on]:bg-navy-900 data-[state=on]:text-white">
                    {s.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {scope === 'district' && (
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-ink-muted">District</span>
                {target && districtName ? (
                  <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted px-3 text-sm">
                    <span className="font-medium">{districtName}</span>
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setParam({ target: null })}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <DistrictSearch className="w-60 max-w-full" label="Bulletin district" placeholder="Choose a district…" onSelect={(d) => setParam({ target: d.id })} />
                )}
              </div>
            )}
            {scope === 'state' && (
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="bulletin-state" className="text-xs font-medium text-ink-muted">
                  State
                </label>
                <Select value={target ?? ''} onValueChange={(v) => setParam({ target: v })}>
                  <SelectTrigger id="bulletin-state" className="h-9 w-56 max-w-full bg-surface">
                    <SelectValue placeholder="Choose a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {(districts.data?.states ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="bulletin-lang" className="text-xs font-medium text-ink-muted">
                Language
              </Label>
              <Select value={formLang} onValueChange={(v) => setFormLang(v as Language)}>
                <SelectTrigger id="bulletin-lang" className="h-9 w-48 max-w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BULLETIN_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code} lang={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generate}>
              <FileText aria-hidden /> Generate bulletin
            </Button>
          </div>
          {formError && (
            <p role="alert" className="px-4 pb-4 text-sm text-risk-veryhigh">
              {formError}
            </p>
          )}
          {formLang !== 'en' && !BULLETIN_REVIEWED[formLang] && (
            <p className="px-4 pb-4 text-xs text-ink-muted">Hindi and Tamil labels are drafts marked “Translation pending review” until a fluent reader checks them.</p>
          )}
        </SectionCard>

        <SectionCard id="exports" title={t('reports.exports')} caption="All exports are UTF-8 CSV with a source column (synthetic / live). This page is the single place for exports.">
          <div className="flex flex-wrap gap-2 p-4">
            <Button variant="outline" disabled={!b} onClick={() => b && saveCsv(`bulletin-${b.scope}-${b.scope_label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${b.language}-${b.as_of}`, bulletinCsv(b))}>
              <Download aria-hidden /> Bulletin data (CSV)
            </Button>
            <Button variant="outline" onClick={() => void exportAllDistricts()}>
              <Download aria-hidden /> All districts, {horizon}-month horizon (CSV)
            </Button>
            <Button variant="outline" onClick={() => void exportTasks()}>
              <Download aria-hidden /> Action Centre tasks (CSV)
            </Button>
          </div>
        </SectionCard>
      </div>

      <section aria-label="Bulletin preview" className="flex flex-col gap-3">
        {b && (
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <h2 className="text-xl font-semibold text-ink">{t('reports.preview')}</h2>
            <Button onClick={() => window.print()}>
              <Printer aria-hidden /> Print / Save as PDF
            </Button>
          </div>
        )}
        {!ready ? (
          <div className="rounded-xl border bg-surface shadow-card print:hidden">
            <EmptyState
              icon={FileText}
              title="No bulletin yet"
              description="Choose who the bulletin is for and a language, then select “Generate bulletin”."
              action={
                <Button variant="outline" onClick={() => setParam({ scope: 'national', target: null, lang: formLang })}>
                  Generate a national bulletin
                </Button>
              }
            />
          </div>
        ) : bulletin.isError ? (
          <div className="rounded-xl border bg-surface shadow-card">
            <ErrorState error={bulletin.error} onRetry={() => void bulletin.refetch()} />
          </div>
        ) : !b ? (
          <BlockSkeleton className="h-[640px]" />
        ) : (
          <BulletinView b={b} />
        )}
        {b && <p className="text-xs text-ink-muted print:hidden">Print uses A4. In the print dialog choose “Save as PDF” to keep a copy.</p>}
      </section>
    </div>
  )
}
