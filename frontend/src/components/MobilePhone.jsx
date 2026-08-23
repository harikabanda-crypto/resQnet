import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const APPS = [
  { id: 'weather', label: 'Weather', emoji: '🌦', color: 'from-sky-400 to-blue-500' },
  { id: 'maps', label: 'Maps', emoji: '🗺', color: 'from-green-400 to-emerald-600' },
  { id: 'messages', label: 'Messages', emoji: '💬', color: 'from-green-400 to-green-600' },
  { id: 'emergency', label: 'Emergency', emoji: '🚨', color: 'from-red-400 to-red-600' },
  { id: 'camera', label: 'Camera', emoji: '📷', color: 'from-slate-400 to-slate-600' },
  { id: 'settings', label: 'Settings', emoji: '⚙️', color: 'from-slate-500 to-slate-700' },
  { id: 'resqnet', label: 'ResQNet', emoji: '🛡', color: 'from-orange-500 to-red-600', main: true },
  { id: 'news', label: 'Alerts', emoji: '📢', color: 'from-yellow-400 to-orange-500' },
]

const DOCK_APPS = [
  { id: 'phone', label: 'Phone', emoji: '📞', color: 'from-green-500 to-green-600' },
  { id: 'safari', label: 'Browser', emoji: '🌐', color: 'from-blue-400 to-blue-600' },
  { id: 'resqnet_dock', label: 'ResQNet', emoji: '🛡', color: 'from-orange-500 to-red-600', main: true },
  { id: 'contacts', label: 'Contacts', emoji: '👤', color: 'from-slate-400 to-slate-500' },
]

function AppIcon({ app, onClick, size = 'normal' }) {
  const s = size === 'dock' ? 'w-12 h-12 text-2xl' : 'w-14 h-14 text-3xl'
  const labelSize = size === 'dock' ? 'text-[9px]' : 'text-[10px]'
  return (
    <motion.div
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      onClick={() => onClick && onClick(app)}
      className="flex flex-col items-center gap-1 cursor-pointer select-none"
    >
      <div className={`${s} rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg ${app.main ? 'ring-2 ring-orange-400/50 shadow-orange-500/30' : ''}`}>
        <span>{app.emoji}</span>
      </div>
      <span className={`${labelSize} text-white/80 font-medium text-center leading-tight`}>{app.label}</span>
    </motion.div>
  )
}

export default function MobilePhone({ children, showApp }) {
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)
  const [splash, setSplash] = useState(false)

  function handleAppClick(app) {
    if (app.main || app.id === 'resqnet_dock') {
      setOpening(true)
      setTimeout(() => { setOpening(false); setSplash(true) }, 600)
      setTimeout(() => { setSplash(false); navigate('/resqnet') }, 1800)
    }
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="relative w-[340px] h-[700px] flex-shrink-0">
      {/* Phone frame */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[50px] shadow-2xl shadow-black/60 border border-slate-600/50">
        {/* Side buttons */}
        <div className="absolute -left-1 top-24 w-1 h-8 bg-slate-600 rounded-l-sm"/>
        <div className="absolute -left-1 top-36 w-1 h-12 bg-slate-600 rounded-l-sm"/>
        <div className="absolute -left-1 top-52 w-1 h-12 bg-slate-600 rounded-l-sm"/>
        <div className="absolute -right-1 top-32 w-1 h-16 bg-slate-600 rounded-r-sm"/>
      </div>

      {/* Screen */}
      <div className="absolute inset-[6px] bg-black rounded-[46px] overflow-hidden">
        {/* Wallpaper */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900"/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.2)_0%,_transparent_60%)]"/>

        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600/50"/>
        </div>

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-14 flex items-end justify-between px-6 pb-1 z-40">
          <span className="text-white text-xs font-semibold">{timeStr}</span>
          <div className="flex items-center gap-1">
            <span className="text-white text-xs">●●●●</span>
            <span className="text-white text-xs">WiFi</span>
            <span className="text-white text-xs">🔋</span>
          </div>
        </div>

        {/* App content or home screen */}
        <AnimatePresence mode="wait">
          {showApp ? (
            <motion.div
              key="app"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pt-14"
            >
              {children}
            </motion.div>
          ) : splash ? (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-orange-900 to-red-950"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl shadow-2xl mb-6"
              >
                🛡
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white text-2xl font-bold tracking-wide"
              >ResQNet</motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/60 text-xs mt-2"
              >Disaster Response Platform</motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 1 }}
              animate={{ opacity: opening ? 0 : 1 }}
              className="absolute inset-0 pt-14"
            >
              {/* Lock screen date */}
              <div className="text-center pt-4 pb-6">
                <div className="text-white/60 text-xs">{dateStr}</div>
              </div>

              {/* App grid */}
              <div className="grid grid-cols-4 gap-4 px-5 pb-4">
                {APPS.map(app => (
                  <AppIcon key={app.id} app={app} onClick={handleAppClick} />
                ))}
              </div>

              {/* Dock */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md rounded-3xl p-3 flex justify-around items-center border border-white/20">
                {DOCK_APPS.map(app => (
                  <AppIcon key={app.id} app={app} onClick={handleAppClick} size="dock" />
                ))}
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/40 rounded-full"/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
