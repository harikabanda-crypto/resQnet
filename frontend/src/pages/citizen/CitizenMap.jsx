import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import SafeRouteCard from '../../components/SafeRouteCard.jsx'
import InteractiveMap from '../../components/InteractiveMap.jsx'
import { Navigation, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../../services/api.js'

export default function CitizenMap() {
  const { zones, shelters, blockages, teams, backendConnected } = useApp()
  const [selected, setSelected] = useState(null)
  const [showRoute, setShowRoute] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [activeRoute, setActiveRoute] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)

  async function handleCalculateRoute() {
    if (!selected) return
    setLoadingRoute(true)
    setShowRoute(true)

    const originLat = selected.lat || 25.5788
    const originLng = selected.lng || 91.8933
    const dest = shelters[0] || { lat: 25.5850, lng: 91.9050 }

    if (backendConnected) {
      try {
        const routeData = await api.getSafeRoute(originLat, originLng, dest.lat, dest.lng)
        setActiveRoute(routeData)
      } catch (err) {
        console.warn('Routing error:', err)
      } finally {
        setLoadingRoute(false)
      }
    } else {
      setLoadingRoute(false)
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-slate-800 font-bold text-base">Live Disaster Map</div>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
          OpenStreetMap GIS
        </span>
      </div>

      {/* Real Interactive Leaflet Map for Mobile */}
      <InteractiveMap
        zones={zones}
        shelters={shelters}
        blockages={blockages}
        responders={teams}
        activeRoute={activeRoute}
        selectedEntity={selected}
        onSelect={(entity) => setSelected(entity)}
        height="260px"
      />

      {/* Zone detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-slate-800 font-bold text-sm">{selected.name || `Zone ${selected.id}`}</div>
                <div className="text-slate-400 text-xs">Zone {selected.id}</div>
              </div>
              {selected.risk && <RiskBadge level={selected.risk} />}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Population</div>
                <div className="text-slate-800 font-semibold">{(selected.population || 0).toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Active SOS</div>
                <div className="text-red-600 font-semibold">{selected.sos || 0}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Water Level</div>
                <div className="text-slate-800 font-semibold">{selected.waterLevel || 'Normal'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Rainfall</div>
                <div className="text-slate-800 font-semibold">{selected.rainfall || '0 mm/hr'}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCalculateRoute}
                disabled={loadingRoute}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Navigation size={13}/> {loadingRoute ? 'Routing…' : 'Safe Route'}
              </button>
              <button
                onClick={() => { setSelected(null); setActiveRoute(null); setShowRoute(false) }}
                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-2 rounded-xl transition-colors font-semibold"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe routes */}
      <AnimatePresence>
        {showRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-800 font-bold flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                Evacuation Corridors
              </div>
              {activeRoute && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Plotted on Map
                </span>
              )}
            </div>
            <SafeRouteCard onSelect={r => setSelectedRoute(r)} />
            {selectedRoute && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-semibold text-center">
                ✓ Selected: {selectedRoute.name}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
