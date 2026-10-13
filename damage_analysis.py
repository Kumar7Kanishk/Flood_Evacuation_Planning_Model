#!/usr/bin/env python3
"""
Damage analysis for Track B (Mapping Flood Damage from Space).

Answers: "What was damaged?"
  Inputs : flood / debris mask (GeoTIFF or vector) from the satellite change-detection step
           + PRE-EVENT OpenStreetMap (ohsome API snapshot, default 2026-07-27)
  Outputs: affected buildings, roads, bridges (GeoJSON + one GeoPackage for QGIS),
           and damage_summary.json (every number the report / copilot may quote).

DATA RULES: only pre-event OSM (snapshot before 26 Aug 2026) and your own flood mask may be
used as input. Never feed Copernicus EMS / UNOSAT maps in here - use them only to validate.

Example
-------
python damage_analysis.py --flood outputs/flood_mask.tif --flood-values "1=water,2=debris" \
       --out outputs/damage

Attribution (put in every submission):
  Contains modified Copernicus Sentinel data 2026.
  (c) OpenStreetMap contributors (ODbL).
"""
import argparse
import hashlib
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import geopandas as gpd
import requests
from shapely.geometry import box

OHSOME_URL = "https://api.ohsome.org/v1/elements/geometry"
DEFAULT_SNAPSHOT = "2026-07-27"  # latest pre-event snapshot (must be < 2026-08-26)
EVENT_DATE = "2026-08-26"

FILTERS = {
    "buildings": "building=* and geometry:polygon",
    "roads": "highway=* and type:way and geometry:line",
    "bridges": "bridge=* and bridge!=no and type:way",
}


# ----------------------------------------------------------------------------
# 1. Flood mask -> polygons
# ----------------------------------------------------------------------------
def parse_values(text):
    """'1=water,2=debris' -> {1:'water', 2:'debris'};  '1' -> {1:'flood'}"""
    out = {}
    for part in text.split(","):
        part = part.strip()
        if "=" in part:
            k, v = part.split("=", 1)
            out[int(k)] = v.strip()
        else:
            out[int(part)] = "flood"
    return out


def load_polygons(path, values):
    """Load a raster mask (tif) or a vector file as polygons with a 'kind' column."""
    path = str(path)
    if path.lower().endswith((".tif", ".tiff")):
        import rasterio
        from rasterio import features

        with rasterio.open(path) as src:
            data = src.read(1)
            mask = np.isin(data, list(values.keys()))
            if src.nodata is not None:
                mask &= data != src.nodata
            geoms = []
            for geom, val in features.shapes(
                data.astype("int32"), mask=mask, transform=src.transform
            ):
                geoms.append({"geometry": geom, "kind": values[int(val)]})
            gdf = gpd.GeoDataFrame.from_features(
                [{"type": "Feature", "geometry": g["geometry"], "properties": {"kind": g["kind"]}}
                 for g in geoms],
                crs=src.crs,
            )
    else:
        gdf = gpd.read_file(path)
        if "kind" not in gdf.columns:
            gdf["kind"] = "flood"
    gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()].copy()
    return gdf[["kind", "geometry"]]


def clean_flood(gdf, utm, min_area):
    gdf = gdf.to_crs(utm)
    gdf["geometry"] = gdf.geometry.buffer(0)  # repair invalid rings
    gdf = gdf[gdf.area >= min_area].reset_index(drop=True)  # drop speckle
    return gdf


# ----------------------------------------------------------------------------
# 2. Pre-event OSM from ohsome (tiled, cached, resumable)
# ----------------------------------------------------------------------------
def _post_ohsome(bbox, flt, snapshot, retries=4):
    payload = {
        "bboxes": ",".join(f"{v:.6f}" for v in bbox),
        "time": snapshot,
        "filter": flt,
        "properties": "tags",
    }
    for attempt in range(retries):
        try:
            r = requests.post(OHSOME_URL, data=payload, timeout=300)
            if r.status_code == 200:
                return r.json()
            print(f"  ohsome HTTP {r.status_code}: {r.text[:150]}", file=sys.stderr)
        except requests.RequestException as e:
            print(f"  ohsome error: {e}", file=sys.stderr)
        time.sleep(2 ** (attempt + 1))
    raise RuntimeError("ohsome API failed repeatedly for bbox %s" % (bbox,))


