from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pathlib import Path
from datetime import datetime, timedelta
import json
import requests
import subprocess
import sys

app = FastAPI(title="Global Flood Explorer & Multilingual AI Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
OUTPUTS_DIR = BASE_DIR / "outputs" / "damage"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

DISASTER_EVENT_TIMESTAMP = "2026-08-26 08:30 NPT (08:15 IST / 02:45 UTC)"

LANGUAGE_MAP = {
    "in": {"name": "Hindi", "lang_code": "hi"},
    "np": {"name": "Nepali", "lang_code": "ne"},
    "es": {"name": "Spanish", "lang_code": "es"},
    "mx": {"name": "Spanish", "lang_code": "es"},
    "ar": {"name": "Spanish", "lang_code": "es"},
    "co": {"name": "Spanish", "lang_code": "es"},
    "cl": {"name": "Spanish", "lang_code": "es"},
    "pe": {"name": "Spanish", "lang_code": "es"},
    "fr": {"name": "French", "lang_code": "fr"},
    "de": {"name": "German", "lang_code": "de"},
    "cn": {"name": "Chinese", "lang_code": "zh"},
    "jp": {"name": "Japanese", "lang_code": "ja"},
    "bd": {"name": "Bengali", "lang_code": "bn"},
    "pk": {"name": "Urdu", "lang_code": "ur"},
    "it": {"name": "Italian", "lang_code": "it"},
    "br": {"name": "Portuguese", "lang_code": "pt"},
    "ru": {"name": "Russian", "lang_code": "ru"},
}

# Location-specific disaster archives (Only matching locations show history)
LOCATION_HISTORIES = {
    "syabrubesi": [
        {
            "year": "2026",
            "date": "2026-08-26",
            "title": "Highway Bridge Snapped at km 114",
            "impact": "Peak glacial surge washed out the concrete bridge approach, severing Syabrubesi's road connection.",
            "newsSource": "The Kathmandu Post (2026)",
            "newsUrl": "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
        },
        {
            "year": "2015",
            "date": "2015-04-25",
            "title": "Gorkha Earthquake Access Cut",
            "impact": "Widespread canyon rockfalls blocked the Pasang Lhamu highway into Syabrubesi for weeks.",
            "newsSource": "USGS / Wikipedia Archive",
            "newsUrl": "https://en.wikipedia.org/wiki/April_2015_Nepal_earthquake"
        }
    ],
    "rasuwagadhi": [
        {
            "year": "2026",
            "date": "2026-08-26",
            "title": "Rasuwagadhi Terminal Inundation",
            "impact": "Glacial lake breach debris plume engulfed border customs and the dry port terminal.",
            "newsSource": "The Kathmandu Post (2026)",
            "newsUrl": "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
        },
        {
            "year": "2025",
            "date": "2025-07-08",
            "title": "Miteri Friendship Bridge Washout",
            "impact": "Heavy tributary flash flood destroyed the concrete abutments of the Nepal-China border bridge.",
            "newsSource": "NepalNews Archive",
            "newsUrl": "https://english.nepalnews.com/s/long-reads/timeline-nepals-major-floods-from-the-koshi-agreement-to-the-bhote-koshi-catastrophe/"
        }
    ],
    "ramche": [
        {
            "year": "2026",
            "date": "2026-08-26",
            "title": "Ramche Canyon Highway Slump",
            "impact": "Toe erosion by the swollen Trishuli River caused 1.4 km of bedrock road to collapse into the canyon.",
            "newsSource": "Department of Roads Nepal",
            "newsUrl": "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
        }
    ],
    "hydro": [
        {
            "year": "2026",
            "date": "2026-08-26",
            "title": "Intake Basin Choked by Sediment",
            "impact": "More than 4 meters of gravel bedload entered the intake channel, halting electricity generation.",
            "newsSource": "Nepal Electricity Authority (NEA)",
            "newsUrl": "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
        }
    ]
}

def translate_summary(country_code, place_name, metrics, query_date):
    cc = country_code.lower()
    m_flow = metrics.get("current_flow", 0)
    p_flow = metrics.get("peak_flow", 0)
    status = metrics.get("status", "NORMAL")

    if cc in ["in", "np"]:
        return f"""================================================================================
स्थानिय विपद् वस्तुस्थिति प्रतिवेदन (HINDI / NEPALI)
स्थान: {place_name} | मिति: {query_date}
अवस्था: {status} | नदी बहाव: {m_flow} m³/s
================================================================================
१. जलप्रवाह स्थिति:
   GloFAS अनुसार मिति {query_date} मा नदी बहाव {m_flow} घनमिटर प्रति सेकेन्ड छ।
================================================================================
"""
    else:
        return f"""================================================================================
LOCAL REGIONAL ASSESSMENT ({country_code.upper()})
Target: {place_name} | Query Date: {query_date}
Status: {status} | Measured Discharge: {m_flow} m³/s
================================================================================
"""

@app.get("/api/global-water-body")
def get_global_water_body(
    lat: float,
    lon: float,
    date: str = Query(None, description="ISO Date (YYYY-MM-DD)")
):
    country_code = "np"
    place_name = f"Coordinates {lat:.4f}° N, {lon:.4f}° E"
    local_lang_name = "Local Dialect"
    query_date = date if date else datetime.utcnow().strftime("%Y-%m-%d")

    # Use zoom=16 for street/settlement accuracy without broad municipality drift
    try:
        geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=16&addressdetails=1"
        geo_res = requests.get(geo_url, headers={"User-Agent": "FloodDamageMapping/2.2"}, timeout=6)
        if geo_res.status_code == 200:
            geo_data = geo_res.json()
            address = geo_data.get("address", {})
            
            specific_place = (
                address.get("village") or
                address.get("town") or
                address.get("hamlet") or
                address.get("suburb") or
                address.get("road") or
                geo_data.get("name")
            )
            region = address.get("state") or address.get("county") or address.get("country")
            if specific_place and region:
                place_name = f"{specific_place}, {region}"
            elif specific_place:
                place_name = specific_place
            else:
                place_name = geo_data.get("display_name", place_name).split(",")[0]

            country_code = address.get("country_code", "np").lower()
            local_lang_name = LANGUAGE_MAP.get(country_code, {}).get("name", "Local Native Language")
    except Exception as e:
        print(f"Geocoding note: {e}")

    # Query GloFAS
    m_flow, p_flow, mean_flow = 0.0, 0.0, 1.0
    status = "NORMAL BASEFLOW"
    is_flooded = False

    try:
        target_dt = datetime.strptime(query_date, "%Y-%m-%d")
        start_str = (target_dt - timedelta(days=2)).strftime("%Y-%m-%d")
        end_str = (target_dt + timedelta(days=2)).strftime("%Y-%m-%d")

        glofas_url = (
            f"https://flood-api.open-meteo.com/v1/flood?"
            f"latitude={lat}&longitude={lon}&daily=river_discharge,river_discharge_mean,river_discharge_max"
            f"&start_date={start_str}&end_date={end_str}"
        )
        res = requests.get(glofas_url, timeout=8)
        if res.status_code == 200:
            data = res.json()
            daily = data.get("daily", {})
            times = daily.get("time", [])
            discharges = daily.get("river_discharge", [])
            max_discharges = daily.get("river_discharge_max", [])

            idx = times.index(query_date) if query_date in times else (len(discharges) // 2 if discharges else 0)

            if discharges and len(discharges) > idx:
                m_flow = discharges[idx] if discharges[idx] is not None else 0.0
                valid_flows = [d for d in discharges if d is not None]
                mean_flow = sum(valid_flows) / len(valid_flows) if valid_flows else 1.0
            if max_discharges and len(max_discharges) > idx:
                p_flow = max([m for m in max_discharges if m is not None], default=m_flow)

            if m_flow and mean_flow > 0:
                ratio = m_flow / max(mean_flow, 0.1)
                if ratio >= 2.0 or p_flow > 1200 or m_flow > 800:
                    status = "CRITICAL FLOOD SURGE"
                    is_flooded = True
                elif ratio >= 1.4 or m_flow > 400:
                    status = "HIGH DISCHARGE ADVISORY"
                    is_flooded = True
    except Exception as e:
        print(f"GloFAS note: {e}")

    # Match location history specifically
    matched_history = []
    lower_place = place_name.lower()
    for key, records in LOCATION_HISTORIES.items():
        if key in lower_place:
            matched_history = records
            break

    metrics = {
        "current_flow": round(m_flow, 2),
        "peak_flow": round(p_flow, 2),
        "status": status,
        "query_date": query_date,
    }

    report_en = f"OFFICIAL SITUATION REPORT\nTarget: {place_name}\nDate: {query_date}\nDischarge: {m_flow:.2f} m³/s\nStatus: {status}"
    report_local = translate_summary(country_code, place_name, metrics, query_date)

    return {
        "place_name": place_name,
        "country_code": country_code,
        "local_language": local_lang_name,
        "coordinates": [lat, lon],
        "query_date": query_date,
        "metrics": metrics,
        "is_flooded": is_flooded,
        "history": matched_history,
        "report_en": report_en,
        "report_local": report_local,
    }

@app.get("/api/damage-summary")
def get_damage_summary():
    return {
        "flood": {"area_km2": 34.8},
        "roads": {"flooded_length_km": 42.6, "segments_affected": 19},
        "buildings": {"inundated": 642, "total_in_aoi": 1820}
    }

@app.get("/api/cutoffs")
def get_cutoffs():
    return []

@app.get("/api/geojson/{layer_name}")
def get_geojson(layer_name: str):
    file_map = {
        "flood": OUTPUTS_DIR / "flood_polygons.geojson",
        "roads": OUTPUTS_DIR / "roads_affected.geojson",
        "buildings": OUTPUTS_DIR / "buildings_affected.geojson",
    }
    target = file_map.get(layer_name)
    if target and target.exists():
        return json.loads(target.read_text())
    return JSONResponse(status_code=404, content={"error": "Layer not found"})

@app.get("/")
def root():
    return {"status": "online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)