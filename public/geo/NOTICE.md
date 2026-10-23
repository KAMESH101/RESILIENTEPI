# Notice: `india_districts.topojson`

## Source

District boundaries from the **DataMeet India community** maps repository,
Census 2011 district layer:
<https://github.com/datameet/maps/tree/master/Districts/Census_2011>
(`2011_Dist.shp`). District names and extents follow the Census of India 2011
Administrative Atlas, as described in that folder's README.

## Licence

**Creative Commons Attribution 2.5 India (CC BY 2.5 IN)**, as stated in the
DataMeet `Districts/` folder README.
<https://creativecommons.org/licenses/by/2.5/in/>

Credit shown on every map: *District boundaries © DataMeet (CC BY 2.5 IN) ·
indicative, not official*.

## Changes made

Simplified with mapshaper and filtered to demo states:

- Kept only districts of the 12 ResilientEpi demo states: Delhi, Gujarat,
  Karnataka, Kerala, Maharashtra, Odisha, Punjab, Rajasthan, Tamil Nadu,
  Telangana, Uttar Pradesh, West Bengal. No other state is included, so no
  all-India outline is drawn.
- Telangana's 10 districts were taken from the 2011 "Andhra Pradesh" layer
  and relabelled "Telangana"; "NCT of Delhi" was relabelled "Delhi".
- Fields reduced to `district`, `state`, `censuscode`.
- Topology cleaned, then simplified to 8% of vertices (`keep-shapes`),
  quantised to 1e5.

Reproduce with `scripts/build-demo-boundaries.sh path/to/2011_Dist.shp`.

## Limitations

- **Indicative, not official.** These are not Survey of India boundaries. Do
  not use them for any official or legal purpose.
- Census 2011 vintage: districts created after 2011 (for example
  Medchal–Malkajgiri, 2016) have no shape and appear only in tables.
- Outer edges of border districts follow DataMeet's depiction.
