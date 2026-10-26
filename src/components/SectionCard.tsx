import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Plain card with a title row; the building block for page panels. */
export function SectionCard({
  title,
  caption,
  actions,
  footer,
  children,
  className,
  bodyClassName,
  headingLevel: H = 'h2',
  id,
}: {
  title: ReactNode
  caption?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  headingLevel?: 'h2' | 'h3'
  id?: string
}) {
  return (
    <section
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn('flex min-w-0 flex-col rounded-[26px] border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(20,30,45,0.04)] transition-all duration-200 overflow-hidden', className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-slate-200/50 px-5 py-3.5">
        <div className="min-w-0">
          <H id={id ? `${id}-title` : undefined} className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900 tracking-tight">
            {title}
          </H>
          {/* A div, not a <p>: captions may contain block content (avoids invalid <p> nesting). */}
          {caption && <div className="mt-0.5 text-sm text-slate-500">{caption}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('min-w-0 flex-1', bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-slate-200/50 px-5 py-3.5">{footer}</footer>}
    </section>
  )
}
