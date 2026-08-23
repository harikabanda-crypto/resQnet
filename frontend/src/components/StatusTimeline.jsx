import React from 'react'

export default function StatusTimeline({ statuses, current }) {
  const steps = [
    { key: 'received', label: 'Request Received' },
    { key: 'matched', label: 'AI Priority & Match' },
    { key: 'assigned', label: 'Team Assigned' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]
  const order = steps.map(s => s.key)
  const currentIdx = order.indexOf(current)

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${done ? 'text-green-600' : active ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
