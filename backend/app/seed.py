from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Alert, EnvironmentalData, Resource, Responder, RiskHistory, RoadBlockage, Shelter, User, Zone
from .security import hash_password

logger = logging.getLogger("resqnet.seed")


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


def get_ner_region_name(lat: float, lon: float) -> str:
    """Classify coordinates into recognizable North Eastern administrative regions."""
    if 27.0 <= lat <= 28.5 and 88.0 <= lon <= 89.0:
        return "Sikkim – Himalaya Slopes"
    if 26.5 <= lat <= 27.2 and 88.0 <= lon <= 89.8:
        return "Darjeeling / Dooars Foothills"
    if 27.0 <= lat <= 29.5 and 91.5 <= lon <= 97.5:
        return "Arunachal Pradesh – Alpine Highlands"
    if 25.0 <= lat <= 26.2 and 89.8 <= lon <= 92.8:
        return "Meghalaya – Khasi & Garo Plateau"
    if 25.2 <= lat <= 27.2 and 93.3 <= lon <= 95.5:
        return "Nagaland – Naga Hills Ridge"
    if 23.8 <= lat <= 25.8 and 93.0 <= lon <= 94.8:
        return "Manipur – Valley & Eastern Ridge"
    if 22.0 <= lat <= 24.5 and 92.2 <= lon <= 93.5:
        return "Mizoram – Lushai Hills"
    if 23.0 <= lat <= 24.5 and 91.1 <= lon <= 92.4:
        return "Tripura – Undulating Lowlands"
    if 24.3 <= lat <= 25.2 and 92.2 <= lon <= 93.2:
        return "Assam – Barak Valley Basin"
    if 25.8 <= lat <= 27.0 and 90.0 <= lon <= 93.5:
        return "Assam – Brahmaputra Central Basin"
    if 26.5 <= lat <= 28.0 and 93.5 <= lon <= 96.0:
        return "Assam – Upper Valley Plains"
    if lat < 24.0:
        return "Southern NER Border Corridor"
    return "North Eastern Region Corridor"


