import React from 'react'
import { DEMO_RESOURCES } from '../../data/mockData.js'
import { useApp } from '../../contexts/AppContext.jsx'

export default function AuthorityResources() {
  const { resources = DEMO_RESOURCES } = useApp()
  const displayResources = resources.length > 0 ? resources : DEMO_RESOURCES

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Resources</h1>
          <p className="text-slate-500 text-xs mt-0.5">Disaster relief inventory, demand, and stockpile tracking ({displayResources.length} tracked)</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayResources.map(r => {
          const pct = Math.round((r.available / r.demand) * 100)
          const shortage = r.demand - r.available
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-slate-800 font-bold text-base">{r.type}</div>
                {shortage > 0
                  ? <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">Shortage</span>
                  : <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Sufficient</span>
                }
              </div>
              <div className="flex items-end justify-between text-sm mb-2">
                <div>
                  <div className="text-slate-400 text-xs">Available</div>
                  <div className="text-slate-800 font-bold text-xl">{r.available.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs">Demand</div>
                  <div className="text-slate-600 font-semibold">{r.demand.toLocaleString()}</div>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full ${shortage > 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, pct)}%` }}/>
              </div>
              {shortage > 0 && <div className="text-xs text-red-600 font-semibold">⚠ Shortage: {shortage.toLocaleString()} {r.unit}</div>}
              <div className="mt-3 text-xs text-slate-400">
                <div>Provider: {r.provider}</div>
                <div>Location: {r.location}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
