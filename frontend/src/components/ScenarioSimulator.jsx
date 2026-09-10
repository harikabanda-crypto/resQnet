import React, { useState, useEffect } from 'react'
import { Sliders, RotateCcw, Zap, CloudRain, Droplets, Mountain, Activity } from 'lucide-react'

const DEFAULT_SIMULATION = {
  rainfall_24h: 75,
  soil_moisture_0_7cm: 65,
  slope: 32,
  rainfall_7day: 180,
  max_eq_magnitude: 0.0,
}

const PRESETS = [
  {
    name: 'Cloudburst Deluge',
    icon: '⛈️',
    desc: 'Severe short-term precipitation storm',
    values: {
      rainfall_24h: 185,
      soil_moisture_0_7cm: 94,
      rainfall_7day: 220,
      max_eq_magnitude: 0.0,
    },
  },
  {
    name: 'Seismic Shock',
    icon: '⚡',
    desc: 'Moderate earthquake near unstable slopes',
    values: {
      max_eq_magnitude: 5.6,
      rainfall_24h: 40,
      soil_moisture_0_7cm: 60,
    },
  },
  {
    name: 'Prolonged Monsoon',
    icon: '🌧️',
    desc: 'Continuous multi-day rain causing deep saturation',
    values: {
      rainfall_24h: 90,
      rainfall_7day: 480,
      soil_moisture_0_7cm: 88,
      max_eq_magnitude: 0.0,
    },
  },
  {
    name: 'Dry & Stable',
    icon: '☀️',
    desc: 'Clear weather conditions with minimal moisture',
    values: {
      rainfall_24h: 0,
      rainfall_7day: 15,
      soil_moisture_0_7cm: 25,
      max_eq_magnitude: 0.0,
    },
  },
]

export default function ScenarioSimulator({
  baseFeatures = {},
  onSimulate = () => {},
  onReset = () => {},
  loading = false,
}) {
  const [params, setParams] = useState(DEFAULT_SIMULATION)

  // Sync with baseFeatures when zone changes
  useEffect(() => {
    if (baseFeatures && Object.keys(baseFeatures).length > 0) {
      setParams({
        rainfall_24h: Math.round(baseFeatures.rainfall_24h ?? 75),
        soil_moisture_0_7cm: Math.round((baseFeatures.soil_moisture_0_7cm ?? 0.65) * (baseFeatures.soil_moisture_0_7cm <= 1 ? 100 : 1)),
        slope: Math.round(baseFeatures.slope ?? 32),
        rainfall_7day: Math.round(baseFeatures.rainfall_7day ?? 180),
        max_eq_magnitude: Number((baseFeatures.max_eq_magnitude ?? 0.0).toFixed(1)),
      })
    }
  }, [baseFeatures])

  function handlePreset(presetValues) {
    const updated = { ...params, ...presetValues }
    setParams(updated)
    onSimulate(updated)
  }

  function handleSliderChange(field, value) {
    const updated = { ...params, [field]: Number(value) }
    setParams(updated)
  }

  function handleRun() {
    onSimulate(params)
  }

  function handleResetParams() {
    onReset()
    if (baseFeatures && Object.keys(baseFeatures).length > 0) {
      setParams({
        rainfall_24h: Math.round(baseFeatures.rainfall_24h ?? 75),
        soil_moisture_0_7cm: Math.round((baseFeatures.soil_moisture_0_7cm ?? 0.65) * (baseFeatures.soil_moisture_0_7cm <= 1 ? 100 : 1)),
        slope: Math.round(baseFeatures.slope ?? 32),
        rainfall_7day: Math.round(baseFeatures.rainfall_7day ?? 180),
        max_eq_magnitude: Number((baseFeatures.max_eq_magnitude ?? 0.0).toFixed(1)),
      })
    } else {
      setParams(DEFAULT_SIMULATION)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Sliders size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">"What-If" Extreme Scenario Simulator</div>
            <div className="text-[11px] text-slate-500">
              Adjust environmental drivers to test geotechnical slope failure conditions
            </div>
          </div>
        </div>

        <button
          onClick={handleResetParams}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium self-start sm:self-auto"
        >
          <RotateCcw size={12} /> Reset to Live Readings
        </button>
      </div>

      {/* Preset Weather & Geological Scenarios */}
      <div>
        <div className="text-xs font-semibold text-slate-700 mb-2">Preset Disaster Scenarios:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePreset(preset.values)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-orange-400 bg-slate-50/60 hover:bg-orange-50/50 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 group-hover:text-orange-700">
                <span>{preset.icon}</span> {preset.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Range Sliders */}
      <div className="space-y-4 pt-1">
        {/* 24h Rainfall */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <CloudRain size={13} className="text-blue-500" /> 24h Cumulative Precipitation:
            </span>
            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {params.rainfall_24h} mm
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="350"
            step="5"
            value={params.rainfall_24h}
            onChange={(e) => handleSliderChange('rainfall_24h', e.target.value)}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>0 mm (Clear)</span>
            <span>150 mm (Heavy)</span>
            <span>350 mm (Extreme Monsoon)</span>
          </div>
        </div>

        {/* Topsoil Moisture */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Droplets size={13} className="text-cyan-500" /> Topsoil Saturation (0-7cm):
            </span>
            <span className="font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
              {params.soil_moisture_0_7cm}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={params.soil_moisture_0_7cm}
            onChange={(e) => handleSliderChange('soil_moisture_0_7cm', e.target.value)}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>10% (Dry)</span>
            <span>60% (Moderate)</span>
            <span>100% (Liquefaction / Saturated)</span>
          </div>
        </div>

        {/* Slope Angle */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Mountain size={13} className="text-amber-600" /> Terrain Slope Steepness:
            </span>
            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              {params.slope}°
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="65"
            step="1"
            value={params.slope}
            onChange={(e) => handleSliderChange('slope', e.target.value)}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>5° (Gentle Plains)</span>
            <span>35° (High Landslide Vulnerability)</span>
            <span>65° (Cliff Face)</span>
          </div>
        </div>

        {/* 7-Day Antecedent Rainfall */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <CloudRain size={13} className="text-indigo-500" /> 7-Day Cumulative Antecedent Rain:
            </span>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {params.rainfall_7day} mm
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="700"
            step="10"
            value={params.rainfall_7day}
            onChange={(e) => handleSliderChange('rainfall_7day', e.target.value)}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>0 mm</span>
            <span>300 mm (Sustained Infiltration)</span>
            <span>700 mm (Record NER Deluge)</span>
          </div>
        </div>

        {/* Seismic Magnitude */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Activity size={13} className="text-rose-500" /> Seismic Tremor Intensity (Hypocenter Trigger):
            </span>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              {params.max_eq_magnitude > 0 ? `${params.max_eq_magnitude} Mw` : 'None (0.0)'}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="7.5"
            step="0.1"
            value={params.max_eq_magnitude}
            onChange={(e) => handleSliderChange('max_eq_magnitude', e.target.value)}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>0.0 (No Tremor)</span>
            <span>4.5 Mw (Moderate Ground Shake)</span>
            <span>7.5 Mw (Severe Coseismic Landslide Trigger)</span>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        disabled={loading}
        onClick={handleRun}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
      >
        <Zap size={16} />
        {loading ? 'Re-evaluating Tree SHAP Features…' : 'Run Scenario Simulation'}
      </button>
    </div>
  )
}
