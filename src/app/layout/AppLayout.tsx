import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { DistrictPanel } from '@/components/DistrictPanel'
import { BlockSkeleton, LoadingLabel } from '@/components/Skeletons'
import { CreateActionDialog } from '@/features/actions/CreateActionDialog'
import { MapPatterns } from '@/features/map/MapPatterns'
import { DemoTour } from './DemoTour'
import { Footer } from './Footer'
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
    <div className="flex min-h-dvh flex-col bg-[#f1f3f6] dark:bg-[#090a0d] p-2.5 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-white sm:p-3 md:flex-row md:gap-3.5 md:p-3.5 transition-colors">
      <a
        href="#main"
        className="sr-only z-[70] rounded-full bg-[#2563eb] px-4 py-2 text-white shadow-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('app.skip')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Single unified topbar — eliminated redundant DemoBanner space */}
        <div className="sticky top-2 z-30 mb-3 print:hidden">
          <Topbar />
        </div>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-1 sm:px-2 md:px-4 pb-12 outline-none print:max-w-none print:p-0">
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
          <Footer />
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
