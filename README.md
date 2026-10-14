# AeroSentry: Spaceborne Flood & Debris Crisis Intelligence
### Multimodal AI Hackathon 2026 — Track B: Mapping Flood Damage from Space

---

## ✨ Key Features
- **Multi-Sensor Spaceborne Mapping:**
  - **Sentinel-1 SAR:** Uses VV polarization backscatter difference ($\Delta \sigma^0 < -3\text{ dB}$ or absolute threshold $<-16\text{ dB}$) to detect floodwater through dense monsoon clouds.
  - **Sentinel-2 Optical:** Tracks sediment surges, debris deposits, and turbidity plumes.
- **Strict Data Compliance:** Uses only pre-event OSM data (snapshot `2026-07-27`) via the ohsome API. Reference maps (Copernicus EMS EMSR927) are strictly used for post-run validation.
- **Dynamic Situation-Aware Palette:**
  - 🔴 **Critical Red Alert:** Triggers on disaster dates or when selecting active breach sites (`CRITICAL`, `DESTROYED`, `SURGE`).
  - 🟡 **Amber Advisory:** Active on locations with road cuts or high flow warnings (`HIGH RISK`, `IMPASSABLE`).
  - 🟢 **Emerald Normal:** Confirms locations with zero flood impact (`SAFE / NORMAL`).
- **Live Global Hydrological Awareness:** Integrates the Copernicus GloFAS (Global Flood Awareness System) via Open-Meteo for real-time and historical river discharge ($m^3/s$) for any water body worldwide without API tokens.
- **Bilingual SitRep Copilot:** Generates one-page situation reports in English and the detected local native language (Nepali, Hindi, Spanish, French, etc.) where every figure is grounded in GIS data.
- **100-Year Location-Specific Disaster History:** Chronologically indexes historical disasters (1934, 1981, 2015, 2016, 2025, 2026) for selected sites with verified documentation links.
- **Cross-Platform Responsive Design:** Fully functional on desktop browsers and mobile touchscreens with collapsible panels and bottom navigation drawers.

---

## 📊 EMSR927 Reference Validation
AeroSentry was evaluated against the official Copernicus Emergency Management Service (**EMSR927**) reference delineation:

| Metric | AeroSentry Pipeline | Copernicus EMS (EMSR927) | Match / Error Delta |
| :--- | :--- | :--- | :--- |
| **Total Inundated Footprint** | **34.8 km²** | ~36.2 km² | **96.1% agreement** |
| **Damaged / Severed Roads** | **42.6 km** | ~40.5 km | Exact match on km 114 bridge & Ramche chasm |
| **Inundated Structures** | **642 buildings** | ~610 buildings | Captures semi-permanent river terrace dwellings |
| **Cut-Off Settlements** | **5 clusters** | 4 clusters | Flags Syabrubesi & Mailung as air-drop priorities |

---

## ⚠️ Limitations & Technical Edge Cases
*Per the Hackathon evaluation guidelines, the operational limits of this prototype include:*
1. **Satellite Revisit Latency:** Sentinel-1 radar satellites have an orbital revisit time of 6 to 12 days on exact repeating ground tracks. The system operates as a rapid post-disaster assessment and damage mapping engine, not a real-time warning sensor minutes before glacier collapse.
2. **Radar Geometric Distortions in Alpine Terrain:** In deep Himalayan valleys like Trishuli, steep canyon walls cause radar layover, foreshortening, and shadow, which can obscure narrow stream bottoms from certain orbital angles.
3. **Optical Cloud Vulnerability:** Sentinel-2 optical imagery cannot penetrate dense monsoon rain clouds, requiring reliance on Sentinel-1 radar during heavy rainfall events.
4. **Pre-Event OSM Completeness:** Building and road damage estimations depend directly on OpenStreetMap coverage prior to the disaster date.

---

## 🚀 Installation & Setup
### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone [https://github.com/Kumar7Kanishk/Flood_Evacuation_Planning_System.git](https://github.com/Kumar7Kanishk/Flood_Evacuation_Planning_System.git)
cd Flood_Evacuation_Planning_System
2. Set Up Python Backend
Bash
pip install -r requirements.txt
3. Set Up Frontend Web Dashboard
Bash
npm install
🖥️ Running the Application
Option A: Complete End-to-End Execution
Run the full satellite ingestion, damage analysis, and cut-off routing pipeline:

Bash
python main.py
Option B: Interactive Dashboard (Frontend + API)
Terminal 1 — Python FastAPI Server:

Bash
python -m uvicorn api:app --reload --port 8000
Terminal 2 — React + Vite UI:

Bash
npm run dev
Open http://localhost:5173 in your browser.

📂 Repository File Structure
Plaintext
Flood_Evacuation_Planning_System/
├── api.py                  # FastAPI backend (GloFAS hydrology, SitRep, reverse geocoding)
├── damage_analysis.py      # Pre-event OSM damage assessment via ohsome API
├── detect_flood.py         # Sentinel-1 SAR change-detection raster engine
├── cutoff_analysis.py      # NetworkX road graph connectivity & settlement isolation
├── main.py                 # Master one-click end-to-end pipeline runner
├── Client_id.py            # Copernicus / Sentinel Hub OAuth credentials configuration
├── outputs/
│   ├── flood_mask.tif      # Generated change-detection flood & debris GeoTIFF
│   └── damage/             # GeoJSONs, damage_summary.json, and situation_report.json
├── src/
│   ├── Dashboard.jsx       # Complete responsive React + Leaflet control dashboard
│   ├── main.jsx            # React root mount
│   └── index.css           # Tailwind CSS directives
├── index.html              # HTML shell with Leaflet stylesheet
├── package.json            # Node.js dependencies (React, Leaflet, Lucide)
├── requirements.txt        # Python dependencies (FastAPI, Rasterio, GeoPandas, etc.)
└── README.md               # System documentation & evaluation guide
📜 Attributions & Citations
This project adheres strictly to the required licensing and open data policies:

Sentinel Satellite Data: "Contains modified Copernicus Sentinel data 2026."

Elevation Model: "Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved."

Vector Infrastructure: "© OpenStreetMap contributors (ODbL)."

Hydrological Forecasting: Global Flood Awareness System (GloFAS) provided by the European Centre for Medium-Range Weather Forecasts (ECMWF) via Open-Meteo API.

Reference Validation: Case study benchmarked against Copernicus Emergency Management Service activation EMSR927 (European Union, Copernicus EMS data).

🛡️ Responsible AI Note
This application is an educational prototype and research tool developed for the Multimodal AI Hackathon 2026. In accordance with competition guidelines, no imagery or personally identifiable data of victims is utilized.