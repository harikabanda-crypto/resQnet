import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext.jsx'
import { LogOut, Bell, MapPin, Phone, User } from 'lucide-react'

export default function CitizenProfile() {
  const navigate = useNavigate()
  const { setCurrentRole } = useApp()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl">👤</div>
        <div>
          <div className="text-slate-800 font-bold">Demo Citizen</div>
          <div className="text-slate-400 text-xs">+91 98765 43210</div>
          <div className="text-xs text-orange-500 mt-0.5">Zone A17 – Kukatpally</div>
        </div>
      </div>

      {[
        { icon: MapPin, label: 'Saved Location', value: 'Kukatpally, Hyderabad' },
        { icon: Phone, label: 'Emergency Contact', value: 'Ravi – +91 98765 11111' },
        { icon: Bell, label: 'Notifications', value: 'Enabled – All alerts' },
        { icon: User, label: 'Language', value: 'English' },
      ].map(item => (
        <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <item.icon size={16} className="text-slate-400"/>
          <div className="flex-1">
            <div className="text-xs text-slate-400">{item.label}</div>
            <div className="text-slate-800 text-sm font-medium">{item.value}</div>
          </div>
        </div>
      ))}

      <button onClick={() => { setCurrentRole(null); navigate('/') }} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-500 font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm">
        <LogOut size={16}/> Logout
      </button>
    </div>
  )
}
