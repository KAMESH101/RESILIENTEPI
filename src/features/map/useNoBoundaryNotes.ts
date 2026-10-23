import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { NO_BOUNDARY_DEFAULT_NOTE, NO_BOUNDARY_NOTES } from '@/config/geo'
import { normaliseName } from '@/lib/names'
import { listDistricts } from '@/services/endpoints'
import { useBoundaries } from './boundaries'
import { joinBoundaries } from './join'

/**
 * District id → note for demo districts that have no shape in the loaded
 * boundary file (e.g. "No 2011 boundary (district created 2016)").
 * Empty when no boundary file is loaded (the schematic view shows every district).
 */
export function useNoBoundaryNotes(): Map<string, string> {
  const boundaries = useBoundaries()
  const districts = useQuery({ queryKey: ['districts', 'all'], queryFn: () => listDistricts(), staleTime: Infinity })
  const b = boundaries.data
  const refs = districts.data?.districts
  return useMemo(() => {
    const notes = new Map<string, string>()
    if (b?.status !== 'loaded' || !refs) return notes
    const { unmatched } = joinBoundaries(
      b.features,
      refs.map((district) => ({ district })),
    )
    for (const { district } of unmatched) notes.set(district.id, NO_BOUNDARY_NOTES[normaliseName(district.name)] ?? NO_BOUNDARY_DEFAULT_NOTE)
    return notes
  }, [b, refs])
}
