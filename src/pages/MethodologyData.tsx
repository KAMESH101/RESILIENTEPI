import { useTranslation } from 'react-i18next'
import { useFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useRunInfo } from '@/app/useRunInfo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MethodTab, ResultsTab, SourcesTab } from '@/features/methodology/tabs'

const TABS = ['method', 'results', 'sources'] as const
type Tab = (typeof TABS)[number]
/** The default active tab is white on light grey; make the current one unmistakable. */
const TAB = 'text-ink-muted data-active:font-semibold data-active:text-navy-900 data-active:shadow-sm data-active:ring-1 data-active:ring-slate-300'

/** One page, three tabs; the active tab lives in the URL (?tab=). */
export default function MethodologyData() {
  const { t } = useTranslation()
  const { params, setParam } = useFilters()
  const run = useRunInfo()
  const tabParam = params.get('tab')
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'method'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('pages.methodology.title')} purpose={t('pages.methodology.purpose')} lastRunAt={run.lastRunAt} asOf={run.asOf} />
      <Tabs value={tab} onValueChange={(v) => setParam({ tab: v === 'method' ? null : v })} className="flex flex-col gap-4">
        <TabsList className="w-full max-w-xl sm:w-fit">
          <TabsTrigger value="method" className={TAB}>{t('methodology.method')}</TabsTrigger>
          <TabsTrigger value="results" className={TAB}>{t('methodology.results')}</TabsTrigger>
          <TabsTrigger value="sources" className={TAB}>{t('methodology.sources')}</TabsTrigger>
        </TabsList>
        <TabsContent value="method">
          <MethodTab />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab />
        </TabsContent>
        <TabsContent value="sources">
          <SourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