def fetch_osm(bbox, layer, snapshot, cache_dir, tile=0.1):
    """bbox = (minx, miny, maxx, maxy) in EPSG:4326."""
    if snapshot >= EVENT_DATE:
        raise ValueError("OSM snapshot must be BEFORE the event (%s)." % EVENT_DATE)
    flt = FILTERS[layer]
    minx, miny, maxx, maxy = bbox
    xs = np.arange(minx, maxx, tile)
    ys = np.arange(miny, maxy, tile)
    cache_dir.mkdir(parents=True, exist_ok=True)
    feats = {}
    n = len(xs) * len(ys)
    i = 0
    for x in xs:
        for y in ys:
            i += 1
            b = (x, y, min(x + tile, maxx), min(y + tile, maxy))
            key = hashlib.md5(f"{b}|{flt}|{snapshot}".encode()).hexdigest()
            cf = cache_dir / f"{layer}_{key}.json"
            if cf.exists():
                data = json.loads(cf.read_text())
            else:
                print(f"[{layer}] tile {i}/{n} ...")
                data = _post_ohsome(b, flt, snapshot)
                cf.write_text(json.dumps(data))
            for f in data.get("features", []):
                fid = f["properties"].get("@osmId")
                feats.setdefault(fid, f)
    if not feats:
        return gpd.GeoDataFrame({"osm_id": []}, geometry=[], crs="EPSG:4326")
    gdf = gpd.GeoDataFrame.from_features(list(feats.values()), crs="EPSG:4326")
    gdf = gdf.rename(columns={"@osmId": "osm_id"})
    keep = ["osm_id", "geometry"] + [
        c for c in ("building", "name", "highway", "bridge", "amenity", "surface", "man_made")
        if c in gdf.columns
    ]
    return gdf[keep]


# ----------------------------------------------------------------------------
# 3. Overlay helpers
# ----------------------------------------------------------------------------
def _measure(gs):
    """area for polygons, length for lines."""
    poly = gs.geom_type.isin(["Polygon", "MultiPolygon"])
    return pd.Series(np.where(poly, gs.area, gs.length), index=gs.index)


def overlap_table(layer, flood):
    """Per feature: total overlap with flood (m2 or m) and the dominant flood kind."""
    cols = ["flood_overlap", "flood_kind"]
    if layer.empty or flood.empty:
        return pd.DataFrame(columns=cols)
    j = gpd.sjoin(layer[["geometry"]], flood[["kind", "geometry"]], predicate="intersects", how="inner")
    if j.empty:
        return pd.DataFrame(columns=cols)
    lg = gpd.GeoSeries(layer.geometry.loc[j.index].values, index=j.index, crs=layer.crs)
    fg = gpd.GeoSeries(flood.geometry.loc[j["index_right"]].values, index=j.index, crs=layer.crs)
    inter = lg.intersection(fg, align=True)
    pairs = pd.DataFrame({"idx": j.index, "kind": j["kind"].values, "m": _measure(inter).values})
    pairs = pairs[pairs.m > 0]
    if pairs.empty:
        return pd.DataFrame(columns=cols)
    by_kind = pairs.groupby(["idx", "kind"])["m"].sum().reset_index()
    total = by_kind.groupby("idx")["m"].sum().rename("flood_overlap")
    dom = by_kind.sort_values("m", ascending=False).drop_duplicates("idx").set_index("idx")["kind"]
    return pd.concat([total, dom.rename("flood_kind")], axis=1)


def within_distance(layer, flood, dist):
    """Index of features within `dist` metres of flood."""
    if layer.empty or flood.empty:
        return pd.Index([])
    buf = gpd.GeoDataFrame(geometry=flood.geometry.buffer(dist), crs=flood.crs)
    j = gpd.sjoin(layer[["geometry"]], buf, predicate="intersects", how="inner")
    return j.index.unique()


