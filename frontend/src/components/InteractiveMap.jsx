import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

const RISK_CONFIG = {
  critical: { bg: '#ef4444', ring: '#fee2e2', text: '#fff', border: '#b91c1c' },
  high:     { bg: '#f97316', ring: '#ffedd5', text: '#fff', border: '#c2410c' },
  moderate: { bg: '#eab308', ring: '#fef9c3', text: '#fff', border: '#a16207' },
  safe:     { bg: '#10b981', ring: '#d1fae5', text: '#fff', border: '#047857' },
}

export default function InteractiveMap({
  zones = [],
  shelters = [],
  blockages = [],
  responders = [],
  activeRoute = null,
  blockedRoute = null,
  filter = 'All',
  selectedEntity = null,
  onSelect = () => {},
  onSetRouteOrigin = null,
  onSetRouteDest = null,
  height = '500px',
  defaultCenter = [25.5788, 91.8933], // Shillong, Meghalaya (NER hub)
  defaultZoom = 8,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({
    zones: L.layerGroup(),
    shelters: L.layerGroup(),
    blockages: L.layerGroup(),
    responders: L.layerGroup(),
    routes: L.layerGroup(),
  })

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
    })

    // Zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    // Add layer groups
    Object.values(layersRef.current).forEach(group => group.addTo(map))
    mapInstanceRef.current = map

    // Fix possible leaflet sizing glitch on load
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 2. Render Markers and Overlays based on Filter & Data
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const { zones: zLayer, shelters: sLayer, blockages: bLayer, responders: rLayer, routes: rtLayer } = layersRef.current

    // Clear all layers
    zLayer.clearLayers()
    sLayer.clearLayers()
    bLayer.clearLayers()
    rLayer.clearLayers()
    rtLayer.clearLayers()

    const showAll = filter === 'All'
    const showRisk = showAll || filter === 'Risk'
    const showShelters = showAll || filter === 'Shelters'
    const showBlockages = showAll || filter === 'Blockages' || filter === 'SOS'
    const showResponders = showAll || filter === 'Volunteers' || filter === 'Deliveries'

    const validCoordinates = []

    // --- A. Render Zones ---
    if (showRisk && zones?.length) {
      zones.forEach(zone => {
        if (!zone.lat || !zone.lng) return
        const latLng = [zone.lat, zone.lng]
        validCoordinates.push(latLng)

        const risk = (zone.risk || 'safe').toLowerCase()
        const cfg = RISK_CONFIG[risk] || RISK_CONFIG.safe
        const isCritical = risk === 'critical'

        // Custom HTML DivIcon
        const iconHtml = `
          <div class="relative flex items-center justify-center">
            ${isCritical ? `<div class="absolute w-10 h-10 rounded-full animate-ping opacity-40" style="background-color: ${cfg.bg};"></div>` : ''}
            <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-[10px] cursor-pointer transition-transform hover:scale-125"
                 style="background-color: ${cfg.bg}; color: ${cfg.text}; border-color: #fff;">
              ${zone.id}
            </div>
          </div>
        `

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-zone-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker(latLng, { icon })

        // Popup HTML
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <strong style="font-size: 14px; color: #1e293b;">Zone ${zone.id}</strong>
              <span style="background: ${cfg.bg}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
                ${risk}
              </span>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${zone.name || 'NER Region'}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 6px; border-radius: 8px; font-size: 11px; margin-bottom: 8px;">
              <div>💧 Rainfall: <strong>${zone.rainfall || '0 mm/hr'}</strong></div>
              <div>🌱 Moisture: <strong>${zone.soil_moisture ? Math.round(zone.soil_moisture * 100) + '%' : 'Normal'}</strong></div>
              <div>🚨 SOS Active: <strong style="color: #ef4444;">${zone.sos || 0}</strong></div>
              <div>👥 Pop: <strong>${zone.population || 'N/A'}</strong></div>
            </div>
            <div style="font-size: 11px; color: #475569; font-style: italic; margin-bottom: 8px;">
              ${zone.recommendation || 'Continuous monitoring in progress.'}
            </div>
          </div>
        `

        marker.bindPopup(popupContent)
        marker.on('click', () => {
          onSelect(zone, 'zone')
        })

        zLayer.addLayer(marker)
      })
    }

    // --- B. Render Shelters ---
    if (showShelters && shelters?.length) {
      shelters.forEach(s => {
        if (!s.lat || !s.lng) return
        const latLng = [s.lat, s.lng]
        validCoordinates.push(latLng)

        const occPct = s.capacity ? Math.round(((s.occupied || 0) / s.capacity) * 100) : 0
        const isNearFull = occPct >= 90

        const iconHtml = `
          <div class="w-8 h-8 rounded-xl bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs cursor-pointer hover:scale-110 transition-transform">
            🏠
          </div>
        `
        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-shelter-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker(latLng, { icon })
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 190px; padding: 4px;">
            <div style="font-size: 13px; font-weight: bold; color: #1e293b; margin-bottom: 4px;">${s.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${s.location || 'NER Safety Point'}</div>
            <div style="background: #eff6ff; padding: 6px; border-radius: 6px; font-size: 11px; margin-bottom: 6px;">
              <div>Capacity: <strong>${s.occupied || 0} / ${s.capacity || 500}</strong> (${occPct}%)</div>
              <div style="width: 100%; height: 5px; background: #cbd5e1; border-radius: 3px; margin-top: 4px; overflow: hidden;">
                <div style="width: ${occPct}%; height: 100%; background: ${isNearFull ? '#ef4444' : '#3b82f6'};"></div>
              </div>
            </div>
          </div>
        `
        marker.bindPopup(popupContent)
        marker.on('click', () => onSelect(s, 'shelter'))
        sLayer.addLayer(marker)
      })
    }

    // --- C. Render Road Blockages ---
    if (showBlockages && blockages?.length) {
      blockages.forEach(b => {
        if (!b.lat || !b.lng) return
        const latLng = [b.lat, b.lng]
        validCoordinates.push(latLng)

        const isBlocked = !b.passable
        const iconHtml = `
          <div class="w-7 h-7 rounded-lg ${isBlocked ? 'bg-red-600 animate-bounce' : 'bg-amber-500'} border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] cursor-pointer">
            ⛔
          </div>
        `
        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-blockage-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const marker = L.marker(latLng, { icon })
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 180px; padding: 4px;">
            <div style="font-size: 12px; font-weight: bold; color: #dc2626;">ROAD HAZARD: ${b.blockage_type?.toUpperCase() || 'OBSTRUCTION'}</div>
            <div style="font-size: 12px; color: #1e293b; margin: 4px 0;">${b.road_name || 'Highway'}</div>
            <div style="font-size: 11px; color: #64748b;">${b.location || ''}</div>
            <div style="margin-top: 6px; font-size: 10px; font-weight: bold; color: ${isBlocked ? '#b91c1c' : '#d97706'};">
              ${isBlocked ? '❌ IMPASSABLE TO VEHICLES' : '⚠️ SINGLE LANE CAUTION'}
            </div>
          </div>
        `
        marker.bindPopup(popupContent)
        marker.on('click', () => onSelect(b, 'blockage'))
        bLayer.addLayer(marker)
      })
    }

    // --- D. Render Responders ---
    if (showResponders && responders?.length) {
      responders.forEach(r => {
        if (!r.lat || !r.lng) return
        const latLng = [r.lat, r.lng]
        validCoordinates.push(latLng)

        const isBusy = r.status === 'busy' || r.status === 'en_route'
        const iconHtml = `
          <div class="w-7 h-7 rounded-full ${isBusy ? 'bg-purple-600' : 'bg-emerald-600'} border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] cursor-pointer">
            🚑
          </div>
        `
        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-responder-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const marker = L.marker(latLng, { icon })
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 170px; padding: 4px;">
            <div style="font-size: 12px; font-weight: bold; color: #1e293b;">${r.name}</div>
            <div style="font-size: 11px; color: #64748b;">Role: ${r.type?.toUpperCase() || 'RESPONSE'}</div>
            <div style="font-size: 11px; margin-top: 4px; color: ${isBusy ? '#7c3aed' : '#059669'}; font-weight: bold;">
              Status: ${r.status?.toUpperCase() || 'AVAILABLE'}
            </div>
          </div>
        `
        marker.bindPopup(popupContent)
        marker.on('click', () => onSelect(r, 'responder'))
        rLayer.addLayer(marker)
      })
    }

    // --- E. Render Active Safe Evacuation Route ---
    if (activeRoute?.path?.length) {
      const routeCoords = activeRoute.path.map(p => [p[0], p[1]])
      const polyline = L.polyline(routeCoords, {
        color: '#10b981',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      })
      rtLayer.addLayer(polyline)

      // Start Marker
      const startPoint = routeCoords[0]
      const startIcon = L.divIcon({
        html: '<div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center text-xs font-bold shadow-lg">🚩</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      rtLayer.addLayer(L.marker(startPoint, { icon: startIcon }))

      // End Marker
      const endPoint = routeCoords[routeCoords.length - 1]
      const endIcon = L.divIcon({
        html: '<div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-bold shadow-lg">🏁</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      rtLayer.addLayer(L.marker(endPoint, { icon: endIcon }))

      // Fit map to route
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
    } else if (validCoordinates.length > 1 && !selectedEntity) {
      // Auto-fit to active coordinates
      try {
        const bounds = L.latLngBounds(validCoordinates)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 })
      } catch {
        // Fallback to default
      }
    }

    // Focus selected entity if provided
    if (selectedEntity?.lat && selectedEntity?.lng) {
      map.flyTo([selectedEntity.lat, selectedEntity.lng], 13, { duration: 1.2 })
    }
  }, [zones, shelters, blockages, responders, activeRoute, filter, selectedEntity])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: height }} />
      
      {/* Map Attribution / Watermark */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-500 font-medium shadow-sm pointer-events-none">
        ResQNet GIS Engine • OpenStreetMap & GSI Landslide Database
      </div>
    </div>
  )
}
