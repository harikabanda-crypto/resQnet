# ResQNet — Datasets

This folder contains all data used by ResQNet, organised by source and purpose.

## Folder Structure

```
datasets/
├── 01_historical_landslides/    # NASA COOLR / Global Landslide Catalog
├── 02_historical_rainfall/      # Open-Meteo ERA5 historical (fetched per landslide event)
├── 03_historical_soil_moisture/ # Open-Meteo ERA5 historical (fetched per landslide event)
├── 04_historical_earthquakes/   # USGS Earthquake Catalog
├── 05_terrain_dem/              # Open-Elevation DEM + derived slope/aspect/curvature
├── 06_land_cover/               # ESA WorldCover / ISRO Bhuvan (approximated by zone)
├── 07_historical_susceptibility/# Derived from dataset 01 (landslide density per zone)
├── 11_live_rainfall/            # Open-Meteo near-real-time (run fetch_live_weather.py)
├── 12_live_soil_moisture/       # Open-Meteo near-real-time (run fetch_live_weather.py)
├── 13_live_earthquakes/         # USGS feed (run fetch_live_earthquakes.py or update manually)
├── 14_community_reports/        # Citizen hazard reports (app-generated)
├── 15_user_photos/              # User photo metadata (app-generated)
├── 16_road_blockages/           # Road blockage reports (app-generated)
├── 17_waterlogging_reports/     # Waterlogging reports (app-generated)
├── 18_sos_requests/             # SOS / emergency requests (app-generated)
├── 19_authority_data/           # Official authority notices (app-generated)
├── 20_shelters/                 # Shelter info and capacity (app-managed)
├── 21_resources/                # Emergency resource inventory (app-managed)
├── 22_responders/               # Responder / volunteer data (app-managed)
├── raw/                         # Unprocessed downloads (original files)
├── processed/                   # Cleaned, zone-mapped CSVs
└── ml_ready/                    # Final feature matrix for ML training
```

## Data Status

| # | Dataset | File | Rows | Status | Source |
|---|---|---|---|---|---|
| 01 | Historical Landslides | `01_historical_landslides/ner_landslides_nasa_coolr.csv` | 664 | ✅ ready | NASA COOLR |
| 02 | Historical Rainfall | `02_historical_rainfall/ner_rainfall_openmeteo.csv` | 664 | ✅ ready | Open-Meteo ERA5 |
| 03 | Historical Soil Moisture | `03_historical_soil_moisture/ner_soilmoisture_openmeteo.csv` | 664 | ✅ ready | Open-Meteo ERA5 |
| 04 | Historical Earthquakes | `04_historical_earthquakes/ner_earthquakes_usgs.csv` | ~3000 | ✅ ready | USGS Catalog |
| 05 | Terrain (DEM/slope/aspect) | `05_terrain_dem/ner_terrain.csv` | 320 | ✅ ready | Open-Elevation + derived |
| 06 | Land Cover | `06_land_cover/ner_land_cover.csv` | 320 | ✅ ready | ESA WorldCover (approx) |
| 07 | Historical Susceptibility | `07_historical_susceptibility/ner_susceptibility.csv` | 320 | ✅ ready | Derived from 01 |
| 11 | Live Rainfall | `11_live_rainfall/ner_rainfall_live.csv` | 320 | ✅ ready | Open-Meteo NRT |
| 12 | Live Soil Moisture | `12_live_soil_moisture/ner_soilmoisture_live.csv` | 320 | ✅ ready | Open-Meteo NRT |
| 13 | Live Earthquakes | `13_live_earthquakes/ner_earthquakes_recent.csv` | live | ✅ ready | USGS feed |
| 14 | Community Reports | `14_community_reports/ner_community_reports.csv` | 80 | ✅ seeded | ResQNet users |
| 15 | User Photos | `15_user_photos/ner_user_photos.csv` | 60 | ✅ seeded | ResQNet users |
| 16 | Road Blockages | `16_road_blockages/ner_road_blockages.csv` | 50 | ✅ seeded | Crowdsource |
| 17 | Waterlogging Reports | `17_waterlogging_reports/ner_waterlogging_reports.csv` | 40 | ✅ seeded | Crowdsource |
| 18 | SOS Requests | `18_sos_requests/ner_sos_requests.csv` | 60 | ✅ seeded | ResQNet users |
| 19 | Authority Data | `19_authority_data/ner_authority_data.csv` | 40 | ✅ seeded | Authority portal |
| 20 | Shelters | `20_shelters/ner_shelters.csv` | 40 | ✅ seeded | Authority portal |
| 21 | Resources | `21_resources/ner_resources.csv` | 40 | ✅ seeded | Authority / NGO portal |
| 22 | Responders | `22_responders/ner_responders.csv` | 60 | ✅ seeded | Authority / volunteer portal |

## NER Bounding Box

The North Eastern Region of India:

```
Latitude:  22.0°N  →  29.5°N
Longitude: 88.0°E  →  97.5°E

States: Assam, Meghalaya, Manipur, Mizoram, Nagaland,
        Arunachal Pradesh, Tripura, Sikkim
```

All datasets are filtered to this bounding box. The zone grid uses 0.5° spacing → 320 zones.

## Scripts

| Script | What it does | When to run |
|---|---|---|
| `fetch_rainfall_soilmoisture.py` | Fetches historical ERA5 rainfall + soil moisture for each landslide event | Once (or when new events are added to dataset 01) |
| `build_terrain.py` | Fetches DEM elevations, derives slope/aspect/curvature, builds land cover + susceptibility | Once |
| `fetch_live_weather.py` | Fetches latest rainfall + soil moisture for all 320 NER zones | Every 1–6h (cron) |
| `build_app_datasets.py` | Generates seed CSVs for app-side datasets 14–22 | Once (demo/dev seed only) |

## Category Legend

- 🧠 **ML Training** (datasets 01–07): Static or historical. Used to train the XGBoost model offline.
- 🌐 **Live / Real-Time** (datasets 11–13): Updated on a schedule from external APIs. Feed current risk scores.
- 📱 **App-Generated** (datasets 14–22): Created by ResQNet users and authorities. Drive situational awareness and response coordination.
