import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useSearchParams } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '../nav'
import { useSession } from '../session'
import { withFilters } from '../filters'
import { LogoMark } from './Logo'

/**
 * Desktop (≥1280): 240px, collapsible to a 72px rail. Tablet (768–1279): rail.
 * Mobile uses MobileNav instead.
 */
export function Sidebar() {
  const { t } = useTranslation()
  const collapsed = useSession((s) => s.sidebarCollapsed)
  const toggle = useSession((s) => s.toggleSidebar)
  // The outer column stretches with the page (full-height navy); the inner one stays pinned.
  return (
    <div
      className={cn(
        'hidden shrink-0 bg-sidebar transition-[width] duration-200 ease-ui md:block print:hidden',
        'w-[72px]',
        !collapsed && 'xl:w-60',
      )}
    >
    <aside className="sticky top-0 flex h-dvh flex-col text-sidebar-foreground">
      <div className={cn('flex h-14 items-center gap-2 border-b border-sidebar-border px-5', !collapsed && 'xl:px-4')}>
        <LogoMark />
        <span className={cn('hidden truncate text-base font-semibold text-white', !collapsed && 'xl:inline')}>{t('app.name')}</span>
      </div>
      <NavList collapsedAlways={collapsed} />
      <div className="mt-auto hidden border-t border-sidebar-border p-3 xl:block">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-white"
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {collapsed ? <PanelLeftOpen className="size-5 shrink-0" aria-hidden /> : <PanelLeftClose className="size-5 shrink-0" aria-hidden />}
          {!collapsed && <span>{t('nav.collapse')}</span>}
        </button>
      </div>
    </aside>
    </div>
  )
}

/** Shared by the sidebar and the mobile drawer. */
export function NavList({ collapsedAlways = false, expanded = false, onNavigate }: { collapsedAlways?: boolean; expanded?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  // In rail mode labels are hidden (tooltips instead); in the drawer they always show.
  const labelClass = expanded ? 'inline' : cn('hidden', !collapsedAlways && 'xl:inline')
  return (
    <nav aria-label={t('nav.label')} className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const label = t(`nav.${item.key}`)
        const link = (
          <NavLink
            to={withFilters(item.to, params)}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150',
                isActive ? 'bg-sidebar-accent text-white shadow-sm before:absolute before:inset-y-2 before:left-0 before:w-1.5 before:rounded-r-full before:bg-[#1a73e8]' : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white',
              )
            }
          >
            <item.icon className="size-5 shrink-0" aria-hidden />
            <span className={cn('truncate', labelClass)}>{label}</span>
            {!expanded && <span className={cn('sr-only', !collapsedAlways && 'xl:hidden')}>{label}</span>}
          </NavLink>
        )
        if (expanded) return <div key={item.to}>{link}</div>
        return (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" className={cn(!collapsedAlways && 'xl:hidden')}>
              {label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
