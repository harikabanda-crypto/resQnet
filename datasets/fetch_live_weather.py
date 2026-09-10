"""
Fetch live rainfall and soil moisture for NER zones from Open-Meteo.
Covers the NER bounding box at 0.5° grid spacing.
Saves to 11_live_rainfall/ and 12_live_soil_moisture/.

Run this script on a schedule (every 1–6h) to keep live data current.
"""

import time
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = Path(__file__).parent
OUT_RAIN = BASE / "11_live_rainfall"      / "ner_rainfall_live.csv"
OUT_SM   = BASE / "12_live_soil_moisture" / "ner_soilmoisture_live.csv"

for p in [OUT_RAIN, OUT_SM]:
    p.parent.mkdir(parents=True, exist_ok=True)

LAT_MIN, LAT_MAX = 22.0, 29.5
LON_MIN, LON_MAX = 88.0, 97.5
STEP = 0.5

lats = np.arange(LAT_MIN, LAT_MAX + STEP, STEP)
lons = np.arange(LON_MIN, LON_MAX + STEP, STEP)

zones = [{"zone_id": f"Z_{lat:.1f}_{lon:.1f}",
          "latitude": round(float(lat), 4),
          "longitude": round(float(lon), 4)}
         for lat in lats for lon in lons]

print(f"Zones: {len(zones)}")

NOW     = datetime.utcnow()
TODAY   = NOW.strftime("%Y-%m-%d")
WEEK_AGO = (NOW - timedelta(days=8)).strftime("%Y-%m-%d")

API = "https://api.open-meteo.com/v1/forecast"

def fetch_zone(zone):
    params = {
        "latitude":   zone["latitude"],
        "longitude":  zone["longitude"],
        "hourly":     "precipitation,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm",
        "past_days":  7,
        "forecast_days": 1,
        "timezone":   "Asia/Kolkata",
    }
    for attempt in range(3):
        try:
            r = requests.get(API, params=params, timeout=20)
            if r.status_code == 200:
                return r.json()
            time.sleep(1.5 ** attempt)
        except Exception:
            time.sleep(2)
    return None

def aggregate_rainfall(precip, times, now_dt):
    """Sum precipitation over rolling windows ending at now."""
    df = pd.DataFrame({"time": pd.to_datetime(times), "prec": precip})
    df["prec"] = df["prec"].fillna(0)
    windows = {"rainfall_30min": 0.5, "rainfall_1h": 1, "rainfall_3h": 3,
               "rainfall_6h": 6, "rainfall_12h": 12, "rainfall_24h": 24,
               "rainfall_3day": 72, "rainfall_7day": 168}
    result = {}
    for col, hours in windows.items():
        start = now_dt - timedelta(hours=hours)
        mask  = (df["time"] >= start) & (df["time"] <= now_dt)
        result[col] = round(df.loc[mask, "prec"].sum(), 2)
    return result

rain_rows = []
sm_rows   = []
errors    = 0
done      = 0

print("Fetching live weather from Open-Meteo...")
with ThreadPoolExecutor(max_workers=12) as ex:
    futures = {ex.submit(fetch_zone, z): z for z in zones}
    for fut in as_completed(futures):
        z = futures[fut]
        done += 1
        data = fut.result()
        if data is None or "hourly" not in data:
            errors += 1
            continue

        h = data["hourly"]
        times  = h["time"]
        precip = [float(x) if x is not None else 0.0 for x in h.get("precipitation", [])]
        sm07   = h.get("soil_moisture_0_to_7cm", [])
        sm728  = h.get("soil_moisture_7_to_28cm", [])

        now_dt = pd.to_datetime(times[-1])
        rain_feats = aggregate_rainfall(precip, times, now_dt)

        rain_rows.append({
            "zone_id":   z["zone_id"],
            "latitude":  z["latitude"],
            "longitude": z["longitude"],
            "fetched_at": NOW.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "data_source": "Open-Meteo forecast (ERA5-seamless)",
            **rain_feats,
        })

        sm0  = sm07[-1]  if sm07  else None
        sm7  = sm728[-1] if sm728 else None
        sm_rows.append({
            "zone_id":              z["zone_id"],
            "latitude":             z["latitude"],
            "longitude":            z["longitude"],
            "soil_moisture_0_7cm":  float(sm0)  if sm0  is not None else None,
            "soil_moisture_7_28cm": float(sm7)  if sm7  is not None else None,
            "fetched_at":           NOW.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "data_source":          "Open-Meteo forecast (ERA5-seamless)",
        })

        if done % 60 == 0:
            print(f"  {done}/{len(zones)} | errors: {errors}")

rain_df = pd.DataFrame(rain_rows)
rain_df.to_csv(OUT_RAIN, index=False)

sm_df = pd.DataFrame(sm_rows)
sm_df.to_csv(OUT_SM, index=False)

print(f"\n✅ Live Rainfall:      {len(rain_df)} rows → {OUT_RAIN.name}")
print(f"✅ Live Soil Moisture: {len(sm_df)} rows  → {OUT_SM.name}")
print(f"   Errors: {errors}")
print(f"   Fetched at: {NOW.strftime('%Y-%m-%dT%H:%M:%SZ')} UTC")
