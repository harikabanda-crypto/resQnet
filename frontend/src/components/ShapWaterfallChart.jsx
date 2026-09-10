import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

const FEATURE_METADATA = {
  rainfall_24h: { label: '24h Rainfall', unit: 'mm', desc: 'Short-term deluge triggering pore saturation' },
  soil_moisture_0_7cm: { label: 'Topsoil Moisture', unit: '%', desc: 'Hydrologic shear strength reduction' },
  slope: { label: 'Slope Steepness', unit: '°', desc: 'Gravitational downhill driving stress' },
  rainfall_7day: { label: '7-Day Antecedent Rain', unit: 'mm', desc: 'Deep soil groundwater table elevation' },
  rainfall_3day: { label: '3-Day Rainfall', unit: 'mm', desc: 'Medium-term regolith soaking' },
  rainfall_12h: { label: '12h Rainfall', unit: 'mm', desc: 'Localized precipitation intensity' },
  elevation: { label: 'Elevation', unit: 'm', desc: 'Orographic lift and slope exposure' },
  curvature: { label: 'Surface Curvature', unit: 'rad/m', desc: 'Water convergence / hollow concavity' },
  aspect: { label: 'Slope Aspect', unit: '°', desc: 'Sunlight and prevailing monsoon exposure' },
  max_eq_magnitude: { label: 'Seismic Magnitude', unit: 'Mw', desc: 'Dynamic geotechnical ground acceleration' },
  historical_landslide_density: { label: 'Historical Scar Density', unit: 'scars/km²', desc: 'Inherent geomorphic susceptibility' },
  nearest_eq_distance_km: { label: 'Fault Distance', unit: 'km', desc: 'Proximity to active tectonic lineaments' },
}

export default function ShapWaterfallChart({
  shapFactors = {},
  rawScore = null,
  title = 'Tree SHAP Attribution Waterfall',
}) {
  // Normalize shapFactors into array format
  const chartData = Object.entries(shapFactors || {})
    .map(([feature, val]) => {
      const meta = FEATURE_METADATA[feature] || {
        label: feature.replace(/_/g, ' '),
        unit: '',
        desc: 'Geotechnical factor',
      }
      const attribution = typeof val === 'number' ? val : (val?.attribution || 0)
      return {
        feature,
        name: meta.label,
        attribution: Number(attribution.toFixed(4)),
        unit: meta.unit,
        desc: meta.desc,
        isPositive: attribution >= 0,
      }
    })
    .sort((a, b) => Math.abs(b.attribution) - Math.abs(a.attribution))

  if (!chartData.length) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
        No Tree SHAP attributions available for this scenario.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-800 text-sm">{title}</div>
          <div className="text-[11px] text-slate-500">
            Positive values push toward landslide failure; negative values stabilize slope
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2.5 h-2.5 rounded bg-red-500"/> Elevating Hazard (+)
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"/> Stabilizing Factor (-)
          </span>
        </div>
      </div>

      {/* Diverging Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 32)}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name, item) => [
                `${value > 0 ? '+' : ''}${value} SHAP log-odds (${item.payload.desc})`,
                'Impact',
              ]}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 11,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="attribution" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? '#ef4444' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 3 Drivers Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {chartData.slice(0, 3).map((item, idx) => (
          <div
            key={item.feature}
            className={`p-2.5 rounded-xl border text-xs ${
              item.isPositive ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Rank #{idx + 1} Factor</div>
            <div className="font-bold text-slate-800 truncate mt-0.5">{item.name}</div>
            <div className={`font-mono font-bold mt-1 ${item.isPositive ? 'text-red-600' : 'text-emerald-600'}`}>
              {item.isPositive ? '+' : ''}{item.attribution.toFixed(3)} SHAP
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
