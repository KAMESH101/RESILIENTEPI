import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Tailwind breakpoints used by the layout (prompt §5.4). */
export const MQ = {
  tablet: '(min-width: 768px)',
  desktop: '(min-width: 1280px)',
} as const
