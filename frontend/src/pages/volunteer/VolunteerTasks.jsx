import React from 'react'
import { ListChecks, Clock, MapPin, CheckCircle } from 'lucide-react'
import RiskBadge from '../../components/RiskBadge.jsx'

const ALL_TASKS = [
  { id: 'T001', type: 'Water Delivery', location: 'Zone A17', distance: '0.8 km', priority: 'high', time: '~15 min', status: 'pending' },
  { id: 'T002', type: 'Medical Assistance', location: 'Zone B05', distance: '1.2 km', priority: 'critical', time: '~20 min', status: 'pending' },
  { id: 'T003', type: 'Food Distribution', location: 'Zone D03', distance: '2.1 km', priority: 'normal', time: '~30 min', status: 'completed' },
  { id: 'T004', type: 'Evacuation Assist', location: 'Zone A17', distance: '0.9 km', priority: 'critical', time: '~10 min', status: 'in_progress' },
  { id: 'T005', type: 'Blanket Distribution', location: 'Zone C12', distance: '3.0 km', priority: 'normal', time: '~40 min', status: 'completed' },
]

const STATUS_STYLE = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
}

export default function VolunteerTasks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">My Tasks</h1>
        <span className="text-xs text-slate-400">{ALL_TASKS.length} total</span>
      </div>

      <div className="space-y-3">
        {ALL_TASKS.map(task => (
          <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-800 font-semibold text-sm">{task.type}</span>
                <RiskBadge level={task.priority} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={11}/>{task.location} · {task.distance}</span>
                <span className="flex items-center gap-1"><Clock size={11}/>{task.time}</span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
