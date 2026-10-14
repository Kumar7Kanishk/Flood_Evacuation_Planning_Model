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