import { AlertOctagon, AlertTriangle, CheckCircle2, MinusCircle, type LucideIcon } from 'lucide-react'
import type { RiskCategory } from '@/types'

/** Fill, icon and text colour per risk category. Yellow and orange always carry dark text. */
export const RISK_STYLE: Record<RiskCategory, { icon: LucideIcon; className: string; fill: string; ink: string }> = {
  low: { icon: CheckCircle2, className: 'bg-risk-low text-white', fill: '#2E7D32', ink: '#FFFFFF' },
  moderate: { icon: MinusCircle, className: 'bg-risk-moderate text-ink', fill: '#F2B705', ink: '#0F172A' },
  high: { icon: AlertTriangle, className: 'bg-risk-high text-ink', fill: '#E8710A', ink: '#0F172A' },
  very_high: { icon: AlertOctagon, className: 'bg-risk-veryhigh text-white', fill: '#C62828', ink: '#FFFFFF' },
}
