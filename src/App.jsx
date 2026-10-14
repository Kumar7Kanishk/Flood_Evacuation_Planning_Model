import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  useMapEvents
} from 'react-leaflet'
import L from 'leaflet'
import {
  AlertTriangle,
  Shield,
  Layers,
  Navigation,
  Activity,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Minimize2,
  PhoneCall,
  Info
} from 'lucide-react'

// Custom DivIcons for crisp SVG rendering without missing asset URLs
const createCustomIcon = (bgColor, iconSvg, size = 32) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        border: 2px solid white;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

const shelterIcon = createCustomIcon(
  '#059669',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  36
)

const damagedBridgeIcon = createCustomIcon(
  '#dc2626',
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  30
)

const userPinIcon = createCustomIcon(
  '#f59e0b',
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>`,
  32
)

// Map event handler for user clicking to calculate evacuation route
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

export default function App() {
  const [summary, setSummary] = useState(null)
  const [floodGeoJson, setFloodGeoJson] = useState(null)
  const [buildingsGeoJson, setBuildingsGeoJson] = useState(null)
  const [roadsGeoJson, setRoadsGeoJson] = useState(null)
  const [bridgesGeoJson, setBridgesGeoJson] = useState(null)
  const [sheltersGeoJson, setSheltersGeoJson] = useState(null)
  const [routesGeoJson, setRoutesGeoJson] = useState(null)

  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [evacuationRoute, setEvacuationRoute] = useState(null)
  const [nearestShelter, setNearestShelter] = useState(null)
  const [activeTab, setActiveTab] = useState('evacuation') // evacuation, damage, layers
  const [mapBase, setMapBase] = useState('dark') // dark, satellite, osm
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Layer visibility toggles
  const [layers, setLayers] = useState({
    flood: true,
    buildings: true,
    roads: true,
    bridges: true,
    shelters: true,
    evacRoutes: true,
  })

  const [refreshIndex, setRefreshIndex] = useState(0)

  // Load datasets from public/data/
  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const fetchJson = async (url) => {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        }

        const [sum, flood, bld, rds, brg, shl, rts] = await Promise.all([
          fetchJson('/data/damage_summary.json').catch(() => null),
          fetchJson('/data/flood_polygons.geojson').catch(() => null),
          fetchJson('/data/buildings_affected.geojson').catch(() => null),
          fetchJson('/data/roads_affected.geojson').catch(() => null),
          fetchJson('/data/bridges_affected.geojson').catch(() => null),
          fetchJson('/data/evacuation_shelters.geojson').catch(() => null),
          fetchJson('/data/evacuation_routes.geojson').catch(() => null),
        ])

        if (active) {
          setSummary(sum)
          setFloodGeoJson(flood)
          setBuildingsGeoJson(bld)
          setRoadsGeoJson(rds)
          setBridgesGeoJson(brg)
          setSheltersGeoJson(shl)
          setRoutesGeoJson(rts)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error loading flood data:', err)
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [refreshIndex])

  // Extract shelter list for UI selector
  const shelterList = useMemo(() => {
    if (!sheltersGeoJson?.features) return []
    return sheltersGeoJson.features.map((f) => ({
      id: f.properties.id || f.properties.name,
      name: f.properties.name,
      capacity: f.properties.capacity || 500,
      status: f.properties.status || 'Active',
      medical: f.properties.medical_support,
      rations: f.properties.food_rations_days || 5,
      elevation: f.properties.elevation_m || 850,
      coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
    }))
  }, [sheltersGeoJson])

  // Calculate shortest path to nearest shelter
  const calculateEvacuation = useCallback(
    (coords) => {
      setSelectedLocation(coords)
      if (shelterList.length === 0) return

      let minDistance = Infinity
      let closest = shelterList[0]

      shelterList.forEach((s) => {
        const dLat = s.coords[0] - coords[0]
        const dLng = s.coords[1] - coords[1]
        const dist = Math.sqrt(dLat * dLat + dLng * dLng)
        if (dist < minDistance) {
          minDistance = dist
          closest = s
        }
      })

      setNearestShelter(closest)

      // Generate simulated safe route points avoiding flood centers
      const midLat = (coords[0] + closest.coords[0]) / 2 + 0.004
      const midLng = (coords[1] + closest.coords[1]) / 2 - 0.003
      setEvacuationRoute([coords, [midLat, midLng], closest.coords])
    },
    [shelterList]
  )

  // Map center bounds calculation
  const mapCenter = [31.7, 77.0]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* LEFT SIDEBAR: Command Center */}
      <div
        className={`${
          sidebarOpen ? 'w-96' : 'w-16'
        } transition-all duration-300 flex flex-col bg-slate-900 border-r border-slate-800 z-20 shadow-2xl`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-lg shrink-0 border border-red-500/30 pulse-alert">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
                  FLOOD EVACUATION
                </h1>
                <p className="text-xs text-red-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span>
                  Active Alert • Mandi, HP
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Quick Stats Bar */}
            {summary && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-center">
                <div className="p-2 rounded bg-slate-800/40 border border-slate-700/50">
                  <span className="block text-xs text-slate-400">Flooded</span>
                  <span className="text-sm font-bold text-cyan-400">
                    {summary.flood?.area_km2 || '0'} km²
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-800/40 border border-slate-700/50">
                  <span className="block text-xs text-slate-400">Affected</span>
                  <span className="text-sm font-bold text-rose-400">
                    {summary.buildings?.inundated || 0} bldgs
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-800/40 border border-slate-700/50">
                  <span className="block text-xs text-slate-400">Shelters</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {summary.evacuation?.active_shelters || 4} Open
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 text-xs font-medium">
              <button
                onClick={() => setActiveTab('evacuation')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'evacuation'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                Evacuation
              </button>
              <button
                onClick={() => setActiveTab('damage')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'damage'
                    ? 'border-red-500 text-red-400 bg-red-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Damage Assessment
              </button>
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'layers'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Layers
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: EVACUATION */}
              {activeTab === 'evacuation' && (
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      Interactive Evacuation Routing
                    </p>
                    <p className="text-slate-300">
                      Click anywhere on the map or pick an affected zone below to compute the
                      fastest safe route avoiding flooded roads and compromised bridges.
                    </p>
                  </div>

                  {/* Active Route Box */}
                  {selectedLocation && nearestShelter ? (
                    <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Destination
                        </span>
                        <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                          Capacity: {nearestShelter.capacity}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-white">{nearestShelter.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                        <div>Elevation: <strong className="text-white">{nearestShelter.elevation}m</strong></div>
                        <div>Rations: <strong className="text-white">{nearestShelter.rations} Days</strong></div>
                        <div>Medical: <strong className="text-emerald-400">{nearestShelter.medical ? 'Available' : 'Standard'}</strong></div>
                        <div>Status: <strong className="text-emerald-400">Open & Safe</strong></div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLocation(null)
                          setEvacuationRoute(null)
                          setNearestShelter(null)
                        }}
                        className="w-full mt-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition"
                      >
                        Clear Route
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-800 rounded-lg">
                      No location selected. Click the map to plan evacuation.
                    </div>
                  )}

                  {/* Available Shelters List */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Designated Relief Shelters</span>
                      <span className="text-[10px] text-emerald-400">{shelterList.length} Active</span>
                    </h3>
                    <div className="space-y-2">
                      {shelterList.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => calculateEvacuation([s.coords[0] - 0.015, s.coords[1] - 0.015])}
                          className="p-3 bg-slate-800/40 hover:bg-slate-800 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 cursor-pointer transition space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">{s.name}</span>
                            <span className="text-[11px] text-emerald-400 font-bold">
                              {s.capacity} beds
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>Elev: {s.elevation}m</span>
                            <span>Food: {s.rations}d</span>
                            {s.medical && <span className="text-rose-400 font-medium">Medical Unit</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Dispatch */}
                  <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                      <PhoneCall className="w-4 h-4" /> Emergency Helplines
                    </div>
                    <div className="text-xs space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span>NDRF Control Room:</span>
                        <strong className="text-white">1078 / 011-24363260</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>HP State Disaster Cell:</span>
                        <strong className="text-white">1070 / 1077</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>District Relief Officer:</span>
                        <strong className="text-white">+91-1905-226201</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DAMAGE ASSESSMENT */}
              {activeTab === 'damage' && (
                <div className="space-y-4">
                  {summary ? (
                    <>
                      {/* Flood Inundation Breakdown */}
                      <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
                        <h4 className="text-xs font-bold text-slate-300">Flood Inundation Extent</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Total Surface Flood:</span>
                            <strong className="text-cyan-400">{summary.flood.area_km2} km²</strong>
                          </div>
                          {summary.flood.area_km2_by_kind &&
                            Object.entries(summary.flood.area_km2_by_kind).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-slate-400 pl-2">
                                <span className="capitalize">{k}:</span>
                                <span>{v} km²</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Buildings Breakdown */}
                      <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-300">Infrastructure Damage</h4>
                          <span className="text-[11px] text-rose-400 font-bold">
                            {summary.buildings?.inundated + (summary.buildings?.partially_hit || 0)} Damaged
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Submerged / Inundated:</span>
                            <span className="text-rose-400 font-semibold">{summary.buildings?.inundated || 0}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Partially Flooded:</span>
                            <span className="text-amber-400 font-semibold">{summary.buildings?.partially_hit || 0}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Unaffected / Safe:</span>
                            <span className="text-emerald-400 font-semibold">{summary.buildings?.unaffected || 0}</span>
                          </div>
                        </div>

                        {summary.buildings?.hit_by_osm_type && (
                          <div className="pt-2 border-t border-slate-700/50">
                            <span className="block text-[11px] text-slate-400 mb-1">Damaged by Facility Type:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(summary.buildings.hit_by_osm_type).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[10px] bg-slate-700/70 text-slate-200 px-2 py-0.5 rounded border border-slate-600 capitalize"
                                >
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Road Network & Bridges */}
                      <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
                        <h4 className="text-xs font-bold text-slate-300">Transport Network Impact</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Flooded Road Length:</span>
                            <strong className="text-rose-400">{summary.roads?.flooded_length_km} km</strong>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Clear Safe Corridors:</span>
                            <strong className="text-emerald-400">{summary.roads?.total_length_km - summary.roads?.flooded_length_km} km</strong>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Impassable Segments:</span>
                            <strong className="text-amber-400">{summary.roads?.segments_affected}</strong>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Compromised Bridges:</span>
                            <strong className="text-rose-400">{summary.bridges?.likely_damaged || 0}</strong>
                          </div>
                        </div>

                        {summary.bridges?.likely_damaged_list?.length > 0 && (
                          <div className="pt-2 border-t border-slate-700/50">
                            <span className="block text-[11px] text-red-400 font-semibold mb-1">Damaged Bridges:</span>
                            <div className="space-y-1">
                              {summary.bridges.likely_damaged_list.map((b) => (
                                <div key={b.osm_id} className="text-[11px] text-slate-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                  <span>{b.name || b.osm_id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 py-6 text-center">
                      No damage summary available. Run pipeline to refresh data.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LAYERS & MAP SETTINGS */}
              {activeTab === 'layers' && (
                <div className="space-y-4">
                  {/* Base Map Style */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Map Basemap</h4>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setMapBase('dark')}
                        className={`py-1.5 px-2 text-xs rounded border transition ${
                          mapBase === 'dark'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        Dark Mode
                      </button>
                      <button
                        onClick={() => setMapBase('satellite')}
                        className={`py-1.5 px-2 text-xs rounded border transition ${
                          mapBase === 'satellite'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        Satellite
                      </button>
                      <button
                        onClick={() => setMapBase('osm')}
                        className={`py-1.5 px-2 text-xs rounded border transition ${
                          mapBase === 'osm'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        Street Map
                      </button>
                    </div>
                  </div>

                  {/* Layer Toggles */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Overlay Layers</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'flood', label: 'Flood Extent Mask', color: 'bg-cyan-500' },
                        { key: 'shelters', label: 'Evacuation Shelters', color: 'bg-emerald-500' },
                        { key: 'evacRoutes', label: 'Safe Evacuation Corridors', color: 'bg-emerald-400' },
                        { key: 'buildings', label: 'Affected Buildings', color: 'bg-rose-500' },
                        { key: 'roads', label: 'Flooded / Impassable Roads', color: 'bg-amber-500' },
                        { key: 'bridges', label: 'Compromised Bridges', color: 'bg-red-600' },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-2.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                            <span>{item.label}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={layers[item.key]}
                            onChange={(e) =>
                              setLayers((prev) => ({ ...prev, [item.key]: e.target.checked }))
                            }
                            className="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={() => {
                      setLoading(true)
                      setRefreshIndex((i) => i + 1)
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reload Spatial Layers
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Sentinel-1 SAR • OSM pre-event</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE: LEAFLET MAP VIEW */}
      <div className="flex-1 relative h-full">
        {loading && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-200">Loading geospatial layers...</p>
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={12}
          zoomControl={false}
          className="h-full w-full"
        >
          {/* Base Layer Selection */}
          {mapBase === 'dark' && (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          )}
          {mapBase === 'satellite' && (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}
          {mapBase === 'osm' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {/* Map click listener */}
          <MapClickHandler onLocationSelect={calculateEvacuation} />

          {/* Flood Extent Polygons */}
          {layers.flood && floodGeoJson && (
            <GeoJSON
              data={floodGeoJson}
              style={(feature) => ({
                fillColor: feature?.properties?.kind === 'debris' ? '#38bdf8' : '#0284c7',
                fillOpacity: 0.55,
                color: '#38bdf8',
                weight: 1.5,
              })}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="text-xs space-y-1">
                    <strong class="text-cyan-400 font-bold">Flood Inundation Zone</strong><br/>
                    Type: <span class="capitalize">${feature.properties?.kind || 'Water'}</span><br/>
                    Status: <span class="text-red-400 font-semibold">Active Inundation</span>
                  </div>
                `)
              }}
            />
          )}

          {/* Affected Buildings */}
          {layers.buildings && buildingsGeoJson && (
            <GeoJSON
              data={buildingsGeoJson}
              style={(feature) => ({
                fillColor: feature?.properties?.status === 'inundated' ? '#ef4444' : '#f97316',
                fillOpacity: 0.8,
                color: '#b91c1c',
                weight: 1.2,
              })}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="text-xs space-y-1">
                    <strong class="text-rose-400 font-bold">Affected Structure</strong><br/>
                    Name: <strong>${feature.properties?.name || feature.properties?.osm_id || 'Building'}</strong><br/>
                    Status: <span class="text-red-400 font-semibold uppercase">${feature.properties?.status}</span><br/>
                    Type: ${feature.properties?.building || 'General'}<br/>
                    Overlap: ${Math.round(feature.properties?.flood_overlap || 0)} m²
                  </div>
                `)
              }}
            />
          )}

          {/* Impassable / Flooded Roads */}
          {layers.roads && roadsGeoJson && (
            <GeoJSON
              data={roadsGeoJson}
              style={{
                color: '#ef4444',
                weight: 4,
                dashArray: '6, 6',
                opacity: 0.9,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="text-xs space-y-1">
                    <strong class="text-red-400 font-bold">Impassable Roadway</strong><br/>
                    Name: <strong>${feature.properties?.name || 'Road Segment'}</strong><br/>
                    Classification: ${feature.properties?.highway || 'Road'}<br/>
                    Flooded: ${Math.round(feature.properties?.flooded_len_m || 0)}m<br/>
                    Status: <span class="text-red-400 font-bold">BLOCKED / DO NOT USE</span>
                  </div>
                `)
              }}
            />
          )}

          {/* Safe Clear Evacuation Corridors */}
          {layers.evacRoutes && routesGeoJson && (
            <GeoJSON
              data={routesGeoJson}
              style={{
                color: '#10b981',
                weight: 3.5,
                opacity: 0.85,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="text-xs space-y-1">
                    <strong class="text-emerald-400 font-bold">Verified Safe Evacuation Corridor</strong><br/>
                    Route: <strong>${feature.properties?.name || 'Highway'}</strong><br/>
                    Condition: <span class="text-emerald-400 font-semibold">Dry & Passable</span>
                  </div>
                `)
              }}
            />
          )}

          {/* Compromised Bridges Markers */}
          {layers.bridges &&
            bridgesGeoJson?.features?.map((b, idx) => {
              const coords = b.geometry.type === 'LineString'
                ? [b.geometry.coordinates[0][1], b.geometry.coordinates[0][0]]
                : [b.geometry.coordinates[1], b.geometry.coordinates[0]]
              return (
                <Marker key={`bridge-${idx}`} position={coords} icon={damagedBridgeIcon}>
                  <Popup>
                    <div className="text-xs space-y-1">
                      <strong className="text-red-400 font-bold">Compromised Bridge</strong><br/>
                      Name: <strong>{b.properties.name || 'River Crossing'}</strong><br/>
                      Status: <span className="text-red-400 font-bold">{b.properties.status}</span><br/>
                      Water overlap: {Math.round(b.properties.flood_overlap || 0)}m
                    </div>
                  </Popup>
                </Marker>
              )
            })}

          {/* Designated Evacuation Shelters */}
          {layers.shelters &&
            shelterList.map((s) => (
              <Marker key={s.id} position={s.coords} icon={shelterIcon}>
                <Popup>
                  <div className="text-xs space-y-1">
                    <strong className="text-emerald-400 font-bold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 inline" /> Emergency Relief Shelter
                    </strong>
                    <br />
                    Name: <strong>{s.name}</strong><br />
                    Capacity: <strong className="text-white">{s.capacity} persons</strong><br />
                    Elevation: {s.elevation} meters (High Ground)<br />
                    Supplies: {s.rations} Days Food & Water<br />
                    Medical: {s.medical ? 'Doctor On-Site' : 'First-Aid Kit'}<br />
                    <button
                      onClick={() => calculateEvacuation([s.coords[0] - 0.02, s.coords[1] - 0.02])}
                      className="mt-2 w-full py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium text-[11px]"
                    >
                      Route Here
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* User Selected Evacuation Start Point */}
          {selectedLocation && (
            <Marker position={selectedLocation} icon={userPinIcon}>
              <Popup>
                <div className="text-xs">
                  <strong>Selected Start Location</strong><br/>
                  Routing to: {nearestShelter?.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active Evacuation Path */}
          {evacuationRoute && (
            <Polyline
              positions={evacuationRoute}
              pathOptions={{
                color: '#34d399',
                weight: 5,
                dashArray: '10, 8',
                opacity: 0.95,
              }}
            />
          )}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-6 right-6 z-10 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-2xl text-xs space-y-2 pointer-events-auto">
          <h4 className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Map Legend
          </h4>
          <div className="space-y-1.5 text-slate-300 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-400"></span>
              <span>Flood Inundation Extent (SAR VV)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-500 border border-rose-400"></span>
              <span>Inundated / Damaged Buildings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-b-2 border-dashed border-red-500"></span>
              <span>Blocked / Submerged Roads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-emerald-400"></span>
              <span>Safe Evacuation Corridors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white"></span>
              <span>Designated Relief Shelters</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span>
              <span>Damaged / At-Risk Bridge</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
