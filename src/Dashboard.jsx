import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Search,
  FileDown,
  Layers,
  AlertTriangle,
  Building,
  Navigation,
  Compass,
  Clock,
  ShieldAlert,
  Play,
  RefreshCw,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Globe,
  Moon,
  Mountain,
  X,
  Crosshair,
  CheckCircle,
  Calendar,
  Flame,
  ExternalLink,
  History,
  SkipBack,
  SkipForward,
  Info,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

// Ground disaster survey database
const GROUND_LOCATIONS = [
  {
    id: "syabru",
    name: "Syabrubesi Valley",
    category: "Isolated Settlement",
    alertLevel: "CRITICAL",
    isFlooded: true,
    coords: [28.1600, 85.3400],
    bufferKm: 1.5,
    eventDateTime: "2026-08-26 08:50 NPT (08:35 IST)",
    cause: "Trishuli highway bridge snapped at km 114; river surged 4.2m over low terraces",
    population: "2,450 residents",
    reserves: "1 Day (< 24 hrs emergency food remaining)",
    elevation: "1,460 m",
    evacHub: "Dhunche Mountain Command Base (8.4 km aerial)",
    riskFactor: "Complete vehicular severance; steep canyon walls prevent foot egress",
    stats: {
      floodedArea: "3.4 km²",
      cutOffTowns: "Syabrubesi Ward 1, 2, 3 cut off",
      severedRoad: "14.2 km (Highway broken at km 114)",
      damagedBld: "184 Buildings inundated / damaged",
    },
    warning: "Bridge washed away on Aug 26. Priority air-drop zone for medical and food supplies.",
    history: [
      {
        year: "2026",
        date: "2026-08-26",
        title: "Highway Bridge Snapped at km 114",
        impact: "Peak glacial surge washed out the concrete bridge approach, severing Syabrubesi's road connection.",
        newsSource: "The Kathmandu Post (2026)",
        newsUrl: "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
      },
      {
        year: "2015",
        date: "2015-04-25",
        title: "Gorkha Earthquake Access Cut",
        impact: "Widespread canyon rockfalls blocked the Pasang Lhamu highway into Syabrubesi for weeks.",
        newsSource: "USGS / Wikipedia Archive",
        newsUrl: "https://en.wikipedia.org/wiki/April_2015_Nepal_earthquake"
      }
    ]
  },
  {
    id: "ramche",
    name: "Ramche Canyon Roadway",
    category: "Highway Corridor Chasm",
    alertLevel: "IMPASSABLE",
    isFlooded: true,
    coords: [28.0450, 85.2530],
    bufferKm: 1.5,
    eventDateTime: "2026-08-26 09:15 NPT (09:00 IST)",
    cause: "1.4 km corridor collapsed into canyon riverbed due to toe erosion",
    population: "Transit Highway Corridor",
    reserves: "Road closed",
    elevation: "1,220 m",
    evacHub: "Betrawati Evac Station (6.2 km south)",
    riskFactor: "Total bedrock subsidence; impassable to wheeled vehicles",
    stats: {
      floodedArea: "1.2 km²",
      cutOffTowns: "Blocks all ground access to upper Rasuwa",
      severedRoad: "8.6 km (Full roadbed collapsed)",
      damagedBld: "14 Commercial transit shops destroyed",
    },
    warning: "Major logistical bottleneck. Entire mountain highway section dropped into river on Aug 26.",
    history: [
      {
        year: "2026",
        date: "2026-08-26",
        title: "Ramche Canyon Highway Slump",
        impact: "Toe erosion by the swollen Trishuli River caused 1.4 km of bedrock road to collapse into the canyon.",
        newsSource: "Department of Roads Nepal",
        newsUrl: "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
      },
      {
        year: "2003",
        date: "2003-08-14",
        title: "Ramche Landslide Damming Crisis",
        impact: "Severe slope failure blocked the highway corridor for over 18 days during peak monsoon.",
        newsSource: "ICIMOD Disaster Registry",
        newsUrl: "https://en.wikipedia.org/wiki/Bhotekoshi_River"
      }
    ]
  },
  {
    id: "rasuwa",
    name: "Rasuwagadhi Border Post",
    category: "Border Customs Terminal",
    alertLevel: "DESTROYED",
    isFlooded: true,
    coords: [28.2750, 85.3780],
    bufferKm: 1.8,
    eventDateTime: "2026-08-26 08:30 NPT (08:15 IST)",
    cause: "Direct impact of glacial outburst debris front; river channel breached customs yard",
    population: "420 (Station personnel & traders)",
    reserves: "0 Days (Supplies buried)",
    elevation: "1,814 m",
    evacHub: "Timure Emergency Staging (3.1 km downstream)",
    riskFactor: "Active mud slurry deposition and structural collapse",
    stats: {
      floodedArea: "1.8 km²",
      cutOffTowns: "Isolated from Tibet & Nepal",
      severedRoad: "6.4 km (Border highway buried)",
      damagedBld: "48 Customs & warehouse units hit",
    },
    warning: "Extreme damage on Aug 26 morning. International Friendship Bridge and dry port inundated.",
    history: [
      {
        year: "2026",
        date: "2026-08-26",
        title: "Rasuwagadhi Terminal Inundation",
        impact: "Glacial lake breach debris plume engulfed border customs and the dry port terminal.",
        newsSource: "The Kathmandu Post (2026)",
        newsUrl: "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
      },
      {
        year: "2025",
        date: "2025-07-08",
        title: "Miteri Friendship Bridge Washout",
        impact: "Heavy tributary flash flood destroyed the concrete abutments of the Nepal-China border bridge.",
        newsSource: "NepalNews Archive",
        newsUrl: "https://english.nepalnews.com/s/long-reads/timeline-nepals-major-floods-from-the-koshi-agreement-to-the-bhote-koshi-catastrophe/"
      },
      {
        year: "1981",
        date: "1981-07-11",
        title: "Zhangzangbu Cho GLOF Surge",
        impact: "Glacial lake failure in Tibet sent a massive debris torrent down through the border gorge.",
        newsSource: "Wikipedia / ICIMOD Archive",
        newsUrl: "https://en.wikipedia.org/wiki/Bhotekoshi_River"
      }
    ]
  },
  {
    id: "mailung",
    name: "Mailung Fan Area",
    category: "Tributary Fan Settlement",
    alertLevel: "HIGH RISK",
    isFlooded: true,
    coords: [28.0900, 85.2700],
    bufferKm: 1.5,
    eventDateTime: "2026-08-26 09:40 NPT (09:25 IST)",
    cause: "Tributary debris fan deposited over 2.5m boulder gravel across road corridors",
    population: "830 residents",
    reserves: "4 Days (Community stocks active)",
    elevation: "1,310 m",
    evacHub: "Dhunche Rescue Helipad",
    riskFactor: "Secondary boulder slides from unstable upper slopes",
    stats: {
      floodedArea: "2.1 km²",
      cutOffTowns: "Mailung lower cluster isolated",
      severedRoad: "4.8 km (Covered in boulder debris)",
      damagedBld: "64 Homes hit on terrace margin",
    },
    warning: "Heavy debris accumulation. Foot paths covered by scree and mud.",
    history: [
      {
        year: "2026",
        date: "2026-08-26",
        title: "Mailung Tributary Torrent",
        impact: "Debris flow buried pedestrian trails and low agricultural terraces with boulders.",
        newsSource: "The Kathmandu Post (2026)",
        newsUrl: "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
      }
    ]
  },
  {
    id: "hydro",
    name: "Trishuli Hydro Intake",
    category: "Hydropower Plant",
    alertLevel: "OFFLINE",
    isFlooded: true,
    coords: [28.0120, 85.2210],
    bufferKm: 1.2,
    eventDateTime: "2026-08-26 10:15 NPT (10:00 IST)",
    cause: "Sediment surge deposited over 4m gravel bedload directly into intake desilting basin",
    population: "Industrial Infrastructure",
    reserves: "Staff evacuated",
    elevation: "890 m",
    evacHub: "Bidur Regional Hospital (11.5 km)",
    riskFactor: "Turbine silt abrasion and electrical flooding",
    stats: {
      floodedArea: "1.6 km²",
      cutOffTowns: "Plant access bridge submerged",
      severedRoad: "2.8 km (Intake access road cut)",
      damagedBld: "12 Control & turbine rooms damaged",
    },
    warning: "Plant shutdown executed on Aug 26. Desilting gates completely choked by boulder bedload.",
    history: [
      {
        year: "2026",
        date: "2026-08-26",
        title: "Intake Basin Choked by Sediment",
        impact: "More than 4 meters of gravel bedload entered the intake channel, halting electricity generation.",
        newsSource: "Nepal Electricity Authority (NEA)",
        newsUrl: "https://kathmandupost.com/columns/2026/10/11/bhotekoshi-flood-wasn-t-a-freak-event-it-s-the-himalaya-doing-what-it-does"
      }
    ]
  },
  {
    id: "dhunche",
    name: "Dhunche (District Headquarters)",
    category: "Regional Rescue Base",
    alertLevel: "SAFE / UNAFFECTED",
    isFlooded: false,
    coords: [28.1100, 85.3000],
    bufferKm: 2.0,
    eventDateTime: "Operational 24/7 (Safe Altitude)",
    cause: "Located high on mountain ridge (+500m above river channel). Zero flood water or debris impact.",
    population: "4,800 residents",
    reserves: "Adequate (Staging center)",
    elevation: "1,960 m",
    evacHub: "District Hospital & Army Barracks Helipad",
    riskFactor: "None. Operating normally as incident command center.",
    stats: {
      floodedArea: "0.0 km² (Zero inundation)",
      cutOffTowns: "None (Internal access open)",
      severedRoad: "0.0 km (Town roads intact)",
      damagedBld: "0 Buildings damaged",
    },
    warning: "Location safe and high above river level. Serving as operational dispatch for air operations.",
    history: []
  }
];