def seed_database(db: Session) -> None:
    """Seed users, zones, shelters, responders, resources, and live records."""
    # 1. Users
    default_users = [
        ("Demo Citizen", "citizen@resqnet.demo", "citizen"),
        ("Demo Authority", "authority@resqnet.demo", "authority"),
        ("Demo NGO", "ngo@resqnet.demo", "ngo"),
        ("Demo Volunteer", "volunteer@resqnet.demo", "volunteer"),
        ("Aiban Langstieh", "aiban.lang@resqnet.ner", "citizen"),
        ("Shillong NER HQ", "shillong.hq@resqnet.ner", "authority"),
        ("Assam Relief Aid", "assam.aid@resqnet.ner", "ngo"),
        ("NDRF Unit Bravo-1", "ndrf.bravo1@resqnet.ner", "volunteer"),
    ]
    for name, email, role in default_users:
        if not db.scalar(select(User).where(User.email == email.lower())):
            db.add(User(name=name, email=email.lower(), password_hash=hash_password("demo123"), role=role))
    db.commit()

    # 2. Demo Prototype Zones (A17–F01)
    demo_zones = [
        Zone(id="A17", name="Zone A17 – Kukatpally", risk="critical", risk_score=97, population=2430, sos=87, rainfall="82 mm/hr", water_level="Rising", lat=17.49, lng=78.39, recommendation="Evacuate vulnerable residents to Shelter S04."),
        Zone(id="B05", name="Zone B05 – Miyapur", risk="high", risk_score=76, population=1820, sos=43, rainfall="65 mm/hr", water_level="High", lat=17.50, lng=78.36, recommendation="Issue evacuation advisory. Monitor road conditions."),
        Zone(id="C12", name="Zone C12 – Bachupally", risk="high", risk_score=68, population=1340, sos=31, rainfall="54 mm/hr", water_level="Moderate", lat=17.52, lng=78.38, recommendation="Pre-position rescue teams. Alert citizens."),
        Zone(id="D03", name="Zone D03 – Kondapur", risk="moderate", risk_score=38, population=980, sos=12, rainfall="38 mm/hr", water_level="Low", lat=17.46, lng=78.35, recommendation="Monitor situation. Send preparedness alerts."),
        Zone(id="E09", name="Zone E09 – Gachibowli", risk="safe", risk_score=12, population=2100, sos=2, rainfall="12 mm/hr", water_level="Normal", lat=17.44, lng=78.34, recommendation="No immediate action required."),
        Zone(id="F01", name="Zone F01 – Madhapur", risk="safe", risk_score=8, population=3200, sos=0, rainfall="8 mm/hr", water_level="Normal", lat=17.45, lng=78.38, recommendation="No immediate action required."),
    ]
    for dz in demo_zones:
        if not db.get(Zone, dz.id):
            db.add(dz)
    db.commit()

    # 3. Real 320 NER Grid Zones
    ner_zones_file = _find_dataset_file("ner_zone_predictions.csv", "processed")
    if ner_zones_file.exists():
        existing_ids = set(db.scalars(select(Zone.id)).all())
        df_zones = pd.read_csv(ner_zones_file)
        new_zones: list[Zone] = []

        for _, r in df_zones.iterrows():
            zid = str(r["zone_id"])
            if zid in existing_ids:
                continue

            lat = float(r["latitude"])
            lon = float(r["longitude"])
            elev = float(r.get("elevation", 500.0))
            r24 = float(r.get("rainfall_24h", 0.0))
            risk_pct = float(r.get("risk_pct", 20.0))
            raw_risk = str(r.get("risk_level", "LOW")).lower()
            risk_tier = "critical" if risk_pct >= 75.0 else "high" if risk_pct >= 50.0 else "moderate" if risk_pct >= 25.0 else "safe"
            reg_name = get_ner_region_name(lat, lon)

            if risk_tier == "critical":
                rec = "CRITICAL: Imminent landslide risk on active slopes. Issue evacuation orders."
            elif risk_tier == "high":
                rec = "HIGH: Pre-position rescue units and restrict vulnerable transport corridors."
            elif risk_tier == "moderate":
                rec = "MODERATE: Soil saturation elevated. Continuous weather monitoring recommended."
            else:
                rec = "LOW: Seasonal baseline conditions. No immediate threat."

            pop = int(max(1500, int(28000 - elev * 6)))

            z = Zone(
                id=zid,
                name=f"{reg_name} [{zid}]",
                risk=risk_tier,
                risk_score=risk_pct,
                population=pop,
                sos=0,
                rainfall=f"{r24:g} mm/24h",
                water_level="High" if r24 >= 50.0 else "Moderate" if r24 >= 20.0 else "Normal",
                lat=lat,
                lng=lon,
                recommendation=rec,
            )
            new_zones.append(z)

        if new_zones:
            db.add_all(new_zones)
            db.commit()

    # 4. Shelters (Demo + Real NER Shelters)
    if db.scalar(select(func.count(Shelter.id))) < 10:
        shelters_file = _find_dataset_file("ner_shelters.csv", "20_shelters")
        if shelters_file.exists():
            df_sh = pd.read_csv(shelters_file)
            for _, r in df_sh.iterrows():
                sid = str(r["shelter_id"])
                if not db.get(Shelter, sid):
                    status_raw = str(r.get("status", "active"))
                    db.add(Shelter(
                        id=sid,
                        name=str(r["name"]),
                        location=str(r["location_name"]),
                        capacity=int(r["capacity"]),
                        occupied=int(r["current_occupancy"]),
                        lat=float(r["latitude"]),
                        lng=float(r["longitude"]),
                        status="warning" if status_raw == "full" else "safe",
                    ))
            db.commit()

    # 5. Resources (Demo + Real NER Resources)
    if db.scalar(select(func.count(Resource.id))) < 10:
        res_file = _find_dataset_file("ner_resources.csv", "21_resources")
        if res_file.exists():
            df_res = pd.read_csv(res_file)
            for _, r in df_res.iterrows():
                rid = str(r["resource_id"])
                if not db.get(Resource, rid):
                    db.add(Resource(
                        id=rid,
                        type=str(r["resource_type"]).replace("_", " ").title(),
                        available=int(r["quantity_available"]),
                        demand=int(r["quantity_deployed"]),
                        unit=str(r["unit"]),
                        provider=str(r["owned_by"]).replace("_", " "),
                        location=str(r["location_name"]),
                    ))
            db.commit()

    # 6. Responders (Demo + Real NER Responders)
    if db.scalar(select(func.count(Responder.id))) < 10:
        resp_file = _find_dataset_file("ner_responders.csv", "22_responders")
        if resp_file.exists():
            df_resp = pd.read_csv(resp_file)
            for _, r in df_resp.iterrows():
                rid = str(r["responder_id"])
                if not db.get(Responder, rid):
                    team_name = str(r["team"]).replace("_", " ")
                    role_name = str(r["role"]).replace("_", " ").title()
                    status_raw = str(r.get("availability", "available"))
                    st = "busy" if status_raw == "on_mission" else "available" if status_raw == "available" else "standby"
                    db.add(Responder(
                        id=rid,
                        name=f"{team_name} – {role_name}",
                        type="rescue" if "rescue" in str(r.get("capabilities", "")) else "volunteer",
                        location=str(r["location_name"]),
                        status=st,
                        members=6 if "team" in team_name.lower() or "sdrf" in team_name.lower() else 1,
                    ))
            db.commit()

    # 7. Alerts
    if db.scalar(select(func.count(Alert.id))) < 5:
        alerts_file = _find_dataset_file("ner_authority_data.csv", "19_authority_data")
        if alerts_file.exists():
            df_al = pd.read_csv(alerts_file)
            for _, r in df_al.head(10).iterrows():
                sev_raw = str(r.get("severity", "moderate")).lower()
                sev = "critical" if sev_raw == "critical" else "high" if sev_raw in ["high", "moderate"] else "info"
                db.add(Alert(
                    message=f"[{r['location_name']}] {r['title']}: {r['description']}",
                    severity=sev,
                    zone_id=str(r.get("affected_zones", "")),
                    status="active" if str(r.get("status", "active")) == "active" else "resolved",
                ))
            db.commit()

    # 8. Road Blockages (Demo + Real NER Blockages)
    if db.scalar(select(func.count(RoadBlockage.id))) < 5:
        demo_blockage = RoadBlockage(
            id="RB_DEMO_01",
            road_name="NH65 Direct",
            location="Kukatpally, Zone A17",
            zone_id="A17",
            blockage_type="flood_water",
            severity="critical",
            passable=False,
            status="active",
            lat=17.49,
            lng=78.39,
        )
        if not db.get(RoadBlockage, demo_blockage.id):
            db.add(demo_blockage)

        rb_file = _find_dataset_file("ner_road_blockages.csv", "16_road_blockages")
        if rb_file.exists():
            df_rb = pd.read_csv(rb_file)
            for _, r in df_rb.iterrows():
                rb_id = str(r["blockage_id"])
                if not db.get(RoadBlockage, rb_id):
                    db.add(RoadBlockage(
                        id=rb_id,
                        road_name=str(r["road_name"]),
                        location=str(r["location_name"]),
                        zone_id=None,
                        blockage_type=str(r["blockage_type"]),
                        severity=str(r["severity"]).lower(),
                        passable=bool(r["passable"]),
                        status=str(r["status"]).lower(),
                        lat=float(r["latitude"]),
                        lng=float(r["longitude"]),
                    ))
        db.commit()
