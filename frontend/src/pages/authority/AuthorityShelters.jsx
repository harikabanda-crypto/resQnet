import React from 'react'
import { DEMO_SHELTERS } from '../../data/mockData.js'
import ShelterCard from '../../components/ShelterCard.jsx'
import { useApp } from '../../contexts/AppContext.jsx'

export default function AuthorityShelters() {
  const { shelters = DEMO_SHELTERS } = useApp()
  const displayShelters = shelters.length > 0 ? shelters : DEMO_SHELTERS

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Shelters</h1>
          <p className="text-slate-500 text-xs mt-0.5">Emergency shelters, capacity, and resource status ({displayShelters.length} active)</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayShelters.map(s => <ShelterCard key={s.id} shelter={s}/>)}
      </div>
    </div>
  )
}
