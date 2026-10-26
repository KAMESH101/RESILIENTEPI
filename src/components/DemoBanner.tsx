import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isDemoMode } from '@/services/api'

/** Thin persistent banner shown on every page in mock mode. */
export function DemoBanner() {
  const { t } = useTranslation()
  if (!isDemoMode) return null
  return (
    <div
      role="note"
      className="mb-2 flex min-h-7 items-center justify-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/85 backdrop-blur-md px-4 py-1 text-center text-xs font-medium text-amber-900 shadow-2xs print:hidden"
    >
      <FlaskConical className="size-3.5 shrink-0 text-amber-700" aria-hidden />
      {t('app.demoBanner')}
    </div>
  )
}
