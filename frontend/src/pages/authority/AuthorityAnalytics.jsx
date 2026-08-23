import React from 'react'
import { ANALYTICS_DATA } from '../../data/mockData.js'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#eab308']

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  color: '#1e293b',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}

export default function AuthorityAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-800">Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests over time */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-semibold text-slate-800 mb-4">Requests Over Time</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ANALYTICS_DATA.requestsOverTime}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Area type="monotone" dataKey="requests" stroke="#f97316" strokeWidth={2} fill="url(#reqGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Resources distributed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-semibold text-slate-800 mb-4">Resources Distributed</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ANALYTICS_DATA.resourcesDistributed} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {ANALYTICS_DATA.resourcesDistributed.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-semibold text-slate-800 mb-4">Zone Risk Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ANALYTICS_DATA.riskTrend}>
              <defs>
                <linearGradient id="a17Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="b05Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }}/>
              <Area type="monotone" dataKey="zoneA17" name="Zone A17" stroke="#ef4444" strokeWidth={2} fill="url(#a17Grad)"/>
              <Area type="monotone" dataKey="zoneB05" name="Zone B05" stroke="#f97316" strokeWidth={2} fill="url(#b05Grad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Response time */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-semibold text-slate-800 mb-4">Avg Response Time (min)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ANALYTICS_DATA.responseTime} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
