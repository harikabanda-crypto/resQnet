import React from 'react'
import { DEMO_SHELTERS } from '../../data/mockData.js'
import ShelterCard from '../../components/ShelterCard.jsx'

export default function AuthorityShelters() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-800">Shelters</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {DEMO_SHELTERS.map(s => <ShelterCard key={s.id} shelter={s}/>)}
      </div>
    </div>
  )
}
