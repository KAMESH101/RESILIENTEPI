# Build ResilientEpi: a dengue early-warning platform (frontend prototype)

## 0. How to work (read this first)

Prerequisites: Node.js 20+ and npm. Scaffold the project with `npm create vite@latest` (React + TypeScript), then set up Tailwind and shadcn/ui using their current official CLI instructions.

You are building a hackathon-grade, fully working **frontend prototype** with a mock API layer. The real FastAPI backend and ML pipeline will be connected later.

Work in phases. At the end of each phase:
- Run `npm run build` and `npm run lint`, and fix every error before moving on.
- **Visual QA:** use Playwright (installing `@playwright/test` as a dev dependency is allowed) to screenshot every page built so far at 375 px, 768 px and 1440 px widths. Review the screenshots and fix:
  - overflow
  - overlap
  - misalignment
  - unreadable text
  - inconsistent spacing
- Write a short summary of what was built and what comes next.

Rules:
- **No dead buttons.** Every control must work. If an action needs a backend that doesn't exist yet, show a clear "Demo mode: not sent to a real system" message.
- **No made-up results.** Never invent model accuracy, uncertainty ranges, SHAP values, LGD codes or map boundaries and present them as real. Label every synthetic value in the UI as **"Synthetic demo data"**.
- **Keep scope lean.** Build only what this prompt asks for. Ask me before adding any page or feature, or any dependency not listed in Section 3.
- Create a `CLAUDE.md` in the repo root that summarises these rules, the folder structure and the commands.

## 1. Product summary

ResilientEpi forecasts **district-level dengue outbreak risk 1–3 months ahead** across India. It also shows an **experimental surveillance blind-spot indicator**: a flag for districts where low reported dengue may reflect low testing or weak reporting, not low disease.

Core message (show it on the Overview and Blind-Spot pages):
> "Low reported dengue doesn't always mean low dengue — sometimes it means low testing."

Positioning: ResilientEpi **complements IDSP/IHIP and does not replace them**. NCDC plans to add predictive surveillance, and ResilientEpi supports that direction.

Users:
- District Surveillance Officers
- State health departments
- Municipal corporations
- Hospitals
- Researchers

Humans make all final decisions. The platform never triggers real-world interventions automatically.

Never claim "first ever", "proven" or "clinically validated".

## 2. Model and method (the UI must reflect this exactly)

The ML pipeline will be built later in Python. The frontend displays its outputs, and the mock data uses the same data shapes.

**Forecast target**
- For each district-month: the probability that dengue cases exceed the district's outbreak threshold, at horizons of 1, 2 and 3 months.
- Outbreak threshold: cases above that district's seasonal 75th percentile for the calendar month. Store this as a setting (`OUTBREAK_PERCENTILE = 75`) and show it in a tooltip.
- Risk categories by probability:

| Category | Probability |
|---|---|
| Low | below 0.25 |
| Moderate | 0.25 to below 0.50 |
| High | 0.50 to below 0.75 |
| Very High | 0.75 and above |

- Secondary output: expected case count, from the negative-binomial model.

