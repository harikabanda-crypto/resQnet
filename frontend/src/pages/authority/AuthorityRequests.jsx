import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import RequestCard from '../../components/RequestCard.jsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'

const FILTERS = ['All', 'Critical', 'Rescue', 'Medical', 'Food', 'Water', 'Shelter']

export default function AuthorityRequests() {
  const { requests, updateRequest } = useApp()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [sort, setSort] = useState('priority')

  const filtered = requests.filter(r => {
    if (filter !== 'All' && !r.type.toLowerCase().includes(filter.toLowerCase()) && r.priority !== filter.toLowerCase()) return false
    if (search && !r.id.toLowerCase().includes(search.toLowerCase()) && !r.location.toLowerCase().includes(search.toLowerCase()) && !r.type.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sort === 'priority') {
      const order = { critical: 0, high: 1, urgent: 2, normal: 3 }
      return (order[a.priority] || 3) - (order[b.priority] || 3)
    }
    return 0
  })

  function handleEscalate(req) {
    updateRequest(req.id, { priority: 'critical', status: 'matched', assignedTeam: 'Emergency Team Alpha' })
    setSelected(null)
  }
  function handleResolve(req) {
    updateRequest(req.id, { status: 'delivered' })
    setSelected(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-800">Citizen Requests</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests…" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500 shadow-sm placeholder:text-slate-400"/>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none shadow-sm">
          <option value="priority">Sort: Priority</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400 shadow-sm'
            }`}>{f}</button>
        ))}
      </div>

      <div className="text-xs text-slate-400">{filtered.length} requests</div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(req => (
          <RequestCard key={req.id} req={req} onClick={() => setSelected(req)}/>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-slate-800 font-bold text-lg">{selected.type} Request</div>
                  <div className="text-slate-400 text-sm">#{selected.id}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                {[['Location', selected.location], ['Zone', selected.zone], ['People', selected.people], ['Priority', selected.priority], ['Status', selected.status], ['Time', selected.time], ['Assigned', selected.assignedTeam || 'Unassigned']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-slate-800 font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleEscalate(selected)} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">⬆ Escalate</button>
                <button onClick={() => handleResolve(selected)} className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">✓ Resolve</button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2.5 rounded-xl transition-colors">📍 View Location</button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2.5 rounded-xl transition-colors">📞 Contact</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
