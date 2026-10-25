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
      className="flex min-h-7 items-center justify-center gap-2 border-b border-[#f9ab00]/30 bg-[#fef7e0] px-4 py-1 text-center text-xs font-medium text-[#7a4100] print:hidden"
    >
      <FlaskConical className="size-3.5 shrink-0 text-[#b06000]" aria-hidden />
      {t('app.demoBanner')}
    </div>
  )
}
