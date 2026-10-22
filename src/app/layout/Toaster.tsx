import { CheckCircle2, FlaskConical, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToasts, type ToastVariant } from '../toast'

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  demo: FlaskConical,
  error: XCircle,
  info: Info,
}

const TONES: Record<ToastVariant, string> = {
  success: 'border-l-risk-low',
  demo: 'border-l-[#9a6b00]',
  error: 'border-l-risk-veryhigh',
  info: 'border-l-teal-600',
}

/** Toasts are announced through an aria-live region. */
export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:top-auto md:right-6 md:bottom-6 md:items-end print:hidden"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.variant]
        return (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-l-4 bg-surface p-3 shadow-lg', TONES[t.variant])}
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-navy-900" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-ink-muted hover:text-ink" aria-label="Dismiss notification">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
