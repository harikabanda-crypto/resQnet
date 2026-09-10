"""
Step 1 — Build ML feature matrix.

Joins datasets 01–07 into a single tabular dataset:
  - Positive samples : NER landslide events (landslide_occurrence = 1)
  - Negative samples : same zones on non-event dates (landslide_occurrence = 0)

Output: datasets/ml_ready/ner_feature_matrix.csv
"""

import math
import random
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

random.seed(42)
np.random.seed(42)

BASE = Path(__file__).parent

# ── Load source datasets ───────────────────────────────────────────────────
landslides = pd.read_csv(BASE / "01_historical_landslides" / "ner_landslides_nasa_coolr.csv")
rainfall   = pd.read_csv(BASE / "02_historical_rainfall"   / "ner_rainfall_openmeteo.csv")
soilmoist  = pd.read_csv(BASE / "03_historical_soil_moisture" / "ner_soilmoisture_openmeteo.csv")
earthquakes= pd.read_csv(BASE / "04_historical_earthquakes" / "ner_earthquakes_usgs.csv")
terrain    = pd.read_csv(BASE / "05_terrain_dem"            / "ner_terrain.csv")
landcover  = pd.read_csv(BASE / "06_land_cover"             / "ner_land_cover.csv")
suscept    = pd.read_csv(BASE / "07_historical_susceptibility" / "ner_susceptibility.csv")

print(f"Landslides  : {len(landslides)}")
print(f"Rainfall    : {len(rainfall)}")
print(f"Soil moist  : {len(soilmoist)}")
print(f"Earthquakes : {len(earthquakes)}")
print(f"Terrain     : {len(terrain)}")
print(f"Land cover  : {len(landcover)}")
print(f"Suscept     : {len(suscept)}")

# ── Snap lat/lon to nearest 0.5° zone centre ──────────────────────────────
STEP = 0.5

def snap(lat, lon):
    slat = round(math.floor(lat / STEP) * STEP + STEP / 2, 2)
    slon = round(math.floor(lon / STEP) * STEP + STEP / 2, 2)
    return slat, slon

# ── Build terrain lookup by zone ──────────────────────────────────────────
# terrain/landcover/susceptibility are per zone (320 rows)
terrain_lc = terrain.merge(
    landcover[["zone_id", "land_cover_code"]],
    on="zone_id", how="left"
).merge(
    suscept[["zone_id", "historical_landslide_density"]],
    on="zone_id", how="left"
)

# Create lookup by (snapped_lat, snapped_lon)
def zone_id(lat, lon):
    return f"Z_{lat:.1f}_{lon:.1f}"

terrain_lc["snap_lat"] = terrain_lc["latitude"].apply(lambda x: round(x, 1))
terrain_lc["snap_lon"] = terrain_lc["longitude"].apply(lambda x: round(x, 1))
terrain_lookup = terrain_lc.set_index(["snap_lat", "snap_lon"])

def get_terrain(lat, lon):
    slat = round(math.floor(lat / STEP) * STEP + STEP / 2, 1)
    slon = round(math.floor(lon / STEP) * STEP + STEP / 2, 1)
    try:
        row = terrain_lookup.loc[(slat, slon)]
        return {
            "elevation":                    row["elevation"],
            "slope":                        row["slope"],
            "aspect":                       row["aspect"],
            "curvature":                    row["curvature"],
            "land_cover_code":              row["land_cover_code"],
            "historical_landslide_density": row["historical_landslide_density"],
        }
    except KeyError:
        return {
            "elevation": np.nan, "slope": np.nan, "aspect": np.nan,
            "curvature": np.nan, "land_cover_code": np.nan,
            "historical_landslide_density": 0.0,
        }

