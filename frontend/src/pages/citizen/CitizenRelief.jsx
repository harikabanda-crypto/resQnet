import React from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import StatusTimeline from '../../components/StatusTimeline.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'

export default function CitizenRelief() {
  const { requests } = useApp()
  const myRequests = requests.filter(r => r.citizenName === 'Demo Citizen' || r.id === 'RQ28491')

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-slate-800 font-bold text-base">My Requests</h2>
      {myRequests.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-10">No requests yet. Go to Request tab to ask for help.</div>
      )}
      {myRequests.map(req => (
        <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-slate-800 font-bold text-sm">{req.type} Request</div>
              <div className="text-slate-400 text-xs">#{req.id} • {req.people} people • {req.time}</div>
            </div>
            <RiskBadge level={req.priority} />
          </div>
          <StatusTimeline statuses={[]} current={req.status === 'matched' ? 'matched' : req.status === 'out_for_delivery' ? 'out_for_delivery' : req.status === 'delivered' ? 'delivered' : req.status === 'received' ? 'received' : 'received'} />
          {req.assignedTeam && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
              👤 Assigned: {req.assignedTeam}
            </div>
          )}
          {req.status === 'out_for_delivery' && (
            <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700 text-center font-semibold animate-pulse">
              🚚 Relief is on the way!
            </div>
          )}
          {req.status === 'delivered' && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700 text-center font-semibold">
              ✅ Delivered
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
