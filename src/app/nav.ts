import { BookOpen, ClipboardList, EyeOff, FileText, LayoutDashboard, Map, MapPinned, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  /** i18n key under nav.* */
  key: 'overview' | 'map' | 'district' | 'blindSpots' | 'actions' | 'reports' | 'methodology'
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', key: 'overview', icon: LayoutDashboard, end: true },
  { to: '/map', key: 'map', icon: Map },
  { to: '/district', key: 'district', icon: MapPinned },
  { to: '/blind-spots', key: 'blindSpots', icon: EyeOff },
  { to: '/actions', key: 'actions', icon: ClipboardList },
  { to: '/reports', key: 'reports', icon: FileText },
  { to: '/methodology', key: 'methodology', icon: BookOpen },
]
