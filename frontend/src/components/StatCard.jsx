import React from 'react'

export default function StatCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`${c} border rounded-xl p-4 flex flex-col gap-2 bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={18} className={`${colors[color]?.split(' ')[2] || 'text-blue-600'} opacity-70`} />}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
