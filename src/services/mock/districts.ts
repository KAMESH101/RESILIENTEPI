/**
 * Demo district catalogue: real district names, 12 states × 5 districts.
 * Every number derived from these profiles is SYNTHETIC. LGD codes are never
 * set here — they come only from the team-supplied CSV.
 */

export interface DistrictProfile {
  id: string
  name: string
  state: string
  /** Optional overrides that script the guided-demo stories. */
  story?: DemoStory
}

export interface DemoStory {
  /** Fixed forecast probabilities for horizons 1, 2, 3 (independent of as-of month). */
  probabilities?: [number, number, number]
  /** Share of true cases that get reported (1 = complete). */
  reportFactor?: number
  /** Tests per 100k per month at the seasonal mean. */
  testRate?: number
  /** Mean reporting completeness 0–1. */
  completeness?: number
  /** Month offsets back from as-of (0 = as-of month) with no report. */
  missingOffsets?: number[]
  /** Last N months unreported → stale data. */
  staleMonths?: number
  /** SHAP explanation not available for this district. */
  noExplanation?: boolean
}

/** Calendar month (1–12) when dengue usually peaks, per state (synthetic assumption). */
export const STATE_PEAK_MONTH: Record<string, number> = {
  'Tamil Nadu': 11,
  Kerala: 7,
  Karnataka: 9,
  Maharashtra: 9,
  Delhi: 10,
  'Uttar Pradesh': 10,
  'West Bengal': 9,
  Gujarat: 10,
  Rajasthan: 10,
  Telangana: 9,
  Odisha: 9,
  Punjab: 10,
}

/** Months of the main rainy season per state (1–12), used for synthetic rainfall. */
export const STATE_RAIN_MONTHS: Record<string, number[]> = {
  'Tamil Nadu': [10, 11, 12],
  Kerala: [6, 7, 8, 9, 10],
}
export const DEFAULT_RAIN_MONTHS = [6, 7, 8, 9]

const STATE_CODES: Record<string, string> = {
  'Tamil Nadu': 'tn',
  Kerala: 'kl',
  Karnataka: 'ka',
  Maharashtra: 'mh',
  Delhi: 'dl',
  'Uttar Pradesh': 'up',
  'West Bengal': 'wb',
  Gujarat: 'gj',
  Rajasthan: 'rj',
  Telangana: 'tg',
  Odisha: 'od',
  Punjab: 'pb',
}

/** Stable slug id, e.g. "tn-madurai". Not an LGD code. */
const slug = (state: string, name: string) =>
  `${STATE_CODES[state]}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

const raw: [string, string[]][] = [
  ['Tamil Nadu', ['Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Tirunelveli']],
  ['Kerala', ['Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Kollam']],
  ['Karnataka', ['Bengaluru Urban', 'Mysuru', 'Dakshina Kannada', 'Belagavi', 'Kalaburagi']],
  ['Maharashtra', ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane']],
  ['Delhi', ['New Delhi', 'South Delhi', 'North West Delhi', 'East Delhi', 'West Delhi']],
  ['Uttar Pradesh', ['Lucknow', 'Kanpur Nagar', 'Prayagraj', 'Varanasi', 'Gorakhpur']],
  ['West Bengal', ['Kolkata', 'North 24 Parganas', 'Howrah', 'Hooghly', 'Darjeeling']],
  ['Gujarat', ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar']],
  ['Rajasthan', ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer']],
  ['Telangana', ['Hyderabad', 'Medchal–Malkajgiri', 'Rangareddy', 'Karimnagar', 'Khammam']],
  ['Odisha', ['Khordha', 'Cuttack', 'Ganjam', 'Sambalpur', 'Baleshwar']],
  ['Punjab', ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda']],
]

/** Scripted stories used by the guided demo tour. */
const STORIES: Record<string, DemoStory> = {
  // High risk + potential blind spot (tour step 2 & 3 headline district).
  Madurai: {
    probabilities: [0.62, 0.68, 0.64],
    reportFactor: 0.35,
    testRate: 7,
    completeness: 0.66,
  },
  // Low risk + potential blind spot.
  Kalaburagi: {
    probabilities: [0.12, 0.16, 0.14],
    reportFactor: 0.4,
    testRate: 8,
    completeness: 0.74,
  },
  // Very high risk, surveillance looks healthy.
  Ernakulam: { probabilities: [0.81, 0.78, 0.7] },
  Mumbai: { probabilities: [0.66, 0.58, 0.52] },
  Kolkata: { probabilities: [0.57, 0.61, 0.55] },
  // High risk + watch band.
  Gorakhpur: {
    probabilities: [0.55, 0.59, 0.51],
    reportFactor: 0.62,
    testRate: 17,
    completeness: 0.82,
  },
  // Watch band, moderate risk.
  Ganjam: { probabilities: [0.31, 0.36, 0.33], reportFactor: 0.63, testRate: 18, completeness: 0.84 },
  // Missing months.
  Darjeeling: { probabilities: [0.27, 0.3, 0.24], missingOffsets: [1, 4, 7] },
  // Stale data, no explanation yet.
  Bathinda: { probabilities: [0.22, 0.29, 0.26], staleMonths: 4, noExplanation: true },
}

export const DISTRICTS: DistrictProfile[] = raw.flatMap(([state, names]) =>
  names.map((name) => ({ id: slug(state, name), name, state, story: STORIES[name] })),
)

export const STATES: string[] = raw.map(([s]) => s)
