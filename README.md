# ResQNet — AI-Powered Landslide Early Warning & Disaster Response Network

> **Smart India Hackathon (SIH)**: AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER) of India.

ResQNet is an end-to-end, production-grade disaster mitigation platform that couples satellite-derived hydrology and terrain physics with **XGBoost machine learning**, **exact Tree SHAP explainability**, **dynamic hazard-aware evacuation routing**, **full-duplex WebSockets**, and an **offline-first Progressive Web App (PWA)** with an **IndexedDB emergency distress outbox**.

---

## Key Highlights

- 🧠 **Native XGBoost ML Engine**: Predicts calibrated landslide probability across 18 terrain, hydrological, and seismic parameters.
- 🔍 **Tree SHAP Attributions**: Exact mathematical feature contributions power an interactive diverging waterfall visualization and a real-time "What-If" scenario simulator.
- 🗺️ **320 Real NER Spatial Grid Zones**: Spanning Meghalaya, Assam, Sikkim, Arunachal Pradesh, Nagaland, Manipur, Mizoram, and Tripura with real GPS coordinates, slope, elevation, and land cover.
- 🛣️ **Hazard-Aware Safe Evacuation Routing**: Dijkstra routing engine dynamically routes evacuees around active landslide blockages and critical slope zones to nearest available shelters.
- ⚡ **Full-Duplex Multi-Channel WebSockets**: Broadcasts instant risk alerts, distress SOS events, and route recalculations to authorities and citizens in real time.
- 📱 **Offline-First PWA & IndexedDB Outbox**: Citizen mobile app caches critical shelters and emergency hotlines (NDRF: 1078, SDMA: 1070, Emergency: 112). SOS distress requests created without cellular signal are queued in IndexedDB and synchronized immediately upon reconnection.
- 🧪 **28/28 Automated Tests Passing**: Complete E2E integration test suite validating ML inference, REST endpoints, WebSocket pub/sub, and route planning.

---

## Quick Start

### Option 1: Turnkey One-Command Runner (Recommended for Local Dev & Demos)

ResQNet includes a single automated script that verifies dependencies, starts the FastAPI backend, runs database seeding, boots the Vite frontend, and streams live health telemetry:

```bash
chmod +x run_resqnet.sh
./run_resqnet.sh
```

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Real-Time WebSocket Feed**: `ws://localhost:8000/ws`

Press `Ctrl+C` to cleanly shut down both processes.

---

### Option 2: Docker & Docker Compose (Production Deployment)

Run the entire containerized stack with a single command:

```bash
docker compose up --build
```

- **Frontend (Nginx Reverse Proxy)**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

---

### Option 3: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Accounts & Roles

All demo accounts come pre-seeded with password: **`demo123`**

