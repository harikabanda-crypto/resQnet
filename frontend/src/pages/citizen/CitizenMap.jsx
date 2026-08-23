import React, { useState } from 'react'
import { DEMO_ZONES, DEMO_SHELTERS } from '../../data/mockData.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import SafeRouteCard from '../../components/SafeRouteCard.jsx'
import { MapPin, Navigation } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const RISK_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  moderate: 'bg-yellow-500',
  safe: 'bg-green-500',
}

export default function CitizenMap() {
  const [selected, setSelected] = useState(null)
  const [showRoute, setShowRoute] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)

  return (
    <div className="p-3 space-y-3">
      <div className="text-slate-800 font-bold text-base">Disaster Map</div>

      {/* Mock map */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative h-52 bg-gradient-to-br from-slate-100 to-blue-50">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute border-slate-300 border-b w-full" style={{ top: `${i * 20}%` }}/>
            ))}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute border-slate-300 border-r h-full" style={{ left: `${i * 20}%` }}/>
            ))}
          </div>
          {/* Zone dots */}
          {DEMO_ZONES.map((z, i) => {
            const positions = [
              { top: '30%', left: '45%' }, { top: '20%', left: '30%' }, { top: '15%', left: '55%' },
              { top: '55%', left: '35%' }, { top: '65%', left: '55%' }, { top: '60%', left: '65%' },
            ]
            const p = positions[i] || { top: '50%', left: '50%' }
            return (
              <motion.div
                key={z.id}
                whileTap={{ scale: 1.3 }}
                onClick={() => setSelected(z)}
                className="absolute cursor-pointer"
                style={p}
              >
                <div className={`w-5 h-5 rounded-full ${RISK_COLORS[z.risk]} border-2 border-white shadow-lg ${z.risk === 'critical' ? 'animate-pulse' : ''}`}/>
                <div className="text-slate-700 text-[9px] font-bold mt-0.5 text-center">{z.id}</div>
              </motion.div>
            )
          })}
          {/* Shelters */}
          {DEMO_SHELTERS.map((s, i) => {
            const positions = [{ top: '40%', left: '60%' }, { top: '35%', left: '42%' }, { top: '25%', left: '32%' }, { top: '58%', left: '38%' }]
            const p = positions[i] || { top: '50%', left: '50%' }
            return (
              <div key={s.id} className="absolute" style={p}>
                <div className="w-4 h-4 rounded bg-blue-500 border border-white flex items-center justify-center text-[8px]">🏠</div>
              </div>
            )
          })}
          {/* Current loc */}
          <div className="absolute" style={{ top: '38%', left: '44%' }}>
            <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-500 animate-pulse shadow-sm"/>
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] text-slate-500">📍 You are here</div>
        </div>

        {/* Legend */}
        <div className="p-2 flex flex-wrap gap-2 border-t border-slate-200">
          {[['critical','Critical'],['high','High Risk'],['moderate','Moderate'],['safe','Safe']].map(([r, l]) => (
            <div key={r} className="flex items-center gap-1 text-[9px] text-slate-500">
              <div className={`w-2.5 h-2.5 rounded-full ${RISK_COLORS[r]}`}/>
              {l}
            </div>
          ))}
          <div className="flex items-center gap-1 text-[9px] text-slate-500">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded"/>🏠 Shelter
          </div>
        </div>
      </div>

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
                <div className="text-slate-800 font-bold text-sm">{selected.name}</div>
                <div className="text-slate-400 text-xs">Zone {selected.id}</div>
              </div>
              <RiskBadge level={selected.risk} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Population</div>
                <div className="text-slate-800 font-semibold">{selected.population.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Active SOS</div>
                <div className="text-red-600 font-semibold">{selected.sos}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Water Level</div>
                <div className="text-slate-800 font-semibold">{selected.waterLevel}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <div className="text-slate-400">Rainfall</div>
                <div className="text-slate-800 font-semibold">{selected.rainfall}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRoute(!showRoute)} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm">
                <Navigation size={12}/> Safe Route
              </button>
              <button onClick={() => setSelected(null)} className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-2 rounded-xl transition-colors">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe routes */}
      <AnimatePresence>
        {showRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-sm text-slate-800 font-semibold mb-2">Safe Routes to Shelter</div>
            <SafeRouteCard onSelect={r => setSelectedRoute(r)} />
            {selectedRoute && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-semibold text-center">
                ✓ Route selected: {selectedRoute.name}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
