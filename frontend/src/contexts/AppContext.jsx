import React, { createContext, useContext, useState } from 'react'
import { INITIAL_REQUESTS, DEMO_ALERTS } from '../data/mockData.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [alerts, setAlerts] = useState(DEMO_ALERTS)
  const [currentRole, setCurrentRole] = useState(null)
  const [stats, setStats] = useState({
    affectedPopulation: 18420,
    activeSOS: 243,
    criticalZones: 7,
    pendingRequests: 892,
    activeResponders: 164,
    ongoingDeliveries: 317,
  })

  // Add a new citizen request and update stats
  function addRequest(req) {
    setRequests(prev => [req, ...prev])
    setStats(prev => ({
      ...prev,
      pendingRequests: prev.pendingRequests + 1,
      activeSOS: req.priority === 'critical' ? prev.activeSOS + 1 : prev.activeSOS,
    }))
    // Simulate AI matching after 3 seconds
    setTimeout(() => {
      setRequests(prev =>
        prev.map(r => r.id === req.id ? { ...r, status: 'matched', assignedTeam: 'NGO Alpha / Volunteer V09' } : r)
      )
    }, 3000)
    // Simulate out for delivery after 8 seconds
    setTimeout(() => {
      setRequests(prev =>
        prev.map(r => r.id === req.id ? { ...r, status: 'out_for_delivery' } : r)
      )
    }, 8000)
  }

  // Update a request status
  function updateRequest(id, updates) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  // Broadcast an alert
  function broadcastAlert(alert) {
    setAlerts(prev => [alert, ...prev])
  }

  return (
    <AppContext.Provider value={{
      requests, addRequest, updateRequest,
      alerts, broadcastAlert,
      stats, setStats,
      currentRole, setCurrentRole,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
