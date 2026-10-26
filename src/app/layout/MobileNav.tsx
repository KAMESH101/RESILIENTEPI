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
        <SheetContent side="left" className="w-72 gap-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-2xl p-0 text-slate-800 shadow-elevated [&>button]:text-slate-600">
          <SheetHeader className="flex-row items-center gap-2.5 border-b border-slate-200/60 p-4">
            <LogoMark />
            <SheetTitle className="text-base font-semibold text-slate-800">{t('app.name')}</SheetTitle>
            <SheetDescription className="sr-only">{t('nav.label')}</SheetDescription>
          </SheetHeader>
          <NavList expanded onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
