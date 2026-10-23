# ResilientEpi — working notes for Claude

Frontend prototype of a district-level dengue early-warning platform for India
(1–3 month outbreak-risk forecasts + an **experimental** surveillance blind-spot
indicator). Mock API now; FastAPI + ML pipeline later. Full brief: `docs/PROMPT.md`.

## Commands

```bash
npm install          # install
npm run dev          # dev server (http://localhost:5173)
npm run build        # tsc -b && vite build — must pass before a phase is done
npm run lint         # oxlint — must pass before a phase is done
npm run qa:screens   # Playwright: qa/visual.spec.ts (screenshots → qa/screenshots/,
                     # fails on horizontal overflow or console errors) + qa/flows.spec.ts
BOUNDARY_FIXTURE=/path/to/other.topojson npx playwright test qa/geo.spec.ts
                     # optional: run the geographic checks against a different local file
npx tsx --tsconfig tsconfig.app.json scripts/check-mock.ts 2026-10   # print seeded demo stories
```

First Playwright run needs `npx playwright install chromium`. QA pins
`VITE_DEMO_AS_OF=2026-10` so screenshots are comparable.

## Rules (non-negotiable)

- **Work in phases.** After each phase: build + lint clean, Playwright screenshots at
  375/768/1440 px reviewed and fixed (overflow, overlap, misalignment, unreadable
  text, inconsistent spacing), then a short summary.
- **No dead buttons.** Anything needing a backend shows
  "Demo mode: not sent to a real system".
- **No made-up results.** Never present invented accuracy, uncertainty ranges, SHAP
  values, LGD codes or map boundaries as real. Every synthetic value has
  `source: "synthetic"` and renders a "Synthetic" tag. Model results in demo mode
  show "Validation pending" — no example accuracy charts, ever.
- **Missing data is "No data", never 0 and never Low risk.** `null` = no data.
- **Lean scope.** Ask before adding any page, feature, or dependency not in the brief.
- **Never claim** "first ever", "proven" or "clinically validated". ResilientEpi
  complements IDSP/IHIP; humans make all decisions; nothing triggers interventions.
- **Map:** only `public/geo/india_districts.topojson` — DataMeet Census 2011
  districts (CC BY 2.5 IN, see `public/geo/NOTICE.md`), **filtered to the 12 demo
  states only** so no all-India outline or J&K/Ladakh/Arunachal border is drawn.
  Rebuild with `scripts/build-demo-boundaries.sh`; `qa/boundary-file.spec.ts`
  fails if any other state gets in. On-map credit: "District boundaries ©
  DataMeet (CC BY 2.5 IN) · indicative, not official". No basemap tiles.
  Districts with no 2011 shape (Medchal–Malkajgiri) are never drawn inside a
  parent; they get a note in the table/panel. Fills have NO stroke; only the
  `innerlines` layer (borders shared by two districts) is drawn as lines, so no
  coastal/international edge is ever stroked — hover darkens, focus uses a pin.
  Missing/invalid file → "Boundary file not loaded" + labelled schematic view + table.
- **Blind-spot bands** (≥50 flagged, 35–49 watch) are a demo assumption and the
  UI says so. **Likelihood words** derive from `RISK_BANDS` in `config/risk.ts` only.
- **Provenance:** every record has `source`. `SyntheticTag` always tags synthetic;
  pass `mixed` in views that combine live and synthetic records.
- **LGD codes** are `null` unless `public/data/lgd_districts.csv` is supplied.
- No API keys, no PII, no patient-level data. Env vars only.
- Light theme only. No dark mode.

## Architecture

```
src/
  app/          router, providers, layout (Sidebar, Topbar, MobileNav), session & toast
                stores, URL filters (filters.ts)
  pages/        Overview, RiskMap, DistrictDetail, BlindSpots, ActionCentre,
                Reports, MethodologyData
  components/   shared UI (KpiCard, RiskBadge, DistrictPanel, DataTable, …)
  components/ui shadcn/ui primitives (generated — edit sparingly)
  features/     map/, blindspots/, actions/, reports/
  services/
    api.ts        typed client; reads VITE_API_MODE = "mock" | "live"
    endpoints.ts  one function per endpoint (brief §9)
    mock/         seeded generators + handlers (never imported by pages directly)
  types/        API contracts (snake_case, mirrors the backend); zod schemas in schemas.ts
  config/       risk thresholds, OUTBREAK_PERCENTILE, blind-spot weights, demo settings
  i18n/         en.json, hi.json (UI); bulletin templates en/hi/ta
public/geo/     boundary file (team-supplied)
public/data/    lgd_districts.csv (team-supplied, optional)
scripts/        simplify-boundaries.md, check-mock.ts
qa/             Playwright visual + flow specs
docs/PROMPT.md  the original product brief
```

- Switching `VITE_API_MODE` from `mock` to `live` must be the **only** change needed.
- Pages import from `services/endpoints.ts` via TanStack Query — never from `services/mock/`.
- Filters (horizon, state, …) live in the URL; Zustand holds session state
  (role, demo-tour step) and persisted demo edits (reviews, actions).
- One `DistrictSearch` and one `DistrictPanel`, reused everywhere.

## Gotchas

- **React 18 + shadcn:** current shadcn components assume React 19 (`ref` as a
  prop). Any `components/ui` component used as an `asChild` child or rendered
  inside a Radix Portal/Presence must use `React.forwardRef` (Button and the
  Dialog/Sheet/AlertDialog overlays already do). The QA spec fails on the
  "Function components cannot be given refs" warning.
- zod schemas are re-run by the mock API on already-parsed data, so optional
  fields must accept `null` (`.nullish()`).
- **URL params:** always update them through `useFilters().setParam` /
  `useDistrictPanel()` — they start from the live `window.location.search`.
  React Router's functional `setSearchParams(prev => …)` can be one navigation
  behind in a captured handler and silently undo a change (e.g. the map/table view).
- Leaflet's CSS loads lazily (after ours), so map overrides need extra
  specificity (`.leaflet-container.re-map`).
- On Git Bash, an env value of `/` is rewritten to a Windows path (MSYS) — don't
  pass `/` as a URL through env vars.

## Design conventions

- Tokens in `src/index.css` (`navy-900`, `teal-600`, `cyan-50`, `risk-*`, …).
- Type scale only: `text-xs/sm/base/xl/2xl/3xl` (12/14/16/20/24/30). `tabular-nums` on figures.
- Numbers/dates via `en-IN` formatting (1,23,456 · "Oct 2026").
- Cards `rounded-xl` (12px), buttons `rounded-lg` (8px), `shadow-card`, 8-pt spacing.
- Risk is never colour alone: icon + text. Moderate (yellow) always dark text.
- Observed = solid line; Forecast = dashed + "Forecast" chip; Experimental = hatch + "Experimental" chip.
- Every chart: summary sentence + "View as table". ≤ 4 series. Monsoon (Jun–Sep) shaded.
