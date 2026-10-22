/** One function per endpoint in the API contract (prompt §9). */
import type {
  ActionListQuery,
  ActionListResponse,
  ActionMutationResponse,
  BlindSpotListResponse,
  BlindSpotReviewRequest,
  BlindSpotReviewResponse,
  Bulletin,
  CreateActionRequest,
  DataSourcesResponse,
  DistrictDetail,
  DistrictListQuery,
  DistrictListResponse,
  ExplanationResponse,
  GenerateReportRequest,
  Horizon,
  ModelPerformanceResponse,
  OverviewQuery,
  OverviewResponse,
  RiskMapResponse,
  UpdateActionRequest,
} from '@/types'
import { apiRequest } from './api'

const enc = encodeURIComponent

export const getOverview = (q: OverviewQuery) =>
  apiRequest<OverviewResponse>('GET', '/overview', { query: { horizon: q.horizon, state: q.state } })

export const getRiskMap = (horizon: Horizon) =>
  apiRequest<RiskMapResponse>('GET', '/risk-map', { query: { horizon } })

export const listDistricts = (q: DistrictListQuery = {}) =>
  apiRequest<DistrictListResponse>('GET', '/districts', { query: { search: q.search, state: q.state } })

export const getDistrict = (id: string) => apiRequest<DistrictDetail>('GET', `/districts/${enc(id)}`)

export const getExplanations = (id: string, horizon: Horizon) =>
  apiRequest<ExplanationResponse>('GET', `/districts/${enc(id)}/explanations`, { query: { horizon } })

export const listBlindSpots = (state?: string | null) =>
  apiRequest<BlindSpotListResponse>('GET', '/blind-spots', { query: { state } })

export const reviewBlindSpot = (id: string, body: BlindSpotReviewRequest) =>
  apiRequest<BlindSpotReviewResponse>('POST', `/blind-spots/${enc(id)}/review`, { body })

export const listActions = (q: ActionListQuery = {}) =>
  apiRequest<ActionListResponse>('GET', '/actions', {
    query: { district: q.district, priority: q.priority, status: q.status },
  })

export const createAction = (body: CreateActionRequest) =>
  apiRequest<ActionMutationResponse>('POST', '/actions', { body })

export const updateAction = (id: string, body: UpdateActionRequest) =>
  apiRequest<ActionMutationResponse>('PATCH', `/actions/${enc(id)}`, { body })

export const generateReport = (body: GenerateReportRequest) =>
  apiRequest<Bulletin>('POST', '/reports/generate', { body })

export const getModelPerformance = () => apiRequest<ModelPerformanceResponse>('GET', '/model-performance')

export const getDataSources = () => apiRequest<DataSourcesResponse>('GET', '/data-sources')
