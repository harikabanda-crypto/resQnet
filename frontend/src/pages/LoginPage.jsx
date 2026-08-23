import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MobilePhone from '../components/MobilePhone.jsx'
import { motion } from 'framer-motion'
import { useApp } from '../contexts/AppContext.jsx'

const ROLE_CONFIG = {
  citizen:   { label: 'Citizen', emoji: '👤', dest: '/citizen/home', desktop: false },
  volunteer: { label: 'Volunteer', emoji: '🙋', dest: '/volunteer/dashboard', desktop: true },
  ngo:       { label: 'NGO / Resource', emoji: '🏥', dest: '/ngo/dashboard', desktop: true },
  delivery:  { label: 'Delivery Partner', emoji: '🚚', dest: '/delivery/dashboard', desktop: true },
  authority: { label: 'Authority', emoji: '🏛', dest: '/authority/dashboard', desktop: true },
}

function LoginForm({ role, onDemoLogin }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.citizen
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  return (
    <div className="h-full flex flex-col bg-white p-5">
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">{cfg.emoji}</div>
        <h2 className="text-slate-800 font-bold text-lg">{cfg.label}</h2>
        <p className="text-slate-500 text-xs mt-1">Sign in to ResQNet</p>
      </div>
      <div className="space-y-3 flex-1">
        <div>
          <label className="text-xs text-slate-600 font-medium">Email / Phone</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400" placeholder="Enter email or phone"/>
        </div>
        <div>
          <label className="text-xs text-slate-600 font-medium">Password / OTP</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400" placeholder="Enter password"/>
        </div>
        <button onClick={onDemoLogin} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md">
          Login
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-200"/>
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-200"/>
        </div>
        <button onClick={onDemoLogin} className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          <span>⚡</span> Demo Login
        </button>
      </div>
      <p className="text-center text-xs text-slate-400 mt-4">ResQNet — SIH 2024 Demo</p>
    </div>
  )
}

export default function LoginPage() {
  const { role } = useParams()
  const navigate = useNavigate()
  const { setCurrentRole } = useApp()
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.citizen

  function handleDemoLogin() {
    setCurrentRole(role)
    navigate(cfg.dest)
  }

  // Authority/NGO/Volunteer/Delivery get desktop login
  if (cfg.desktop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">{cfg.emoji}</div>
            <h1 className="text-2xl font-bold text-slate-800">{cfg.label}</h1>
            <p className="text-slate-500 text-sm mt-1">ResQNet Command Access</p>
          </div>
          <div className="space-y-4">
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400" placeholder="Email / Official ID"/>
            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400" placeholder="Password"/>
            <button onClick={handleDemoLogin} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md">Login</button>
            <button onClick={handleDemoLogin} className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <span>⚡</span> Demo Login
            </button>
          </div>
          <button onClick={() => navigate('/resqnet')} className="mt-6 text-slate-400 hover:text-slate-600 text-sm w-full text-center transition-colors">← Back to roles</button>
        </motion.div>
      </div>
    )
  }

  // Citizen gets phone UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <MobilePhone showApp={true}>
        <LoginForm role={role} onDemoLogin={handleDemoLogin} />
      </MobilePhone>
    </div>
  )
}
