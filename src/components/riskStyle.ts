import { AlertOctagon, AlertTriangle, CheckCircle2, MinusCircle, type LucideIcon } from 'lucide-react'
import type { RiskCategory } from '@/types'

/** Fill, icon and text colour per risk category. Yellow and orange always carry dark text. */
export const RISK_STYLE: Record<RiskCategory, { icon: LucideIcon; className: string; fill: string; ink: string }> = {
  low: { icon: CheckCircle2, className: 'bg-risk-low text-white', fill: '#1E8E3E', ink: '#FFFFFF' },
  moderate: { icon: MinusCircle, className: 'bg-risk-moderate text-ink', fill: '#F9AB00', ink: '#202124' },
  high: { icon: AlertTriangle, className: 'bg-risk-high text-ink', fill: '#E37400', ink: '#202124' },
  very_high: { icon: AlertOctagon, className: 'bg-risk-veryhigh text-white', fill: '#D93025', ink: '#FFFFFF' },
}
