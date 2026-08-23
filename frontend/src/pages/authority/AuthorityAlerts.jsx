import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import { CheckCircle } from 'lucide-react'

const SEVERITIES = ['critical', 'high', 'warning', 'info']
const ALERT_TYPES = ['Evacuation', 'Flood Warning', 'Road Closure', 'Shelter Open', 'Resource Alert', 'General']
const ZONES = ['All Zones', 'Zone A17', 'Zone B05', 'Zone C12', 'Zone D03', 'Zone E09']

export default function AuthorityAlerts() {
  const { alerts, broadcastAlert } = useApp()
  const [form, setForm] = useState({ title: '', message: '', zone: 'All Zones', severity: 'high', type: 'Flood Warning' })
  const [sent, setSent] = useState(false)

  function handleBroadcast() {
    if (!form.title || !form.message) return
    broadcastAlert({
      id: 'AL' + Date.now(),
      time: 'Just now',
      message: `[${form.zone}] ${form.title}: ${form.message}`,
      severity: form.severity,
    })
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setForm({ title: '', message: '', zone: 'All Zones', severity: 'high', type: 'Flood Warning' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-800">Broadcast Alerts</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="font-semibold text-slate-800">Create Alert</div>

          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Alert Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
              placeholder="e.g. Flood Warning – Zone A17"/>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm resize-none focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
              placeholder="Alert message to broadcast to citizens…"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Target Zone</label>
              <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:outline-none">
                {ZONES.map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:outline-none">
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Alert Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:outline-none">
              {ALERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {sent && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
              <CheckCircle size={16}/> Alert broadcast successfully!
            </div>
          )}

          <button onClick={handleBroadcast}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md">
            📢 BROADCAST ALERT
          </button>
        </div>

        {/* Live alerts feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="font-semibold text-slate-800 mb-4">Live Alert Feed</div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {alerts.map(a => (
              <div key={a.id} className={`text-xs p-3 rounded-xl border-l-2 ${
                a.severity === 'critical' ? 'bg-red-50 border-red-400 text-red-700' :
                a.severity === 'high' ? 'bg-orange-50 border-orange-400 text-orange-700' :
                a.severity === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                'bg-blue-50 border-blue-400 text-blue-700'
              }`}>
                <div className="font-medium">{a.message}</div>
                <div className="opacity-60 mt-1">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