# ----------------------------------------------------------------------------
# 4. The three damage analyses
# ----------------------------------------------------------------------------
def analyse_buildings(b, flood, near_m):
    b = b.reset_index(drop=True)
    b["bld_area_m2"] = b.area
    ov = overlap_table(b, flood)
    b = b.join(ov)
    b["flood_overlap"] = b["flood_overlap"].fillna(0.0)
    b["overlap_frac"] = (b["flood_overlap"] / b["bld_area_m2"].replace(0, np.nan)).fillna(0).clip(0, 1)
    near = set(within_distance(b, flood, near_m))

    def status(r):
        if r.flood_overlap > 0:
            return "inundated" if r.overlap_frac >= 0.5 else "partially_hit"
        return "near_flood" if r.name in near else "unaffected"

    b["status"] = b.apply(status, axis=1)
    return b


def analyse_roads(r, flood, min_len):
    r = r.reset_index(drop=True)
    r["length_m"] = r.length
    ov = overlap_table(r, flood)
    r = r.join(ov)
    r["flood_overlap"] = r["flood_overlap"].fillna(0.0)
    r = r.rename(columns={"flood_overlap": "flooded_len_m"})
    r["flooded_frac"] = (r["flooded_len_m"] / r["length_m"].replace(0, np.nan)).fillna(0).clip(0, 1)
    # "affected" = treat as impassable in the cut-off analysis
    r["affected"] = r["flooded_len_m"] >= min_len
    return r


def analyse_bridges(br, flood, buf_m):
    br = br.reset_index(drop=True)
    ov = overlap_table(br, flood)
    br = br.join(ov)
    br["flood_overlap"] = br["flood_overlap"].fillna(0.0)
    near = set(within_distance(br, flood, buf_m))

    def status(row):
        if row.flood_overlap > 0:
            return "likely_damaged"   # flood water/debris reaches the structure
        return "at_risk" if row.name in near else "unaffected"

    br["status"] = br.apply(status, axis=1)
    return br


# ----------------------------------------------------------------------------
# 5. Summary (single source of truth for every number in report / copilot)
# ----------------------------------------------------------------------------
def build_summary(flood, bld, rds, brg, args):
    s = {
        "parameters": {
            "osm_snapshot": args.snapshot,
            "near_flood_distance_m": args.near_m,
            "bridge_buffer_m": args.bridge_buffer,
            "min_flooded_road_length_m": args.min_road_m,
            "min_flood_polygon_area_m2": args.min_flood_area,
        },
        "flood": {
            "area_km2": round(float(flood.area.sum()) / 1e6, 3),
            "area_km2_by_kind": {k: round(float(v) / 1e6, 3) for k, v in flood.groupby("kind").area.sum().items()},
            "polygons": int(len(flood)),
        },
        "buildings": {
            "total_in_aoi": int(len(bld)),
            **{k: int(v) for k, v in bld["status"].value_counts().items()},
        },
        "roads": {
            "total_length_km": round(float(rds["length_m"].sum()) / 1000, 2),
            "flooded_length_km": round(float(rds["flooded_len_m"].sum()) / 1000, 2),
            "segments_affected": int(rds["affected"].sum()),
        },
        "bridges": {
            "total_in_aoi": int(len(brg)),
            **{k: int(v) for k, v in brg["status"].value_counts().items()},
        },
        "attribution": [
            "Contains modified Copernicus Sentinel data 2026.",
            "(c) OpenStreetMap contributors.",
        ],
    }
    if "building" in bld.columns:
        hit = bld[bld.status.isin(["inundated", "partially_hit"])]
        s["buildings"]["hit_by_osm_type"] = {str(k): int(v) for k, v in hit["building"].value_counts().head(10).items()}
    if "highway" in rds.columns:
        g = rds.groupby("highway")["flooded_len_m"].sum().sort_values(ascending=False).head(10)
        s["roads"]["flooded_km_by_class"] = {str(k): round(float(v) / 1000, 2) for k, v in g.items() if v > 0}
    hb = brg[brg.status == "likely_damaged"]
    s["bridges"]["likely_damaged_list"] = [
        {"osm_id": str(r.osm_id), "name": (r["name"] if "name" in brg.columns and pd.notna(r.get("name")) else None)}
        for _, r in hb.iterrows()
    ][:50]
    return s


# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--flood", required=True, help="flood mask: GeoTIFF (class raster) or vector file")
    ap.add_argument("--flood-values", default="1=flood", help='raster values counted as flood, e.g. "1=water,2=debris"')
    ap.add_argument("--exclude", help="optional permanent-water mask (tif/vector) to subtract")
    ap.add_argument("--out", default="outputs/damage")
    ap.add_argument("--snapshot", default=DEFAULT_SNAPSHOT, help="ohsome OSM date (must be before 2026-08-26)")
    ap.add_argument("--bbox", help="minx,miny,maxx,maxy (EPSG:4326); default = flood extent + margin")
    ap.add_argument("--tile", type=float, default=0.1, help="ohsome tile size in degrees")
    ap.add_argument("--min-flood-area", type=float, default=500.0, help="drop flood polygons smaller than this (m2)")
    ap.add_argument("--near-m", type=float, default=30.0, help="'near_flood' buffer for buildings (m)")
    ap.add_argument("--bridge-buffer", type=float, default=15.0, help="'at_risk' buffer for bridges (m)")
    ap.add_argument("--min-road-m", type=float, default=15.0, help="min flooded length for a road to count as affected (m)")
    ap.add_argument("--buildings", help="optional local pre-event OSM buildings file (skips ohsome)")
    ap.add_argument("--roads", help="optional local pre-event OSM roads file")
    ap.add_argument("--bridges", help="optional local pre-event OSM bridges file")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    # --- flood polygons -----------------------------------------------------
    flood_raw = load_polygons(args.flood, parse_values(args.flood_values))
    if flood_raw.crs is None:
        sys.exit("Flood mask has no CRS - set one (e.g. in QGIS) and retry.")
    utm = flood_raw.to_crs(4326).estimate_utm_crs()
    flood = clean_flood(flood_raw, utm, args.min_flood_area)
    if args.exclude:
        ex = clean_flood(load_polygons(args.exclude, {1: "water"}), utm, 0)
        if not ex.empty:
            ex_u = ex.geometry.union_all()
            flood["geometry"] = flood.geometry.difference(ex_u)
            flood = flood[~flood.geometry.is_empty & (flood.area >= args.min_flood_area)].reset_index(drop=True)
    if flood.empty:
        sys.exit("No flood polygons left after cleaning - check --flood-values / --min-flood-area.")
    print(f"Flood: {len(flood)} polygons, {flood.area.sum() / 1e6:.2f} km2 (CRS {utm.to_string()})")

    # --- OSM (pre-event) ----------------------------------------------------
    if args.bbox:
        bbox = tuple(float(v) for v in args.bbox.split(","))
    else:
        minx, miny, maxx, maxy = flood.to_crs(4326).total_bounds
        m = 0.01
        bbox = (minx - m, miny - m, maxx + m, maxy + m)
    cache = out / "osm_cache"

    def get(layer, local):
        g = gpd.read_file(local) if local else fetch_osm(bbox, layer, args.snapshot, cache, args.tile)
        if g.crs is None:
            g = g.set_crs(4326)
        return g.to_crs(utm)

    bld = analyse_buildings(get("buildings", args.buildings), flood, args.near_m)
    rds = analyse_roads(get("roads", args.roads), flood, args.min_road_m)
    brg = analyse_bridges(get("bridges", args.bridges), flood, args.bridge_buffer)

    # --- write outputs (EPSG:4326 for web dashboard / QGIS) -------------------
    w = lambda g: g.to_crs(4326)
    w(flood).to_file(out / "flood_polygons.geojson", driver="GeoJSON")
    w(bld[bld.status != "unaffected"]).to_file(out / "buildings_affected.geojson", driver="GeoJSON")
    w(rds[rds.affected]).to_file(out / "roads_affected.geojson", driver="GeoJSON")
    w(brg[brg.status != "unaffected"]).to_file(out / "bridges_affected.geojson", driver="GeoJSON")
    # whole result in one GeoPackage (roads incl. 'affected' flag -> feed to cut-off analysis)
    gpkg = out / "damage_layers.gpkg"
    for name, g in (("flood", flood), ("buildings", bld), ("roads", rds), ("bridges", brg)):
        if not g.empty:
            w(g).to_file(gpkg, layer=name, driver="GPKG")

    summary = build_summary(flood, bld, rds, brg, args)
    (out / "damage_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False))
    print(json.dumps({k: summary[k] for k in ("flood", "buildings", "roads")}, indent=2))
    print(f"\nDone. Outputs in {out.resolve()}")


if __name__ == "__main__":
    main()
