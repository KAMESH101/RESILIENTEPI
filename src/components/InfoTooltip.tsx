import { Info } from 'lucide-react'
import { GLOSSARY, type GlossaryKey } from '@/config/glossary'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

/**
 * Plain-language glossary definition behind an (i) button. Uses a popover rather
 * than a hover tooltip so it works on touch and with the keyboard.
 */
export function InfoTooltip({ term, className, extra }: { term: GlossaryKey; className?: string; extra?: string }) {
  const g = GLOSSARY[term]
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-muted hover:text-navy-900',
          className,
        )}
        aria-label={`What is ${g.term.toLowerCase()}?`}
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm" side="top">
        <p className="font-semibold text-navy-900">{g.term}</p>
        <p className="mt-1 text-ink-muted">{g.definition}</p>
        {extra && <p className="mt-2 text-ink-muted">{extra}</p>}
      </PopoverContent>
    </Popover>
  )
}
