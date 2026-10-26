import { Compass, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useSearchParams } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '../nav'
import { ROLE_LABELS, useSession } from '../session'
import { withFilters } from '../filters'
import { LogoMark } from './Logo'

/**
 * Detached Navigation Bar:
 * A sleek, detached vertical dark capsule rail floating independently on the left.
 */
export function Sidebar() {
  const { t } = useTranslation()
  const collapsed = useSession((s) => s.sidebarCollapsed)
  const toggle = useSession((s) => s.toggleSidebar)
  const role = useSession((s) => s.role)
  const openTour = useSession((s) => s.openTour)

  return (
    <aside
      className={cn(
        'hidden shrink-0 transition-all duration-200 ease-ui md:flex print:hidden sticky top-3.5 h-[calc(100dvh-1.75rem)] z-40',
        collapsed ? 'w-[72px]' : 'w-[72px] xl:w-60',
      )}
    >
      <div
        className={cn(
          'flex h-full w-full flex-col justify-between rounded-[32px] bg-[#121316] text-white border border-white/10 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.35)] py-4 transition-all duration-200 overflow-hidden',
          collapsed ? 'items-center px-2.5' : 'items-center px-2.5 xl:items-stretch xl:px-3.5',
        )}
      >
        {/* Top: Logo / Brand Action Button */}
        <div className="flex flex-col items-center gap-1 w-full">
          <NavLink
            to="/"
            className={cn(
              'group flex items-center transition-all duration-200',
              collapsed
                ? 'size-11 shrink-0 aspect-square rounded-full justify-center bg-white/10 hover:bg-white/15 border border-white/10 shadow-xs'
                : 'size-11 shrink-0 aspect-square rounded-full justify-center bg-white/10 hover:bg-white/15 border border-white/10 shadow-xs xl:size-auto xl:w-full xl:aspect-auto xl:justify-start xl:gap-3 xl:p-2 xl:rounded-2xl xl:bg-white/5 xl:border-white/5 hover:xl:bg-white/10',
            )}
            aria-label={t('app.name')}
          >
            <div className="relative flex size-9 shrink-0 aspect-square items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
              <LogoMark className="size-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-orange-500 ring-2 ring-[#121316]" />
            </div>
            <div className={cn('hidden flex-col min-w-0', !collapsed && 'xl:flex')}>
              <span className="truncate text-sm font-semibold tracking-tight text-white">{t('app.name')}</span>
              <span className="truncate text-[10px] text-slate-400 font-medium">Early Warning</span>
            </div>
          </NavLink>
        </div>

        {/* Middle: Navigation Items */}
        <div className="my-auto w-full">
          <NavList collapsedAlways={collapsed} />
        </div>

        {/* Bottom: Utilities & Profile */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 w-full">
          {/* Quick Tour Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openTour}
                className={cn(
                  'flex size-11 shrink-0 aspect-square items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all',
                  !collapsed && 'xl:w-full xl:aspect-auto xl:h-11 xl:rounded-2xl xl:justify-start xl:px-3 xl:gap-3',
                )}
                aria-label={t('topbar.tour')}
              >
                <Compass className="size-5 text-blue-400 shrink-0" aria-hidden />
                <span className={cn('hidden truncate text-xs font-medium', !collapsed && 'xl:inline')}>
                  {t('topbar.tour')}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className={cn(!collapsed && 'xl:hidden')}>
              {t('topbar.tour')}
            </TooltipContent>
          </Tooltip>

          {/* Expand / Collapse Rail Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'hidden xl:flex size-11 shrink-0 aspect-square items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all',
                  !collapsed && 'xl:w-full xl:aspect-auto xl:h-11 xl:rounded-2xl xl:justify-start xl:px-3 xl:gap-3',
                )}
                aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
              >
                {collapsed ? <PanelLeftOpen className="size-5 shrink-0" aria-hidden /> : <PanelLeftClose className="size-5 shrink-0" aria-hidden />}
                <span className={cn('hidden truncate text-xs font-medium', !collapsed && 'xl:inline')}>
                  {collapsed ? t('nav.expand') : t('nav.collapse')}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? t('nav.expand') : t('nav.collapse')}
            </TooltipContent>
          </Tooltip>

          {/* User Profile Avatar Pill */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center justify-center rounded-full cursor-default transition-all',
                  collapsed
                    ? 'size-11 shrink-0 aspect-square'
                    : 'size-11 shrink-0 aspect-square xl:size-auto xl:w-full xl:aspect-auto xl:bg-white/5 xl:p-1.5 xl:rounded-2xl xl:justify-start xl:gap-2.5',
                )}
              >
                <div className="flex size-10 shrink-0 aspect-square items-center justify-center rounded-full bg-[#272832] ring-2 ring-white/15 text-orange-400 shadow-xs">
                  <UserRound className="size-4.5" aria-hidden />
                </div>
                <div className={cn('hidden flex-col min-w-0 pr-2', !collapsed && 'xl:flex')}>
                  <span className="truncate text-xs font-medium text-white">{ROLE_LABELS[role]}</span>
                  <span className="truncate text-[10px] text-slate-400">Active session</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className={cn(!collapsed && 'xl:hidden')}>
              {ROLE_LABELS[role]}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  )
}

/** Shared by the sidebar and the mobile drawer. */
export function NavList({ collapsedAlways = false, expanded = false, onNavigate }: { collapsedAlways?: boolean; expanded?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const labelClass = expanded ? 'inline' : cn('hidden', !collapsedAlways && 'xl:inline')

  return (
    <nav
      aria-label={t('nav.label')}
      className={cn(
        'flex flex-col gap-2 w-full',
        expanded ? 'items-stretch' : collapsedAlways ? 'items-center' : 'items-center xl:items-stretch',
      )}
    >
      {NAV_ITEMS.map((item) => {
        const label = t(`nav.${item.key}`)
        const link = (
          <NavLink
            to={withFilters(item.to, params)}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center transition-all duration-150',
                expanded
                  ? 'h-11 w-full gap-3 px-3.5 rounded-2xl text-sm font-medium'
                  : collapsedAlways
                    ? 'size-11 shrink-0 aspect-square rounded-full justify-center'
                    : 'size-11 shrink-0 aspect-square rounded-full justify-center xl:size-auto xl:w-full xl:aspect-auto xl:h-11 xl:rounded-2xl xl:justify-start xl:gap-3 xl:px-3 text-sm font-medium',
                isActive
                  ? 'bg-[#272832] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] border border-white/10 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/10',
              )
            }
          >
            <item.icon className="size-5 shrink-0 transition-transform duration-150 group-hover:scale-105" aria-hidden />
            <span className={cn('truncate', labelClass)}>{label}</span>
            {!expanded && <span className={cn('sr-only', !collapsedAlways && 'xl:hidden')}>{label}</span>}
          </NavLink>
        )
        if (expanded) return <div key={item.to}>{link}</div>
        return (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" className={cn(!collapsedAlways && 'xl:hidden bg-slate-900 text-white border-white/10')}>
              {label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
