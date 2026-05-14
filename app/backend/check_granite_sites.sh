#!/bin/bash

cd ~/Fire-Vulnerability-App/app/backend || exit 1

../../venv/bin/python - <<'PY'
import geopandas as gpd

sites_path = "data/risk_outputs/recorded_site_priority.geojson"
granite_path = "data/risk_outputs/precaution_zone.geojson"

sites = gpd.read_file(sites_path)
granite = gpd.read_file(granite_path)

if sites.crs != granite.crs:
    granite = granite.to_crs(sites.crs)

matches_found = []

for _, site in sites.iterrows():
    matches = granite[granite.geometry.intersects(site.geometry)]
    if not matches.empty:
        matches_found.append(site)

print(f"Total sites: {len(sites)}")
print(f"Sites with granite/outcrop overlap: {len(matches_found)}")

print("\nExample matching sites:")
for site in matches_found[:20]:
    print("-" * 40)
    print("Site ID:", site.get("ach_identifier"))
    print("Site name:", site.get("site_name"))
    print("Priority level:", site.get("recorded_site_priority_level"))
PY
