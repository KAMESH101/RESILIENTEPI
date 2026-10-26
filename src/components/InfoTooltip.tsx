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
          'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-[#e8f0fe] hover:text-[#1a73e8]',
          className,
        )}
        aria-label={`What is ${g.term.toLowerCase()}?`}
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl border border-border bg-surface p-4 text-sm shadow-[0_4px_16px_rgba(60,64,67,0.16)]" side="top">
        <p className="font-semibold text-ink">{g.term}</p>
        <p className="mt-1 text-ink-muted">{g.definition}</p>
        {extra && <p className="mt-2 text-ink-muted">{extra}</p>}
      </PopoverContent>
    </Popover>
  )
}
