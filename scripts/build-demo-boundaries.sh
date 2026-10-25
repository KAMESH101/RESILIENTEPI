#!/usr/bin/env sh
# Rebuilds public/geo/india_districts.topojson from DataMeet's Census 2011
# district shapefile, keeping ONLY the 12 demo states (no India outline, no
# J&K / Ladakh / Arunachal Pradesh). See public/geo/NOTICE.md and
# scripts/simplify-boundaries.md.
#
# Output: one TopoJSON with two objects sharing arcs —
#   districts   polygons, drawn as fills with NO outline
#   innerlines  only the borders BETWEEN two districts, drawn as lines
# so no outer (state-union / international / coastal) edge is ever stroked.
# The second -clean (after -simplify) repairs slivers that would otherwise leave
# short outer-edge segments in innerlines (qa/boundary-file.spec.ts checks this).
#
# Usage: scripts/build-demo-boundaries.sh path/to/2011_Dist.shp
#   (download 2011_Dist.{shp,shx,dbf,prj} from
#    https://github.com/datameet/maps/tree/master/Districts/Census_2011)
set -eu

SRC="${1:?path to DataMeet 2011_Dist.shp}"
OUT="$(dirname "$0")/../public/geo/india_districts.topojson"

# Demo states as named in the 2011 file. Telangana did not exist in 2011, so its
# 10 districts are taken from Andhra Pradesh and relabelled below.
STATES='["Tamil Nadu","Kerala","Karnataka","Maharashtra","NCT of Delhi","Uttar Pradesh","West Bengal","Gujarat","Rajasthan","Odisha","Punjab"]'
TELANGANA='["Adilabad","Hyderabad","Karimnagar","Khammam","Mahbubnagar","Medak","Nalgonda","Nizamabad","Rangareddy","Warangal"]'

npx --yes mapshaper "$SRC" \
  -clean \
  -filter "$STATES.indexOf(ST_NM) > -1 || (ST_NM == 'Andhra Pradesh' && $TELANGANA.indexOf(DISTRICT) > -1)" \
  -each "ST_NM = ST_NM == 'NCT of Delhi' ? 'Delhi' : ST_NM == 'Andhra Pradesh' ? 'Telangana' : ST_NM" \
  -rename-fields district=DISTRICT,state=ST_NM \
  -filter-fields district,state,censuscode \
  -simplify 8% keep-shapes weighting=0.7 \
  -clean \
  -rename-layers districts \
  -innerlines + name=innerlines \
  -o format=topojson quantization=1e5 'target=*' "$OUT"

echo "Wrote $OUT"
