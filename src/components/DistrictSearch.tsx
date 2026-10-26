import { useQuery } from '@tanstack/react-query'
import { MapPin, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { listDistricts } from '@/services/endpoints'
import { cn } from '@/lib/utils'
import type { DistrictRef } from '@/types'

/**
 * The one district search used everywhere (top bar, map, filters, pickers).
 * Accessible combobox: arrow keys move, Enter selects, Escape closes.
 * With `shortcut`, pressing "/" anywhere focuses it.
 */
export function DistrictSearch({
  onSelect,
  placeholder = 'Search district…',
  shortcut = false,
  autoFocus = false,
  className,
  inputClassName,
  label = 'Search district',
}: {
  onSelect: (d: DistrictRef) => void
  placeholder?: string
  shortcut?: boolean
  autoFocus?: boolean
  className?: string
  inputClassName?: string
  label?: string
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const { data, isLoading } = useQuery({ queryKey: ['districts', 'all'], queryFn: () => listDistricts(), staleTime: Infinity })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = data?.districts ?? []
    if (!q) return all.slice(0, 8)
    return all
      .filter((d) => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q))
      .sort((a, b) => Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q)))
      .slice(0, 8)
  }, [data, query])

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      const el = inputRef.current
      if (!el || el.offsetParent === null) return
      e.preventDefault()
      el.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shortcut])

  const choose = (d: DistrictRef) => {
    onSelect(d)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const listId = `${id}-list`
  const showList = open && (results.length > 0 || query.trim().length > 0)

  return (
    <div className={cn('relative min-w-0', className)}>
      <label htmlFor={`${id}-input`} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        // Suggestions appear once the user types or presses ↓, so focus alone never covers the page.
        onFocus={() => setOpen(query.trim().length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((a) => Math.min(a + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter') {
            const d = results[active]
            if (showList && d) {
              e.preventDefault()
              choose(d)
            }
          } else if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
        className={cn(
          'h-9.5 w-full rounded-full border border-white/80 bg-white/60 backdrop-blur-md pr-3 pl-9 text-sm text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all duration-150 hover:bg-white/80 hover:border-slate-300/70 focus:bg-white focus:border-blue-500/80 focus:shadow-[0_4px_20px_rgba(37,99,235,0.08)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500',
          inputClassName,
        )}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching districts"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-80 overflow-auto rounded-2xl border border-white/80 bg-white/92 backdrop-blur-2xl p-1.5 shadow-[0_12px_36px_rgba(20,32,50,0.12)]"
        >
          {isLoading && <li className="px-3.5 py-2 text-sm text-ink-muted">Loading districts…</li>}
          {!isLoading && results.length === 0 && (
            <li className="px-3.5 py-2 text-sm text-ink-muted">No district matches “{query}”. Try a state name.</li>
          )}
          {results.map((d, i) => (
            <li
              key={d.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(d)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-100',
                i === active ? 'bg-blue-50/80 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100/70',
              )}
            >
              <MapPin className={cn('size-4 shrink-0', i === active ? 'text-blue-600' : 'text-slate-400')} aria-hidden />
              <span className="font-medium">{d.name}</span>
              <span className={cn('truncate text-xs', i === active ? 'text-blue-600/80' : 'text-slate-400')}>{d.state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
