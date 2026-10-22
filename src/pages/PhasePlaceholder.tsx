import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { withFilters } from '@/app/filters'
import { PageHeader } from '@/app/layout/PageHeader'
import { useRunInfo } from '@/app/useRunInfo'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

/** Temporary page for sections built in later phases — always offers a next step. */
export function PhasePlaceholder({ pageKey, phase, note }: { pageKey: string; phase: number; note: string }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const run = useRunInfo()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t(`pages.${pageKey}.title`)} purpose={t(`pages.${pageKey}.purpose`)} lastRunAt={run.lastRunAt} asOf={run.asOf} />
      <div className="rounded-xl border bg-surface shadow-card">
        <EmptyState
          icon={Construction}
          title={`This page is built in Phase ${phase}`}
          description={note}
          action={
            <Button asChild>
              <Link to={withFilters('/', params)}>Back to Overview</Link>
            </Button>
          }
        />
      </div>
    </div>
  )
}
