import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MobilePhone from '../components/MobilePhone.jsx'
import { motion } from 'framer-motion'
import { useApp } from '../contexts/AppContext.jsx'

const ROLE_CONFIG = {
  citizen:   { label: 'Citizen', emoji: '👤', dest: '/citizen/home', desktop: false, email: 'citizen@resqnet.demo' },
  volunteer: { label: 'Volunteer', emoji: '🙋', dest: '/volunteer/dashboard', desktop: true, email: 'volunteer@resqnet.demo' },
  ngo:       { label: 'NGO / Resource', emoji: '🏥', dest: '/ngo/dashboard', desktop: true, email: 'ngo@resqnet.demo' },
  delivery:  { label: 'Delivery Partner', emoji: '🚚', dest: '/delivery/dashboard', desktop: true, email: 'volunteer@resqnet.demo' },
  authority: { label: 'Authority', emoji: '🏛', dest: '/authority/dashboard', desktop: true, email: 'authority@resqnet.demo' },
}

function LoginForm({ role, onSubmit, onDemoLogin, error, loading, backendConnected }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.citizen
  const [email, setEmail] = useState(cfg.email || '')
  const [pass, setPass] = useState('demo123')

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto scrollbar-hide">
      <div className="flex flex-col items-center pt-6 pb-4 px-5 shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">{cfg.emoji}</div>
        <h2 className="text-slate-800 font-bold text-lg">{cfg.label}</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] text-slate-500">
            {backendConnected ? 'Connected to FastAPI Backend' : 'Demo Mode (Offline)'}
          </span>
        </div>
      </div>
      <div className="flex-1 px-5 pb-4 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs text-slate-600 font-medium">Email / Phone</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400" placeholder="Enter email or phone"/>
        </div>
        <div>
          <label className="text-xs text-slate-600 font-medium">Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400" placeholder="Enter password"/>
        </div>
        <button
          disabled={loading}
          onClick={() => onSubmit(email, pass)}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md"
        >
          {loading ? 'Authenticating…' : 'Login'}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-200"/>
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-200"/>
        </div>
        <button onClick={onDemoLogin} className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          <span>⚡</span> One-Click Demo Login
        </button>
        <p className="text-center text-[11px] text-slate-400 pt-2">ResQNet — North Eastern Region Network</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { role } = useParams()
  const navigate = useNavigate()
  const { setCurrentRole, loginUser, backendConnected } = useApp()
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.citizen

  const [desktopEmail, setDesktopEmail] = useState(cfg.email || '')
  const [desktopPass, setDesktopPass] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(email, password) {
    setLoading(true)
    setError('')
    try {
      await loginUser(email, password, role)
      navigate(cfg.dest)
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">{cfg.emoji}</div>
            <h1 className="text-2xl font-bold text-slate-800">{cfg.label}</h1>
            <p className="text-slate-500 text-sm mt-1">ResQNet Command Access</p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-slate-100">
              <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs text-slate-600 font-medium">
                {backendConnected ? 'FastAPI Backend Live' : 'Demo Fallback Mode'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Email / Official ID</label>
              <input
                value={desktopEmail}
                onChange={e => setDesktopEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                placeholder="Email / Official ID"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Password</label>
              <input
                type="password"
                value={desktopPass}
                onChange={e => setDesktopPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                placeholder="Password"
              />
            </div>
            <button
              disabled={loading}
              onClick={() => handleLogin(desktopEmail, desktopPass)}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
            <button
              onClick={handleDemoLogin}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>⚡</span> One-Click Demo Access
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
        <LoginForm
          role={role}
          onSubmit={handleLogin}
          onDemoLogin={handleDemoLogin}
          error={error}
          loading={loading}
          backendConnected={backendConnected}
        />
      </MobilePhone>
    </div>
  )
}
