import React from 'react'
import { DEMO_ROUTES } from '../data/mockData.js'
import { Shield } from 'lucide-react'

export default function SafeRouteCard({ routes = DEMO_ROUTES, onSelect }) {
  const displayRoutes = routes?.length ? routes : DEMO_ROUTES
  return (
    <div className="space-y-3">
      {displayRoutes.map(route => (
        <div
          key={route.id}
          onClick={() => onSelect && onSelect(route)}
          className={`border rounded-xl p-4 cursor-pointer transition-all ${
            route.recommended
              ? 'bg-green-50 border-green-200 hover:bg-green-100'
              : route.risk === 'high'
              ? 'bg-red-50 border-red-200 hover:bg-red-100'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="font-semibold text-slate-800 text-sm">{route.name}</div>
            {route.recommended && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                RECOMMENDED
              </span>
            )}
            {route.risk === 'high' && (
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                AVOID
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
            <span>📏 {route.distance}</span>
            <span>⏱ {route.time}</span>
            <span className="flex items-center gap-1">
              <Shield size={11}/>
              Safety: <strong className={route.safetyScore >= 80 ? 'text-green-600' : 'text-red-600'}>{route.safetyScore}/100</strong>
            </span>
          </div>
          <div className="text-xs text-slate-500">{route.reason}</div>
        </div>
      ))}
    </div>
  )
}
