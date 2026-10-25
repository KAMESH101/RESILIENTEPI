import { createBrowserRouter } from 'react-router'
import { ActionCentre, BlindSpots, DistrictDetail, MethodologyData, NotFound, Overview, Reports, RiskMap } from '@/pages'
import { AppLayout } from './layout/AppLayout'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'map', element: <RiskMap /> },
      { path: 'district', element: <DistrictDetail /> },
      { path: 'district/:id', element: <DistrictDetail /> },
      { path: 'blind-spots', element: <BlindSpots /> },
      { path: 'actions', element: <ActionCentre /> },
      { path: 'reports', element: <Reports /> },
      { path: 'methodology', element: <MethodologyData /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
