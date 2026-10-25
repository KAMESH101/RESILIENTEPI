import { useQuery } from '@tanstack/react-query'
import { getRiskMap } from '@/services/endpoints'
import { useFilters } from './filters'

/** Last monthly run and as-of month, for page headers that have no data query of their own. */
export function useRunInfo() {
  const { horizon } = useFilters()
  const q = useQuery({ queryKey: ['risk-map', horizon], queryFn: () => getRiskMap(horizon) })
  return { lastRunAt: q.data?.last_run_at, asOf: q.data?.as_of }
}
