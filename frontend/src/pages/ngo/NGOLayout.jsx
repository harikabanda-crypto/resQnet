import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext.jsx'
import { LayoutDashboard, Package, FileText, History, User, LogOut, Menu, X } from 'lucide-react'

const NAV = [
  { to: '/ngo/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ngo/inventory', icon: Package, label: 'Inventory' },
  { to: '/ngo/requests', icon: FileText, label: 'Requests' },
  { to: '/ngo/history', icon: History, label: 'History' },
]

export default function NGOLayout() {
  const navigate = useNavigate()
  const { setCurrentRole } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-sm ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">🏥</div>
          <div>
            <div className="text-slate-800 font-bold text-sm">ResQNet</div>
            <div className="text-slate-400 text-[10px]">NGO Portal</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-purple-50 text-purple-600 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => { setCurrentRole(null); navigate('/') }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 text-sm rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={15}/> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 lg:ml-56 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500" onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
            <span className="text-slate-800 font-semibold text-sm">NGO / Resource Provider</span>
          </div>
          <div className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">● ACTIVE</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet/></main>
      </div>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)}/>}
    </div>
  )
}
