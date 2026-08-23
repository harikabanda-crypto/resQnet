import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext.jsx'
import {
  LayoutDashboard, Map, FileText, Package, Users, Home, Brain,
  BarChart2, Bell, Settings, LogOut, Menu, X, AlertTriangle
} from 'lucide-react'

const NAV = [
  { to: '/authority/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/authority/map', icon: Map, label: 'Live Map' },
  { to: '/authority/requests', icon: FileText, label: 'Requests' },
  { to: '/authority/resources', icon: Package, label: 'Resources' },
  { to: '/authority/teams', icon: Users, label: 'Response Teams' },
  { to: '/authority/shelters', icon: Home, label: 'Shelters' },
  { to: '/authority/ai', icon: Brain, label: 'AI Intelligence' },
  { to: '/authority/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/authority/alerts', icon: Bell, label: 'Alerts' },
]

export default function AuthorityLayout() {
  const navigate = useNavigate()
  const { setCurrentRole, alerts } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-base">🛡</div>
            <div>
              <div className="text-slate-800 font-bold text-sm">ResQNet</div>
              <div className="text-slate-400 text-[10px]">Authority Command</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <Icon size={16}/>{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => { setCurrentRole(null); navigate('/') }}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 text-sm rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={15}/> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
              <span className="text-sm text-red-500 font-semibold">ACTIVE INCIDENT – FLOOD</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={18} className="text-slate-400 cursor-pointer hover:text-slate-700"/>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-xs">🏛</div>
              <span className="text-slate-600 hidden sm:block">Authority</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}/>}
    </div>
  )
}
