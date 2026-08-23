import React from 'react'
import { DEMO_TEAMS } from '../../data/mockData.js'

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700 border-green-200',
  busy: 'bg-orange-100 text-orange-700 border-orange-200',
  en_route: 'bg-blue-100 text-blue-700 border-blue-200',
  offline: 'bg-slate-100 text-slate-500 border-slate-200',
}

const TYPE_EMOJI = { rescue: '🚨', volunteer: '🙋', ngo: '🏥', delivery: '🚚' }

export default function AuthorityTeams() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-800">Response Teams</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {DEMO_TEAMS.map(t => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{TYPE_EMOJI[t.type]}</span>
                <div>
                  <div className="text-slate-800 font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-400 text-xs">ID: {t.id} · {t.type}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[t.status]}`}>
                {t.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>📍 {t.location}</div>
              {t.task && <div>📋 {t.task}</div>}
              <div>👥 {t.members} member{t.members > 1 ? 's' : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
