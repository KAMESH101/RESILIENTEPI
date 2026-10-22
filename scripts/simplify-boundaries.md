# Simplifying the district boundary file

ResilientEpi loads `public/geo/india_districts.topojson`. The team supplies this
file, and it **must follow Survey of India official boundaries** (including J&K,
Ladakh and Arunachal Pradesh). Do not substitute boundaries from any other source.

Target: **under 3 MB** so the map loads quickly on district-office connections.

## Required properties

Every district feature needs:

| Property    | Example        |
|-------------|----------------|
| `lgd_code`  | official LGD district code (string) |
| `district`  | `Madurai`      |
| `state`     | `Tamil Nadu`   |

The app validates these on load. If any are missing, it shows
"Boundary file not loaded" and falls back to the schematic tile view.

## Steps (mapshaper)

```bash
npm install -g mapshaper

# 1. Inspect the source file (shapefile, GeoJSON or TopoJSON)
mapshaper india_districts_source.shp -info

# 2. Keep only the required fields, renaming if the source uses other names
mapshaper india_districts_source.shp \
  -rename-fields lgd_code=LGD_CODE,district=DISTRICT,state=STATE \
  -filter-fields lgd_code,district,state \
  -proj wgs84 \
  -simplify 8% keep-shapes weighting=0.7 \
  -clean \
  -o format=topojson quantization=1e5 public/geo/india_districts.topojson

# 3. Check the size; lower the simplify % (e.g. 5%) if it is still over 3 MB
ls -lh public/geo/india_districts.topojson
```

Notes:

- `keep-shapes` stops small districts from disappearing.
- `-clean` repairs gaps and overlaps introduced by simplification.
- Name the TopoJSON object `districts` if possible (`-rename-layers districts`);
  the loader otherwise uses the first object in the file.
- After simplifying, visually compare the external boundary with the official
  Survey of India map before committing the file.
