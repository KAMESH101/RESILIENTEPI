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

> Status: Phases 1–5 (app shell, seeded mock API, Overview, National Risk Map,
> Blind-Spot Analysis, Action Centre, District Detail, Reports & Bulletins)
> complete. Hindi and Tamil bulletin templates are marked "Translation pending
> review" until a fluent reader checks them. Full documentation (live API
> switch, LGD CSV, backend plan) follows with the last phase. See `CLAUDE.md`
> and `docs/PROMPT.md`.

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
