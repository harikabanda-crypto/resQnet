import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import StatCard from '../../components/StatCard.jsx'
import { CheckCircle, MapPin, Clock, Users } from 'lucide-react'

const NEARBY_TASKS = [
  { id: 'T001', type: 'Water Delivery', location: 'Zone A17', distance: '0.8 km', priority: 'high', time: '~15 min', risk: 'high' },
  { id: 'T002', type: 'Medical Assistance', location: 'Zone B05', distance: '1.2 km', priority: 'critical', time: '~20 min', risk: 'high' },
  { id: 'T003', type: 'Food Distribution', location: 'Zone D03', distance: '2.1 km', priority: 'normal', time: '~30 min', risk: 'moderate' },
  { id: 'T004', type: 'Evacuation Assist', location: 'Zone A17', distance: '0.9 km', priority: 'critical', time: '~10 min', risk: 'critical' },
]

export default function VolunteerDashboard() {
  const { updateRequest } = useApp()
  const [accepted, setAccepted] = useState({})
  const [status, setStatus] = useState('AVAILABLE')

  function acceptTask(task) {
    setAccepted(prev => ({ ...prev, [task.id]: true }))
    setStatus('EN ROUTE')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">Volunteer Dashboard</h1>
        <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{status}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CheckCircle} label="Tasks Completed" value="12" color="green"/>
        <StatCard icon={Clock} label="Hours Active" value="6.5" color="blue"/>
        <StatCard icon={MapPin} label="Current Zone" value="A17" color="orange"/>
        <StatCard icon={Users} label="People Helped" value="47" color="purple"/>
      </div>

      <div>
        <h2 className="font-bold text-slate-800 mb-3">Nearby Tasks</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {NEARBY_TASKS.map(task => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="text-slate-800 font-semibold">{task.type}</div>
                <RiskBadge level={task.priority}/>
              </div>
              <div className="text-xs text-slate-500 space-y-1 mb-3">
                <div className="flex items-center gap-1"><MapPin size={11}/>{task.location} · {task.distance}</div>
                <div className="flex items-center gap-1"><Clock size={11}/>{task.time}</div>
                <div>Route risk: <span className={task.risk === 'critical' ? 'text-red-600' : task.risk === 'high' ? 'text-orange-600' : 'text-yellow-600'}>{task.risk}</span></div>
              </div>
              {accepted[task.id] ? (
                <div className="text-green-600 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle size={15}/> Accepted – En Route
                </div>
              ) : (
                <button onClick={() => acceptTask(task)} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                  Accept Task
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
