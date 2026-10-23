import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { TOUR_STEPS } from '@/config/tour'
import { cn } from '@/lib/utils'
import { useSession } from '../session'

/** Dismissible 5-step side card. "Go" navigates and applies the step's filters. */
export function DemoTour() {
  const navigate = useNavigate()
  const { tourOpen, tourStep, closeTour, setTourStep } = useSession()
  if (!tourOpen) return null
  const step = TOUR_STEPS[tourStep] ?? TOUR_STEPS[0]!
  const last = tourStep === TOUR_STEPS.length - 1

  return (
    <aside
      aria-label="Demo tour"
      // Above the district panel's overlay (z-50) and clickable while it is open, so a
      // presenter can press Next without closing the panel first (the click closes it).
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[60] rounded-xl border bg-surface p-4 shadow-xl md:inset-x-auto md:right-6 md:bottom-6 md:w-80 print:hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-teal-600 uppercase">
          <Compass className="size-4" aria-hidden />
          Demo tour · Step {tourStep + 1} of {TOUR_STEPS.length}
        </p>
        <Button variant="ghost" size="icon-sm" onClick={closeTour} aria-label="Close demo tour">
          <X aria-hidden />
        </Button>
      </div>
      <h2 className="mt-1 text-base font-semibold text-navy-900">{step.title}</h2>
      <p className="mt-1 text-sm text-ink">{step.text}</p>
      <ol className="mt-3 flex gap-1" aria-hidden>
        {TOUR_STEPS.map((s, i) => (
          <li key={s.title} className={cn('h-1 flex-1 rounded-full', i <= tourStep ? 'bg-teal-600' : 'bg-border')} />
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTourStep(tourStep - 1)} disabled={tourStep === 0} aria-label="Previous step">
          <ArrowLeft aria-hidden />
        </Button>
        <Button className="flex-1" onClick={() => void navigate(step.to)}>
          Go
        </Button>
        <Button
          variant="outline"
          onClick={() => (last ? closeTour() : setTourStep(tourStep + 1))}
          className="gap-1"
        >
          {last ? 'Finish' : 'Next'}
          {!last && <ArrowRight aria-hidden />}
        </Button>
      </div>
    </aside>
  )
}
