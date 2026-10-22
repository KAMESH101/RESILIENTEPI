import { lazy } from 'react'

/** Route-level code splitting: each page loads on first visit. */
export const Overview = lazy(() => import('./Overview'))
export const RiskMap = lazy(() => import('./RiskMap'))
export const DistrictDetail = lazy(() => import('./DistrictDetail'))
export const BlindSpots = lazy(() => import('./BlindSpots'))
export const ActionCentre = lazy(() => import('./ActionCentre'))
export const Reports = lazy(() => import('./Reports'))
export const MethodologyData = lazy(() => import('./MethodologyData'))
export const NotFound = lazy(() => import('./NotFound'))
