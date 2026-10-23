# District boundary file: DataMeet → `public/geo/`

> **The committed file** is built by `scripts/build-demo-boundaries.sh`:
> DataMeet Census 2011 districts, **demo states only**, cleaned and simplified
> (≈ 0.3 MB). See `public/geo/NOTICE.md`. The steps below are for adding LGD
> codes or rebuilding — never add states outside the demo set
> (`qa/boundary-file.spec.ts` will fail).

ResilientEpi draws districts only from a file the team places in `public/geo/`:

- `public/geo/india_districts.topojson` (preferred), or
- `public/geo/india_districts.geojson`

The app never downloads, generates or invents boundaries, and uses no basemap
tiles. If neither file is present (or it fails validation) the map shows
**"Boundary file not loaded"** and falls back to a labelled schematic tile view
plus a table.

Target size: **under 3 MB**.

## Source: DataMeet district boundaries

Planned source: the DataMeet India community maps repository,
<https://github.com/datameet/maps> (`Districts/` folder).

Things to know before using it:

| Point | Detail | What we do |
|---|---|---|
| Licence | The repo README says datasets are **CC BY 4.0** unless stated; the `Districts/` README says **CC BY 2.5 India**. | Confirm the licence of the exact file you use and update `BOUNDARY_ATTRIBUTION` in `src/config/geo.ts`. The attribution is shown under the map. |
| Vintage | District layers are from the **Census 2011** administrative atlas (~640 districts). India now has 780+ districts. | Districts created after 2011 will not have their own shape; data for them shows only in tables. |
| LGD codes | DataMeet features carry Census 2011 names/codes, **not LGD codes**. | Join LGD codes in during preprocessing (below) using `public/data/lgd_districts.csv`. |
| External boundary | Derived from DataMeet's own India outline. | Before committing, visually compare against the **Survey of India** official map (J&K, Ladakh, Arunachal Pradesh). Ladakh became a separate UT in 2019; Census 2011 layers list Leh and Kargil under Jammu & Kashmir — fix the `state` field if needed. |

## Properties the app reads

Each feature needs a district name and a state name; an LGD code is needed for
joining forecasts. The loader accepts these property names (first match wins,
see `BOUNDARY_PROPERTY_ALIASES` in `src/config/geo.ts`):

| Field | Accepted names |
|---|---|
| `lgd_code` | `lgd_code`, `LGD_CODE`, `lgd_district_code` |
| `district` | `district`, `DISTRICT`, `dtname`, `NAME_2` |
| `state` | `state`, `ST_NM`, `STATE`, `stname` |
| `census2011_code` | `census2011_code`, `censuscode`, `DT_CEN_CD`, `dt_code` |

Features without a district or state name make the file invalid. Features
without an LGD code are drawn but render as "No data" until joined.

## LGD crosswalk CSV

`public/data/lgd_districts.csv` — supplied by the team from the Local Government
Directory district download. Columns:

```csv
lgd_code,district,state,census2011_code
```

Never fill LGD codes by hand or by guessing; leave a row out if unknown.

## Steps (mapshaper)

```bash
npm install -g mapshaper

# 1. Inspect the DataMeet file
mapshaper 2011_Dist.shp -info

# 2. Clean, join LGD codes, keep only the needed fields, simplify, write TopoJSON
#    (-clean must come BEFORE -simplify — see notes)
mapshaper 2011_Dist.shp \
  -clean \
  -join public/data/lgd_districts.csv keys=censuscode,census2011_code fields=lgd_code field-types=lgd_code:str,census2011_code:str \
  -rename-fields district=DISTRICT,state=ST_NM \
  -filter-fields lgd_code,district,state,censuscode \
  -proj wgs84 \
  -simplify 8% keep-shapes weighting=0.7 \
  -rename-layers districts \
  -o format=topojson quantization=1e5 public/geo/india_districts.topojson

# 3. Check size and unmatched districts
ls -lh public/geo/india_districts.topojson
mapshaper public/geo/india_districts.topojson -filter '!lgd_code' -info
```

Notes:

- Use the property names the `-info` step prints if they differ from the
  example (`DISTRICT`, `ST_NM`, `censuscode`).
- **Run `-clean` before `-simplify`, not after.** Measured on DataMeet's
  `2011_Dist.shp` (641 districts, 10 MB): clean → simplify 8% gives
  **≈ 0.5 MB**; simplify → clean gives ≈ 3.5 MB (cleaning re-densifies arcs).
- `keep-shapes` stops small districts from disappearing.
- Without the LGD CSV, drop the `-join` line; the app then matches by name
  (with known old spellings, e.g. Gulbarga → Kalaburagi) and says so on the map.
  Medchal–Malkajgiri (created 2016) has no Census 2011 shape.
- Commit the attribution change together with the boundary file.