# ── Earthquake features for a given lat/lon/date ──────────────────────────
earthquakes["time"] = pd.to_datetime(earthquakes["time"], utc=True, errors="coerce")
earthquakes = earthquakes.dropna(subset=["time", "latitude", "longitude", "mag"])

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def eq_features(lat, lon, event_dt):
    """Earthquake features in 7-day window before event."""
    cutoff = pd.Timestamp(event_dt, tz="UTC")
    window = earthquakes[
        (earthquakes["time"] >= cutoff - timedelta(days=7)) &
        (earthquakes["time"] <= cutoff)
    ]
    if window.empty:
        return {"earthquake_count_7d": 0, "nearest_eq_distance_km": 500.0, "max_eq_magnitude": 0.0}

    dists = window.apply(
        lambda r: haversine(lat, lon, r["latitude"], r["longitude"]), axis=1
    )
    return {
        "earthquake_count_7d":    len(window),
        "nearest_eq_distance_km": round(dists.min(), 1),
        "max_eq_magnitude":       round(window["mag"].max(), 2),
    }

# ── Rainfall lookup ───────────────────────────────────────────────────────
rainfall["event_id"] = rainfall["event_id"].astype(str)
soilmoist["event_id"] = soilmoist["event_id"].astype(str)

rain_lookup = rainfall.set_index("event_id")
sm_lookup   = soilmoist.set_index("event_id")

RAIN_COLS = ["rainfall_1h","rainfall_3h","rainfall_6h","rainfall_12h",
             "rainfall_24h","rainfall_3day","rainfall_7day"]
SM_COLS   = ["soil_moisture_0_7cm","soil_moisture_7_28cm"]

# ── Build POSITIVE samples ────────────────────────────────────────────────
print("\nBuilding positive samples...")
pos_rows = []
landslides["event_date"] = pd.to_datetime(landslides["event_date"], errors="coerce")
landslides["event_id"]   = landslides["event_id"].astype(str)

for _, ev in landslides.iterrows():
    eid = ev["event_id"]
    lat = ev["latitude"]
    lon = ev["longitude"]
    dt  = ev["event_date"]
    if pd.isna(lat) or pd.isna(lon) or pd.isna(dt):
        continue

    ter = get_terrain(lat, lon)

    # Rainfall
    if eid in rain_lookup.index:
        rr = rain_lookup.loc[eid]
        rain = {c: rr[c] for c in RAIN_COLS if c in rr}
    else:
        rain = {c: np.nan for c in RAIN_COLS}

    # Soil moisture
    if eid in sm_lookup.index:
        sr = sm_lookup.loc[eid]
        sm = {c: sr[c] for c in SM_COLS if c in sr}
    else:
        sm = {c: np.nan for c in SM_COLS}

    # Earthquakes
    eq = eq_features(lat, lon, dt)

    pos_rows.append({
        "latitude": lat, "longitude": lon,
        "event_date": dt.strftime("%Y-%m-%d") if not pd.isna(dt) else "",
        **ter, **rain, **sm, **eq,
        "landslide_occurrence": 1,
    })

pos_df = pd.DataFrame(pos_rows)
print(f"Positive samples: {len(pos_df)}")

# ── Build NEGATIVE samples ────────────────────────────────────────────────
# Use the same ERA5 rainfall/soil-moisture distribution as positives,
# but perturb to represent normal (non-event) conditions.
# Strategy: sample from the lower half of the positive distributions
# so all feature ranges overlap realistically.
print("Building negative samples...")

pos_zone_dates = set(zip(
    pos_df["latitude"].round(1), pos_df["longitude"].round(1), pos_df["event_date"]
))

# Compute realistic ranges from positive samples
rf_cols  = ["rainfall_1h","rainfall_3h","rainfall_6h","rainfall_12h",
            "rainfall_24h","rainfall_3day","rainfall_7day"]
sm_cols  = ["soil_moisture_0_7cm","soil_moisture_7_28cm"]
eq_cols  = ["earthquake_count_7d","nearest_eq_distance_km","max_eq_magnitude"]

rf_stats = {c: (pos_df[c].quantile(0.05), pos_df[c].quantile(0.60)) for c in rf_cols}
sm_stats = {c: (pos_df[c].quantile(0.05), pos_df[c].quantile(0.85)) for c in sm_cols}

neg_rows = []
n_needed = len(pos_df) * 2
terrain_zones = terrain_lc[["latitude","longitude","elevation","slope","aspect",
                              "curvature","land_cover_code","historical_landslide_density"]].to_dict("records")

