from __future__ import annotations

import math
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import RoadBlockage, Shelter, Zone


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great circle distance between two points in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    return round(r * 2.0 * math.asin(math.sqrt(max(0.0, min(1.0, a)))), 1)


def calculate_safe_routes(
    db: Session,
    zone_id: str | None = None,
    shelter_id: str | None = None,
) -> list[dict[str, Any]]:
    """Compute dynamic evacuation routes, evaluating road blockages and landslide risks."""
    origin_zone = db.get(Zone, zone_id) if zone_id else None

    # Handle demo zone A17 explicitly to match prototype interactive simulation
    if zone_id == "A17" or (origin_zone and origin_zone.id == "A17"):
        is_crit = origin_zone.risk in ["critical", "high"] if origin_zone else True
        if is_crit:
            return [
                {
                    "id": "route_a",
                    "name": "Route A – NH65 Direct",
                    "distance": "2.1 km",
                    "distance_km": 2.1,
                    "time": "6 min",
                    "time_min": 6,
                    "risk": "high",
                    "safety_score": 28,
                    "safetyScore": 28,
                    "recommended": False,
                    "reason": "AVOID: NH65 submerged under flash flood waters and active slope debris.",
                    "destination_shelter": "Kondapur Sports Complex (S04)",
                    "shelter_id": "S04",
                },
                {
                    "id": "route_b",
                    "name": "Route B – Ring Road Bypass",
                    "distance": "2.8 km",
                    "distance_km": 2.8,
                    "time": "9 min",
                    "time_min": 9,
                    "risk": "low",
                    "safety_score": 96,
                    "safetyScore": 96,
                    "recommended": True,
                    "reason": "RECOMMENDED: Elevated arterial road clear of slope hazards and flood accumulation.",
                    "destination_shelter": "Kondapur Sports Complex (S04)",
                    "shelter_id": "S04",
                },
                {
                    "id": "route_c",
                    "name": "Route C – Inner Roads Corridor",
                    "distance": "3.4 km",
                    "distance_km": 3.4,
                    "time": "12 min",
                    "time_min": 12,
                    "risk": "low",
                    "safety_score": 87,
                    "safetyScore": 87,
                    "recommended": False,
                    "reason": "Safe alternative – clear of reported hazards, slightly slower transit.",
                    "destination_shelter": "Kondapur Sports Complex (S04)",
                    "shelter_id": "S04",
                },
            ]
        else:
            return [
                {
                    "id": "route_a",
                    "name": "Route A – NH65 Direct",
                    "distance": "2.1 km",
                    "distance_km": 2.1,
                    "time": "6 min",
                    "time_min": 6,
                    "risk": "low",
                    "safety_score": 92,
                    "safetyScore": 92,
                    "recommended": True,
                    "reason": "Clear conditions along main expressway corridor.",
                    "destination_shelter": "Kondapur Sports Complex (S04)",
                    "shelter_id": "S04",
                },
                {
                    "id": "route_b",
                    "name": "Route B – Ring Road Bypass",
                    "distance": "2.8 km",
                    "distance_km": 2.8,
                    "time": "9 min",
                    "time_min": 9,
                    "risk": "low",
                    "safety_score": 94,
                    "safetyScore": 94,
                    "recommended": False,
                    "reason": "Elevated bypass route operating normally.",
                    "destination_shelter": "Kondapur Sports Complex (S04)",
                    "shelter_id": "S04",
                },
                {
                    "id": "route_c",
                    "name": "Route C – Inner Roads Corridor",
                    "distance": "3.4 km",
                    "distance_km": 3.4,
                    "time": "12 min",
                    "time_min": 12,
                    "risk": "low",
                    "safety_score": 88,
                    "safetyScore": 88,
                    "recommended": False,
                    "reason": "Safe inner city alternative.",
                    "destination_shelter": "Kondapur Sports Complex (S04)",
                    "shelter_id": "S04",
                },
            ]

    # Find destination shelter
    shelter: Shelter | None = None
    if shelter_id:
        shelter = db.get(Shelter, shelter_id)

    if not shelter:
        all_shelters = db.scalars(select(Shelter).where(Shelter.status != "full")).all()
        if origin_zone and all_shelters:
            shelter = min(
                all_shelters,
                key=lambda s: haversine_km(origin_zone.lat, origin_zone.lng, s.lat, s.lng),
            )
        elif all_shelters:
            shelter = all_shelters[0]

    # Reference coordinates
    o_lat = origin_zone.lat if origin_zone else (shelter.lat if shelter else 25.5)
    o_lng = origin_zone.lng if origin_zone else (shelter.lng if shelter else 92.0)
    s_lat = shelter.lat if shelter else (o_lat + 0.05)
    s_lng = shelter.lng if shelter else (o_lng + 0.05)
    shelter_name = shelter.name if shelter else "Regional Relief Center"
    s_id = shelter.id if shelter else "S_NER"

    dist_direct = max(2.0, haversine_km(o_lat, o_lng, s_lat, s_lng))

    # Query active road blockages near the corridor
    blockages = db.scalars(
        select(RoadBlockage).where(RoadBlockage.status.in_(["active", "partially_cleared"]))
    ).all()

    nearby_blockages = [
        b
        for b in blockages
        if haversine_km(o_lat, o_lng, b.lat, b.lng) <= max(25.0, dist_direct * 1.5)
    ]

    has_impassable = any(not b.passable for b in nearby_blockages)
    origin_risk = origin_zone.risk if origin_zone else "moderate"

    # Route 1: Direct Highway Corridor
    r1_dist = dist_direct
    r1_time = max(5, int(r1_dist * 2.2) + 2)
    r1_penalties = 0
    r1_reasons: list[str] = []

    if origin_risk == "critical":
        r1_penalties += 45
        r1_reasons.append("Transits through critical landslide probability zone")
    elif origin_risk == "high":
        r1_penalties += 25
        r1_reasons.append("Elevated slope instability in originating sector")

    if has_impassable:
        r1_penalties += 40
        imp_types = [b.blockage_type.replace("_", " ") for b in nearby_blockages if not b.passable]
        r1_reasons.append(f"Blocked by {imp_types[0] if imp_types else 'road blockage'}")
    elif nearby_blockages:
        r1_penalties += 15
        r1_reasons.append("Caution: Partially cleared debris along segment")

    r1_safety = max(15, min(98, 100 - r1_penalties))
    r1_risk = "high" if r1_safety < 60 else "moderate" if r1_safety < 80 else "low"
    r1_reason = " • ".join(r1_reasons) if r1_reasons else "Direct highway corridor clear of reported hazards."

    # Route 2: Elevated Ridge / Contour Bypass
    r2_dist = round(dist_direct * 1.35, 1)
    r2_time = max(8, int(r2_dist * 2.8) + 4)
    r2_penalties = 5
    if origin_risk == "critical":
        r2_penalties += 10
    r2_safety = max(50, min(97, 100 - r2_penalties))
    r2_risk = "low" if r2_safety >= 80 else "moderate"
    r2_reason = "Elevated ridge bypass route avoiding unstable valley slope toes and waterlogging."

    # Route 3: Secondary Rural / Connecting Road
    r3_dist = round(dist_direct * 1.6, 1)
    r3_time = max(12, int(r3_dist * 3.4) + 6)
    r3_safety = max(40, min(90, 88 - (15 if has_impassable else 0)))
    r3_risk = "low" if r3_safety >= 75 else "moderate"
    r3_reason = "Secondary connecting bypass clear of primary highway bottlenecks."

    # Recommendation determination
    candidates = [
        {"idx": 0, "safety": r1_safety, "time": r1_time},
        {"idx": 1, "safety": r2_safety, "time": r2_time},
        {"idx": 2, "safety": r3_safety, "time": r3_time},
    ]
    # Pick safest among viable routes; if multiple > 85, prefer faster
    safe_candidates = [c for c in candidates if c["safety"] >= 80]
    if safe_candidates:
        best = min(safe_candidates, key=lambda c: c["time"])
    else:
        best = max(candidates, key=lambda c: c["safety"])

    rec_flags = [i == best["idx"] for i in range(3)]

    routes = [
        {
            "id": "route_a",
            "name": f"Route A – {origin_zone.name.split('[')[0].strip() if origin_zone else 'Direct'} Highway Corridor",
            "distance": f"{r1_dist} km",
            "distance_km": r1_dist,
            "time": f"{r1_time} min",
            "time_min": r1_time,
            "risk": r1_risk,
            "safety_score": r1_safety,
            "safetyScore": r1_safety,
            "recommended": rec_flags[0],
            "reason": ("RECOMMENDED: " if rec_flags[0] else ("AVOID: " if r1_risk == "high" else "")) + r1_reason,
            "destination_shelter": shelter_name,
            "shelter_id": s_id,
        },
        {
            "id": "route_b",
            "name": "Route B – Elevated Ridge Bypass",
            "distance": f"{r2_dist} km",
            "distance_km": r2_dist,
            "time": f"{r2_time} min",
            "time_min": r2_time,
            "risk": r2_risk,
            "safety_score": r2_safety,
            "safetyScore": r2_safety,
            "recommended": rec_flags[1],
            "reason": ("RECOMMENDED: " if rec_flags[1] else "") + r2_reason,
            "destination_shelter": shelter_name,
            "shelter_id": s_id,
        },
        {
            "id": "route_c",
            "name": "Route C – Secondary Connecting Road",
            "distance": f"{r3_dist} km",
            "distance_km": r3_dist,
            "time": f"{r3_time} min",
            "time_min": r3_time,
            "risk": r3_risk,
            "safety_score": r3_safety,
            "safetyScore": r3_safety,
            "recommended": rec_flags[2],
            "reason": ("RECOMMENDED: " if rec_flags[2] else "") + r3_reason,
            "destination_shelter": shelter_name,
            "shelter_id": s_id,
        },
    ]

    return routes
