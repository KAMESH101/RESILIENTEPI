# ResilientEpi

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
```

## Boundary file

The map uses only a team-supplied file in `public/geo/` (planned: DataMeet
district boundaries with attribution, LGD codes joined during preprocessing).
Without it, the app shows a labelled schematic view plus a table. See
[`scripts/simplify-boundaries.md`](scripts/simplify-boundaries.md).

> Status: Phase 1 (app shell, seeded mock API, Overview) complete. Full
> documentation (live API switch, LGD CSV, backend plan) is added as the phases
> complete. See `CLAUDE.md` and `docs/PROMPT.md`.
