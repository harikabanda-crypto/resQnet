import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import SafeRouteCard from '../../components/SafeRouteCard.jsx'
import InteractiveMap from '../../components/InteractiveMap.jsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigation, AlertTriangle, ShieldCheck, MapPin, Layers } from 'lucide-react'
import api from '../../services/api.js'

const FILTERS = ['All', 'Risk', 'Shelters', 'Blockages', 'Volunteers']

export default function AuthorityMap() {
  const { zones, shelters, blockages, teams, backendConnected } = useApp()
  const [selected, setSelected] = useState(null)
  const [selectedType, setSelectedType] = useState('zone')
  const [filter, setFilter] = useState('All')
  const [showRoute, setShowRoute] = useState(false)
  const [activeRoute, setActiveRoute] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)

  // Handle entity selection from map
  function handleSelect(item, type) {
    setSelected(item)
    setSelectedType(type)
  }

  // Calculate live safe route to nearest shelter
  async function handleCalculateRoute() {
    if (!selected) return
    setLoadingRoute(true)
    setShowRoute(true)

    // Origin: selected zone or entity
    const originLat = selected.lat || 25.5788
    const originLng = selected.lng || 91.8933

    // Destination: nearest shelter or first available shelter
    const dest = shelters[0] || { lat: 25.5850, lng: 91.9050, name: 'Safe Shelter' }

    if (backendConnected) {
      try {
        const routeData = await api.getSafeRoute(originLat, originLng, dest.lat, dest.lng)
        setActiveRoute(routeData)
      } catch (err) {
        console.warn('Backend routing failed, using fallback:', err)
        setActiveRoute(null)
      } finally {
        setLoadingRoute(false)
      }
    } else {
      setLoadingRoute(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Live Geospatial Disaster Map</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time GIS monitoring {zones.length} NER grid zones, shelters, and road blockages
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg border border-red-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> Critical Risk
          </span>
          <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg border border-orange-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-500"/> High Risk
          </span>
          <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200 font-semibold">
            🏠 Shelters ({shelters.length})
          </span>
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200 font-semibold">
            ⛔ Road Hazards ({blockages.length})
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Layers size={13} /> Filter Layers:
        </span>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Leaflet Map Component */}
        <div className="lg:col-span-2">
          <InteractiveMap
            zones={zones}
            shelters={shelters}
            blockages={blockages}
            responders={teams}
            activeRoute={activeRoute}
            filter={filter}
            selectedEntity={selected}
            onSelect={handleSelect}
            height="560px"
          />
        </div>

        {/* Details & Routing Panel */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id || 'entity'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-slate-800 font-bold text-base">{selected.name || `Hazard: ${selected.blockage_type}`}</div>
                    <div className="text-slate-400 text-xs capitalize">
                      {selectedType}: {selected.id} {selected.location ? `• ${selected.location}` : ''}
                    </div>
                  </div>
                  {selected.risk && <RiskBadge level={selected.risk} size="lg"/>}
                </div>

                {/* Zone Telemetry Metrics */}
                {selectedType === 'zone' && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      ['Population', (selected.population || 0).toLocaleString()],
                      ['Active SOS', selected.sos || 0],
                      ['Water Level', selected.waterLevel || 'Normal'],
                      ['24h Rain', selected.rainfall || '0 mm/hr'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <div className="text-[11px] text-slate-400 font-medium">{k}</div>
                        <div className="text-slate-800 font-bold text-sm">{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shelter Capacity Metrics */}
                {selectedType === 'shelter' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 text-xs">
                    <div className="text-blue-700 font-bold mb-1">Evacuation Shelter Capacity</div>
                    <div className="text-slate-700">Occupied: {selected.occupied || 0} / {selected.capacity || 500}</div>
                  </div>
                )}

                {/* Blockage Metrics */}
                {selectedType === 'blockage' && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 text-xs">
                    <div className="text-red-700 font-bold mb-1">Road Closure Details</div>
                    <div className="text-slate-700">{selected.road_name} — {selected.passable ? 'Caution Passable' : 'Completely Blocked'}</div>
                  </div>
                )}

                {/* AI Recommendation */}
                {selected.recommendation && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                    <div className="text-xs text-purple-700 font-semibold mb-1">🤖 AI Action Advisory</div>
                    <div className="text-xs text-slate-600 leading-relaxed">{selected.recommendation}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleCalculateRoute}
                    disabled={loadingRoute}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Navigation size={15}/> {loadingRoute ? 'Computing Safe Corridors…' : 'Generate Safe Route'}
                  </button>
                  <button
                    onClick={() => { setSelected(null); setActiveRoute(null); setShowRoute(false) }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-2 rounded-xl transition-colors font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs shadow-sm">
                <MapPin size={24} className="mx-auto mb-2 text-slate-300" />
                Select any zone, shelter, or blockage on the map to inspect telemetry and compute hazard-free routes.
              </div>
            )}
          </AnimatePresence>

          {showRoute && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Hazard-Aware Routing Engine
                </div>
                {activeRoute && (
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    Safe Route Plotted
                  </span>
                )}
              </div>
              <SafeRouteCard />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
