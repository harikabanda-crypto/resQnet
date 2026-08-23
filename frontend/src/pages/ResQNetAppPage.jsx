import React from 'react'
import MobilePhone from '../components/MobilePhone.jsx'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const ROLES = [
  { id: 'citizen', label: 'Citizen', emoji: '👤', desc: 'Request help, view alerts & find safe routes', color: 'from-blue-50 to-blue-100 border-blue-200', loginRoute: '/login/citizen' },
  { id: 'volunteer', label: 'Volunteer', emoji: '🙋', desc: 'Accept tasks, deliver aid, assist rescues', color: 'from-green-50 to-green-100 border-green-200', loginRoute: '/login/volunteer' },
  { id: 'ngo', label: 'NGO / Resource', emoji: '🏥', desc: 'Manage inventory and fulfill resource requests', color: 'from-purple-50 to-purple-100 border-purple-200', loginRoute: '/login/ngo' },
  { id: 'delivery', label: 'Delivery Partner', emoji: '🚚', desc: 'Pick up and deliver relief supplies safely', color: 'from-yellow-50 to-yellow-100 border-yellow-200', loginRoute: '/login/delivery' },
  { id: 'authority', label: 'Authority', emoji: '🏛', desc: 'Command dashboard, live map & AI intelligence', color: 'from-red-50 to-red-100 border-red-200', loginRoute: '/login/authority' },
]

function RoleSelection({ navigate }) {
  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto scrollbar-hide">
      <div className="px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
        <p className="text-slate-500 text-[11px] leading-tight">Connecting people, resources and responders when every second matters.</p>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Select your role</p>
        {ROLES.map(role => (
          <motion.button
            key={role.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(role.loginRoute)}
            className={`w-full bg-gradient-to-br ${role.color} border rounded-xl p-3 text-left flex items-center gap-3 hover:opacity-90 transition-all shadow-sm`}
          >
            <span className="text-2xl">{role.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-slate-800 font-semibold text-sm">{role.label}</div>
              <div className="text-slate-500 text-[10px] leading-tight">{role.desc}</div>
            </div>
            <span className="text-slate-400 text-xs">→</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function ResQNetAppPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <MobilePhone showApp={true}>
        <RoleSelection navigate={navigate} />
      </MobilePhone>
    </div>
  )
}
