import React from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import { Package, CheckCircle, Clock, Truck } from 'lucide-react'

export default function NGODashboard() {
  const { requests } = useApp()
  const pending = requests.filter(r => r.status === 'received').length
  const matched = requests.filter(r => r.status === 'matched').length
  const delivered = requests.filter(r => r.status === 'delivered').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-800">NGO Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Available Resources" value="4,080" sub="units" color="purple"/>
        <StatCard icon={Clock} label="Pending Requests" value={pending} color="orange"/>
        <StatCard icon={CheckCircle} label="Matched" value={matched} color="blue"/>
        <StatCard icon={Truck} label="Delivered" value={delivered} color="green"/>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="font-semibold text-slate-800 mb-4">Active NGO: NGO Alpha</div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {[['Water', '500 bottles', '🔵'], ['Food', '300 packets', '🟡'], ['Medicine', '120 kits', '🟢']].map(([t, v, e]) => (
            <div key={t} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">{e}</span>
              <div><div className="text-slate-800 font-semibold">{t}</div><div className="text-slate-500 text-xs">{v} available</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
