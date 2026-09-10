import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  DEMO_ZONES,
  DEMO_SHELTERS,
  DEMO_RESOURCES,
  DEMO_TEAMS,
  INITIAL_REQUESTS,
  DEMO_ALERTS,
} from '../data/mockData.js'
import api from '../services/api.js'
import wsService from '../services/websocket.js'
import offlineStorage from '../services/offlineStorage.js'

const AppContext = createContext(null)

function normalizeRequest(item) {
  return {
    ...item,
    id: item.request_code || (typeof item.id === 'number' ? `RQ${item.id}` : item.id),
    backendId: typeof item.id === 'number' ? item.id : null,
    zone: item.zone_id || item.zone || 'A17',
    assignedTeam: item.assigned_team || item.assignedTeam || null,
    citizenName: item.citizen_name || item.citizenName || 'Citizen',
    time: item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : (item.time || 'Just now'),
  }
}

function normalizeAlert(item) {
  return {
    ...item,
    id: typeof item.id === 'number' ? `AL${String(item.id).padStart(3, '0')}` : item.id,
    backendId: typeof item.id === 'number' ? item.id : null,
    time: item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : (item.time || 'Just now'),
    zone: item.zone_id || item.zone || 'All Zones',
  }
}

function normalizeZone(z) {
  return {
    ...z,
    waterLevel: typeof z.water_level === 'number'
      ? (z.water_level > 70 ? 'Rising' : z.water_level > 40 ? 'High' : 'Normal')
      : (z.waterLevel || 'Normal'),
    rainfall: typeof z.rainfall === 'number'
      ? `${Math.round(z.rainfall)} mm/hr`
      : (z.rainfall || '0 mm/hr'),
  }
}

