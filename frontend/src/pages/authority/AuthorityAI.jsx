import React, { useState, useEffect } from 'react'
import { AI_PREDICTIONS } from '../../data/mockData.js'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import RiskBadge from '../../components/RiskBadge.jsx'
import { useApp } from '../../contexts/AppContext.jsx'
import api from '../../services/api.js'

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  color: '#1e293b',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}

export default function AuthorityAI() {
  const { zones, backendConnected, broadcastAlert } = useApp()
  const [selectedZone, setSelectedZone] = useState('A17')
  const [prediction, setPrediction] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  // Fetch ML inspection and trend data for selected zone
  useEffect(() => {
    let isMounted = true
    async function fetchML() {
      if (!backendConnected) {
        setPrediction(null)
        setTrendData([])
        return
      }
      setLoading(true)
      try {
        const [inspectRes, trendRes] = await Promise.allSettled([
          api.getZoneInspection(selectedZone),
          api.getRiskTrend(selectedZone),
        ])

        if (isMounted) {
          if (inspectRes.status === 'fulfilled' && inspectRes.value) {
            setPrediction(inspectRes.value)
          }
          if (trendRes.status === 'fulfilled' && trendRes.value?.length) {
            const formatted = trendRes.value.map((item, idx) => ({
              time: item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${idx}h`,
              risk: Math.round(item.score * 100),
            }))
            setTrendData(formatted)
          }
        }
      } catch (err) {
        console.warn('ML fetch error, using fallback:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchML()
    return () => { isMounted = false }
  }, [selectedZone, backendConnected])

  const ai = AI_PREDICTIONS
  const currentRisk = prediction?.risk || ai.currentRisk
  const currentConfidence = prediction ? Math.round(prediction.confidence * 100) : ai.confidence
  const currentScore = prediction ? Math.round(prediction.score * 100) : 97

  const chartData = trendData.length > 0 ? trendData : [
    { time: 'Now', risk: currentScore },
    { time: '+1h', risk: Math.max(0, currentScore - 15) },
    { time: '+3h', risk: Math.min(100, currentScore + 5) },
    { time: '+6h', risk: currentScore },
    { time: '+12h', risk: Math.max(0, currentScore - 12) },
    { time: '+24h', risk: Math.max(0, currentScore - 30) },
  ]

  const factorsList = prediction?.shap_factors?.length
    ? prediction.shap_factors.map(sf => `${sf.feature}: ${sf.attribution > 0 ? '+' : ''}${sf.attribution.toFixed(3)} (Val: ${typeof sf.value === 'number' ? sf.value.toFixed(1) : sf.value})`)
    : (prediction?.factors?.length ? prediction.factors : ai.factors)

  const recommendationText = prediction
    ? `Zone ${selectedZone} assessed at ${currentRisk.toUpperCase()} risk (${currentScore}% score). Primary drivers: ${prediction.factors?.slice(0, 2).join(', ') || 'Heavy localized rainfall'}. Pre-position disaster response teams and issue citizen advisory.`
    : ai.recommendation

  function handleAcceptRecommendation() {
    broadcastAlert({
      message: `[AI Advisory - Zone ${selectedZone}]: ${recommendationText}`,
      severity: currentRisk === 'critical' ? 'critical' : 'high',
      zone: selectedZone,
    })
    setAlertSent(true)
    setTimeout(() => setAlertSent(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">AI Disaster Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">XGBoost & Tree SHAP Predictive Analytics Engine</p>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Inspect Zone:</label>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-orange-500"
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>
                Zone {z.id} {z.name ? `– ${z.name.slice(0, 24)}` : ''} ({z.risk})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main prediction panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-slate-400 text-xs uppercase tracking-wide font-medium">Selected Zone</div>
                <div className="text-slate-800 font-black text-2xl">Zone {selectedZone}</div>
              </div>
              <div className="text-right">
                <RiskBadge level={currentRisk} size="lg"/>
                <div className="text-slate-400 text-xs mt-1">
                  Confidence: <span className="text-purple-600 font-bold">{currentConfidence}%</span>
                </div>
              </div>
            </div>

            {/* Risk chart */}
            <div className="mb-4">
              <div className="text-xs text-slate-500 font-medium mb-2">
                {trendData.length > 0 ? 'Historical Telemetry & Risk Score Trend' : 'Predicted Risk Trend'}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentRisk === 'critical' ? '#ef4444' : currentRisk === 'high' ? '#f97316' : '#eab308'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentRisk === 'critical' ? '#ef4444' : currentRisk === 'high' ? '#f97316' : '#eab308'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke={currentRisk === 'critical' ? '#ef4444' : currentRisk === 'high' ? '#f97316' : '#eab308'}
                    strokeWidth={2}
                    fill="url(#riskGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key Metric Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3 text-center border bg-slate-50 border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Risk Score</div>
                <div className="text-lg font-black text-slate-800">{currentScore}%</div>
              </div>
              <div className="rounded-xl p-3 text-center border bg-slate-50 border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Model Engine</div>
                <div className="text-xs font-bold text-purple-700">XGBoost + SHAP</div>
              </div>
              <div className="rounded-xl p-3 text-center border bg-slate-50 border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <div className="text-xs font-bold text-green-600">
                  {backendConnected ? 'Live Inference' : 'Demo Fallback'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <div className="text-purple-700 font-bold">AI RECOMMENDED ACTION</div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">{recommendationText}</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleAcceptRecommendation}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                {alertSent ? '✓ Broadcasted to Citizens!' : '✓ Accept Recommendation'}
              </button>
            </div>
          </div>
        </div>

        {/* Factors panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-slate-800">Tree SHAP Risk Drivers</div>
              <span className="text-[11px] bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">
                Explainable AI
              </span>
            </div>
            <div className="space-y-2.5">
              {factorsList.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"/>
                  <span className="text-slate-700 font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-semibold text-slate-800 mb-4">Inference Architecture</div>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between"><span>Algorithm</span><span className="text-purple-600 font-semibold">XGBoost Native Booster</span></div>
              <div className="flex justify-between"><span>Attribution</span><span className="text-slate-700">Tree SHAP (Exact)</span></div>
              <div className="flex justify-between"><span>Feature Vector</span><span className="text-slate-700">18 Geotechnical/Hydro</span></div>
              <div className="flex justify-between"><span>Calibration</span><span className="text-green-600">Physical Soil Moisture Layer</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
