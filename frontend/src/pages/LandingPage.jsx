import React from 'react'
import MobilePhone from '../components/MobilePhone.jsx'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl"/>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"/>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-red-100/30 rounded-full blur-2xl"/>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl">🛡</div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">ResQNet</h1>
        </div>
        <p className="text-slate-500 text-sm max-w-xs text-center">
          AI-powered disaster response coordination platform
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          {['SENSE','PREDICT','ALERT','RESPOND'].map((s, i) => (
            <React.Fragment key={s}>
              <span className="text-xs text-slate-400 font-semibold">{s}</span>
              {i < 3 && <span className="text-orange-400/80 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
        className="z-10"
      >
        <MobilePhone showApp={false} />
      </motion.div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-8 text-slate-400 text-xs z-10 animate-pulse"
      >
        Tap the ResQNet app to begin
      </motion.p>

      {/* Desktop role shortcuts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-6 flex gap-3 z-10 flex-wrap justify-center"
      >
        {['Authority Dashboard →', 'NGO Dashboard →', 'Volunteer →', 'Delivery →'].map((label, i) => {
          const routes = ['/login/authority', '/login/ngo', '/login/volunteer', '/login/delivery']
          return (
            <a key={i} href={routes[i]} className="text-xs text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 hover:border-slate-400 bg-white/70 px-3 py-1.5 rounded-lg shadow-sm">
              {label}
            </a>
          )
        })}
      </motion.div>
    </div>
  )
}
