import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { DemoBanner } from '@/components/DemoBanner'
import { DistrictPanel } from '@/components/DistrictPanel'
import { BlockSkeleton, LoadingLabel } from '@/components/Skeletons'
import { CreateActionDialog } from '@/features/actions/CreateActionDialog'
import { MapPatterns } from '@/features/map/MapPatterns'
import { DemoTour } from './DemoTour'
import { Sidebar } from './Sidebar'
import { Toaster } from './Toaster'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  // Move to the top on page change (not on filter-only changes).
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('app.skip')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 print:static">
          <DemoBanner />
          <Topbar />
        </div>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 pb-28 outline-none md:px-6 md:pb-12 xl:px-8">
          <Suspense
            fallback={
              <>
                <LoadingLabel label="Loading page" />
                <BlockSkeleton className="h-96" />
              </>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MapPatterns />
      <DistrictPanel />
      <CreateActionDialog />
      <DemoTour />
      <Toaster />
    </div>
  )
}
