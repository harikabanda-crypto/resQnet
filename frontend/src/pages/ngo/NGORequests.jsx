import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import { MapPin, Users, CheckCircle } from 'lucide-react'

export default function NGORequests() {
  const { requests, updateRequest } = useApp()
  const [offered, setOffered] = useState({})
  const open = requests.filter(r => r.status === 'received' || r.status === 'matched')

  function offerResource(req) {
    updateRequest(req.id, { status: 'matched', assignedTeam: 'NGO Alpha' })
    setOffered(prev => ({ ...prev, [req.id]: true }))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-800">Nearby Requests</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {open.map(req => (
          <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-800 font-bold">{req.type} Request</div>
              <RiskBadge level={req.priority}/>
            </div>
            <div className="text-xs text-slate-500 space-y-1 mb-3">
              <div className="flex items-center gap-1"><MapPin size={11}/>{req.location} – Zone {req.zone}</div>
              <div className="flex items-center gap-1"><Users size={11}/>{req.people} people</div>
              <div>Distance: {(Math.random() * 3 + 1).toFixed(1)} km</div>
            </div>
            {offered[req.id] ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle size={16}/> Resource Offered
              </div>
            ) : (
              <button onClick={() => offerResource(req)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors shadow-sm">
                Offer Resource
              </button>
            )}
          </div>
        ))}
        {open.length === 0 && <div className="col-span-3 text-center text-slate-400 py-10">No open requests right now.</div>}
      </div>
    </div>
  )
}
