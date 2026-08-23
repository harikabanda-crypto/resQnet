import React from 'react'
import RiskBadge from './RiskBadge.jsx'
import { MapPin, Users } from 'lucide-react'

export default function RequestCard({ req, onClick, actions }) {
  const priorityBorder = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    urgent: 'border-l-orange-400',
    normal: 'border-l-blue-400',
  }
  const statusLabel = {
    received: 'Received',
    matched: 'AI Matched',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
  }
  const typeIcon = {
    Water: '💧', Food: '🍱', Medicine: '💊', Rescue: '🚨', Shelter: '🏠', 'Other Emergency': '⚡',
  }
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 border-l-4 ${priorityBorder[req.priority] || 'border-l-slate-300'} rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcon[req.type] || '📋'}</span>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{req.type} Request</div>
            <div className="text-xs text-slate-400">#{req.id}</div>
          </div>
        </div>
        <RiskBadge level={req.priority} />
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <span className="flex items-center gap-1"><MapPin size={11}/>{req.location}</span>
        <span className="flex items-center gap-1"><Users size={11}/>{req.people} people</span>
        <span className="text-slate-400">{req.time}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          req.status === 'delivered' ? 'bg-green-100 text-green-700' :
          req.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
          req.status === 'matched' ? 'bg-purple-100 text-purple-700' :
          'bg-slate-100 text-slate-600'
        }`}>{statusLabel[req.status] || req.status}</span>
        {req.assignedTeam && <span className="text-xs text-slate-400">{req.assignedTeam}</span>}
      </div>
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </div>
  )
}
