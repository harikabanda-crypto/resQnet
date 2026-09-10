import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import MobilePhone from '../../components/MobilePhone.jsx'
import { Home, Map, HelpCircle, Package, User } from 'lucide-react'
import { useApp } from '../../contexts/AppContext.jsx'

const NAV = [
  { to: '/citizen/home', icon: Home, label: 'Home' },
  { to: '/citizen/map', icon: Map, label: 'Map' },
  { to: '/citizen/request', icon: HelpCircle, label: 'Request' },
  { to: '/citizen/relief', icon: Package, label: 'Relief' },
  { to: '/citizen/profile', icon: User, label: 'Profile' },
]

function CitizenNav() {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 flex items-center justify-around px-1 py-2 z-50">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${isActive ? 'text-orange-500' : 'text-slate-400'}`
        }>
          <Icon size={18}/>
          <span className="text-[9px] font-medium">{label}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default function CitizenLayout() {
  const { isOnline, outboxCount } = useApp()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <MobilePhone showApp={true}>
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
          {/* Top Offline Network Indicator */}
          {!isOnline && (
            <div className="bg-amber-600 text-white text-[10px] px-3 py-1 flex items-center justify-between font-semibold shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Offline Life-Safety Mode
              </span>
              {outboxCount > 0 && (
                <span className="bg-amber-800 px-1.5 py-0.5 rounded text-[9px]">
                  {outboxCount} queued
                </span>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide pb-16">
            <Outlet />
          </div>
          <CitizenNav />
        </div>
      </MobilePhone>
    </div>
  )
}
