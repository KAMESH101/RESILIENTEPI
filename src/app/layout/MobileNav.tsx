import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LogoMark } from './Logo'
import { NavList } from './Sidebar'

/** Drawer navigation for < 768px. */
export function MobileNav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label={t('nav.openMenu')}>
        <Menu className="size-5" aria-hidden />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0 border-r border-white/10 bg-[#121316] p-4 text-white shadow-2xl [&>button]:text-white/70">
          <SheetHeader className="flex-row items-center gap-2.5 border-b border-white/10 pb-4 mb-3">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
              <LogoMark className="size-6 text-white" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-orange-500 ring-2 ring-[#121316]" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-white">{t('app.name')}</SheetTitle>
              <p className="text-[10px] text-slate-400">Early Warning</p>
            </div>
            <SheetDescription className="sr-only">{t('nav.label')}</SheetDescription>
          </SheetHeader>
          <NavList expanded onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
