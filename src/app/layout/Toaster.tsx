import { CheckCircle2, FlaskConical, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToasts, type ToastVariant } from '../toast'

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  demo: FlaskConical,
  error: XCircle,
  info: Info,
}

const ICON_TONES: Record<ToastVariant, string> = {
  success: 'text-[#1e8e3e]',
  demo: 'text-[#f9ab00]',
  error: 'text-[#d93025]',
  info: 'text-[#1a73e8]',
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
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-[0_4px_20px_rgba(60,64,67,0.18)] transition-all"
          >
            <Icon className={cn('mt-0.5 size-5 shrink-0', ICON_TONES[t.variant])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="rounded-full p-1 text-ink-muted hover:bg-[#f1f3f4] hover:text-ink transition-colors" aria-label="Dismiss notification">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
