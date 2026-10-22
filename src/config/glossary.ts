import { BLIND_SPOT_THRESHOLD_NOTE } from './blindspot'
import { OUTBREAK_PERCENTILE } from './risk'

/** Plain-language definitions used by InfoTooltip (prompt §5.3). */
export const GLOSSARY = {
  forecast_horizon: {
    term: 'Forecast horizon',
    definition:
      'How far ahead the forecast looks. "2 months" means the risk for the month two months after the last monthly run.',
  },
  outbreak_threshold: {
    term: 'Outbreak threshold',
    definition: `A month counts as an outbreak when cases are above that district's usual level for the same calendar month — specifically above its ${OUTBREAK_PERCENTILE}th percentile in past years.`,
  },
  auprc: {
    term: 'AUPRC',
    definition:
      'Area under the precision–recall curve. A 0–1 score of how well the model ranks real outbreaks above non-outbreaks; higher is better. Useful when outbreaks are rare.',
  },
  shap: {
    term: 'SHAP',
    definition:
      'A method that shows how much each input (rainfall, past cases, etc.) pushed a forecast up or down. We show the top 3 as plain sentences.',
  },
  baseline: {
    term: 'Baseline',
    definition:
      'A simple rule the model must beat: same month last year, last month’s value, or the historical monthly average.',
  },
  blind_spot: {
    term: 'Blind spot',
    definition: `A district where low reported dengue may reflect low testing or weak reporting rather than low disease. This is an experimental indicator, not proof of under-reporting. ${BLIND_SPOT_THRESHOLD_NOTE}`,
  },
  reporting_completeness: {
    term: 'Reporting completeness',
    definition:
      'The share of health facilities that sent their report on time. Low completeness means some cases may be missing from the totals.',
  },
  test_positivity: {
    term: 'Test positivity',
    definition:
      'The share of dengue tests that came back positive. High positivity with few tests can mean many cases are not being tested.',
  },
  lgd_code: {
    term: 'LGD code',
    definition:
      'The official district code from the Local Government Directory. Used to join data from different sources to the same district.',
  },
  last_run: {
    term: 'Last monthly run',
    definition:
      'ResilientEpi updates once a month in a batch. This is when that run finished — the data is not real-time.',
  },
  synthetic: {
    term: 'Synthetic demo data',
    definition:
      'Generated for this demonstration from a fixed seed. It is not real surveillance data and must not be used for decisions.',
  },
} as const

export type GlossaryKey = keyof typeof GLOSSARY
