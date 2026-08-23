import React, { useState } from 'react'
import { CheckCircle } from 'lucide-react'

const INITIAL = [
  { id: 'INV001', type: 'Water', qty: 500, unit: 'bottles', location: 'Zone B05' },
  { id: 'INV002', type: 'Food', qty: 300, unit: 'packets', location: 'Zone D03' },
  { id: 'INV003', type: 'Medicine', qty: 120, unit: 'kits', location: 'Zone A17' },
  { id: 'INV004', type: 'Blankets', qty: 200, unit: 'pieces', location: 'Zone E09' },
]

export default function NGOInventory() {
  const [items, setItems] = useState(INITIAL)
  const [form, setForm] = useState({ type: '', qty: '', unit: '', location: '' })
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (!form.type || !form.qty) return
    setItems(prev => [...prev, { id: 'INV' + Date.now(), ...form, qty: Number(form.qty) }])
    setForm({ type: '', qty: '', unit: '', location: '' })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-800">Inventory</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-slate-800 font-bold text-base mb-1">{item.type}</div>
            <div className="text-2xl font-black text-purple-600">{item.qty.toLocaleString()}</div>
            <div className="text-xs text-slate-400">{item.unit} · {item.location}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="font-semibold text-slate-800 mb-4">Add Resource</div>
        <div className="grid sm:grid-cols-4 gap-3">
          <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Type (e.g. Water)" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-purple-500 placeholder:text-slate-400"/>
          <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="Quantity" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-purple-500 placeholder:text-slate-400"/>
          <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unit (bottles)" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-purple-500 placeholder:text-slate-400"/>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-purple-500 placeholder:text-slate-400"/>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm">
            + Add Resource
          </button>
          {added && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle size={14}/> Added!</span>}
        </div>
      </div>
    </div>
  )
}