| Role | Email | Interface | Capabilities |
|---|---|---|---|
| **Authority** | `shillong.hq@resqnet.ner` | Desktop Dashboard (`/authority`) | Regional GIS risk overview, Tree SHAP AI diagnostics, "What-If" simulator, alert dispatch, SOS triage, responder deployment |
| **Citizen** | `aiban.lang@resqnet.ner` | Mobile PWA View (`/citizen`) | High-risk zone warnings, safe evacuation navigation, 1-tap SOS distress outbox, offline life-safety hub |
| **Responder** | `ndrf.bravo1@resqnet.ner` | Field View (`/volunteer`) | Real-time dispatched task queue, GPS navigation, mission status updates |
| **NGO Relief** | `assam.aid@resqnet.ner` | Relief Portal (`/ngo`) | Camp food/medical inventory management, incoming relief requests, delivery tracking |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CITIZEN & AUTHORITY UI                          │
│  React 18 + Vite + Tailwind CSS + Framer Motion + Recharts + Leaflet GIS   │
│  Offline PWA (Service Worker) + IndexedDB Distress Outbox (Auto-Sync)       │
└───────────────────────┬───────────────────────────────┬─────────────────────┘
                        │ REST API (Fetch / Axios)       │ WebSockets (/ws/*)
                        ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND ENGINE                            │
│  • Auth & RBAC (Bearer JWT)           • Multi-Channel WebSocket Manager     │
│  • Real-Time Hazard Evaluator        • Dijkstra Hazard-Aware Routing Engine │
│  • Weather Sync Engine (IMERG / USGS) • SQLite / PostgreSQL ORM Database   │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MACHINE LEARNING INFERENCE PIPELINE                    │
│  • Pretrained XGBoost Model (`resqnet_model.json`)                          │
│  • Exact Tree SHAP Attributions (`pred_contribs=True`)                      │
│  • 18 Topographic, Hydrological & Seismic Features                          │
│  • 320 Spatial Grid Zones across 8 North Eastern States                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implemented Technical Features

### 1. XGBoost ML Risk Inference & Tree SHAP Explainability
- Evaluates 18 calibrated parameters: `elevation`, `slope`, `aspect`, `curvature`, `land_cover_code`, `historical_landslide_density`, rainfall accumulations (`1h`, `3h`, `6h`, `12h`, `24h`, `3day`, `7day`), soil moisture (`0-7cm`, `7-28cm`), and seismic factors (`earthquake_count_7d`, `nearest_eq_distance_km`, `max_eq_magnitude`).
- Generates exact local feature attributions using native XGBoost Tree SHAP (`booster.predict(dmatrix, pred_contribs=True)`).
- Visualized in the **Authority AI Panel** with an interactive **Diverging Waterfall Chart** and a **"What-If" Scenario Simulator** allowing emergency managers to test hypothetical rainfall spikes or earthquake shocks.

### 2. Hazard-Aware Safe Evacuation Routing
- Graph-based Dijkstra routing engine avoiding impassable road blockages and high-risk slope hazard zones.
- Provides turn-by-turn path waypoints, total safe distance (km), estimated evacuation duration (mins), hazard clearance score, and nearest available shelter destination.
- Visualized directly on real OpenStreetMap Leaflet layers with live polyline rendering.

### 3. Full-Duplex WebSockets
- `/ws` — Global event bus.
- `/ws/alerts` — Real-time hazard notifications and early warnings.
- `/ws/sos` — Instant citizen distress dispatch and status tracking.
- `/ws/routes` — Live route recalculations when blockages occur.

### 4. Offline-First PWA & IndexedDB Distress Outbox
- Fully functional Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).
- `ResQNetOfflineDB` IndexedDB store saves distress reports locally if the user is cut off from internet connectivity in remote mountain regions.
- Automatically flushes and synchronizes the outbox once network connectivity is restored.
- **Offline Life-Safety Hub**: Direct 1-tap phone dialers to NDRF (`1078`), State Disaster Management (`1070`), National Emergency (`112`), and District Emergency Operations (`1077`), paired with essential landslide survival protocols.

---

## Automated Test Suite

ResQNet includes a comprehensive suite of 28 automated integration and unit tests:

```bash
./backend/.venv/bin/pytest backend/tests -v
```

### Verified Test Matrix:
- `backend/tests/test_api.py`: REST CRUD operations, authentication, zone predictions, shelters, and resources.
- `backend/tests/test_e2e_lifecycle.py`: Complete disaster lifecycle (hazard rise → alert broadcast → citizen SOS → responder assignment).
- `backend/tests/test_ml.py`: Model loading, Tree SHAP attributions, calibrated hazard scoring, and feature boundary handling.
- `backend/tests/test_ner_sync.py`: Ingestion of 320 real NER grid zones and weather synchronization.
- `backend/tests/test_routing.py`: Dijkstra obstacle avoidance, impassable blockage bypass, and shelter routing.
- `backend/tests/test_websockets.py`: Concurrent WebSocket connections, channel pub/sub, and heartbeat pings.

---

## Project Structure

```
resQnet/
├── backend/
│   ├── app/
│   │   ├── routers/          # FastAPI API & Auth endpoints
│   │   ├── config.py         # App settings & CORS configuration
│   │   ├── database.py       # SQLAlchemy session & SQLite engine
│   │   ├── main.py           # Lifespan, CORS, router mounting
│   │   ├── ml_engine.py      # XGBoost inference & Tree SHAP explainability
│   │   ├── models.py         # 12 relational ORM models
│   │   ├── routing_engine.py # Dijkstra hazard-aware evacuation router
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── security.py       # Password hashing & JWT tokens
│   │   ├── seed.py           # Auto-seeding 320 NER zones, shelters, users
│   │   ├── weather_sync.py   # IMERG & USGS synchronization
│   │   └── websockets.py     # Multi-channel WebSocket connection manager
│   ├── tests/                # 28 passing pytest integration tests
│   ├── Dockerfile            # Containerized backend (Python 3.11, OpenMP)
│   └── requirements.txt      # Dependencies
├── frontend/
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   └── sw.js             # Service Worker caching & offline shell
│   ├── src/
│   │   ├── components/
│   │   │   ├── InteractiveMap.jsx       # Leaflet OpenStreetMap GIS layer
│   │   │   ├── OfflineEmergencyHub.jsx  # 1-tap dialers & survival guide
│   │   │   ├── ScenarioSimulator.jsx    # "What-If" parameter perturbation
│   │   │   ├── ShapWaterfallChart.jsx   # Tree SHAP diverging bar visualizer
│   │   │   └── ...                      # UI cards, badges, mobile phone frame
│   │   ├── contexts/
│   │   │   └── AppContext.jsx           # Global state, live REST sync, WebSocket bus
│   │   ├── pages/                       # Authority, Citizen, NGO, Responder views
│   │   ├── services/
│   │   │   ├── api.js                   # Axios REST client with JWT interceptor
│   │   │   ├── offlineStorage.js        # IndexedDB distress outbox & auto-sync
│   │   │   └── websocket.js             # WebSocket connection manager
│   │   ├── App.jsx
│   │   └── index.css                    # Tailwind CSS & Leaflet styles
│   ├── Dockerfile            # Multi-stage Node builder + Nginx image
│   └── nginx.conf            # Reverse proxy for API, WS, and SPA fallback
├── datasets/                 # Real NER zone coordinates, ML model, features
├── docker-compose.yml        # Turnkey containerized composition
├── run_resqnet.sh            # One-command local runner script
└── README.md
```

---

## SIH Problem Alignment

> **"AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER) of India"**

ResQNet addresses both sides of the challenge:
1. **Early Warning**: Uses actual topography, geotechnical parameters, and near-real-time precipitation data to estimate rapidly evolving landslide hazard before ground failure occurs.
2. **Disaster Response**: Closes the loop from warning to action by computing hazard-free evacuation corridors, providing offline SOS life-safety capabilities in disconnected mountain areas, and enabling centralized authority and NGO coordination.