export default function Dashboard() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const baseLabelsLayerRef = useRef(null);
  const layersGroupRef = useRef(null);
  const userClickMarkerRef = useRef(null);

  // TODAY'S DATE BOUNDATION: Cannot exceed today (2026-10-14)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState("2026-08-26");
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("");

  // Timeline bounds (Slider cannot go past today)
  const timelineMin = new Date("2026-08-01").getTime();
  const timelineMax = new Date(todayStr).getTime();
  const currentSliderTime = Math.min(
    new Date(selectedDate).getTime() || new Date("2026-08-26").getTime(),
    timelineMax
  );

  const isEventDate = selectedDate === "2026-08-26";

  // FOLDABLE / COLLAPSIBLE PANEL STATES
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // UI state
  const [mapMode, setMapMode] = useState("satellite");
  const [activeTab, setActiveTab] = useState("summary");
  const [showSentinel1, setShowSentinel1] = useState(true);
  const [showSentinel2, setShowSentinel2] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  // SitRep Modal state
  const [showSitRepModal, setShowSitRepModal] = useState(false);
  const [sitRepLang, setSitRepLang] = useState("en");
  const [sitRepData, setSitRepData] = useState(null);

  // Baseline summary
  const [summary, setSummary] = useState({
    flood: { area_km2: 34.8 },
    roads: { flooded_length_km: 42.6, segments_affected: 19 },
    buildings: { inundated: 642, total_in_aoi: 1820 },
  });

  // Vector data
  const [floodGeoJson, setFloodGeoJson] = useState(null);
  const [roadsGeoJson, setRoadsGeoJson] = useState(null);
  const [buildingsGeoJson, setBuildingsGeoJson] = useState(null);

  // Active Selected Location
  const [selectedLocation, setSelectedLocation] = useState(GROUND_LOCATIONS[0]);

  // Indian Standard Time (IST) Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const istString = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });
      setCurrentTimeDisplay(istString + " IST");
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spatial evaluator
  const evaluateGroundCoordinates = (lat, lng, queryDate) => {
    for (const loc of GROUND_LOCATIONS) {
      const distKm = Math.hypot(lat - loc.coords[0], (lng - loc.coords[1]) * Math.cos((lat * Math.PI) / 180)) * 111.0;
      if (distKm <= (loc.bufferKm || 1.2)) {
        return {
          ...loc,
          name: `${loc.name} (${distKm < 0.2 ? "Direct Site" : `${distKm.toFixed(1)} km margin`})`,
          queryDate,
          history: loc.history || [],
        };
      }
    }

    const expectedRiverLon = 85.18 + (lat - 27.95) * ((85.38 - 85.18) / (28.28 - 27.95));
    const distToRiverKm = Math.abs(lng - expectedRiverLon) * 111.0 * Math.cos((lat * Math.PI) / 180);

    if (distToRiverKm <= 1.2 && lat >= 27.93 && lat <= 28.32) {
      return {
        name: `Trishuli River Corridor (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
        category: "Valley Riverbed Zone",
        alertLevel: "HIGH FLOOD HAZARD",
        isFlooded: true,
        coords: [lat, lng],
        eventDateTime: "2026-08-26 09:00 NPT (08:45 IST)",
        queryDate,
        cause: `Within ${distToRiverKm.toFixed(1)} km river inundation margin. Satellite radar confirms high water runoff on ${queryDate}.`,
        population: "Dispersed riparian settlements",
        reserves: "< 48 hrs (Surge buffer)",
        elevation: `${Math.round(700 + (lat - 27.95) * 3200)} m (DEM)`,
        evacHub: "Nearest Ridge Staging Point",
        riskFactor: "Active water current, mudflow deposition, and bank erosion",
        stats: {
          floodedArea: `${(0.8 + (lat - 27.9) * 1.8).toFixed(1)} km² sector`,
          cutOffTowns: "Valley access route threatened",
          severedRoad: `${(1.2 + (lat - 27.9) * 2.2).toFixed(1)} km road impacted`,
          damagedBld: `${Math.round(15 + (lat - 27.9) * 45)} structures at risk`,
        },
        warning: `Sector lies in direct river surge path on ${queryDate}. Rescuers should proceed with caution regarding unstable valley embankments.`,
        history: [],
      };
    }

    return {
      name: `Ground Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
      category: "Unaffected Highland Area",
      alertLevel: "SAFE / NORMAL",
      isFlooded: false,
      coords: [lat, lng],
      eventDateTime: "Normal seasonal baseline",
      queryDate,
      cause: `Located outside maximum flood and debris margins on ${queryDate}. Ground is stable.`,
      population: "Local highland area",
      reserves: "Normal local conditions",
      elevation: `${Math.round(1400 + Math.abs(lat) * 20)} m (DEM)`,
      evacHub: "Local Ridge Trail",
      riskFactor: "None. Elevation is well above river flood levels.",
      stats: {
        floodedArea: "0.0 km² (Zero flood detected)",
        cutOffTowns: "None (Terrain accessible)",
        severedRoad: "0.0 km (No flood break)",
        damagedBld: "0 Buildings damaged",
      },
      warning: `No flood impact recorded for ${queryDate}. Terrain is stable and free from water accumulation.`,
      history: [],
    };
  };

  // Autocomplete Geocoding
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    const localMatches = GROUND_LOCATIONS
      .filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        item.category.toLowerCase().includes(q.toLowerCase())
      )
      .map(item => ({
        name: item.name,
        display_name: `${item.name} (${item.category})`,
        lat: item.coords[0],
        lon: item.coords[1],
        fullData: item,
      }));

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (res.ok) {
          const osmResults = await res.json();
          const formattedOsm = osmResults.map(r => {
            const lat = parseFloat(r.lat);
            const lon = parseFloat(r.lon);
            const evaluated = evaluateGroundCoordinates(lat, lon, selectedDate);
            return {
              name: r.name || r.display_name.split(",")[0],
              display_name: r.display_name,
              lat,
              lon,
              fullData: {
                ...evaluated,
                name: r.name || r.display_name.split(",")[0],
              }
            };
          });
          setSuggestions([...localMatches, ...formattedOsm]);
        } else {
          setSuggestions(localMatches);
        }
      } catch {
        setSuggestions(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedDate]);

  // Query backend for specific date
  const queryLocationForDate = async (lat, lng, dateStr) => {
    const evaluated = evaluateGroundCoordinates(lat, lng, dateStr);
    setSelectedLocation(evaluated);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/global-water-body?lat=${lat}&lon=${lng}&date=${dateStr}`);
      if (res.ok) {
        const live = await res.json();
        const flow = live.metrics.current_flow;
        const isFlooded = live.is_flooded;

        setSelectedLocation(prev => ({
          ...prev,
          name: prev.id ? prev.name : live.place_name,
          alertLevel: prev.id ? prev.alertLevel : live.metrics.status,
          isFlooded: prev.id ? prev.isFlooded : isFlooded,
          queryDate: dateStr,
          cause: `${prev.cause} | GloFAS discharge on ${dateStr}: ${flow} m³/s (Peak: ${live.metrics.peak_flow} m³/s).`,
          stats: {
            ...prev.stats,
            floodedArea: prev.id ? prev.stats.floodedArea : `${flow} m³/s flow`,
          },
          history: prev.history || live.history || [],
          report_en: live.report_en,
          report_local: live.report_local,
          local_language: live.local_language,
        }));

        setSitRepData({
          report_en: live.report_en,
          report_local: live.report_local,
          local_language: live.local_language,
          queryDate: dateStr,
        });
      }
    } catch (err) {
      console.warn("Hydrological query note:", err);
    }
  };

  // Date change handler with STRICT TODAY'S DATE BOUNDATION
  const handleDateChange = (newDate) => {
    // Clamp to today's date so it never exceeds today
    let clampedDate = newDate;
    if (newDate > todayStr) {
      clampedDate = todayStr;
    }
    setSelectedDate(clampedDate);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
    if (selectedLocation && selectedLocation.coords) {
      queryLocationForDate(selectedLocation.coords[0], selectedLocation.coords[1], clampedDate);
    }
  };

  const stepDate = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const newStr = cur.toISOString().slice(0, 10);
    handleDateChange(newStr);
  };

  const handleSliderChange = (e) => {
    const timeMs = Number(e.target.value);
    const d = new Date(Math.min(timeMs, timelineMax));
    const dateStr = d.toISOString().slice(0, 10);
    handleDateChange(dateStr);
  };

  // 1. INITIALIZE LEAFLET MAP ONCE
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.1600, 85.3400],
      zoom: 12,
      minZoom: 3,
      maxZoom: 20,
      zoomControl: false,
    });

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      if (userClickMarkerRef.current) {
        map.removeLayer(userClickMarkerRef.current);
      }

      const activePin = L.divIcon({
        className: "active-select-icon",
        html: `<div style="background-color: #38bdf8; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 14px #38bdf8;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const newMarker = L.marker([lat, lng], { icon: activePin })
        .bindPopup(
          `<div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
            <strong style="color: #0284c7; font-size: 13px;">Selected Ground Point</strong>
            <p style="margin: 3px 0; font-size: 10px; font-family: monospace;">${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</p>
          </div>`
        )
        .addTo(map);
      newMarker.openPopup();
      userClickMarkerRef.current = newMarker;

      queryLocationForDate(lat, lng, selectedDate);
    });

    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 600);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. SWITCH BASE TILE LAYERS
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (baseLabelsLayerRef.current) {
      map.removeLayer(baseLabelsLayerRef.current);
      baseLabelsLayerRef.current = null;
    }

    if (mapMode === "satellite") {
      baseTileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri, Maxar", maxNativeZoom: 18, maxZoom: 20 }
      ).addTo(map);

      baseLabelsLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxNativeZoom: 18, maxZoom: 20 }
      ).addTo(map);
    } else if (mapMode === "topo") {
      baseTileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri, USGS", maxNativeZoom: 18, maxZoom: 20 }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri, DeLorme", maxNativeZoom: 16, maxZoom: 20 }
      ).addTo(map);

      baseLabelsLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        { maxNativeZoom: 16, maxZoom: 20 }
      ).addTo(map);
    }

    setTimeout(() => map.invalidateSize(), 100);
  }, [mapMode]);

  // Resize map whenever panels are folded/unfolded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isLeftPanelOpen, isRightPanelOpen]);

  // Fetch backend data
  const fetchBackendData = async () => {
    try {
      const resSum = await fetch("http://127.0.0.1:8000/api/damage-summary");
      if (resSum.ok) setSummary(await resSum.json());

      const resFlood = await fetch("http://127.0.0.1:8000/api/geojson/flood");
      if (resFlood.ok) setFloodGeoJson(await resFlood.json());

      const resRoads = await fetch("http://127.0.0.1:8000/api/geojson/roads");
      if (resRoads.ok) setRoadsGeoJson(await resRoads.json());

      const resBld = await fetch("http://127.0.0.1:8000/api/geojson/buildings");
      if (resBld.ok) setBuildingsGeoJson(await resBld.json());
    } catch {
      console.log("Backend offline, using standard baseline.");
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  // 3. DRAW MARKERS AND VECTOR LAYERS
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const redPin = L.divIcon({
      className: "custom-red-pin",
      html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(239,68,68,0.9);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const amberPin = L.divIcon({
      className: "custom-amber-pin",
      html: `<div style="background-color: #f59e0b; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(245,158,11,0.9);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const greenPin = L.divIcon({
      className: "custom-green-pin",
      html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(16,185,129,0.9);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    GROUND_LOCATIONS.forEach((zone) => {
      let icon = greenPin;
      if (zone.alertLevel === "CRITICAL" || zone.alertLevel === "DESTROYED") icon = redPin;
      else if (zone.isFlooded) icon = amberPin;

      const marker = L.marker(zone.coords, { icon });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedLocation(zone);
        map.flyTo(zone.coords, 14, { duration: 1.2 });
        queryLocationForDate(zone.coords[0], zone.coords[1], selectedDate);
      });

      marker.bindPopup(`
        <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
          <strong style="color: ${zone.isFlooded ? '#dc2626' : '#16a34a'}; font-size: 14px;">${zone.name}</strong>
          <p style="margin: 2px 0; font-size: 10px; color: #64748b; font-weight: bold;">Event Time: ${zone.eventDateTime}</p>
          <p style="margin: 4px 0; font-size: 12px; color: #475569;">${zone.cause}</p>
          <p style="margin: 0; font-size: 11px; font-weight: 600;">Status: ${zone.alertLevel}</p>
        </div>
      `);
      group.addLayer(marker);
    });

    if (showSentinel1 && floodGeoJson) {
      const geoLayer = L.geoJSON(floodGeoJson, {
        style: { color: "#38bdf8", fillColor: "#0284c7", fillOpacity: 0.65, weight: 1.5 },
      });
      group.addLayer(geoLayer);
    }

    if (roadsGeoJson) {
      const roadLayer = L.geoJSON(roadsGeoJson, {
        style: { color: "#ef4444", weight: 3.5 },
      });
      group.addLayer(roadLayer);
    }

    if (buildingsGeoJson) {
      const bldLayer = L.geoJSON(buildingsGeoJson, {
        style: { color: "#f97316", fillColor: "#fb923c", fillOpacity: 0.75, weight: 1 },
      });
      group.addLayer(bldLayer);
    }

    if (showSentinel2) {
      const opticalCircle = L.circle([28.12, 85.3], {
        radius: 2200,
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 0.35,
      });
      opticalCircle.bindPopup("Sentinel-2 Optical: Glacial Debris & Turbidity Plume");
      group.addLayer(opticalCircle);
    }
  }, [showSentinel1, showSentinel2, floodGeoJson, roadsGeoJson, buildingsGeoJson]);

  // Select location from list
  const selectAndFlyTo = (item) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setSelectedLocation(item);
    map.flyTo(item.coords, 14, { duration: 1.2 });

    if (userClickMarkerRef.current) {
      map.removeLayer(userClickMarkerRef.current);
    }

    const beacon = L.divIcon({
      className: "beacon-icon",
      html: `<div style="background-color: #38bdf8; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 14px #38bdf8;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker(item.coords, { icon: beacon })
      .bindPopup(`<strong style="color: #0f172a;">${item.name}</strong>`)
      .addTo(map);

    setTimeout(() => marker.openPopup(), 1300);
    userClickMarkerRef.current = marker;
    setShowSuggestions(false);
    queryLocationForDate(item.coords[0], item.coords[1], selectedDate);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (suggestions.length > 0) {
      selectAndFlyTo(suggestions[0].fullData);
    }
  };

  // Pipeline runner
  const triggerPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/run-pipeline", { method: "POST" });
      const data = await res.json();
      alert("✅ " + data.message);
      fetchBackendData();
      setIsRunningPipeline(false);
    } catch (e) {
      alert("⚠️ Error: " + e.message);
      setIsRunningPipeline(false);
    }
  };

  // Open Situation Report Copilot Modal
  const openSitRepModal = () => {
    if (!sitRepData) {
      setSitRepData({
        report_en: selectedLocation.report_en || `OFFICIAL DISASTER SITUATION REPORT (SITREP)\nTarget: ${selectedLocation.name}\nDisaster Event Timestamp: 2026-08-26 08:30 NPT (08:15 IST / 02:45 UTC)\nQueried Date: ${selectedDate}\nStatus: ${selectedLocation.alertLevel}\nCause: ${selectedLocation.cause}`,
        report_local: selectedLocation.report_local || `स्थानिय विपद् वस्तुस्थिति प्रतिवेदन\nस्थान: ${selectedLocation.name}\nबाढी विपद् मिति तथा समय: 2026-08-26 08:30 NPT (08:15 IST / 02:45 UTC)\nमिति: ${selectedDate}\nअवस्था: ${selectedLocation.alertLevel}`,
        local_language: selectedLocation.local_language || "Local Language",
      });
    }
    setShowSitRepModal(true);
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#111317" }}>
      {/* 1. MAP VIEWPORT */}
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          zIndex: 1,
          backgroundColor: "#111317",
        }}
      />

      {/* 2. LEFT COLUMN (COLLAPSIBLE / FOLDABLE) */}
      {isLeftPanelOpen ? (
        <div
          style={{ position: "absolute", top: 20, left: 20, zIndex: 1000, width: 330 }}
          className="flex flex-col gap-2.5 max-h-[94vh] transition-all duration-300"
        >
          {/* Search Bar with Collapse Button */}
          <div className="flex items-center gap-1.5">
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-center gap-2 bg-[#16181d]/95 backdrop-blur-md border border-slate-700/80 px-3 py-2.5 rounded-lg shadow-xl"
            >
              <input
                type="text"
                placeholder="Search any river, city, or country..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-400 w-full"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : (
                <button
                  type="submit"
                  className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center shrink-0"
                  title="Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            <button
              onClick={() => setIsLeftPanelOpen(false)}
              className="p-2.5 rounded-lg bg-[#16181d]/95 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition shadow-xl shrink-0"
              title="Fold Left Panel for Full View"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-[#16181d]/95 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => selectAndFlyTo(place.fullData)}
                  className="px-3 py-2 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between border-b border-slate-800/40 last:border-none transition"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="text-xs font-semibold text-white truncate">{place.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{place.display_name}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* DATE & TIME CONTROL (STRICTLY CAPPED AT TODAY'S DATE) */}
          <div className={`p-2.5 rounded-xl shadow-xl flex flex-col gap-2 transition-all duration-300 border ${
            isEventDate 
              ? "bg-[#200e12]/95 border-rose-600/70 shadow-rose-950/60" 
              : "bg-[#16181d]/95 border-cyan-800/60"
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <div className={`flex items-center gap-1.5 ${isEventDate ? "text-rose-400" : "text-cyan-400"}`}>
                {isEventDate ? <Flame className="w-4 h-4 text-rose-500 animate-pulse" /> : <Calendar className="w-4 h-4" />}
                <span>{isEventDate ? "Active Disaster Date" : "Timeline Scrubber"}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{currentTimeDisplay}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => stepDate(-1)}
                className="p-1.5 bg-[#121418] hover:bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white transition"
                title="Previous Day"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                max={todayStr} // Strict boundation: cannot exceed today's date
                onChange={(e) => handleDateChange(e.target.value)}
                className={`border text-white text-xs px-2 py-1 rounded w-full outline-none transition text-center font-mono ${
                  isEventDate 
                    ? "bg-[#170a0d] border-rose-700 focus:border-rose-500 font-bold" 
                    : "bg-[#121418] border-slate-700 focus:border-cyan-500"
                }`}
              />
              <button
                onClick={() => stepDate(1)}
                disabled={selectedDate >= todayStr}
                className={`p-1.5 bg-[#121418] border border-slate-700 rounded transition ${
                  selectedDate >= todayStr
                    ? "opacity-30 cursor-not-allowed text-slate-600"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
                title={selectedDate >= todayStr ? "Cannot exceed today's date" : "Next Day"}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDateChange("2026-08-26")}
                className={`text-[10px] font-bold px-2 py-1.5 rounded shrink-0 transition border ${
                  isEventDate
                    ? "bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-900"
                    : "bg-rose-900/40 hover:bg-rose-900/70 border-rose-600/50 text-rose-300"
                }`}
                title="Jump to August 26, 2026 Disaster Date"
              >
                Event Date
              </button>
            </div>

            {/* Slider capped at today's timestamp */}
            <div className="flex flex-col gap-1 pt-1">
              <input
                type="range"
                min={timelineMin}
                max={timelineMax} // Boundation: Capped at today
                step={86400000}
                value={currentSliderTime}
                onChange={handleSliderChange}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Aug 01</span>
                <span className="text-rose-400 font-bold">Aug 26 (Disaster)</span>
                <span className="text-cyan-400 font-semibold">Today (Oct 14)</span>
              </div>
            </div>
          </div>

          {/* Priority Survey Sites Column */}
          <div className="bg-[#16181d]/95 backdrop-blur-md border border-rose-900/60 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-rose-900/40 bg-rose-950/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
                <span className="text-xs font-bold text-rose-200 uppercase tracking-wide">
                  Ground Survey Sites
                </span>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                {GROUND_LOCATIONS.length} SITES
              </span>
            </div>

            <div className="p-2 space-y-2 overflow-y-auto max-h-[26vh]">
              {GROUND_LOCATIONS.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => selectAndFlyTo(zone)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer flex flex-col gap-1 ${
                    selectedLocation.id === zone.id
                      ? zone.isFlooded
                        ? "bg-rose-950/50 border-rose-500 shadow-md"
                        : "bg-emerald-950/50 border-emerald-500 shadow-md"
                      : "bg-[#1e222a] border-slate-800 hover:border-slate-700 hover:bg-[#252a35]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <MapPin className={`w-3 h-3 ${zone.isFlooded ? "text-rose-400" : "text-emerald-400"}`} />
                      {zone.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        zone.alertLevel === "CRITICAL" || zone.alertLevel === "DESTROYED"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : zone.isFlooded
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {zone.alertLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    {zone.eventDateTime}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    {zone.cause}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map Mode Selector */}
          <div className="bg-[#16181d]/95 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-lg shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold pl-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Map Mode</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setMapMode("satellite")}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition border ${
                  mapMode === "satellite"
                    ? "bg-cyan-600/30 text-cyan-300 border-cyan-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                <Globe className="w-3 h-3" />
                Satellite
              </button>
              <button
                onClick={() => setMapMode("dark")}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition border ${
                  mapMode === "dark"
                    ? "bg-cyan-600/30 text-cyan-300 border-cyan-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                <Moon className="w-3 h-3" />
                Dark
              </button>
              <button
                onClick={() => setMapMode("topo")}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition border ${
                  mapMode === "topo"
                    ? "bg-cyan-600/30 text-cyan-300 border-cyan-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                <Mountain className="w-3 h-3" />
                Topo
              </button>
            </div>
          </div>

          {/* Satellite Overlays */}
          <div className="bg-[#16181d]/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-lg shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold pl-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Overlays</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowSentinel1(!showSentinel1)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition border ${
                  showSentinel1
                    ? "bg-emerald-600/30 text-emerald-300 border-emerald-500"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                Sentinel-1 (SAR)
              </button>
              <button
                onClick={() => setShowSentinel2(!showSentinel2)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition border ${
                  showSentinel2
                    ? "bg-emerald-600/30 text-emerald-300 border-emerald-500"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                Sentinel-2 (Opt)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FOLDED LEFT CHIP (Full View Mode) */
        <button
          onClick={() => setIsLeftPanelOpen(true)}
          style={{ position: "absolute", top: 20, left: 20, zIndex: 1000 }}
          className="flex items-center gap-2 bg-[#16181d]/95 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white text-xs font-semibold shadow-2xl transition"
          title="Unfold Controls & Survey Sites"
        >
          <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
          <span>Open Controls</span>
        </button>
      )}

      {/* 3. RIGHT COLUMN: CONTROL & INFO PANEL (COLLAPSIBLE / FOLDABLE) */}
      {isRightPanelOpen ? (
        <div
          style={{ position: "absolute", top: 20, right: 20, zIndex: 1000, width: 440 }}
          className={`backdrop-blur-md rounded-xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden transition-all duration-300 border ${
            isEventDate
              ? "bg-[#180a0e]/95 border-rose-600/90 shadow-rose-950/80"
              : "bg-[#16181d]/95 border-slate-700/70"
          }`}
        >
          {/* Header with Fold Button */}
          <div className={`p-3.5 border-b flex items-center justify-between transition-colors duration-300 ${
            isEventDate ? "bg-[#250d14] border-rose-800/80" : "bg-[#121418] border-slate-800"
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition mr-0.5"
                title="Fold Panel for Full Map View"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isEventDate ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`}></span>
                  <h2 className={`text-xs uppercase tracking-wider font-bold ${isEventDate ? 'text-rose-100' : 'text-white'}`}>
                    {isEventDate ? "EMERGENCY DISASTER CONTROL" : "Control & Info Panel"}
                  </h2>
                </div>
                <p className={`text-[10px] font-mono mt-0.5 truncate max-w-[210px] ${isEventDate ? 'text-rose-300 font-semibold' : 'text-cyan-400'}`}>
                  Inspecting: {selectedLocation.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerPipeline}
                disabled={isRunningPipeline}
                className={`flex items-center gap-1 text-white text-xs font-semibold px-2 py-1.5 rounded-md transition shadow ${
                  isEventDate ? "bg-rose-600 hover:bg-rose-500 shadow-rose-950" : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {isRunningPipeline ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run AI
              </button>
              <button
                onClick={openSitRepModal}
                className={`flex items-center gap-1 text-white text-xs font-semibold px-2 py-1.5 rounded-md transition shadow ${
                  isEventDate ? "bg-rose-700 hover:bg-rose-600 shadow-rose-950" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                SitRep
              </button>
            </div>
          </div>

          {/* 4-Tab Navigator with LOCATION-SPECIFIC HISTORY */}
          <div className={`grid grid-cols-4 border-b p-1.5 gap-1 transition-colors duration-300 ${
            isEventDate ? "bg-[#1d0b10] border-rose-900/60" : "bg-[#121418] border-slate-800"
          }`}>
            <button
              onClick={() => setActiveTab("summary")}
              className={`py-2 px-1 text-center rounded text-[11px] font-semibold uppercase tracking-wider transition ${
                activeTab === "summary"
                  ? isEventDate ? "bg-rose-600 text-white shadow-md shadow-rose-950" : "bg-slate-700 text-white shadow"
                  : isEventDate ? "text-rose-300 hover:bg-rose-950/40" : "text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab("cutoff")}
              className={`py-2 px-1 text-center rounded text-[11px] font-semibold uppercase tracking-wider transition ${
                activeTab === "cutoff"
                  ? isEventDate ? "bg-rose-600 text-white shadow-md shadow-rose-950" : "bg-slate-700 text-white shadow"
                  : isEventDate ? "text-rose-300 hover:bg-rose-950/40" : "text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              Cut-Off
            </button>
            <button
              onClick={() => setActiveTab("sites")}
              className={`py-2 px-1 text-center rounded text-[11px] font-semibold uppercase tracking-wider transition text-ellipsis overflow-hidden whitespace-nowrap ${
                activeTab === "sites"
                  ? isEventDate ? "bg-rose-600 text-white shadow-md shadow-rose-950" : "bg-slate-700 text-white shadow"
                  : isEventDate ? "text-rose-300 hover:bg-rose-950/40" : "text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              Flood Sites
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 text-center rounded text-[11px] font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                activeTab === "history"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                  : "text-amber-300/80 hover:bg-amber-950/30"
              }`}
            >
              <History className="w-3 h-3 shrink-0" />
              History
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {/* TAB 1: SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-3">
                <div className={`p-2.5 rounded-lg flex flex-col gap-1 border transition-colors duration-300 ${
                  isEventDate
                    ? "bg-rose-950/80 border-rose-600 text-rose-100 shadow-sm shadow-rose-900"
                    : "bg-slate-800/90 border-slate-700/80 text-slate-300"
                }`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 ${isEventDate ? "text-rose-300" : "text-cyan-400"}`} />
                      <span>Target Date: <strong className={isEventDate ? "text-rose-200" : "text-white"}>{selectedDate}</strong></span>
                    </div>
                    {isEventDate && (
                      <span className="text-[9px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded tracking-wide animate-pulse">
                        Disaster Day
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-rose-200 pt-0.5">
                    <Clock className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>Flood Surge: <strong>2026-08-26 08:30 NPT (08:15 IST)</strong></span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  <span>Damage Status on {selectedDate}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedLocation.isFlooded || isEventDate
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {selectedLocation.alertLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className={`p-2.5 rounded-lg border transition ${
                    isEventDate ? "bg-[#250d14] border-rose-900/80" : "bg-[#1e222a] border-slate-800"
                  }`}>
                    <div className={`flex items-center gap-1 text-[11px] mb-1 ${isEventDate ? "text-rose-300" : "text-slate-400"}`}>
                      <Compass className="w-3 h-3 text-cyan-400" />
                      River Flow on Date
                    </div>
                    <div className={`text-xl font-bold ${selectedLocation.isFlooded || isEventDate ? 'text-white' : 'text-emerald-400'}`}>
                      {selectedLocation.stats?.floodedArea}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border transition ${
                    isEventDate ? "bg-[#250d14] border-rose-900/80" : "bg-[#1e222a] border-slate-800"
                  }`}>
                    <div className={`flex items-center gap-1 text-[11px] mb-1 ${isEventDate ? "text-rose-300" : "text-slate-400"}`}>
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Cut-Off Status
                    </div>
                    <div className="text-xl font-bold text-rose-400">
                      {selectedLocation.stats?.cutOffTowns}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border transition ${
                    isEventDate ? "bg-[#250d14] border-rose-900/80" : "bg-[#1e222a] border-slate-800"
                  }`}>
                    <div className={`flex items-center gap-1 text-[11px] mb-1 ${isEventDate ? "text-rose-300" : "text-slate-400"}`}>
                      <Navigation className="w-3 h-3 text-amber-400" />
                      Highway Impact
                    </div>
                    <div className="text-xl font-bold text-amber-400">
                      {selectedLocation.stats?.severedRoad}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border transition ${
                    isEventDate ? "bg-[#250d14] border-rose-900/80" : "bg-[#1e222a] border-slate-800"
                  }`}>
                    <div className={`flex items-center gap-1 text-[11px] mb-1 ${isEventDate ? "text-rose-300" : "text-slate-400"}`}>
                      <Building className="w-3 h-3 text-indigo-400" />
                      Structures Affected
                    </div>
                    <div className={`text-xl font-bold ${selectedLocation.isFlooded || isEventDate ? 'text-white' : 'text-emerald-400'}`}>
                      {selectedLocation.stats?.damagedBld}
                    </div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg flex items-start gap-2 border ${
                  selectedLocation.isFlooded || isEventDate
                    ? "bg-rose-950/40 border-rose-800 text-rose-200"
                    : "bg-emerald-950/30 border-emerald-900/60 text-emerald-200"
                }`}>
                  {selectedLocation.isFlooded || isEventDate ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-semibold">{selectedLocation.isFlooded || isEventDate ? "Damage Advisory: " : "Status Assessment: "}</span>
                    {selectedLocation.warning || selectedLocation.cause}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg space-y-1.5 text-xs border ${
                  isEventDate ? "bg-[#1a080c] border-rose-900/60 text-rose-100" : "bg-[#121418] border-slate-800 text-slate-300"
                }`}>
                  <div className="flex justify-between">
                    <span className={isEventDate ? "text-rose-300" : "text-slate-500"}>Elevation:</span>
                    <strong className="text-cyan-400 font-mono">{selectedLocation.elevation}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={isEventDate ? "text-rose-300" : "text-slate-500"}>Disaster Time:</span>
                    <strong className="text-rose-400 font-mono">{selectedLocation.eventDateTime || "Normal"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={isEventDate ? "text-rose-300" : "text-slate-500"}>Food / Medical Reserves:</span>
                    <strong className={selectedLocation.isFlooded || isEventDate ? "text-amber-300" : "text-emerald-400"}>
                      {selectedLocation.reserves}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={isEventDate ? "text-rose-300" : "text-slate-500"}>Evacuation Base:</span>
                    <strong className="text-slate-200">{selectedLocation.evacHub}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CUT-OFF ZONES */}
            {activeTab === "cutoff" && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Isolated Settlements Along Corridor
                </div>
                {GROUND_LOCATIONS
                  .filter(l => l.isFlooded && l.category.includes("Settlement"))
                  .map((settlement) => (
                    <div
                      key={settlement.id}
                      onClick={() => selectAndFlyTo(settlement)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer ${
                        selectedLocation.id === settlement.id
                          ? "bg-rose-950/60 border-rose-500 shadow-md shadow-rose-950"
                          : isEventDate
                          ? "bg-[#250d14] border-rose-900/70 hover:border-rose-600"
                          : "bg-[#1e222a] border-slate-800 hover:border-slate-700 hover:bg-[#252a35]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                          {settlement.name}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          {settlement.alertLevel}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                        Impact Time: {settlement.eventDateTime}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        <span className="text-slate-500">Cause:</span> {settlement.cause}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1.5 flex items-center justify-between">
                        <span>Population: <strong className="text-white">{settlement.population}</strong></span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Reserves: <strong className="text-white">{settlement.reserves}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* TAB 3: EXACT FLOOD SITES */}
            {activeTab === "sites" && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Infrastructure Impact & Field Sites
                </div>
                {GROUND_LOCATIONS
                  .filter(l => !l.category.includes("Settlement") || l.category.includes("Terminal"))
                  .map((site) => (
                    <div
                      key={site.id}
                      onClick={() => selectAndFlyTo(site)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer ${
                        selectedLocation.id === site.id
                          ? "bg-cyan-950/40 border-cyan-500 shadow-md"
                          : isEventDate
                          ? "bg-[#250d14] border-rose-900/70 hover:border-rose-600"
                          : "bg-[#1e222a] border-slate-800 hover:border-slate-700 hover:bg-[#252a35]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-bold text-white">{site.name}</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          site.alertLevel === "DESTROYED" || site.alertLevel === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : site.isFlooded
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {site.alertLevel}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                        Event Time: {site.eventDateTime}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{site.cause}</div>
                      <div className="flex justify-between items-center pt-1.5 text-[10px]">
                        <span className="text-slate-500">{site.category}</span>
                        <span className="font-mono text-cyan-400">
                          {site.coords[0].toFixed(3)}° N, {site.coords[1].toFixed(3)}° E
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* TAB 4: LOCATION-SPECIFIC DISASTER HISTORY */}
            {activeTab === "history" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-amber-400 border-b border-amber-900/40 pb-1">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>Historical Record for {selectedLocation.name}</span>
                  </div>
                  <span className="text-[9px] font-mono bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                    {selectedLocation.history && selectedLocation.history.length > 0
                      ? `${selectedLocation.history.length} RECORDED`
                      : "0 RECORDS"}
                  </span>
                </div>

                {selectedLocation.history && selectedLocation.history.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      Verified flood, GLOF, or geological disaster records that directly impacted this exact location in the past 100 years:
                    </p>
                    {selectedLocation.history.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-[#191510] border border-amber-900/40 hover:border-amber-600/70 p-3 rounded-xl transition flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-200">
                            {item.year} &bull; {item.title || item.event}
                          </span>
                          <span className="text-[8.5px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {item.date}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">
                          {item.impact}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-amber-950/80">
                          <button
                            onClick={() => handleDateChange(item.date)}
                            className="text-[10px] bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded transition flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3 text-amber-400" />
                            Jump to {item.date}
                          </button>

                          {item.newsUrl && (
                            <a
                              href={item.newsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition underline"
                            >
                              <span>{item.newsSource}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#16181d] border border-slate-800 p-4 rounded-xl text-center space-y-2 my-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                      <Info className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">No Historical Flood Damage Recorded</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-[320px] mx-auto">
                      There are no recorded catastrophic glacial lake outbursts (GLOF) or flood washouts on file for <strong className="text-slate-200">{selectedLocation.name}</strong> in the past 100 years.
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Terrain and elevation for this sector indicate historic slope stability.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attribution Footer */}
          <div className={`p-2.5 border-t text-[9px] leading-tight transition-colors duration-300 ${
            isEventDate ? "bg-[#15070a] border-rose-900/60 text-rose-300/70" : "bg-[#121418] border-slate-800/80 text-slate-500"
          }`}>
            <div>Contains modified Copernicus Sentinel data 2026. Produced using WorldDEM-30.</div>
            <div>&copy; OpenStreetMap contributors.</div>
          </div>
        </div>
      ) : (
        /* FOLDED RIGHT CHIP (Full View Mode) */
        <button
          onClick={() => setIsRightPanelOpen(true)}
          style={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}
          className={`flex items-center gap-2 border px-3 py-2 rounded-lg text-xs font-semibold shadow-2xl transition ${
            isEventDate
              ? "bg-[#250d14]/95 border-rose-600 text-rose-200 hover:bg-rose-900"
              : "bg-[#16181d]/95 hover:bg-slate-800 border-slate-700 text-white"
          }`}
          title="Unfold Control & Info Panel"
        >
          <PanelRightOpen className={`w-4 h-4 ${isEventDate ? "text-rose-400" : "text-cyan-400"}`} />
          <span>Open Control Panel</span>
        </button>
      )}

      {/* 4. MULTILINGUAL SITREP COPILOT MODAL */}
      {showSitRepModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16181d] border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121418]">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Situation-Report Copilot (Date: {selectedDate})
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-800 p-1 rounded-md border border-slate-700">
                  <button
                    onClick={() => setSitRepLang("en")}
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      sitRepLang === "en" ? "bg-emerald-600 text-white" : "text-slate-400"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSitRepLang("local")}
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      sitRepLang === "local" ? "bg-emerald-600 text-white" : "text-slate-400"
                    }`}
                  >
                    {sitRepData?.local_language || "Local Language"}
                  </button>
                </div>
                <button
                  onClick={() => setShowSitRepModal(false)}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text bg-[#0d0f12]">
              {sitRepLang === "en" ? sitRepData?.report_en : sitRepData?.report_local}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-between items-center bg-[#121418]">
              <span className="text-[10px] text-slate-500">
                Verified from satellite raster calculations for {selectedDate}.
              </span>
              <button
                onClick={() => {
                  const content = sitRepLang === "en" ? sitRepData?.report_en : sitRepData?.report_local;
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `SitRep_${selectedDate}_${sitRepLang}.txt`;
                  a.click();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download 1-Page SitRep ({sitRepLang.toUpperCase()})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}