from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from .ml_engine import get_ml_engine
from .models import EnvironmentalData, RiskHistory, Zone

logger = logging.getLogger("resqnet.sync")


def _find_dataset_file(filename: str, subfolder: str = "") -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "datasets" / subfolder / filename,
        Path(__file__).resolve().parent.parent.parent / "datasets" / filename,
        Path.cwd() / "datasets" / subfolder / filename,
        Path.cwd().parent / "datasets" / subfolder / filename,
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]


def sync_live_weather_data(db: Session, use_remote_api: bool = False) -> dict[str, Any]:
    """Synchronize live rainfall and soil moisture feeds across all NER zones.

    Updates Zone risk scores and status using the trained XGBoost ML engine,
    and appends time-series records to EnvironmentalData and RiskHistory.
    """
    rain_path = _find_dataset_file("ner_rainfall_live.csv", "11_live_rainfall")
    sm_path = _find_dataset_file("ner_soilmoisture_live.csv", "12_live_soil_moisture")

    if not rain_path.exists() or not sm_path.exists():
        return {
            "status": "warning",
            "message": "Live dataset files not found on disk",
            "zones_updated": 0,
        }

    rain_df = pd.read_csv(rain_path)
    sm_df = pd.read_csv(sm_path)

    # Merge rainfall and soil moisture data
    merged = rain_df.merge(
        sm_df[["zone_id", "soil_moisture_0_7cm", "soil_moisture_7_28cm"]],
        on="zone_id",
        how="left",
    )

    engine = get_ml_engine()
    now_utc = datetime.now(timezone.utc)
    updated_count = 0
    risk_counts = {"critical": 0, "high": 0, "moderate": 0, "safe": 0}

    # Fetch existing zones from database
    zones = {z.id: z for z in db.scalars(select(Zone)).all()}

    for _, row in merged.iterrows():
        zid = str(row["zone_id"])
        zone = zones.get(zid)
        if not zone:
            continue

        r1h = float(row.get("rainfall_1h", 0.0))
        r24h = float(row.get("rainfall_24h", 0.0))
        r7d = float(row.get("rainfall_7day", 0.0))
        sm0 = float(row.get("soil_moisture_0_7cm", 0.25))

        # Run ML prediction with live inputs
        overrides = {
            "rainfall_1h": r1h,
            "rainfall_24h": r24h,
            "rainfall_7day": r7d,
            "soil_moisture_0_7cm": sm0,
            "rainfall_mm_hr": r1h,
            "soil_moisture": round(sm0 * 100.0, 1),
        }
        pred = engine.predict(zid, overrides=overrides)

        # Update Zone entity
        zone.risk = pred.risk
        zone.risk_score = pred.score
        zone.rainfall = f"{r24h:g} mm/24h" if r24h > 0 else f"{r1h:g} mm/hr"
        zone.water_level = "High" if r24h >= 60.0 else "Moderate" if r24h >= 25.0 else "Normal"

        if pred.risk == "critical":
            zone.recommendation = "CRITICAL WARNING: Imminent landslide danger. Evacuate vulnerable slopes."
        elif pred.risk == "high":
            zone.recommendation = "HIGH RISK: Restrict transit through hilly segments. Pre-position response teams."
        elif pred.risk == "moderate":
            zone.recommendation = "ADVISORY: Elevated soil saturation. Monitor local slope indicators."
        else:
            zone.recommendation = "LOW RISK: Regular seasonal monitoring."

        risk_counts[pred.risk] = risk_counts.get(pred.risk, 0) + 1
        updated_count += 1

        # Record environmental observation
        env_obs = EnvironmentalData(
            zone_id=zid,
            rainfall_mm_hr=r1h,
            soil_moisture=round(sm0 * 100.0, 1),
            water_level=60.0 if r24h >= 60.0 else 25.0 if r24h >= 25.0 else 10.0,
            recorded_at=now_utc,
        )
        db.add(env_obs)

        # Record risk history point
        risk_pt = RiskHistory(
            zone_id=zid,
            risk=pred.risk,
            score=pred.score,
            recorded_at=now_utc,
        )
        db.add(risk_pt)

    db.commit()

    return {
        "status": "success",
        "zones_updated": updated_count,
        "risk_breakdown": risk_counts,
        "synced_at": now_utc.isoformat(),
        "source": "Open-Meteo Near-Real-Time Stream",
    }