**Models**
- One **national pooled LightGBM classifier** covering all districts, so districts with few cases still get forecasts.
- A **negative-binomial model** (statsmodels) for case counts and comparison.
- **Three baselines**, always shown next to the model:
  - seasonal naive (same month last year)
  - persistence (last month's value)
  - historical monthly average

**Features**
- Past cases: lags 1–3 months and the same month last year
- Rainfall, temperature and humidity, each lagged 1–3 months
- El Niño index (ONI)
- Cases in neighbouring districts (spatial lag)
- Testing level and fever-related admissions
- Month and season

**Explanations**
- SHAP top 3 reasons per alert, in plain language. Example: "Rainfall 2 months ago was 38% above normal".
- Show these only when SHAP results exist; otherwise show "Explanation not yet available".

**Validation**
- Walk-forward backtest.
- Metrics:
  - AUPRC
  - precision of the top-20 alerts
  - lead time (months of warning before the peak)
  - Brier score / calibration
  - MAE and RMSE, for the count model only

**Experimental blind-spot indicator**

A transparent 0–100 score. Show the value and contribution of each part:

| Part | Signal | Default weight |
|---|---|---|
| Expected vs reported gap | The climate and neighbour model expects far more cases than were reported | 35% |
| Low testing per 100k | Testing well below the state median | 25% |
| High test positivity | Few tests, but a high share positive | 15% |
| Low reporting completeness | Missing or late reports | 15% |
| Fever admissions vs dengue reports | Fever admissions rising while dengue reports stay flat | 10% |

- Keep the weights in a config file.
- Always label the score: **"Experimental surveillance blind-spot indicator — not proof of under-reporting."**
- Validation plan: 3 independent tests, including a **synthetic test** that hides real reports and checks whether the indicator flags the gap.

**Data reality** (show this on the Methodology & Data page)
- HMIS district-month data ends in **2022**, so the district model is retrospective.
- A **live state-level view** comes from IDSP outbreak records.
- All sources are joined on **LGD district codes**.
- The pipeline runs as a **monthly batch** for 700+ districts. "Last updated" means the last monthly run, not real time.

**Context statistic** (show it on the Overview with its source)
> 23,952 dengue cases in India, Jan–Jun 2026; the dengue season is now starting earlier and lasting longer. (Source: MoHFW, Rajya Sabha, July 2026)

## 3. Tech stack

**Frontend:** React 18, TypeScript (strict), Vite, Tailwind CSS, shadcn/ui, Recharts, React Leaflet with Leaflet and topojson-client, React Router, TanStack Query, Zustand (filters and session state), i18next with react-i18next, zod (form validation), Lucide icons, Inter font.

**Exports:** a print stylesheet for PDF ("Save as PDF"), plus a CSV helper.

**Later backend** (document it in the README; do not build it now): Python FastAPI, PostgreSQL, pandas, GeoPandas, imdlib, LightGBM, statsmodels, SHAP.

## 4. Project structure

```
src/
  app/            router, providers, layout (Sidebar, Topbar, MobileNav)
  pages/          Overview, RiskMap, DistrictDetail, BlindSpots,
                  ActionCentre, Reports, MethodologyData
  components/     KpiCard, FilterBar, RiskBadge, BlindSpotBadge, DataTable,
                  MapLegend, DistrictPanel, ChartCard, DemoBanner, EmptyState,
                  ErrorState, Skeletons, ConfirmDialog, InfoTooltip,
                  SyntheticTag, DistrictSearch
  features/       map/, blindspots/, actions/, reports/
  services/
    api.ts        typed client; reads VITE_API_MODE = "mock" | "live"
    endpoints.ts  one function per endpoint (Section 9)
    mock/         mock handlers and seeded data generators
  types/          shared TypeScript types matching the API contracts
  config/         risk thresholds, blind-spot weights, outbreak percentile
  i18n/           en.json, hi.json (UI); bulletin templates in en, hi, ta
public/geo/       boundary file supplied by the team (see Section 6)
scripts/          simplify-boundaries.md (mapshaper instructions)
```

- Keep mock data in `services/mock/`, separate from the production services.
- Switching `VITE_API_MODE` from `mock` to `live` must be the **only** change needed to use the real backend.
- Build one reusable `DistrictSearch` component and use it everywhere: the top bar, the map and the filters.

## 5. Design and UX

### 5.1 UX principles (apply them on every page)

1. **"What needs my attention?" comes first.** Every page opens with the 1–3 things an officer should act on, then the supporting detail.
2. **Plain language first, technical detail on demand.**
   - Lead with a sentence, e.g. "Madurai: High risk in 2 months. Main reason: rainfall 2 months ago was 38% above normal."
   - Put numbers, SHAP values and methods behind a "How is this calculated?" expander or an `InfoTooltip`.
3. **One district, one consistent panel.** The `DistrictPanel` looks and behaves the same on the Overview, the map, Blind-Spot Analysis and the Action Centre.
4. **Show certainty honestly.**
   - Use words alongside numbers: "Likely (62%)".
   - Show "Low confidence: data 3 months old" where it applies.
   - Never show more decimals than the data supports.
5. **Separate three kinds of information everywhere.**
   - **Observed**: solid lines, plain cards.
   - **Forecast**: dashed lines, with a "Forecast" chip.
   - **Experimental**: hatched pattern, with an "Experimental" chip.
6. **Every click leads somewhere useful.** KPI cards, badges, table rows and map districts open a filtered view or a district panel. No dead ends.

### 5.2 Design tokens (define them in `tailwind.config` and CSS variables)

| Token | Value | Use |
|---|---|---|
| navy-900 | `#0F2A4A` | sidebar, headings, primary buttons |
| navy-700 | `#1F4470` | hover and active states |
| teal-600 | `#0E8A8A` | accent, links, selected states |
| cyan-50 | `#ECF8FA` | info surfaces, selected rows |
| bg | `#F6F8FB` | app background |
| surface | `#FFFFFF` | cards |
| border | `#E2E8F0` | dividers, card borders |
| text | `#0F172A` / muted `#475569` | body / secondary text |
| risk-low | `#2E7D32` + check-circle icon | Low |
| risk-moderate | `#F2B705` + minus-circle icon, **dark text** | Moderate |
| risk-high | `#E8710A` + alert-triangle icon | High |
| risk-veryhigh | `#C62828` + alert-octagon icon | Very High |
| blindspot | navy diagonal hatch + eye-off icon | potential blind spot |
| nodata | grey dotted pattern + help-circle icon | no data (never 0) |

- **Typography:** Inter.
  - Scale: 12 / 14 / 16 / 20 / 24 / 30 px. Body text is 14–16 px.
  - Use `tabular-nums` for all figures.
- **Number and date formatting:** Indian formats (`en-IN`): 1,23,456 and "Oct 2026".
- **Shape:** card radius 12 px, button radius 8 px, a single soft shadow level, 8-pt spacing grid.
- **Motion:** 150–200 ms ease for hover and panel transitions only. Respect `prefers-reduced-motion`.
- **Theme:** light theme only. Do not build dark mode.

### 5.3 Core components (build them once, reuse them everywhere)

- **RiskBadge:** colour, icon and text label ("High"), with the probability shown on hover. Sizes sm and md.
- **BlindSpotBadge:** hatch swatch, eye-off icon and "Potential blind spot", always with an "Experimental" chip.
- **KpiCard:**
  - Contents: label, big number, a trend arrow only when valid, a one-line meaning, and a "View →" link.
  - The whole card is clickable and focusable.
- **DistrictPanel:** a right-side drawer on desktop and a bottom sheet on mobile. Contents, in order:
  1. Header: name, state, RiskBadge, BlindSpotBadge
  2. A one-sentence plain-language summary
  3. The top 3 reasons, shown as icon rows
  4. Case trend sparkline
  5. Testing and freshness
  6. Recommended action
  7. Buttons: "Open district page" and "Create action"
- **ChartCard:**
  - Title, a one-line "what this shows" caption, a legend with direct line labels, and a "Synthetic" tag when relevant.
  - Shade the monsoon season (Jun–Sep) lightly on time-series charts.
  - Show at most 4 series per chart.
- **DataTable:**
  - Sticky header, sortable columns, a filter chip bar, row click to open the DistrictPanel, pagination at 25 rows.
  - On mobile, rows turn into stacked cards.
- **FilterBar:**
  - Horizon segmented control (1M / 2M / 3M), state select, active-filter chips, "Clear all".
  - Filters are kept in the URL so views can be shared and the browser back button works.
- **InfoTooltip:** a glossary of plain-language definitions. Required terms:
  - forecast horizon
  - outbreak threshold
  - AUPRC
  - SHAP
  - baseline
  - blind spot
  - reporting completeness
  - test positivity
  - LGD code
- **Feedback:**
  - Toasts announced with `aria-live` for success and demo-mode messages.
  - ConfirmDialog for every change.
  - Skeletons that match the final layout.
  - EmptyState with helpful text and one next-step button, e.g. "No blind spots in this state. Try another state."
  - ErrorState with "Try again".

### 5.4 Layout and responsiveness

**Desktop (≥ 1280 px)**
- Collapsible sidebar, 240 px wide, collapsing to a 72 px icon rail.
- 12-column content grid, maximum width 1440 px.

**Tablet (768–1279 px)**
- Icon rail.
- Cards drop to 2 per row.
- The DistrictPanel becomes an overlay drawer.

**Mobile (< 768 px)**
- Drawer navigation.
- Cards stack in 1 column.
- The map page opens on **list view first**, with a "Show map" toggle.
- The DistrictPanel becomes a bottom sheet.
- Primary actions are reachable by thumb.

**On every page**
- A page header with the title, a one-line purpose, the last-run time and the FilterBar.
- A persistent thin demo banner: "Demo mode — synthetic data. Not for operational use."
- A keyboard shortcut: `/` focuses district search. Show it in the search placeholder.

### 5.5 Accessibility

- WCAG AA contrast. Moderate (yellow) always uses dark text.
- Risk is never shown by colour alone: always icon plus text, and patterns for blind spots and missing data.
- Visible focus rings, logical tab order, labelled controls, and skip-to-content.
- Every chart has an accessible summary sentence and a "View as table" toggle.
- The map always offers a table alternative.

### 5.6 Guided demo for judges (small, in the top bar)

A "Demo tour" button opens a dismissible 5-step side card. Each step has one sentence and a "Go" button that navigates and applies the right filters:

1. **Overview:** what needs attention this month.
2. **Risk map:** a High-risk district and its top 3 reasons.
3. **Blind-spot analysis:** a low-reporting district flagged as a potential blind spot, with its evidence.
4. **Action Centre:** assign a test-kit and audit task, then mark it In Progress.
5. **Reports:** generate a Hindi or Tamil bulletin preview.

Use the seeded demo districts so the tour always shows the same story.

**Sidebar (7 pages):**
1. Overview
2. National Risk Map
3. District Detail
4. Blind-Spot Analysis
5. Action Centre
6. Reports & Bulletins
7. Methodology & Data

District Detail opens from any district click. Its sidebar link opens a searchable district picker.

**Top bar:**
- Logo
- `DistrictSearch`
- Language selector (EN / हिन्दी)
- Profile menu, containing:
  - a role switcher (District Officer / Evaluator)
  - "Reset demo data"

No login screen: the app opens on the Overview as a District Officer.

## 6. Map and boundaries (important)

- Load district boundaries from `public/geo/india_districts.topojson`. The team supplies this file, and it must follow **Survey of India official boundaries**, including J&K, Ladakh and Arunachal Pradesh.
- Required properties on each district: `lgd_code`, `district`, `state`. Validate them when the file loads.
- Write `scripts/simplify-boundaries.md` explaining how to simplify the file with mapshaper (target under 3 MB).
- **Do not download, generate or invent boundaries or coordinates.**
- **Do not use external basemap tiles** (OpenStreetMap or similar), because their boundaries may not match official Indian boundaries. Use a plain background with only the team's boundary file.
- If the file is missing or invalid:
  - Show "Boundary file not loaded".
  - Fall back to a **state-grouped tile view**: one square per district, grouped under state headings and coloured by risk, labelled "Schematic view — not geographic".
- The table view always works.

## 7. Demo data rules

- Use a seeded generator (fixed seed) in `services/mock/` that produces about 60 **real district names** across about 12 states.
- Set `lgd_code` to `null` unless the team supplies `public/data/lgd_districts.csv`. Never invent LGD codes.
- Generate monthly series from Jan 2018 up to the **demo "as-of" month** (`DEMO_AS_OF`, a config value defaulting to the current month), with a realistic monsoon pattern: a peak from July to November and lows in the dry season.
- Forecasts run 1–3 months beyond `DEMO_AS_OF`. The Methodology & Data page explains that real district data ends in 2022 and the demo timeline is synthetic.
- The demo covers about 60 districts, so "Districts Monitored" shows that number. On the map, every other district uses the "No data" pattern, never Low risk.
- Label all demo forecasts as synthetic.
- Include deliberate examples for the demo:
  - high risk with a blind spot
  - low risk with a blind spot
  - missing months
  - stale data
- Give every synthetic number a `source: "synthetic"` flag, and render a small "Synthetic" tag next to it.
- Model results in demo mode: show "Validation pending — results will appear after the backtest is run." **Do not show any example accuracy charts.**

## 8. Pages

Build in this order. Phases 1–4 must be fully polished.

### Phase 1: App shell and Overview

**Overview: "India Dengue Surveillance Overview"**
- Subtitle: "Early warnings. Stronger surveillance. Better preparedness."
- Header:
  - last-run timestamp
  - horizon selector (1 / 2 / 3 months)
  - state filter
- **"Needs attention this month" strip** at the very top: up to 3 plain-language alert cards. Example: "Madurai, Tamil Nadu — High risk + potential blind spot. Suggested: send testing team." Each card has "View district" and "Create action" buttons.
- KPI cards. Each card has a value, a trend only where valid, a one-line explanation, and a click that opens a filtered view.
  - Districts Monitored
  - High / Very High Risk Districts
  - Potential Blind Spots
  - Needing Immediate Attention (high risk plus a blind spot)
- Panels:
  - mini risk map
  - top 10 forecast-risk districts
  - blind-spot alerts
  - recommended actions (top 5, linking to the Action Centre)
  - 2026 context statistic card
- Clicking any district opens District Detail.

### Phase 2: National Risk Map

- A risk choropleth with the blind-spot hatch overlay.
- Two layers: **Forecast risk** and **Blind-spot overlay** (on/off toggle).
- Horizon toggle (1 / 2 / 3 months).
- Zoom, pan and reset controls; a legend; hover tooltips.
- `DistrictSearch` zooms the map to the chosen district.
- Clicking a district opens a side panel showing:
  - name and state
  - risk category and probability
  - case trend sparkline
  - testing figures
  - data freshness
  - SHAP top 3 reasons (or "not available")
  - an "Open district page" link
- A "Map / Table" switch, where the table can be sorted and filtered.

### Phase 3: Blind-Spot Analysis, "Where Dengue May Be Going Undetected"

- An explainer card with the core message and the experimental label.
- Charts:
  - reported cases vs testing (scatter with an expected line)
  - testing and reporting-completeness trends
  - fever admissions vs dengue reports
- A ranked list of potential blind spots. Each entry shows:
  - the breakdown of the five parts
  - the evidence behind the alert
  - data-quality warnings
- Review buttons: **Acknowledge**, **Flag for audit** and **Dismiss**, each with an optional reason.
  - Each review records who made it, their role and a timestamp, shown inline as a history line.
  - Each review calls `POST /blind-spots/{id}/review` (mocked).
- Evaluators can view but not review.

### Phase 4: Action Centre

The decision matrix generates the recommendations:

| | Potential blind spot | No blind spot detected |
|---|---|---|
| **High risk** | Prioritise field surveillance, testing teams, test-kit allocation and vector-control assessment | Strengthen preparedness, clinical readiness and vector control |
| **Low risk** | Audit testing and reporting, check completeness, investigate possible under-reporting | Routine surveillance; monitor for changes |

Each task shows:
- district
- severity
- reason
- suggested action
- priority
- responsible team
- status (Pending / In Progress / Completed)
- notes with timestamps

What users can do:
- Assign tasks, change their status and add notes.
- Filter by district, priority and status.
- Every change goes through a confirmation dialog and adds an inline history line.
- Evaluators have read-only access.

A permanent note on the page: "Recommendations need human review and approval. ResilientEpi does not start interventions."

### Phase 5: District Detail and Reports

**District Detail**
- Status header and the 1 / 2 / 3-month forecast.
- Forecast chart showing the **model** forecast, the **actual cases**, and **one baseline at a time**, chosen from a baseline dropdown (seasonal naive / persistence / historical average). This keeps the chart within 4 series. Include a horizon switch.
- Charts for:
  - historical cases
  - testing volume and coverage
  - fever admissions
  - rainfall, temperature and humidity
- Reporting completeness and data freshness.
- Blind-spot score with its breakdown.
- SHAP top 3 reasons.
- Recommended actions.
- Every chart has a date-range selector.
- A clear legend:
  - **Observed**: solid line
  - **Forecast**: dashed line, with an uncertainty band only if the data provides one
  - **Experimental**: hatched

**Reports & Bulletins**
- Generate a district, state or national bulletin containing:
  - forecast summary
  - risk categories
  - blind-spot alerts
  - key factors
  - recommended actions
  - data limitations
  - generation date
- Bulletin language: English, Hindi or Tamil.
- Print-friendly preview, with PDF via print.
- CSV export (this page is the single place for all exports).
- Footer on every bulletin: "Demonstration bulletin — not an official government communication."
- Mark machine-translated text "Translation pending review".

### Phase 6: Methodology & Data (one page, three tabs)

1. **Method:** the content of Section 2 written for non-technical officials — target, models, features, the blind-spot parts and weights, and the validation plan.
2. **Model results:** the metrics listed in Section 2, model vs baselines, results by horizon and by state, model version and last evaluation date, and limitations. In demo mode, show "Validation pending" (see Section 7).
3. **Data sources:** HMIS, IDSP, NCVBDC, IMD (imdlib) and Open-Meteo. For each one show:
   - a type tag: Live / Imported historical / Delayed / Synthetic demo
   - status
   - last successful update
   - coverage period
   - missing-data warnings

## 9. API contract (typed, mocked for now)

```
GET   /api/v1/overview?horizon=&state=
GET   /api/v1/risk-map?horizon=
GET   /api/v1/districts?search=&state=
GET   /api/v1/districts/{district_id}
GET   /api/v1/districts/{district_id}/explanations?horizon=
GET   /api/v1/blind-spots?state=
POST  /api/v1/blind-spots/{id}/review
GET   /api/v1/actions?district=&priority=&status=
POST  /api/v1/actions
PATCH /api/v1/actions/{action_id}
POST  /api/v1/reports/generate
GET   /api/v1/model-performance
GET   /api/v1/data-sources
```

- Put request and response types in `src/types/`.
- Mock responses add 300–800 ms of delay.
- Validate all form input with zod.
- Document `POST /api/v1/auth/login` in the README as future work only.

## 10. Safety and reliability (frontend scope)

- **Roles in the demo:**
  - District Officer: can review alerts and edit actions.
  - Evaluator: read-only.
  - The README describes the full role-based access planned for the backend (Admin, State Officer, District Officer, Evaluator), plus authentication and audit logging.
- No API keys in the frontend; use environment variables only.
- No patient-level or personally identifiable data anywhere.
- Always show data freshness and uncertainty.
- Missing reports are never treated as low prevalence: show "No data", never 0.
- Keep the blind-spot indicator visually separate from confirmed case counts.

## 11. Deliverables and acceptance checklist

- [ ] `npm install && npm run dev` works, and `npm run build` and `npm run lint` pass.
- [ ] All 7 sidebar pages work, with active-page highlighting and mobile navigation.
- [ ] Playwright screenshots at 375, 768 and 1440 px show no overflow, overlap or unreadable text.
- [ ] Every district view uses the same DistrictPanel, and every alert has a plain-language summary sentence.
- [ ] Filters persist in the URL, and the `/` shortcut focuses search.
- [ ] The 5-step demo tour runs from start to finish.
- [ ] Every chart has a summary sentence and a "View as table" toggle.
- [ ] The horizon and state filters update every relevant view, and district search works everywhere.
- [ ] KPI cards, the map, tables and charts are interactive, and tables sort and filter.
- [ ] Blind-spot reviews and Action Centre updates persist in the browser (Zustand `persist` to localStorage) and show history lines. "Reset demo data" clears them.
- [ ] The EN / HI switch translates the menu and headings, and bulletins generate in EN, HI and TA.
- [ ] Every synthetic value is tagged, the demo banner is visible, and no invented accuracy appears anywhere.
- [ ] The map loads the team's boundary file, or falls back to the schematic tile view plus the table.
- [ ] `README.md` covers:
  - setup and environment variables
  - switching to the live API
  - adding the boundary file and the LGD CSV
  - the backend plan: FastAPI endpoints, PostgreSQL tables, and the monthly batch pipeline (ingest → LGD match → features → LightGBM / NB → SHAP → blind-spot score → publish)
- [ ] `CLAUDE.md` is created with the project rules.

Start with Phase 1. Show me the folder structure and the main types before writing any page code.