export function AppProvider({ children }) {
  // Mode & connection states
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [backendConnected, setBackendConnected] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [outboxCount, setOutboxCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Auth state
  const [currentUser, setCurrentUser] = useState(api.user)
  const [currentRole, setCurrentRole] = useState(api.user?.role || null)

  // Core domain entities
  const [zones, setZones] = useState(DEMO_ZONES)
  const [shelters, setShelters] = useState(DEMO_SHELTERS)
  const [resources, setResources] = useState(DEMO_RESOURCES)
  const [teams, setTeams] = useState(DEMO_TEAMS)
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [alerts, setAlerts] = useState(DEMO_ALERTS)
  const [blockages, setBlockages] = useState([])

  // Dashboard metrics
  const [stats, setStats] = useState({
    affectedPopulation: 18420,
    activeSOS: 243,
    criticalZones: 7,
    pendingRequests: 892,
    activeResponders: 164,
    ongoingDeliveries: 317,
  })

  // Fetch live backend data
  const refreshData = useCallback(async () => {
    if (!isLiveMode) return

    try {
      // 1. Check backend health
      await api.checkHealth()
      setBackendConnected(true)

      // 2. Fetch parallel entities
      const [zonesRes, alertsRes, sosRes, sheltersRes, resourcesRes, teamsRes, blockagesRes] =
        await Promise.allSettled([
          api.getZones(),
          api.getAlerts(),
          api.getSOSRequests(),
          api.getShelters(),
          api.getResources(),
          api.getResponders(),
          api.getBlockages(),
        ])

      if (zonesRes.status === 'fulfilled' && zonesRes.value?.length) {
        setZones(zonesRes.value.map(normalizeZone))
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value?.length) {
        setAlerts(alertsRes.value.map(normalizeAlert))
      }
      if (sosRes.status === 'fulfilled' && sosRes.value?.length) {
        setRequests(sosRes.value.map(normalizeRequest))
      }
      if (sheltersRes.status === 'fulfilled' && sheltersRes.value?.length) {
        setShelters(sheltersRes.value)
        offlineStorage.cacheShelters(sheltersRes.value)
      } else {
        offlineStorage.getCachedShelters().then(cached => {
          if (cached?.length) setShelters(cached)
        })
      }
      if (resourcesRes.status === 'fulfilled' && resourcesRes.value?.length) {
        setResources(resourcesRes.value)
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.length) {
        setTeams(teamsRes.value)
      }
      if (blockagesRes.status === 'fulfilled' && blockagesRes.value?.length) {
        setBlockages(blockagesRes.value)
      }
    } catch (err) {
      console.warn('[AppContext] Backend unreachable, using demo fallback:', err.message)
      setBackendConnected(false)
      offlineStorage.getCachedShelters().then(cached => {
        if (cached?.length) setShelters(cached)
      })
    } finally {
      setIsLoading(false)
    }
  }, [isLiveMode])

  // Recalculate stats whenever zones or requests update
  useEffect(() => {
    const activeSosCount = requests.filter(r => r.status !== 'delivered' && r.status !== 'resolved').length
    const pendingCount = requests.filter(r => r.status === 'received').length
    const criticalZoneCount = zones.filter(z => z.risk === 'critical').length
    const totalPop = zones.reduce((acc, z) => acc + (z.population || 0), 0)

    setStats(prev => ({
      ...prev,
      affectedPopulation: totalPop > 0 ? totalPop : prev.affectedPopulation,
      activeSOS: activeSosCount > 0 ? activeSosCount : prev.activeSOS,
      criticalZones: criticalZoneCount > 0 ? criticalZoneCount : prev.criticalZones,
      pendingRequests: pendingCount > 0 ? pendingCount : prev.pendingRequests,
    }))
  }, [zones, requests])

  // Mount effect: Initial fetch and WebSocket connection
  useEffect(() => {
    refreshData()

    if (isLiveMode) {
      wsService.connect()
      const unsubscribeStatus = wsService.onStatusChange(setWsConnected)

      // Listen for live backend WebSocket events
      const offSosCreated = wsService.on('sos_created', (data) => {
        const normalized = normalizeRequest(data)
        setRequests(prev => [normalized, ...prev.filter(r => r.id !== normalized.id)])
      })

      const offSosUpdated = wsService.on('sos_updated', (data) => {
        setRequests(prev =>
          prev.map(r => (r.backendId === data.id || r.id === data.request_code || r.id === `RQ${data.id}`)
            ? { ...r, status: data.status, priority: data.priority, assignedTeam: data.assigned_team || r.assignedTeam }
            : r
          )
        )
      })

      const offSosAssigned = wsService.on('sos_assigned', (data) => {
        setRequests(prev =>
          prev.map(r => (r.backendId === data.request_id || r.id === data.request_code || r.id === `RQ${data.request_id}`)
            ? { ...r, status: data.status, assignedTeam: `${data.responder_name} (${data.responder_id})` }
            : r
          )
        )
      })

      const offAlertCreated = wsService.on('alert_created', (data) => {
        const normalized = normalizeAlert(data)
        setAlerts(prev => [normalized, ...prev.filter(a => a.id !== normalized.id)])
      })

      const offAlertUpdated = wsService.on('alert_updated', (data) => {
        setAlerts(prev =>
          prev.map(a => (a.backendId === data.id || a.id === `AL${String(data.id).padStart(3, '0')}`)
            ? { ...a, status: data.status, severity: data.severity }
            : a
          )
        )
      })

      const offBlockageReported = wsService.on('blockage_reported', (data) => {
        setBlockages(prev => [data, ...prev.filter(b => b.id !== data.id)])
      })

      const offBlockageUpdated = wsService.on('blockage_updated', (data) => {
        setBlockages(prev =>
          prev.map(b => b.id === data.id ? { ...b, ...data } : b)
        )
      })

      return () => {
        unsubscribeStatus()
        offSosCreated()
        offSosUpdated()
        offSosAssigned()
        offAlertCreated()
        offAlertUpdated()
        offBlockageReported()
        offBlockageUpdated()
        wsService.disconnect()
      }
    }
  }, [refreshData, isLiveMode])

  // Offline outbox queue & network monitor effect
  useEffect(() => {
    offlineStorage.getPendingSOS().then(pending => setOutboxCount(pending.length))
    const unsubscribeSync = offlineStorage.onSyncEvent(() => {
      offlineStorage.getPendingSOS().then(pending => setOutboxCount(pending.length))
    })

    const handleOnline = async () => {
      setIsOnline(true)
      const { syncedCount } = await offlineStorage.syncOutbox(api)
      if (syncedCount > 0) {
        refreshData()
      }
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubscribeSync()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshData])

  // Citizen SOS submission
  async function addRequest(req) {
    const tempId = req.id || 'RQ' + Math.floor(10000 + Math.random() * 90000)
    const isDisconnected = !isOnline || !backendConnected
    const optimisticReq = {
      ...req,
      id: tempId,
      status: isDisconnected ? 'offline_queued' : 'received',
      time: 'Just now',
      citizenName: req.citizenName || req.citizen_name || 'Citizen',
    }

    setRequests(prev => [optimisticReq, ...prev])

    // If offline or backend unreachable, immediately persist in IndexedDB outbox
    if (isDisconnected) {
      await offlineStorage.queueSOS(optimisticReq)
      return optimisticReq
    }

    if (backendConnected && isLiveMode) {
      try {
        const liveReq = await api.createSOS({
          type: req.type || 'Rescue',
          zone: req.zone || req.zone_id || 'A17',
          location: req.location || 'Location Pending',
          people: Number(req.people) || 1,
          priority: req.priority || 'high',
          description: req.description || req.desc || '',
          citizen_name: req.citizenName || 'Citizen',
        })
        const normalized = normalizeRequest(liveReq)
        setRequests(prev => [normalized, ...prev.filter(r => r.id !== tempId && r.id !== normalized.id)])
        return normalized
      } catch (err) {
        console.warn('[AppContext] Failed to post live SOS, queueing in IndexedDB outbox:', err.message)
        await offlineStorage.queueSOS(optimisticReq)
        setRequests(prev => prev.map(r => r.id === tempId ? { ...r, status: 'offline_queued' } : r))
      }
    } else {
      // Offline Demo simulation
      setTimeout(() => {
        setRequests(prev =>
          prev.map(r => r.id === tempId ? { ...r, status: 'matched', assignedTeam: 'NDRF Team Alpha' } : r)
        )
      }, 3000)
      setTimeout(() => {
        setRequests(prev =>
          prev.map(r => r.id === tempId ? { ...r, status: 'out_for_delivery' } : r)
        )
      }, 8000)
    }
    return optimisticReq
  }

  // Update request status (dispatch, in-transit, delivered)
  async function updateRequest(id, updates) {
    // Optimistic UI update
    setRequests(prev => prev.map(r => (r.id === id || r.backendId === id) ? { ...r, ...updates } : r))

    if (backendConnected && isLiveMode) {
      try {
        const targetReq = requests.find(r => r.id === id || r.backendId === id)
        const targetId = targetReq?.backendId || (typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10))
        if (targetId && !isNaN(targetId)) {
          await api.updateSOS(targetId, updates)
        }
      } catch (err) {
        console.warn('[AppContext] Failed to update SOS on backend:', err.message)
      }
    }
  }

  // Assign responder team to SOS
  async function assignRequest(requestId, responderId) {
    const targetReq = requests.find(r => r.id === requestId || r.backendId === requestId)
    const targetId = targetReq?.backendId || (typeof requestId === 'number' ? requestId : parseInt(String(requestId).replace(/\D/g, ''), 10))

    if (backendConnected && isLiveMode && targetId && !isNaN(targetId)) {
      try {
        await api.assignSOS(targetId, responderId)
      } catch (err) {
        console.warn('[AppContext] Failed to assign responder on backend:', err.message)
      }
    } else {
      const team = teams.find(t => t.id === responderId)
      updateRequest(requestId, {
        status: 'matched',
        assignedTeam: team ? `${team.name} (${team.id})` : responderId,
      })
    }
  }

  // Authority alert broadcast
  async function broadcastAlert(alertPayload) {
    const tempId = alertPayload.id || 'AL' + Date.now()
    const optimisticAlert = {
      ...alertPayload,
      id: tempId,
      time: 'Just now',
    }
    setAlerts(prev => [optimisticAlert, ...prev])

    if (backendConnected && isLiveMode) {
      try {
        const liveAlert = await api.createAlert(
          alertPayload.message,
          alertPayload.severity || 'high',
          alertPayload.zone || alertPayload.zone_id || null,
        )
        const normalized = normalizeAlert(liveAlert)
        setAlerts(prev => [normalized, ...prev.filter(a => a.id !== tempId && a.id !== normalized.id)])
      } catch (err) {
        console.warn('[AppContext] Failed to broadcast alert on backend:', err.message)
      }
    }
  }

  // Auth handlers
  async function loginUser(username, password, role) {
    if (backendConnected && isLiveMode && username && password) {
      try {
        const data = await api.login(username, password)
        setCurrentUser(api.user)
        setCurrentRole(data.role || role)
        return { success: true, role: data.role || role }
      } catch (err) {
        console.warn('[AppContext] Backend login failed, falling back to demo login:', err.message)
      }
    }
    // Demo fallback login
    setCurrentRole(role)
    setCurrentUser({ username: username || `${role}@resqnet.demo`, role })
    return { success: true, role }
  }

  function logoutUser() {
    api.logout()
    setCurrentUser(null)
    setCurrentRole(null)
  }

  return (
    <AppContext.Provider
      value={{
        // Mode & network state
        isLiveMode,
        setIsLiveMode,
        backendConnected,
        wsConnected,
        isOnline,
        outboxCount,
        syncOutbox: () => offlineStorage.syncOutbox(api),
        isLoading,
        refreshData,

        // Auth
        currentUser,
        currentRole,
        setCurrentRole,
        loginUser,
        logoutUser,

        // Core data
        zones,
        shelters,
        resources,
        teams,
        requests,
        alerts,
        blockages,
        stats,
        setStats,

        // Actions
        addRequest,
        updateRequest,
        assignRequest,
        broadcastAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
