import React, { useState } from 'react'
import { PhoneCall, ShieldAlert, WifiOff, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react'
import { useApp } from '../contexts/AppContext.jsx'

const EMERGENCY_CONTACTS = [
  { name: 'NDRF Disaster Helpline', number: '1078', desc: 'National Disaster Response Force Headquarters', tollFree: true },
  { name: 'State Disaster Management (SDMA)', number: '1070', desc: 'North Eastern Regional Emergency Command', tollFree: true },
  { name: 'Unified Emergency Services', number: '112', desc: 'Police, Fire, and Ambulance Direct Line', tollFree: true },
  { name: 'District Operations Centre (DEOC)', number: '1077', desc: 'Local Hill District Evacuation Desk', tollFree: true },
]

const LANDSLIDE_PROTOCOLS = [
  {
    title: '⚠️ Early Warning Signs',
    tips: [
      'New tension cracks appearing on roads, hillslopes, or building foundations',
      'Sudden change from clear stream water to muddy/turbid runoff with debris',
      'Fences, utility poles, or retaining walls tilting downslope',
      'Faint rumbling sounds that increase in volume as debris moves',
    ],
  },
  {
    title: '🏃 Immediate Action During Slope Movement',
    tips: [
      'Never attempt to cross flooded mudflow channels or debris flows',
      'Move quickly perpendicular to the path of the slide toward solid high ground',
      'If escape is impossible, curl into a tight ball under sturdy furniture and protect your head',
      'Alert nearby neighbors without entering the active hazard zone',
    ],
  },
  {
    title: '🎒 Emergency Grab-Kit Checklist',
    tips: [
      'Water bottles (at least 3 liters per family member)',
      'High-calorie non-perishable rations (biscuits, energy bars)',
      'Battery-powered or hand-crank torch/radio with spare batteries',
      'Waterproof pouch with government photo ID and critical medications',
    ],
  },
]

export default function OfflineEmergencyHub() {
  const { isOnline, outboxCount, syncOutbox } = useApp()
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [expandedProtocol, setExpandedProtocol] = useState(null)

  async function handleManualSync() {
    setSyncing(true)
    setSyncSuccess(false)
    try {
      const { syncedCount } = await syncOutbox()
      if (syncedCount > 0) {
        setSyncSuccess(true)
        setTimeout(() => setSyncSuccess(false), 4000)
      }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-sm text-xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
            <WifiOff size={15} className="text-amber-600 shrink-0" />
            <span>Cellular / Internet Outage Detected</span>
          </div>
          <p className="text-amber-700 leading-relaxed text-[11px]">
            Operating in <strong>Offline Life-Safety Mode</strong>. All SOS distress calls are locally queued in browser storage and will auto-transmit immediately when signal returns.
          </p>
        </div>
      )}

      {/* Outbox Pending Transmission Card */}
      {outboxCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <div>
                <div className="text-xs font-bold text-orange-900">
                  {outboxCount} Distress Call(s) in Offline Queue
                </div>
                <div className="text-[11px] text-orange-700">
                  Transmitting automatically on signal reconnection
                </div>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Retrying…' : 'Sync Now'}
            </button>
          </div>

          {syncSuccess && (
            <div className="mt-2 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <CheckCircle2 size={13} /> Queued distress requests transmitted to response network!
            </div>
          )}
        </div>
      )}

      {/* Direct One-Tap Emergency Helplines */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <PhoneCall size={14} className="text-red-500" />
            Direct Emergency Helplines (Toll-Free)
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Cell / Landline</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-red-50/50 hover:border-red-200 transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">
                  {contact.name}
                </div>
                <div className="text-[10px] text-slate-500">{contact.desc}</div>
              </div>
              <div className="bg-red-500 group-hover:bg-red-600 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1">
                📞 {contact.number}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Offline Landslide Protocols & Safety Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-2">
          <BookOpen size={14} className="text-blue-500" />
          Offline Safety & Evacuation Protocols
        </div>

        {LANDSLIDE_PROTOCOLS.map((protocol, idx) => {
          const isExpanded = expandedProtocol === idx
          return (
            <div key={protocol.title} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedProtocol(isExpanded ? null : idx)}
                className="w-full text-left p-2.5 bg-slate-50/70 hover:bg-slate-100/70 text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors"
              >
                <span>{protocol.title}</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isExpanded && (
                <div className="p-3 bg-white space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100">
                  {protocol.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
