# ResQNet — AI-Powered Landslide Early Warning & Disaster Response Network

> SIH Problem Statement: AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER) of India.

ResQNet estimates zone-wise landslide probability and identifies rapidly increasing risk conditions to support early warning and disaster-response decisions. It does **not** claim to predict the exact time and location of every landslide.

---

## What ResQNet Does

ResQNet demonstrates a complete, connected pipeline — not just a dashboard:

```
Environmental Data → Feature Engineering → ML Risk Prediction
    → Risk Trend Detection → Early Warning → Safe Route
    → SOS / Community Report → Authority Response → Resource Coordination
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion |
| Routing | React Router v6 |
| Icons | Lucide React |
| Maps | OpenStreetMap (Leaflet-ready) |
| ML (planned) | Python, XGBoost, SHAP, Scikit-learn |
| Backend (planned) | FastAPI, PostgreSQL / SQLite |
| Real-time (planned) | WebSockets |

---

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

No backend is required to run the frontend prototype. All data runs from `src/data/mockData.js` in **Demo Mode**.

---

## Project Structure

```
resQnet/
└── frontend/
    ├── public/
    ├── src/
    │   ├── contexts/
    │   │   └── AppContext.jsx       # Global state (mode, zones, alerts, SOS)
    │   ├── data/
    │   │   └── mockData.js          # Zone data, shelters, requests, responders
    │   ├── components/
    │   │   ├── MobilePhone.jsx      # iPhone-frame wrapper for citizen UI
    │   │   ├── RiskBadge.jsx        # Risk level indicator (LOW/MODERATE/HIGH/CRITICAL)
    │   │   ├── StatCard.jsx         # Dashboard stat card
    │   │   ├── RequestCard.jsx      # SOS / relief request card
    │   │   ├── ShelterCard.jsx      # Shelter info card
    │   │   ├── SafeRouteCard.jsx    # Safe route display
    │   │   └── StatusTimeline.jsx   # Request status tracker
    │   ├── pages/
    │   │   ├── LandingPage.jsx      # Public landing / role selector
    │   │   ├── LoginPage.jsx        # Login for each role
    │   │   ├── ResQNetAppPage.jsx   # App entry with Live/Demo mode toggle
    │   │   ├── citizen/
    │   │   │   ├── CitizenLayout.jsx
    │   │   │   ├── CitizenHome.jsx       # Risk summary, rainfall, SOS button
    │   │   │   ├── CitizenMap.jsx        # Interactive risk map (zone colours)
    │   │   │   ├── CitizenRequest.jsx    # Submit SOS / community report
    │   │   │   ├── CitizenRelief.jsx     # Find shelters, safe routes
    │   │   │   └── CitizenProfile.jsx
    │   │   ├── authority/
    │   │   │   ├── AuthorityLayout.jsx
    │   │   │   ├── AuthorityDashboard.jsx  # Stats: critical zones, active SOS, alerts
    │   │   │   ├── AuthorityMap.jsx        # Full risk map with zone inspection
    │   │   │   ├── AuthorityAlerts.jsx     # Create / send / manage alerts
    │   │   │   ├── AuthorityRequests.jsx   # SOS queue, assign responders
    │   │   │   ├── AuthorityResources.jsx  # Resource inventory
    │   │   │   ├── AuthorityTeams.jsx      # Volunteer / responder management
    │   │   │   ├── AuthorityShelters.jsx   # Shelter status and capacity
    │   │   │   ├── AuthorityAI.jsx         # ML risk engine, SHAP explainability
    │   │   │   └── AuthorityAnalytics.jsx  # Charts, trend analysis
    │   │   ├── ngo/
    │   │   │   ├── NGOLayout.jsx
    │   │   │   ├── NGODashboard.jsx
    │   │   │   ├── NGOInventory.jsx        # Relief supplies inventory
    │   │   │   ├── NGORequests.jsx         # Incoming citizen requests
    │   │   │   └── NGOHistory.jsx
    │   │   └── volunteer/
    │   │       ├── VolunteerLayout.jsx
    │   │       ├── VolunteerDashboard.jsx
    │   │       ├── VolunteerTasks.jsx      # Assigned tasks queue
    │   │       └── VolunteerMap.jsx        # Field map view
    │   ├── App.jsx                  # Routes for all four portals
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.js
```

---

## User Roles & Portals

| Role | Route | UI Style |
|---|---|---|
| Citizen | `/citizen` | Mobile-first, inside iPhone frame |
| Authority | `/authority` | Desktop dashboard |
| NGO | `/ngo` | Desktop dashboard |
| Volunteer | `/volunteer` | Desktop / field-optimised |

Access each portal from the Landing Page (`/`) by selecting a role, or navigate directly.

---

## Data Architecture

Data is clearly separated into three categories so simulated values are never presented as real-time sensor readings.

### Live / Dynamic (updates during prediction loop)
- 🌧️ Rainfall (NASA GPM IMERG — near-real-time satellite-derived precipitation)
- 💧 Soil moisture (Copernicus satellite-derived — latest available)
- 🌍 Earthquake activity (USGS earthquake feed)
- 📱 Community reports (user-submitted ground observations)
- 🚨 SOS requests
- 🚧 Road blockage reports
- 🏠 Shelter availability and capacity
- 👥 Responder availability

### Static / Constant (loaded once)
- ⛰️ Elevation (SRTM DEM)
- 📐 Slope (derived from DEM)
- 🧭 Aspect (derived from DEM)
- 🏔️ Terrain curvature
- 🌲 Land cover (ISRO/NRSC Bhuvan or equivalent)
- 📍 Historical landslide density
- 🛣️ Road geometry (OpenStreetMap)
- 🏥 Base locations of shelters and hospitals

### Historical / Training
- 📚 Historical landslide records (NASA COOLR / Global Landslide Catalog)
- 📚 Historical rainfall, soil moisture, seismic data

---

## ML Risk Model

The risk engine uses **XGBoost** (fallback: Random Forest) trained on a unified tabular dataset.

### Input Features per Zone

| Feature | Source |
|---|---|
| `elevation`, `slope`, `aspect`, `curvature` | SRTM DEM (static) |
| `land_cover` | ISRO/NRSC Bhuvan (static) |
| `historical_landslide_density` | NASA COOLR (static) |
| `rainfall_30min` → `rainfall_7day` | NASA GPM IMERG (live) |
| `soil_moisture` | Copernicus (periodically updated) |
| `earthquake_count_24h/7d`, `nearest_eq_distance`, `max_magnitude` | USGS (live) |

**Target variable:** `landslide_occurrence` (1 = recorded landslide, 0 = no landslide)

Negative samples are generated from locations and time periods without recorded landslides to avoid class imbalance.

### Risk Thresholds (configurable)

| Probability | Level |
|---|---|
| 0 – 25% | 🟢 LOW |
| 25 – 50% | 🟡 MODERATE |
| 50 – 75% | 🟠 HIGH |
| 75 – 100% | 🔴 CRITICAL |

### Explainability (SHAP)

The Authority AI panel shows why a zone is at risk:

```
WHY IS ZONE 17 AT RISK?
Heavy cumulative rainfall      HIGH IMPACT
Increasing soil moisture       HIGH IMPACT
Steep slope                    MEDIUM IMPACT
Historical susceptibility      MEDIUM IMPACT
Recent seismic activity        LOW IMPACT
```

---

## Risk Trend Detection

Every zone stores its prediction history. The system calculates:

- `risk_change` — absolute change since last update
- `risk_velocity` — rate of change
- `risk_trend` — displayed as ↑ RAPIDLY INCREASING / → STABLE / ↓ DECREASING

Example progression for Zone 17:
```
6h ago →  31%
3h ago →  48%
1h ago →  64%
Now    →  78%   ↑ RAPIDLY INCREASING
```

---

## Live Mode vs Demo Mode

The app shows a prominent toggle at the top of every portal:

```
[ LIVE MODE ]  |  [ DEMO MODE ]
```

- **Live Mode** — connects to NASA IMERG, Copernicus, USGS, and the FastAPI backend. Data is labelled with its source and update time.
- **Demo Mode** — uses a simulation engine. Rainfall and risk values change when you click the demo buttons. All values are clearly labelled **DEMO DATA**.

### Demo Flow (≈ 2–3 minutes)

1. Open ResQNet → Zone 17 shows **Risk 31% (LOW)**
2. Open Risk Map → inspect Zone 17 (slope 38°, low rainfall)
3. Click **Simulate Heavy Rainfall** → risk rises to **64% (HIGH)**, map turns orange
4. Click **Continue Rainfall** → risk reaches **84% (CRITICAL)**, map turns red
5. System auto-generates **Critical Landslide Warning**
6. Click **Find Safe Route** → route avoids Zone 17, navigates to nearest shelter
7. Submit **SOS — Medical Help** from citizen portal
8. Switch to **Authority Dashboard** → see critical zone, new alert, SOS request, community report
9. Authority assigns a responder → citizen receives status update

---

## Geographic Zone System

The NER is divided into a grid of zones. Each zone carries:

```
zone_id, latitude, longitude
elevation, slope, aspect, curvature, land_cover
historical_landslide_density
rainfall_1h, rainfall_6h, rainfall_24h, rainfall_7day
soil_moisture
earthquake_count_7d, nearest_eq_distance
prediction (0–1), risk_level, risk_trend
last_updated
```

---

## Early Warning Logic

Alerts are triggered by combinations of conditions, not probability alone:

```
IF probability >= 0.75:                         → CRITICAL ALERT
IF probability >= 0.50 AND trend == INCREASING: → HIGH WARNING
IF probability >= 0.25 AND rainfall rising:     → ADVISORY / MONITOR
```

Thresholds are configurable in the authority settings.

---

## Key Features

**Citizen Portal**
- Risk summary with real-time zone probability, rainfall, soil moisture, slope
- Interactive risk map — zones coloured GREEN / YELLOW / ORANGE / RED
- Early warning cards with recommended actions
- Safe route finder — avoids critical zones and blocked roads
- SOS submission (trapped, medical, food, water, shelter, rescue, missing person)
- Community hazard reporting (landslide, rockfall, road crack, waterlogging, soil movement, road damage)
- Shelter finder with distance, capacity, and navigation
- All wrapped in an iPhone-style mobile frame

**Authority Dashboard**
- Live stats: critical zones, high-risk zones, active alerts, active SOS, community reports
- Full risk map with zone inspection (probability, trend, SHAP explanation)
- Alert management: create, send, update, cancel alerts by zone/district
- SOS queue with responder assignment and priority management
- Resource and inventory tracking
- Team / volunteer management
- Analytics and trend charts

**NGO Portal**
- Relief inventory management
- Incoming citizen request queue
- Deployment history

**Volunteer Portal**
- Assigned task queue
- Field map view

---

## Planned Backend (FastAPI)

```
GET  /api/risk/zones
GET  /api/risk/zones/{zone_id}
GET  /api/risk/trend/{zone_id}
POST /api/predict

GET  /api/alerts
POST /api/alerts
PUT  /api/alerts/{id}

GET  /api/sos
POST /api/sos
PUT  /api/sos/{id}

GET  /api/reports
POST /api/reports

GET  /api/shelters
GET  /api/resources
GET  /api/routes

GET  /api/dashboard/summary
```

Database models: `users`, `zones`, `environmental_data`, `predictions`, `risk_history`, `alerts`, `sos_requests`, `community_reports`, `shelters`, `resources`, `responders`, `assignments`

---

## What ResQNet Is Not

- It does **not** claim to predict the exact time and location of every landslide.
- It does **not** present simulated demo data as real-time sensor readings.
- It does **not** automatically retrain the ML model from a single community report.
- Earthquake activity is a **secondary** feature — rainfall and soil moisture are the primary drivers.

---

## SIH Problem Alignment

> "AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER) of India"

ResQNet addresses this by demonstrating the full chain from environmental monitoring through prediction, early warning, citizen guidance, and coordinated authority response — covering both the early warning and the disaster response sides of the problem.
