import React from 'react'
import { useApp } from '../../contexts/AppContext.jsx'

export default function NGOHistory() {
  const { requests } = useApp()
  const done = requests.filter(r => r.status === 'delivered')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-800">Delivery History</h1>
      {done.length === 0 && <div className="text-slate-400 text-sm py-10 text-center">No completed deliveries yet.</div>}
      <div className="space-y-3">
        {done.map(r => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-slate-800 font-semibold">{r.type} – #{r.id}</div>
              <div className="text-xs text-slate-400">{r.location} · {r.people} people · {r.time}</div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Delivered ✓</span>
          </div>
        ))}
      </div>
    </div>
  )
}
