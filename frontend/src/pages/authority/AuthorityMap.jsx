import React, { useState } from 'react'
import { DEMO_ZONES, DEMO_SHELTERS } from '../../data/mockData.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import SafeRouteCard from '../../components/SafeRouteCard.jsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Filter, Navigation } from 'lucide-react'

const RISK_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  moderate: 'bg-yellow-500',
  safe: 'bg-green-500',
}

const FILTERS = ['All', 'Risk', 'SOS', 'Shelters', 'Resources', 'Volunteers', 'Deliveries']

export default function AuthorityMap() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [showRoute, setShowRoute] = useState(false)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-800">Live Disaster Map</h1>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400 shadow-sm'
            }`}
          >{f}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-[500px] bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="absolute inset-0 opacity-30">
              {[...Array(10)].map((_, i) => <div key={i} className="absolute border-slate-300 border-b w-full" style={{ top: `${i * 11}%` }}/>)}
              {[...Array(10)].map((_, i) => <div key={i} className="absolute border-slate-300 border-r h-full" style={{ left: `${i * 11}%` }}/>)}
            </div>
            {DEMO_ZONES.map((z, i) => {
              const positions = [
                { top: '35%', left: '48%' }, { top: '22%', left: '32%' }, { top: '18%', left: '58%' },
                { top: '58%', left: '37%' }, { top: '68%', left: '57%' }, { top: '62%', left: '68%' },
              ]
              const p = positions[i] || { top: '50%', left: '50%' }
              return (
                <motion.div key={z.id} whileHover={{ scale: 1.2 }} onClick={() => setSelected(z)} className="absolute cursor-pointer" style={p}>
                  <div className={`w-8 h-8 rounded-full ${RISK_COLORS[z.risk]} border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-xl ${z.risk === 'critical' ? 'animate-pulse' : ''}`}>{z.id}</div>
                </motion.div>
              )
            })}
            {DEMO_SHELTERS.map((s, i) => {
              const positions = [{ top: '42%', left: '62%' }, { top: '37%', left: '44%' }, { top: '26%', left: '34%' }, { top: '60%', left: '40%' }]
              const p = positions[i] || { top: '50%', left: '50%' }
              return (
                <div key={s.id} className="absolute" style={p}>
                  <div className="w-6 h-6 rounded bg-blue-500 border border-white flex items-center justify-center text-xs shadow-lg cursor-pointer">🏠</div>
                </div>
              )
            })}
            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-slate-200 rounded-xl p-2 flex flex-col gap-1.5 shadow-sm">
              {[['bg-red-500','Critical'],['bg-orange-500','High Risk'],['bg-yellow-500','Moderate'],['bg-green-500','Safe'],['bg-blue-500','Shelter']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <div className={`w-3 h-3 rounded-full ${c}`}/>{l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone detail panel */}
        <div className="space-y-3">
          <AnimatePresence>
            {selected ? (
              <motion.div key="zone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-slate-800 font-bold">{selected.name}</div>
                    <div className="text-slate-400 text-xs">Zone {selected.id}</div>
                  </div>
                  <RiskBadge level={selected.risk} size="lg"/>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    ['Population', selected.population.toLocaleString()],
                    ['Active SOS', selected.sos],
                    ['Water Level', selected.waterLevel],
                    ['Rainfall', selected.rainfall],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <div className="text-xs text-slate-400">{k}</div>
                      <div className="text-slate-800 font-semibold text-sm">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                  <div className="text-xs text-purple-700 font-semibold mb-1">🤖 AI Recommendation</div>
                  <div className="text-xs text-slate-600">{selected.recommendation}</div>
                </div>
                <div className="space-y-2">
                  <button onClick={() => setShowRoute(!showRoute)} className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <Navigation size={14}/> Safe Route
                  </button>
                  <button onClick={() => setSelected(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm py-2 rounded-xl transition-colors">✕ Close</button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm shadow-sm">
                Click a zone on the map to view details
              </div>
            )}
          </AnimatePresence>

          {showRoute && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="font-semibold text-slate-800 text-sm mb-3">Safe Routes</div>
              <SafeRouteCard/>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
