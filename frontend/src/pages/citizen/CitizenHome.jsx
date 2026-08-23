import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, AlertTriangle, Droplets, CloudRain, Home, ChevronRight, Shield } from 'lucide-react'
import { useApp } from '../../contexts/AppContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'

export default function CitizenHome() {
  const { alerts } = useApp()
  const navigate = useNavigate()
  const [sosModal, setSosModal] = useState(false)
  const [sosSent, setSosSent] = useState(false)

  function handleSOS() {
    setSosModal(true)
  }
  function confirmSOS() {
    setSosSent(true)
    setTimeout(() => { setSosModal(false); setSosSent(false) }, 3000)
  }

  return (
    <div className="p-3 space-y-3">
      {/* Location & Risk */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
            <MapPin size={12} className="text-orange-500"/>
            <span>Kukatpally, Hyderabad</span>
          </div>
          <RiskBadge level="high" />
        </div>
        <div className="text-red-700 font-bold text-base mb-1">HIGH RISK ZONE</div>
        <p className="text-slate-600 text-xs leading-relaxed">{alerts[0]?.message || 'Heavy rainfall detected. Water levels are rising in your area.'}</p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <CloudRain size={13} className="text-blue-500"/>
            <span className="text-xs text-slate-500">Rainfall</span>
          </div>
          <div className="text-slate-800 font-bold text-lg">82 mm/hr</div>
          <div className="text-xs text-orange-600">⬆ Rising</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={13} className="text-blue-500"/>
            <span className="text-xs text-slate-500">Water Level</span>
          </div>
          <div className="text-slate-800 font-bold text-lg">Rising</div>
          <div className="text-xs text-slate-400">Updated 2 min ago</div>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/citizen/request')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md"
        >
          🆘 Request Help
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/citizen/map')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md"
        >
          🗺 Safe Place
        </motion.button>
      </div>

      {/* Nearest shelter */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Home size={14} className="text-green-500"/>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Nearest Shelter</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-800 font-semibold text-sm">Kondapur Sports Complex</div>
            <div className="text-xs text-slate-500">1.8 km • ~12 min • 580 spots available</div>
          </div>
          <button onClick={() => navigate('/citizen/map')} className="text-orange-500 hover:text-orange-600">
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>

      {/* Latest alert */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Latest Alerts</div>
        {alerts.slice(0, 3).map(a => (
          <div key={a.id} className={`text-xs p-2 rounded-lg border-l-2 ${
            a.severity === 'critical' ? 'bg-red-50 border-red-400 text-red-700' :
            a.severity === 'high' ? 'bg-orange-50 border-orange-400 text-orange-700' :
            'bg-yellow-50 border-yellow-400 text-yellow-700'
          }`}>
            {a.message}
          </div>
        ))}
      </div>

      {/* SOS button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={handleSOS}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
      >
        🆘 EMERGENCY SOS
      </motion.button>

      {/* SOS Modal */}
      <AnimatePresence>
        {sosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
            onClick={() => !sosSent && setSosModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-red-200 rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl"
            >
              {sosSent ? (
                <>
                  <div className="text-5xl mb-3">✅</div>
                  <div className="text-green-600 font-bold text-lg mb-2">SOS SENT</div>
                  <div className="text-slate-500 text-sm">Request ID: <span className="text-slate-800 font-mono">SOS-{Date.now().toString().slice(-5)}</span></div>
                  <div className="text-slate-500 text-xs mt-2">Location: Kukatpally</div>
                  <div className="mt-3 text-xs text-orange-600 font-semibold">Priority: CRITICAL</div>
                  <div className="text-xs text-slate-500">Estimated response: 8-12 min</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">🆘</div>
                  <div className="text-red-600 font-bold text-lg mb-2">EMERGENCY SOS</div>
                  <p className="text-slate-500 text-xs mb-5">Your current location will be shared with authorities and nearby responders.</p>
                  <button onClick={confirmSOS} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors animate-pulse">
                    HOLD TO SEND
                  </button>
                  <button onClick={() => setSosModal(false)} className="mt-3 text-slate-400 text-xs hover:text-slate-600 transition-colors">Cancel</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
