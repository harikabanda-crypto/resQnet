import React from 'react'
import { AI_PREDICTIONS } from '../../data/mockData.js'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import RiskBadge from '../../components/RiskBadge.jsx'

const chartData = [
  { time: 'Now', risk: 97 },
  { time: '+1h', risk: 80 },
  { time: '+3h', risk: 95 },
  { time: '+6h', risk: 97 },
  { time: '+12h', risk: 85 },
  { time: '+24h', risk: 60 },
]

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  color: '#1e293b',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}

export default function AuthorityAI() {
  const ai = AI_PREDICTIONS
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">AI Disaster Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">Decision-support system powered by predictive analytics</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main prediction panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-slate-400 text-xs uppercase tracking-wide font-medium">Selected Zone</div>
                <div className="text-slate-800 font-black text-2xl">Zone {ai.zone}</div>
              </div>
              <div className="text-right">
                <RiskBadge level={ai.currentRisk} size="lg"/>
                <div className="text-slate-400 text-xs mt-1">Confidence: <span className="text-purple-600 font-bold">{ai.confidence}%</span></div>
              </div>
            </div>

            {/* Risk chart */}
            <div className="mb-4">
              <div className="text-xs text-slate-500 font-medium mb-2">Predicted Risk Level (Next 24h)</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#riskGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Predictions */}
            <div className="grid grid-cols-3 gap-3">
              {ai.predictions.map(p => (
                <div key={p.period} className={`rounded-xl p-3 text-center border ${
                  p.risk === 'critical' ? 'bg-red-50 border-red-200' :
                  p.risk === 'high' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="text-xs text-slate-500 mb-1">{p.period}</div>
                  <RiskBadge level={p.risk}/>
                  <div className="text-xs text-slate-400 mt-1">{p.level}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <div className="text-purple-700 font-bold">AI RECOMMENDED ACTION</div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">{ai.recommendation}</p>
            <div className="mt-4 flex gap-3">
              <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
                ✓ Accept Recommendation
              </button>
              <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-xl transition-colors shadow-sm">
                Override
              </button>
            </div>
          </div>
        </div>

        {/* Factors panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-semibold text-slate-800 mb-4">Risk Factors</div>
            <div className="space-y-2">
              {ai.factors.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"/>
                  <span className="text-slate-600">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-semibold text-slate-800 mb-4">Model Info</div>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between"><span>Model</span><span className="text-purple-600">ResQNet AI v2.1</span></div>
              <div className="flex justify-between"><span>Data sources</span><span className="text-slate-700">IMD, sensors, historical</span></div>
              <div className="flex justify-between"><span>Last updated</span><span className="text-slate-700">2 min ago</span></div>
              <div className="flex justify-between"><span>Accuracy</span><span className="text-green-600">91.4%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
