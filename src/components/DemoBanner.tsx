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
      className="flex min-h-7 items-center justify-center gap-1.5 border-b border-[#e8d9a8] bg-[#fff8e1] px-4 py-1 text-center text-xs font-medium text-[#5c4300] print:hidden"
    >
      <FlaskConical className="size-3.5 shrink-0" aria-hidden />
      {t('app.demoBanner')}
    </div>
  )
}
