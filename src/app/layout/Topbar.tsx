import { useQueryClient } from '@tanstack/react-query'
import { Compass, Languages, RotateCcw, Search, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DistrictSearch } from '@/components/DistrictSearch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isDemoMode, resetDemoData } from '@/services/api'
import type { DistrictRef, Role } from '@/types'
import { withFilters } from '../filters'
import { ROLE_LABELS, useSession, type UiLanguage } from '../session'
import { toast } from '../toast'
import { LogoMark } from './Logo'
import { MobileNav } from './MobileNav'

export function Topbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [mobileSearch, setMobileSearch] = useState(false)
  const openTour = useSession((s) => s.openTour)

  const goToDistrict = (d: DistrictRef) => {
    setMobileSearch(false)
    void navigate(withFilters(`/district/${d.id}`, params))
  }

  return (
    <div className="border-b border-slate-200/60 bg-white/75 backdrop-blur-xl transition-colors">
      <div className="flex h-14 items-center gap-1 px-2 sm:gap-2 sm:px-4 md:px-6">
        <MobileNav />
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <LogoMark className="size-7" />
          <span className="text-sm font-semibold text-slate-800 tracking-tight min-[400px]:text-base">{t('app.name')}</span>
        </div>
        <DistrictSearch
          shortcut
          onSelect={goToDistrict}
          placeholder={t('topbar.search')}
          label={t('topbar.searchShort')}
          className="hidden w-full max-w-md md:block"
        />
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="md:hidden rounded-xl text-slate-600 hover:bg-white/80" onClick={() => setMobileSearch((v) => !v)} aria-label={t('topbar.searchShort')} aria-expanded={mobileSearch}>
            {mobileSearch ? <X className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
          </Button>
          <Button
            variant="outline"
            onClick={openTour}
            className="gap-1.5 rounded-full px-2.5 text-xs font-medium sm:px-3 sm:text-sm bg-white/70 border-slate-200/80 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-200 shadow-2xs transition-all"
            aria-label={t('topbar.tour')}
          >
            <Compass className="size-3.5 text-blue-600" aria-hidden />
            <span className="hidden sm:inline">{t('topbar.tour')}</span>
          </Button>
          <LanguageMenu />
          <ProfileMenu />
        </div>
      </div>
      {mobileSearch && (
        <div className="border-t px-4 py-2 md:hidden">
          <DistrictSearch autoFocus onSelect={goToDistrict} placeholder={t('topbar.searchShort')} label={t('topbar.searchShort')} />
        </div>
      )}
    </div>
  )
}

function LanguageMenu() {
  const { t } = useTranslation()
  const language = useSession((s) => s.language)
  const setLanguage = useSession((s) => s.setLanguage)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 px-2.5 rounded-full hover:bg-white/80 text-slate-700" aria-label={`${t('topbar.language')}: ${language === 'hi' ? 'हिन्दी' : 'English'}`}>
          <Languages className="hidden size-4 sm:block text-slate-500" aria-hidden />
          <span className="text-xs font-semibold">{language === 'hi' ? 'हि' : 'EN'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('topbar.language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as UiLanguage)}>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="hi" lang="hi">
            हिन्दी
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProfileMenu() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const role = useSession((s) => s.role)
  const setRole = useSession((s) => s.setRole)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-1.5 lg:px-2 rounded-full hover:bg-white/80 text-slate-800" aria-label={`${t('topbar.profile')}: ${ROLE_LABELS[role]}`}>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs">
              <UserRound className="size-3.5" aria-hidden />
            </span>
            <span className="hidden text-xs font-medium lg:inline">{ROLE_LABELS[role]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{t('topbar.role')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={role}
            onValueChange={(v) => {
              setRole(v as Role)
              toast({ variant: 'info', title: `Now viewing as ${ROLE_LABELS[v as Role]}`, description: v === 'evaluator' ? 'Read-only: reviews and actions are disabled.' : 'You can review alerts and edit actions.' })
            }}
          >
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <DropdownMenuRadioItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {isDemoMode && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmReset(true)}>
                <RotateCcw aria-hidden />
                {t('topbar.reset')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="This clears blind-spot reviews and Action Centre changes saved in this browser and restores the seeded demo data."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          void resetDemoData().then(() => {
            void qc.invalidateQueries()
            toast({ variant: 'success', title: 'Demo data reset', description: 'Seeded demo data restored.' })
          })
        }}
      />
    </>
  )
}
