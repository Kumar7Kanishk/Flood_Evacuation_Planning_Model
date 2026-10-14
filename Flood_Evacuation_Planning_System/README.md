# Flood Evacuation Planning System
### Satellite-Driven Flood Damage Assessment & Emergency Evacuation Planning

A comprehensive end-to-end disaster response system combining **Copernicus Sentinel-1 SAR (Synthetic Aperture Radar) satellite imagery**, **OpenStreetMap infrastructure data**, and an **interactive React + Leaflet command dashboard** to assess flood damage and compute emergency evacuation corridors.

---

## 🌟 Key Features

1. **Satellite SAR Flood Detection (`image.py` & `Sentinalhub.py`)**:
   - Downloads and processes Sentinel-1 SAR VV/VH polarization imagery via Sentinel Hub API.
   - Detects flood waters and debris using adaptive radar backscatter thresholding (Otsu & dB thresholds).
   - Generates georeferenced GeoTIFFs (`outputs/flood_mask.tif`).
   - Includes simulated flood event generator for testing without an active satellite API quota.

2. **Geospatial Damage & Evacuation Analysis (`damage_analysis.py`)**:
   - Intersects flood masks with pre-event OpenStreetMap infrastructure (buildings, roads, bridges).
   - Classifies building damage (`inundated`, `partially_hit`, `near_flood`, `unaffected`).
   - Identifies impassable road segments and compromised bridges.
   - Designates safe high-ground emergency relief shelters and verified open evacuation corridors.
   - Exports all layers into standard GeoJSONs and a single multi-layer **GeoPackage (`damage_layers.gpkg`)** for QGIS / ArcGIS.
   - Compiles single-source-of-truth metrics into `damage_summary.json`.

3. **Interactive Evacuation & Command Dashboard (`src/App.jsx`)**:
   - Modern React 19 + Leaflet + Tailwind CSS dashboard.
   - Interactive map with CartoDB Dark, ESRI Satellite, and OpenStreetMap basemaps.
   - Real-time layer toggles for flood extents, affected buildings, blocked roads, and bridges.
   - **Interactive Evacuation Route Planner**: Click any flooded point or structure on the map to compute the shortest safe path to the closest active relief shelter.
   - Emergency helpline directory and damage statistics breakdown.

---

## 📁 Repository Structure

```
Flood_Evacuation_Planning_System/
├── Client_id.py              # Sentinel Hub credential and OAuth token helper
├── Sentinalhub.py            # Sentinel-1 SAR download module with CLI options
├── image.py                  # SAR water detection & GeoTIFF flood mask generator
├── damage_analysis.py        # Infrastructure damage analysis & evacuation planner
├── generate_demo_data.py     # One-command end-to-end pipeline runner & data sync
├── requirements.txt          # Python geospatial dependencies
├── package.json              # Frontend Node dependencies (React 19, Leaflet, Tailwind)
├── vite.config.js            # Vite build configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── index.html                # Web entry point
├── src/
│   ├── main.jsx              # React DOM root
│   ├── App.jsx               # Interactive Evacuation Planning Dashboard
│   └── index.css             # Tailwind and Leaflet theme styles
├── outputs/
│   ├── flood_mask.tif        # Georeferenced flood classification raster
│   └── damage/               # Generated GeoJSONs, GeoPackage & summary JSON
└── public/
    └── data/                 # Synced GeoJSON layers consumed by the web UI
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (tested and compatible with Python 3.14)
- **Node.js 18+** and **npm**

### 2. Install Dependencies

#### Python Dependencies
```bash
py -m pip install -r requirements.txt
```
*(Or `pip install -r requirements.txt`)*

#### Web Dashboard Dependencies
```bash
npm install
```

---

### 3. Run the Complete Data Pipeline

Run the automated pipeline to generate satellite flood masks, compute infrastructure damage, plan evacuation shelters, and sync datasets to the web app:

```bash
py generate_demo_data.py
```

This generates:
- `outputs/flood_mask.tif` (Satellite flood raster)
- `outputs/damage/damage_summary.json` (Full damage & evacuation metrics)
- `outputs/damage/flood_polygons.geojson` (Vectorized flood zones)
- `outputs/damage/buildings_affected.geojson` (Submerged & damaged buildings)
- `outputs/damage/roads_affected.geojson` (Impassable road segments)
- `outputs/damage/bridges_affected.geojson` (Compromised river crossings)
- `outputs/damage/evacuation_shelters.geojson` (Designated relief shelters)
- `outputs/damage/evacuation_routes.geojson` (Safe transit corridors)
- `outputs/damage/damage_layers.gpkg` (All-in-one multi-layer GeoPackage for QGIS)
- Synced copies in `public/data/` for the web app.

---

### 4. Launch the Interactive Web Dashboard

Start the local Vite development server:

```bash
npm run dev
```

Open your browser at the displayed local URL (typically **`http://localhost:5173`**).

To build for production:
```bash
npm run build
```

---

## 🛰️ Running Individual Modules

### Retrieve Satellite Imagery (`Sentinalhub.py`)
```bash
py Sentinalhub.py --bbox 76.9 31.6 77.1 31.8 --start 2023-07-01 --end 2023-07-15 --out sentinel1_images
```

### Process Flood Masks (`image.py`)
```bash
# Process raw satellite TIFF
py image.py --input raw_sar.tif --out outputs/flood_mask.tif --threshold -15.5

# Or generate high-fidelity synthetic scenario for Mandi, HP
py image.py --generate-mock --out outputs/flood_mask.tif
```

### Run Damage Assessment (`damage_analysis.py`)
```bash
py damage_analysis.py --flood outputs/flood_mask.tif --flood-values "1=water,2=debris" --out outputs/damage
```

---

## 📄 License & Attribution
- Contains modified Copernicus Sentinel data.
- © OpenStreetMap contributors (ODbL).
