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

> Status: Phase 1 scaffolding. Full documentation (live API switch, boundary
> file, LGD CSV, backend plan) is added as the phases complete. See `CLAUDE.md`
> and `docs/PROMPT.md`.
