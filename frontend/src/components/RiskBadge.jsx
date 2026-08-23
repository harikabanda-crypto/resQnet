import React from 'react'

const config = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  urgent: 'bg-orange-100 text-orange-700 border border-orange-200',
  moderate: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  normal: 'bg-blue-100 text-blue-700 border border-blue-200',
  safe: 'bg-green-100 text-green-700 border border-green-200',
  low: 'bg-green-100 text-green-700 border border-green-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
}

export default function RiskBadge({ level, className = '', size = 'sm' }) {
  const base = config[level?.toLowerCase()] || config.info
  const padding = size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2 py-0.5 text-xs font-medium'
  return (
    <span className={`inline-flex items-center rounded-full ${padding} ${base} ${className}`}>
      {level?.toUpperCase()}
    </span>
  )
}
