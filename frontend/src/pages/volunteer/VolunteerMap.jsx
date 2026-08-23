import React from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { DEMO_ZONES } from '../../data/mockData.js'
import RiskBadge from '../../components/RiskBadge.jsx'

const RISK_COLOR = {
  critical: 'border-red-200 bg-red-50',
  high: 'border-orange-200 bg-orange-50',
  moderate: 'border-yellow-200 bg-yellow-50',
  safe: 'border-green-200 bg-green-50',
}

export default function VolunteerMap() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">Zone Map</h1>
        <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">
          <Navigation size={11}/> Zone A17
        </span>
      </div>

      {/* Placeholder map */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl h-64 flex items-center justify-center text-slate-400 text-sm shadow-sm">
        <div className="text-center space-y-2">
          <MapPin size={32} className="mx-auto text-slate-300"/>
          <p>Interactive map view</p>
          <p className="text-xs">(Leaflet / MapBox integration point)</p>
        </div>
      </div>

      {/* Zone cards */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3 text-sm">Active Zones</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEMO_ZONES.map(zone => (
            <div key={zone.id} className={`border rounded-xl p-3 shadow-sm ${RISK_COLOR[zone.risk] || 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-800 font-semibold text-sm">{zone.id}</span>
                <RiskBadge level={zone.risk} />
              </div>
              <p className="text-slate-500 text-xs">{zone.name}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>SOS: <span className="text-slate-800 font-semibold">{zone.sos}</span></span>
                <span>Pop: {zone.population.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
