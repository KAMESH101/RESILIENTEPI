# ResilientEpi

[![CI](https://github.com/KAMESH101/RESILIENTEPI/actions/workflows/ci.yml/badge.svg)](https://github.com/KAMESH101/RESILIENTEPI/actions/workflows/ci.yml)

District-level dengue outbreak early warning for India — a frontend prototype
with a mock API. Forecasts the probability that dengue cases exceed each
district's outbreak threshold 1–3 months ahead, and shows an **experimental**
surveillance blind-spot indicator.

> "Low reported dengue doesn't always mean low dengue — sometimes it means low testing."

ResilientEpi complements IDSP/IHIP; it does not replace them. Humans make all
decisions. **Demo mode uses synthetic data and is not for operational use.**

## Setup

```bash
npm install
cp .env.example .env   # optional
npm run dev
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_MODE` | `mock` | `mock` uses seeded synthetic data; `live` calls the backend |
| `VITE_API_BASE_URL` | `/api/v1` | backend base URL (live mode) |
| `VITE_DEMO_AS_OF` | current month | pin the demo "as-of" month (`YYYY-MM`) |

## Quality checks

```bash
npm run build && npm run lint
npx playwright install chromium   # first time only
npm run qa:screens                # screenshots at 375/768/1440 px + behaviour flows
                                  # (includes the geographic map and the boundary-file guard)
```

CI (GitHub Actions, Ubuntu) runs the build, lint and the full Playwright suite
on every push and pull request; `main` is merged only when it is green. Each run
uploads the Playwright report, the screenshots and the built `dist/` as
artifacts.

## Where to run it

Vite 8's bundler (rolldown) uses a native module that **Windows Smart App
Control / Application Control can block** ("An Application Control policy has
blocked this file"). Don't change Windows security settings — use Linux:

**WSL2** (day-to-day work on Windows)

```bash
# inside the WSL2 (Ubuntu) shell — keep the repo in the Linux file system (~/),
# NOT under /mnt/c: Windows-mounted folders are much slower
cd ~
git clone https://github.com/KAMESH101/RESILIENTEPI.git
cd RESILIENTEPI
npm ci
npm run dev -- --host   # open the printed URL in your Windows browser
npx playwright install --with-deps chromium && npm run qa:screens
```

Node 20.19+ (or 22.12+) is required; in WSL install it with `nvm`.

**GitHub Codespaces** — on the repo page choose *Code → Codespaces → Create
codespace on main*, then run `npm ci && npm run dev`. The forwarded port opens
in the browser.

## Demo laptop: serve the pre-built app

Running the app from a build needs no bundler, so it works even where rolldown
is blocked.

1. Open the latest green CI run on GitHub → **Artifacts** → download **dist**.
2. Unzip it into a folder named `dist`.
3. Serve it (single-page mode, so deep links like `/map?h=2` work):

   ```bash
   npx serve -s dist
   ```

   Then open <http://localhost:3000>. Do this once before demo day while
   online, so `serve` is cached; or run it from WSL2 / Codespaces instead.

The demo "as-of" month is the current month at the time you open the app.

## Boundary file

`public/geo/india_districts.topojson` holds DataMeet's Census 2011 district
boundaries (CC BY 2.5 IN — see [`public/geo/NOTICE.md`](public/geo/NOTICE.md)),
filtered to the 12 demo states and simplified (≈ 0.3 MB). They are indicative,
not official. Rebuild with `scripts/build-demo-boundaries.sh`; to add LGD codes
see [`scripts/simplify-boundaries.md`](scripts/simplify-boundaries.md). Without a
valid file the app shows a labelled schematic view plus a table.

### LGD codes (`public/data/lgd_districts.csv`, optional)

LGD codes are **never invented**. Without this file every `lgd_code` is null
and the map matches districts to shapes by name (and says so on the map).
To supply codes, add the Local Government Directory district list as:

```csv
lgd_code,district,state,census2011_code
```

The mock API fills each demo district's `lgd_code` from this file (matched on
state + district name). To join codes into the boundary file as well, see
[`scripts/simplify-boundaries.md`](scripts/simplify-boundaries.md).

> Status: Phases 1–6 complete (app shell, seeded mock API, Overview, National
> Risk Map, Blind-Spot Analysis, Action Centre, District Detail, Reports &
> Bulletins, Methodology & Data). Hindi and Tamil bulletin templates are marked
> "Translation pending review" until a fluent reader checks them. See
> `CLAUDE.md` and `docs/PROMPT.md`.

## Switching to the live API

The only change is the environment:

```bash
VITE_API_MODE=live
VITE_API_BASE_URL=https://api.example.org/api/v1   # or /api/v1 behind a reverse proxy
```

The client (`src/services/api.ts`) then calls the backend with `fetch` and
never loads the mock code. The backend must implement the endpoints below with
the request/response shapes in `src/types/` (snake_case, zod schemas in
`src/types/schemas.ts`). Records carry `source: "observed" | "model"`; anything
still synthetic keeps `source: "synthetic"` and is tagged in the UI. Requests
send cookies (`credentials: "include"`), so serve the API from the same site or
configure CORS for it. No API keys live in the frontend.

## Bulletins and exports

- Bulletins (district, state, national) are **templates**: only fixed labels
  are translated (`src/i18n/bulletin.ts`); every number, district name and
  action comes from the same data as the rest of the app.
- Hindi and Tamil use bundled Noto Sans Devanagari / Noto Sans Tamil
  (`@fontsource`, no CDN), so printed PDFs never show empty boxes.
- Print / Save as PDF: A4, the generation date in the header and the
  "Demonstration bulletin — not an official government communication" footer
  on every page.
- CSV exports (Reports page only): UTF-8 with BOM, a `source` column, and an
  apostrophe before any cell starting with `=`, `+`, `-` or `@`.

## Backend plan (future work — not built in this repo)

**Stack:** Python FastAPI, PostgreSQL, pandas, GeoPandas, imdlib, LightGBM,
statsmodels, SHAP.

### Endpoints (`/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/overview?horizon=&state=` | KPIs, attention items, top risk, blind-spot alerts, top actions |
| GET | `/risk-map?horizon=` | One summary per district (map and table) |
| GET | `/districts?search=&state=` | District list and states |
| GET | `/districts/{district_id}` | District detail: forecasts, baselines, history, blind spot, tasks |
| GET | `/districts/{district_id}/explanations?horizon=` | SHAP top reasons, or `not_available` |
| GET | `/blind-spots?state=` | Experimental blind-spot assessments with reviews |
| POST | `/blind-spots/{id}/review` | Acknowledge / Flag for audit / Dismiss (+ reason) |
| GET | `/actions?district=&priority=&status=&state=` | Tasks from the decision matrix, audit flags and officers |
| POST | `/actions` | Create a task |
| PATCH | `/actions/{action_id}` | Assign, change status (Completed needs a note), add note |
| POST | `/reports/generate` | Language-neutral bulletin facts (frontend renders EN/HI/TA) |
| GET | `/model-performance` | Backtest metrics vs baselines, or `pending` |
| GET | `/data-sources` | Source type, status, last update, coverage, warnings |
| POST | `/auth/login` | **Future work only** — not used by the demo |

### PostgreSQL tables

| Table | Holds |
|---|---|
| `districts` | `lgd_code` (PK), name, state, `census2011_code` |
| `observations_monthly` | `lgd_code`, month, reported cases, tests, positivity, fever admissions, reporting completeness, source, ingested_at (missing = no row, never 0) |
| `climate_monthly` | `lgd_code`, month, rainfall, temperature, humidity; ONI by month |
| `model_runs` | run id, as-of month, model version, started/finished, status |
| `forecasts` | run, `lgd_code`, horizon, target month, probability, category, expected cases, interval (nullable), threshold |
| `explanations` | run, `lgd_code`, horizon, rank, feature, SHAP value, sentence |
| `blind_spot_scores` | run, `lgd_code`, score, band, five components, evidence, data-quality warnings |
| `blind_spot_reviews` | assessment, decision, reason, user, role, created_at |
| `actions`, `action_events`, `action_notes` | tasks with stable ids, every change as an event (history), notes |
| `model_performance` | model version, model, horizon, state, metric, value, evaluated_at |
| `data_sources` | id, type tag, status, last success, coverage |
| `users`, `roles`, `audit_log` | accounts, role assignments, every write with who/when/what |

### Monthly batch pipeline

```
ingest (HMIS, IDSP/IHIP, NCVBDC, IMD via imdlib, Open-Meteo)
  → LGD match (all sources joined on LGD district codes)
  → features (case lags 1–3 + same month last year, climate lags 1–3, ONI,
              neighbour cases, testing, fever admissions, month/season)
  → LightGBM (national pooled classifier) / negative-binomial counts + baselines
  → SHAP (top 3 reasons per district and horizon)
  → blind-spot score (five weighted parts, config-driven)
  → publish (write the run, flip "last monthly run", invalidate caches)
```

Runs once a month for 700+ districts; "Last updated" in the UI is the finish
time of the last run, not real time. A walk-forward backtest writes
`model_performance` before any results are shown.

### Access control (planned)

| Role | Can |
|---|---|
| Admin | Manage users, roles, data sources and configuration |
| State Officer | Everything a District Officer can, for all districts in their state |
| District Officer | Review blind spots and edit actions for their district(s) |
| Evaluator | Read-only |

Authentication via `POST /api/v1/auth/login` (session cookie); every write is
recorded in `audit_log`. The demo has only District Officer and Evaluator,
switched from the profile menu, with no login.
