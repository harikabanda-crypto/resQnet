"""
Fast fetch: rainfall + soil moisture for NER landslide events
Uses ThreadPoolExecutor for parallel requests (10 workers).
Open-Meteo ERA5 — free, no login.

Runtime: ~2-3 minutes for 664 events
"""

import csv
import time
import requests
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = Path(__file__).parent
LANDSLIDE_CSV = BASE / "01_historical_landslides" / "ner_landslides_nasa_coolr.csv"
RAINFALL_OUT  = BASE / "02_historical_rainfall"   / "ner_rainfall_openmeteo.csv"
SOILMOIST_OUT = BASE / "03_historical_soil_moisture" / "ner_soilmoisture_openmeteo.csv"

RAINFALL_OUT.parent.mkdir(parents=True, exist_ok=True)
SOILMOIST_OUT.parent.mkdir(parents=True, exist_ok=True)

API = "https://archive-api.open-meteo.com/v1/archive"

def fetch_weather(lat, lon, start_date, end_date, retries=3):
    params = {
        "latitude":   round(lat, 4),
        "longitude":  round(lon, 4),
        "start_date": start_date,
        "end_date":   end_date,
        "hourly":     "precipitation,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm",
        "models":     "era5",
        "timezone":   "Asia/Kolkata",
    }
    for attempt in range(retries):
        try:
            r = requests.get(API, params=params, timeout=30)
            if r.status_code == 200:
                return r.json()
            elif r.status_code == 429:
                time.sleep(2 ** (attempt + 1))
            else:
                time.sleep(1)
        except Exception:
            time.sleep(2)
    return None

def process_event(ev):
    event_dt   = ev["event_date"]
    start_date = (event_dt - timedelta(days=8)).strftime("%Y-%m-%d")
    end_date   = event_dt.strftime("%Y-%m-%d")

    data = fetch_weather(ev["latitude"], ev["longitude"], start_date, end_date)
    if data is None or "hourly" not in data:
        return None, None

    h = data["hourly"]
    precip  = [float(x) if x is not None else 0.0 for x in h.get("precipitation", [])]
    sm_0_7  = h.get("soil_moisture_0_to_7cm", [])
    sm_7_28 = h.get("soil_moisture_7_to_28cm", [])
    times   = pd.to_datetime(h["time"])

    df = pd.DataFrame({
        "time":         times,
        "precipitation": precip,
        "sm_0_7":       sm_0_7,
        "sm_7_28":      sm_7_28,
    })

    end_dt = event_dt.replace(minute=0, second=0, microsecond=0)

    windows = {
        "rainfall_1h":    1,
        "rainfall_3h":    3,
        "rainfall_6h":    6,
        "rainfall_12h":  12,
        "rainfall_24h":  24,
        "rainfall_3day": 72,
        "rainfall_7day": 168,
    }
    rain_feats = {}
    for col, hours in windows.items():
        start = end_dt - timedelta(hours=hours - 1)
        mask = (df["time"] >= start) & (df["time"] <= end_dt)
        rain_feats[col] = round(df.loc[mask, "precipitation"].sum(), 2)

    sm_row = df[df["time"] == end_dt]
    if sm_row.empty:
        sm_row = df.iloc[[-1]]

    sm0 = sm_row["sm_0_7"].values[0]
    sm7 = sm_row["sm_7_28"].values[0]
    sm0 = float(sm0) if sm0 is not None else None
    sm7 = float(sm7) if sm7 is not None else None

    rf_row = {
        "event_id":             ev["event_id"],
        "latitude":             ev["latitude"],
        "longitude":            ev["longitude"],
        "event_date":           event_dt.strftime("%Y-%m-%d"),
        "trigger":              ev["trigger"],
        "category":             ev["category"],
        "landslide_occurrence": 1,
        **rain_feats,
    }

    sm_row_out = {
        "event_id":             ev["event_id"],
        "latitude":             ev["latitude"],
        "longitude":            ev["longitude"],
        "event_date":           event_dt.strftime("%Y-%m-%d"),
        "soil_moisture_0_7cm":  sm0,
        "soil_moisture_7_28cm": sm7,
        "landslide_occurrence": 1,
    }

    return rf_row, sm_row_out

# ── Load events ────────────────────────────────────────────────────────────
events = []
with open(LANDSLIDE_CSV, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        try:
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            dt  = datetime.strptime(row["event_date"].strip(), "%m/%d/%Y %I:%M:%S %p")
            events.append({
                "event_id":   row["event_id"],
                "latitude":   lat,
                "longitude":  lon,
                "event_date": dt,
                "trigger":    row.get("landslide_trigger", ""),
                "category":   row.get("landslide_category", ""),
            })
        except Exception:
            continue

print(f"Loaded {len(events)} NER landslide events")
print(f"Fetching from Open-Meteo ERA5 (10 parallel workers)...")

# ── Parallel fetch ─────────────────────────────────────────────────────────
rainfall_rows  = []
soilmoist_rows = []
errors = 0
done   = 0

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(process_event, ev): ev for ev in events}
    for future in as_completed(futures):
        done += 1
        rf_row, sm_row = future.result()
        if rf_row is None:
            errors += 1
        else:
            rainfall_rows.append(rf_row)
            soilmoist_rows.append(sm_row)
        if done % 50 == 0:
            print(f"  {done}/{len(events)} done | errors: {errors}")

# ── Save ───────────────────────────────────────────────────────────────────
rf_df = pd.DataFrame(rainfall_rows)
rf_df.to_csv(RAINFALL_OUT, index=False)

sm_df = pd.DataFrame(soilmoist_rows)
sm_df.to_csv(SOILMOIST_OUT, index=False)

print(f"\n✅ Done.")
print(f"   Rainfall rows:      {len(rf_df)}  → {RAINFALL_OUT.name}")
print(f"   Soil moisture rows: {len(sm_df)}  → {SOILMOIST_OUT.name}")
print(f"   Errors:             {errors}")
