import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../contexts/AppContext.jsx'
import { MapPin, Users, ChevronRight, CheckCircle } from 'lucide-react'

const REQUEST_TYPES = [
  { id: 'Rescue', emoji: '🚨', color: 'from-red-50 to-red-100 border-red-200' },
  { id: 'Food', emoji: '🍱', color: 'from-yellow-50 to-yellow-100 border-yellow-200' },
  { id: 'Water', emoji: '💧', color: 'from-blue-50 to-blue-100 border-blue-200' },
  { id: 'Medicine', emoji: '💊', color: 'from-green-50 to-green-100 border-green-200' },
  { id: 'Shelter', emoji: '🏠', color: 'from-purple-50 to-purple-100 border-purple-200' },
  { id: 'Other Emergency', emoji: '⚡', color: 'from-orange-50 to-orange-100 border-orange-200' },
]

export default function CitizenRequest() {
  const { addRequest } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [type, setType] = useState(null)
  const [people, setPeople] = useState(1)
  const [urgency, setUrgency] = useState('urgent')
  const [desc, setDesc] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [reqId, setReqId] = useState(null)

  function handleSubmit() {
    const id = 'RQ' + Math.floor(10000 + Math.random() * 90000)
    const req = {
      id, type, zone: 'A17', location: 'Kukatpally', people,
      priority: urgency, status: 'received',
      assignedTeam: null, time: 'Just now', citizenName: 'Demo Citizen',
    }
    addRequest(req)
    setReqId(id)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[400px] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4"/>
        </motion.div>
        <h2 className="text-slate-800 font-bold text-lg mb-2">Request Submitted!</h2>
        <div className="text-slate-500 text-sm mb-1">Request ID</div>
        <div className="text-orange-500 font-mono font-bold text-xl mb-4">#{reqId}</div>
        <div className="space-y-2 text-xs text-slate-500 mb-6">
          <div>📍 Location: Kukatpally</div>
          <div>🏷 Type: {type}</div>
          <div>👥 People: {people}</div>
          <div>⚡ Priority: <span className="text-orange-500 uppercase font-semibold">{urgency}</span></div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 mb-4 w-full">
          ✓ AI priority assigned<br/>✓ Matching resources…
        </div>
        <button onClick={() => navigate('/citizen/relief')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md">
          Track My Request →
        </button>
        <button onClick={() => { setSubmitted(false); setStep(1); setType(null) }} className="mt-2 text-slate-400 text-xs hover:text-slate-600 transition-colors">
          New request
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-slate-800 font-bold text-base mb-4">What do you need?</h2>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-2 gap-3">
              {REQUEST_TYPES.map(rt => (
                <motion.button
                  key={rt.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setType(rt.id); setStep(2) }}
                  className={`bg-gradient-to-br ${rt.color} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-all shadow-sm`}
                >
                  <span className="text-3xl">{rt.emoji}</span>
                  <span className="text-slate-700 font-semibold text-sm">{rt.id}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{REQUEST_TYPES.find(r => r.id === type)?.emoji}</span>
              <span className="text-slate-800 font-bold">{type} Request</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <MapPin size={12}/> Location (auto-detected)
              </div>
              <div className="text-slate-800 text-sm font-medium">Kukatpally, Zone A17</div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-2 block">Number of people</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setPeople(Math.max(1, people - 1))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 font-bold text-lg transition-colors">−</button>
                <span className="text-slate-800 font-bold text-xl w-8 text-center">{people}</span>
                <button onClick={() => setPeople(Math.min(50, people + 1))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 font-bold text-lg transition-colors">+</button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-2 block">Urgency</label>
              <div className="grid grid-cols-3 gap-2">
                {[['critical','Critical'],['urgent','Urgent'],['normal','Normal']].map(([val, label]) => (
                  <button key={val} onClick={() => setUrgency(val)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      urgency === val
                        ? val === 'critical' ? 'bg-red-100 border-red-400 text-red-700'
                        : val === 'urgent' ? 'bg-orange-100 border-orange-400 text-orange-700'
                        : 'bg-blue-100 border-blue-400 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Additional info (optional)</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm resize-none focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400" placeholder="Describe your situation…"/>
            </div>

            <button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
              Submit Request
            </button>
            <button onClick={() => setStep(1)} className="w-full text-slate-400 text-xs hover:text-slate-600 transition-colors py-1">← Change type</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
