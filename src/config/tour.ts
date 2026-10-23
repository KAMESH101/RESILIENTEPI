/**
 * Guided demo tour (prompt §5.6). Uses the seeded demo districts so the story
 * is identical on every run. Each `to` sets the page and its filters.
 */
export interface TourStep {
  title: string
  text: string
  to: string
}

export const TOUR_DISTRICTS = {
  highRiskBlindSpot: 'tn-madurai',
  lowRiskBlindSpot: 'ka-kalaburagi',
} as const

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Overview',
    text: 'Start with what needs attention this month — the strip at the top lists the districts to act on first.',
    to: '/',
  },
  {
    title: 'Risk map',
    text: 'Madurai is forecast High risk in 2 months. Its panel shows the top 3 reasons in plain language.',
    to: `/map?h=2&focus=${TOUR_DISTRICTS.highRiskBlindSpot}&district=${TOUR_DISTRICTS.highRiskBlindSpot}`,
  },
  {
    title: 'Blind-spot analysis',
    text: 'Kalaburagi reports few cases, but testing is far below the state median — a potential blind spot (experimental).',
    to: `/blind-spots?focus=${TOUR_DISTRICTS.lowRiskBlindSpot}`,
  },
  {
    title: 'Action Centre',
    text: 'Assign Madurai’s testing and test-kit task, then mark it In Progress. Every change asks for confirmation.',
    to: `/actions?dist=${TOUR_DISTRICTS.highRiskBlindSpot}`,
  },
  {
    title: 'Reports',
    text: 'Generate a Hindi or Tamil bulletin preview for Madurai, ready to print as PDF.',
    to: `/reports?scope=district&target=${TOUR_DISTRICTS.highRiskBlindSpot}&lang=hi`,
  },
]
