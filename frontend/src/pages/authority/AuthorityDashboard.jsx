import React from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import RequestCard from '../../components/RequestCard.jsx'
import { useNavigate } from 'react-router-dom'
import {
  Users, AlertTriangle, Shield, Package, Truck, Activity, MapPin
} from 'lucide-react'
import { DEMO_ZONES } from '../../data/mockData.js'
import RiskBadge from '../../components/RiskBadge.jsx'

const RISK_COLORS = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  moderate: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  safe: 'bg-green-50 border-green-200 text-green-700',
}

export default function AuthorityDashboard() {
  const { stats, requests, alerts } = useApp()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 mb-1">Command Dashboard</h1>
        <p className="text-slate-500 text-sm">Real-time disaster response overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard icon={Activity} label="Active Incident" value="FLOOD" sub="Hyderabad" color="red"/>
        <StatCard icon={Users} label="Affected" value={stats.affectedPopulation.toLocaleString()} sub="people" color="orange"/>
        <StatCard icon={AlertTriangle} label="Active SOS" value={stats.activeSOS} sub="requests" color="red"/>
        <StatCard icon={Shield} label="Critical Zones" value={stats.criticalZones} color="orange"/>
        <StatCard icon={Package} label="Pending Requests" value={stats.pendingRequests} color="yellow"/>
        <StatCard icon={Users} label="Active Responders" value={stats.activeResponders} color="green"/>
        <StatCard icon={Truck} label="Deliveries" value={stats.ongoingDeliveries} sub="ongoing" color="blue"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mock map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold text-slate-800 flex items-center gap-2"><MapPin size={16} className="text-orange-500"/> Live Disaster Map</div>
            <button onClick={() => navigate('/authority/map')} className="text-xs text-orange-500 hover:text-orange-600 transition-colors">Full Map →</button>
          </div>
          <div className="relative h-72 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="absolute inset-0 opacity-20">
              {[...Array(8)].map((_, i) => <div key={i} className="absolute border-slate-300 border-b w-full" style={{ top: `${i * 14}%` }}/>)}
              {[...Array(8)].map((_, i) => <div key={i} className="absolute border-slate-300 border-r h-full" style={{ left: `${i * 14}%` }}/>)}
            </div>
            {DEMO_ZONES.map((z, i) => {
              const positions = [
                { top: '35%', left: '48%' }, { top: '22%', left: '32%' }, { top: '18%', left: '58%' },
                { top: '58%', left: '37%' }, { top: '68%', left: '57%' }, { top: '62%', left: '68%' },
              ]
              const p = positions[i] || { top: '50%', left: '50%' }
              const dotColor = { critical: 'bg-red-500', high: 'bg-orange-500', moderate: 'bg-yellow-500', safe: 'bg-green-500' }
              return (
                <div key={z.id} className="absolute" style={p}>
                  <div className={`w-6 h-6 rounded-full ${dotColor[z.risk]} border-2 border-white flex items-center justify-center text-[9px] text-white font-bold shadow-lg ${z.risk === 'critical' ? 'animate-pulse' : ''}`}>{z.id}</div>
                </div>
              )
            })}
            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex gap-2 flex-wrap">
              {[['bg-red-500','Critical'],['bg-orange-500','High'],['bg-yellow-500','Moderate'],['bg-green-500','Safe']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1 text-[9px] text-slate-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${c}`}/>{l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <div className="font-semibold text-slate-800">Live Alerts</div>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-72">
            {alerts.map(a => (
              <div key={a.id} className={`text-xs p-2.5 rounded-xl border-l-2 ${
                a.severity === 'critical' ? 'bg-red-50 border-red-400 text-red-700' :
                a.severity === 'high' ? 'bg-orange-50 border-orange-400 text-orange-700' :
                a.severity === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                'bg-blue-50 border-blue-400 text-blue-700'
              }`}>
                <div className="font-medium leading-tight">{a.message}</div>
                <div className="text-[10px] opacity-60 mt-1">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Zone Status</h2>
          <button onClick={() => navigate('/authority/map')} className="text-xs text-orange-500 hover:text-orange-600">View All →</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEMO_ZONES.slice(0, 3).map(z => (
            <div key={z.id} className={`border rounded-xl p-3 ${RISK_COLORS[z.risk]}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm">{z.name}</div>
                <RiskBadge level={z.risk}/>
              </div>
              <div className="text-xs space-y-0.5 opacity-80">
                <div>👥 Pop: {z.population.toLocaleString()}</div>
                <div>🆘 SOS: {z.sos}</div>
                <div>🌧 {z.rainfall}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Recent Requests</h2>
          <button onClick={() => navigate('/authority/requests')} className="text-xs text-orange-500 hover:text-orange-600">View All →</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {requests.slice(0, 3).map(req => (
            <RequestCard key={req.id} req={req} onClick={() => navigate('/authority/requests')}/>
          ))}
        </div>
      </div>
    </div>
  )
}
