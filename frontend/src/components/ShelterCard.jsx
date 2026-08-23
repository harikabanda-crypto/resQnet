import React from 'react'
import RiskBadge from './RiskBadge.jsx'
import { Users } from 'lucide-react'

export default function ShelterCard({ shelter }) {
  const pct = Math.round((shelter.occupied / shelter.capacity) * 100)
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-slate-800">{shelter.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">📍 {shelter.location}</div>
        </div>
        <RiskBadge level={pct >= 90 ? 'warning' : 'safe'} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Users size={14} className="text-slate-400"/>
        <span className="text-sm text-slate-700">{shelter.occupied} / {shelter.capacity}</span>
        <span className="text-xs text-slate-400">({pct}% full)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}/>
      </div>
      <div className="mt-2 text-xs text-slate-500">{shelter.capacity - shelter.occupied} spots available</div>
    </div>
  )
}