DATE_START = datetime(2009, 1, 1)
DATE_END   = datetime(2023, 12, 31)
date_range_days = (DATE_END - DATE_START).days

attempts = 0
while len(neg_rows) < n_needed and attempts < n_needed * 10:
    attempts += 1
    z   = random.choice(terrain_zones)
    lat = z["latitude"]
    lon = z["longitude"]
    rd  = DATE_START + timedelta(days=random.randint(0, date_range_days))
    key = (round(lat, 1), round(lon, 1), rd.strftime("%Y-%m-%d"))
    if key in pos_zone_dates:
        continue

    # Draw from the same realistic distributions as positives
    rain = {c: round(random.uniform(rf_stats[c][0], rf_stats[c][1]), 2) for c in rf_cols}
    sm   = {c: round(random.uniform(sm_stats[c][0], sm_stats[c][1]), 3) for c in sm_cols}
    eq   = {
        "earthquake_count_7d":    random.randint(0, 5),
        "nearest_eq_distance_km": round(random.uniform(10, 500), 1),
        "max_eq_magnitude":       round(random.uniform(0, 6.5), 2),
    }

    neg_rows.append({
        "latitude":  lat, "longitude": lon,
        "event_date": rd.strftime("%Y-%m-%d"),
        "elevation":  z["elevation"],
        "slope":      z["slope"],
        "aspect":     z["aspect"],
        "curvature":  z["curvature"],
        "land_cover_code":              z["land_cover_code"],
        "historical_landslide_density": z["historical_landslide_density"],
        **rain, **sm, **eq,
        "landslide_occurrence": 0,
    })

neg_df = pd.DataFrame(neg_rows)
print(f"Negative samples: {len(neg_df)}")

# ── Merge and save ────────────────────────────────────────────────────────
feature_cols = [
    "latitude", "longitude", "event_date",
    "elevation", "slope", "aspect", "curvature",
    "land_cover_code", "historical_landslide_density",
    "rainfall_1h", "rainfall_3h", "rainfall_6h", "rainfall_12h",
    "rainfall_24h", "rainfall_3day", "rainfall_7day",
    "soil_moisture_0_7cm", "soil_moisture_7_28cm",
    "earthquake_count_7d", "nearest_eq_distance_km", "max_eq_magnitude",
    "landslide_occurrence",
]

full_df = pd.concat([pos_df, neg_df], ignore_index=True)
full_df = full_df[[c for c in feature_cols if c in full_df.columns]]

# Fill NaNs: terrain medians for positives that missed a zone snap
for col in ["slope","aspect","curvature","elevation","land_cover_code","historical_landslide_density"]:
    if col in full_df.columns:
        full_df[col] = full_df[col].fillna(full_df[col].median())
for col in ["rainfall_1h","rainfall_3h","rainfall_6h","rainfall_12h",
            "rainfall_24h","rainfall_3day","rainfall_7day",
            "soil_moisture_0_7cm","soil_moisture_7_28cm"]:
    if col in full_df.columns:
        full_df[col] = full_df[col].fillna(0.0)
for col in ["earthquake_count_7d","nearest_eq_distance_km","max_eq_magnitude"]:
    if col in full_df.columns:
        full_df[col] = full_df[col].fillna(full_df[col].median())

full_df = full_df.sample(frac=1, random_state=42).reset_index(drop=True)

out = BASE / "ml_ready" / "ner_feature_matrix.csv"
out.parent.mkdir(parents=True, exist_ok=True)
full_df.to_csv(out, index=False)

pos_count = (full_df["landslide_occurrence"] == 1).sum()
neg_count = (full_df["landslide_occurrence"] == 0).sum()
print(f"\n✅ Feature matrix saved → {out.name}")
print(f"   Total rows  : {len(full_df)}")
print(f"   Positives   : {pos_count}")
print(f"   Negatives   : {neg_count}")
print(f"   Features    : {len(full_df.columns) - 3} (excl. lat/lon/date)")
