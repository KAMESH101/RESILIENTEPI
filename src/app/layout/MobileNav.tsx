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
        <SheetContent side="left" className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-white">
          <SheetHeader className="flex-row items-center gap-2 border-b border-sidebar-border p-4">
            <LogoMark />
            <SheetTitle className="text-base text-white">{t('app.name')}</SheetTitle>
            <SheetDescription className="sr-only">{t('nav.label')}</SheetDescription>
          </SheetHeader>
          <NavList expanded onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
