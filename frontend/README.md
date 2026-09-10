# ResQNet Frontend

Modern, responsive, offline-first Web Application for the **ResQNet** Landslide Early Warning & Disaster Response Network (SIH Problem Statement).

---

## Portals & Roles

1. **Citizen PWA** (`/citizen`):
   - Rendered inside an interactive smartphone chassis with iOS-inspired Dynamic Island.
   - Real-time landslide hazard level, rainfall rate, and soil saturation telemetry.
   - 1-tap Emergency SOS with automatic IndexedDB offline queuing and reconnection sync.
   - Offline Life-Safety Hub with direct phone dialers for emergency hotlines (NDRF: 1078, SDMA: 1070, 112).
   - Dynamic OpenStreetMap Leaflet hazard map with route planning to nearest shelters.
2. **Authority Command Center** (`/authority`):
   - Real-time GIS situational overview monitoring 320 North Eastern Region (NER) grid zones.
   - Tree SHAP AI diagnostics with interactive diverging waterfall chart.
   - "What-If" parameter perturbation simulator.
   - Alert broadcaster, incoming SOS triage queue, responder assignments, and shelter tracking.
3. **NGO Relief Portal** (`/ngo`):
   - Supply stockpile tracking (food, clean water, medical kits, tents).
   - Citizen aid requests and delivery status timeline.
4. **Field Responder / Volunteer** (`/volunteer`):
   - Dispatched mission queue, GPS navigation, and task completion updates.

---

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Lucide React Icons
- **Motion & Charts**: Framer Motion + Recharts
- **GIS Mapping**: Leaflet + OpenStreetMap
- **Real-Time Engine**: Full-duplex WebSockets (`/ws/*`)
- **Offline Storage**: Native IndexedDB (`ResQNetOfflineDB`) + Service Worker PWA (`sw.js`)

---

## Development

```bash
# Install dependencies
npm install

# Start Vite dev server with backend proxy on port 5173
npm run dev

# Build production bundle
npm run build
```
