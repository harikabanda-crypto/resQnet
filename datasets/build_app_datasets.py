"""
Generate seed CSV datasets for app-side data (datasets 14–22).
These are structured records that the ResQNet app creates/manages.
Each CSV matches the schema used by the FastAPI backend.

Datasets:
  14_community_reports/        ner_community_reports.csv
  15_user_photos/              ner_user_photos.csv
  16_road_blockages/           ner_road_blockages.csv
  17_waterlogging_reports/     ner_waterlogging_reports.csv
  18_sos_requests/             ner_sos_requests.csv
  19_authority_data/           ner_authority_data.csv
  20_shelters/                 ner_shelters.csv
  21_resources/                ner_resources.csv
  22_responders/               ner_responders.csv
"""

import random
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

BASE = Path(__file__).parent
random.seed(42)

# ── Helpers ────────────────────────────────────────────────────────────────
NER_ZONES = [
    ("Guwahati, Assam",         26.1445, 91.7362),
    ("Shillong, Meghalaya",     25.5788, 91.8933),
    ("Imphal, Manipur",         24.8170, 93.9368),
    ("Aizawl, Mizoram",         23.7271, 92.7176),
    ("Kohima, Nagaland",        25.6751, 94.1086),
    ("Itanagar, Arunachal",     27.0844, 93.6053),
    ("Agartala, Tripura",       23.8315, 91.2868),
    ("Gangtok, Sikkim",         27.3314, 88.6138),
    ("Dimapur, Nagaland",       25.9000, 93.7300),
    ("Silchar, Assam",          24.8333, 92.7789),
    ("Jorhat, Assam",           26.7509, 94.2037),
    ("Tezpur, Assam",           26.6338, 92.7926),
    ("Mawsynram, Meghalaya",    25.2980, 91.5825),
    ("Cherrapunji, Meghalaya",  25.2840, 91.7260),
    ("Churachandpur, Manipur",  24.3330, 93.6830),
]

def rand_dt(days_back=30):
    dt = datetime.utcnow() - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def rand_zone():
    return random.choice(NER_ZONES)

def save(rows, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(path, index=False)

SEVERITIES   = ["low", "moderate", "high", "critical"]
hazard_types = ["landslide", "rockfall", "road_crack", "waterlogging",
                "soil_movement", "road_damage", "tree_fall", "embankment_failure"]

# ── 14. Community Hazard Reports ──────────────────────────────────────────
statuses = ["pending", "verified", "resolved", "dismissed"]
rows14 = []
for i in range(1, 81):
    loc, lat, lon = rand_zone()
    rows14.append({
        "report_id":    f"CR{i:04d}",
        "submitted_at": rand_dt(60),
        "user_id":      f"U{random.randint(1000,9999)}",
        "latitude":     round(lat + random.uniform(-0.1, 0.1), 4),
        "longitude":    round(lon + random.uniform(-0.1, 0.1), 4),
        "location_name": loc,
        "hazard_type":  random.choice(hazard_types),
        "severity":     random.choice(SEVERITIES),
        "description":  f"Community report from {loc}: observed {random.choice(hazard_types)} near main road.",
        "photo_id":     f"PH{i:04d}" if random.random() > 0.4 else "",
        "status":       random.choice(statuses),
        "verified_by":  f"AUTH{random.randint(1,10):02d}" if random.random() > 0.5 else "",
        "source":       "resqnet_citizen",
    })
save(rows14, BASE / "14_community_reports" / "ner_community_reports.csv")
print(f"✅ 14 Community Reports:  {len(rows14)} rows")

# ── 15. User Photos ───────────────────────────────────────────────────────
rows15 = []
for i in range(1, 61):
    loc, lat, lon = rand_zone()
    rows15.append({
        "photo_id":         f"PH{i:04d}",
        "uploaded_at":      rand_dt(60),
        "user_id":          f"U{random.randint(1000,9999)}",
        "latitude":         round(lat + random.uniform(-0.1, 0.1), 4),
        "longitude":        round(lon + random.uniform(-0.1, 0.1), 4),
        "location_name":    loc,
        "linked_report_id": f"CR{i:04d}" if random.random() > 0.3 else "",
        "linked_sos_id":    f"SOS{i:04d}" if random.random() > 0.7 else "",
        "file_name":        f"img_{i:04d}.jpg",
        "file_size_kb":     random.randint(100, 4000),
        "hazard_type":      random.choice(hazard_types),
        "caption":          f"Photo taken at {loc} showing hazard condition.",
        "status":           random.choice(["uploaded", "reviewed", "flagged"]),
        "source":           "resqnet_citizen",
    })
save(rows15, BASE / "15_user_photos" / "ner_user_photos.csv")
print(f"✅ 15 User Photos:        {len(rows15)} rows")

# ── 16. Road Blockage Reports ─────────────────────────────────────────────
road_types    = ["NH", "SH", "district_road", "village_road", "forest_road"]
blockage_types = ["landslide_debris", "flood_water", "bridge_damage",
                  "road_collapse", "fallen_trees", "rockfall"]
rows16 = []
for i in range(1, 51):
    loc, lat, lon = rand_zone()
    rows16.append({
        "blockage_id":   f"RB{i:04d}",
        "reported_at":   rand_dt(30),
        "latitude":      round(lat + random.uniform(-0.2, 0.2), 4),
        "longitude":     round(lon + random.uniform(-0.2, 0.2), 4),
        "location_name": loc,
        "road_name":     f"{random.choice(road_types)}-{random.randint(1,60)}",
        "blockage_type": random.choice(blockage_types),
        "severity":      random.choice(SEVERITIES),
        "passable":      random.choice([True, False]),
        "estimated_clearance_hours": random.choice([2, 4, 8, 12, 24, 48, ""]),
        "reported_by":   random.choice(["citizen", "authority", "ngo", "volunteer"]),
        "status":        random.choice(["active", "cleared", "partially_cleared"]),
        "photo_id":      f"PH{i:04d}" if random.random() > 0.5 else "",
        "source":        "resqnet_crowdsource",
    })
save(rows16, BASE / "16_road_blockages" / "ner_road_blockages.csv")
print(f"✅ 16 Road Blockages:     {len(rows16)} rows")

# ── 17. Waterlogging Reports ──────────────────────────────────────────────
rows17 = []
for i in range(1, 41):
    loc, lat, lon = rand_zone()
    rows17.append({
        "waterlog_id":   f"WL{i:04d}",
        "reported_at":   rand_dt(30),
        "latitude":      round(lat + random.uniform(-0.15, 0.15), 4),
        "longitude":     round(lon + random.uniform(-0.15, 0.15), 4),
        "location_name": loc,
        "depth_cm":      random.choice([10, 20, 30, 50, 75, 100, 150, ""]),
        "area_sqm":      random.choice([50, 100, 500, 1000, 5000, ""]),
        "severity":      random.choice(SEVERITIES),
        "affects_road":  random.choice([True, False]),
        "affects_homes": random.choice([True, False]),
        "reported_by":   random.choice(["citizen", "authority"]),
        "status":        random.choice(["active", "receding", "resolved"]),
        "photo_id":      f"PH{i:04d}" if random.random() > 0.5 else "",
        "source":        "resqnet_citizen",
    })
save(rows17, BASE / "17_waterlogging_reports" / "ner_waterlogging_reports.csv")
print(f"✅ 17 Waterlogging:       {len(rows17)} rows")

# ── 18. SOS Requests ─────────────────────────────────────────────────────
sos_types    = ["trapped", "medical", "food", "water", "shelter",
                "rescue", "missing_person", "evacuation"]
sos_statuses = ["pending", "acknowledged", "assigned", "in_progress",
                "resolved", "cancelled"]
rows18 = []
for i in range(1, 61):
    loc, lat, lon = rand_zone()
    rows18.append({
        "sos_id":          f"SOS{i:04d}",
        "submitted_at":    rand_dt(14),
        "user_id":         f"U{random.randint(1000,9999)}",
        "latitude":        round(lat + random.uniform(-0.1, 0.1), 4),
        "longitude":       round(lon + random.uniform(-0.1, 0.1), 4),
        "location_name":   loc,
        "request_type":    random.choice(sos_types),
        "severity":        random.choice(SEVERITIES),
        "people_count":    random.randint(1, 20),
        "description":     f"SOS from {loc}: {random.choice(sos_types)} needed urgently.",
        "contact_number":  f"+91{random.randint(7000000000,9999999999)}",
        "status":          random.choice(sos_statuses),
        "assigned_to":     f"RESP{random.randint(1,20):03d}" if random.random() > 0.4 else "",
        "resolved_at":     rand_dt(7) if random.random() > 0.5 else "",
        "photo_id":        f"PH{i:04d}" if random.random() > 0.6 else "",
        "source":          "resqnet_citizen",
    })
save(rows18, BASE / "18_sos_requests" / "ner_sos_requests.csv")
print(f"✅ 18 SOS Requests:       {len(rows18)} rows")

# ── 19. Authority Data ────────────────────────────────────────────────────
auth_types = ["evacuation_order", "road_closure", "shelter_activation",
              "rescue_operation", "flood_alert", "landslide_warning",
              "curfew", "relief_distribution"]
rows19 = []
for i in range(1, 41):
    loc, lat, lon = rand_zone()
    rows19.append({
        "authority_id":        f"AUTH{i:04d}",
        "issued_at":           rand_dt(30),
        "issued_by":           f"District_Authority_{random.randint(1,8)}",
        "latitude":            round(lat, 4),
        "longitude":           round(lon, 4),
        "location_name":       loc,
        "incident_type":       random.choice(auth_types),
        "severity":            random.choice(SEVERITIES),
        "title":               f"Official: {random.choice(auth_types).replace('_',' ').title()} in {loc}",
        "description":         f"Verified authority action in {loc} district.",
        "affected_zones":      f"Z_{lat:.1f}_{lon:.1f}",
        "affected_population": random.randint(500, 50000),
        "status":              random.choice(["active", "lifted", "under_review"]),
        "source":              "authority_portal",
    })
save(rows19, BASE / "19_authority_data" / "ner_authority_data.csv")
print(f"✅ 19 Authority Data:     {len(rows19)} rows")

# ── 20. Shelter Data ──────────────────────────────────────────────────────
shelter_types = ["government_school", "community_hall", "relief_camp",
                 "hospital", "church", "temple", "sports_complex"]
rows20 = []
for i in range(1, 41):
    loc, lat, lon = rand_zone()
    cap = random.choice([50, 100, 200, 300, 500, 1000])
    occ = random.randint(0, cap)
    rows20.append({
        "shelter_id":       f"SH{i:04d}",
        "name":             f"{loc} Relief Shelter {i}",
        "shelter_type":     random.choice(shelter_types),
        "latitude":         round(lat + random.uniform(-0.05, 0.05), 4),
        "longitude":        round(lon + random.uniform(-0.05, 0.05), 4),
        "location_name":    loc,
        "capacity":         cap,
        "current_occupancy": occ,
        "available_beds":   cap - occ,
        "has_food":         random.choice([True, False]),
        "has_water":        random.choice([True, True, False]),
        "has_medical":      random.choice([True, False, False]),
        "has_electricity":  random.choice([True, True, False]),
        "contact_number":   f"+91{random.randint(6000000000,9999999999)}",
        "status":           random.choice(["active", "full", "inactive", "preparing"]),
        "last_updated":     rand_dt(1),
        "source":           "authority_portal",
    })
save(rows20, BASE / "20_shelters" / "ner_shelters.csv")
print(f"✅ 20 Shelters:           {len(rows20)} rows")

# ── 21. Resource Data ─────────────────────────────────────────────────────
resource_types = [
    ("food_packets",   "packets"),
    ("water_bottles",  "litres"),
    ("medicine_kits",  "kits"),
    ("blankets",       "units"),
    ("vehicles_4wd",   "units"),
    ("boats",          "units"),
    ("ropes",          "metres"),
    ("first_aid_kits", "kits"),
    ("tents",          "units"),
    ("generators",     "units"),
]
orgs = ["SDRF", "NDRF", "State_DMA", "Red_Cross", "NGO_Helping_Hands",
        "District_Authority", "Army_Unit", "Civil_Defence"]
rows21 = []
for i, (rtype, unit) in enumerate((resource_types * 4)[:40], 1):
    loc, lat, lon = rand_zone()
    qty = random.randint(10, 500)
    rows21.append({
        "resource_id":         f"RES{i:04d}",
        "resource_type":       rtype,
        "unit":                unit,
        "quantity_total":      qty,
        "quantity_available":  random.randint(0, qty),
        "quantity_deployed":   random.randint(0, qty // 2),
        "location_name":       loc,
        "latitude":            round(lat, 4),
        "longitude":           round(lon, 4),
        "owned_by":            random.choice(orgs),
        "status":              random.choice(["available", "deployed", "depleted", "reserved"]),
        "last_updated":        rand_dt(3),
        "source":              "authority_ngo_portal",
    })
save(rows21, BASE / "21_resources" / "ner_resources.csv")
print(f"✅ 21 Resources:          {len(rows21)} rows")

# ── 22. Responder / Volunteer Data ────────────────────────────────────────
teams = ["NDRF", "SDRF", "Police", "Fire_Brigade", "Civil_Defence",
         "Red_Cross_Volunteer", "NGO_Volunteer", "Army", "Medical_Team",
         "Search_And_Rescue"]
capabilities_pool = ["first_aid", "rescue", "flood_ops", "logistics",
                     "communication", "medical", "search", "driving",
                     "mountaineering", "trauma_support"]
rows22 = []
for i in range(1, 61):
    loc, lat, lon = rand_zone()
    caps = random.sample(capabilities_pool, random.randint(1, 4))
    rows22.append({
        "responder_id":     f"RESP{i:03d}",
        "name":             f"Responder_{i:03d}",
        "team":             random.choice(teams),
        "role":             random.choice(["team_leader", "medic", "operator", "volunteer"]),
        "latitude":         round(lat + random.uniform(-0.2, 0.2), 4),
        "longitude":        round(lon + random.uniform(-0.2, 0.2), 4),
        "location_name":    loc,
        "capabilities":     "|".join(caps),
        "availability":     random.choice(["available", "on_mission", "off_duty", "standby"]),
        "assigned_sos_id":  f"SOS{random.randint(1,60):04d}" if random.random() > 0.6 else "",
        "contact_number":   f"+91{random.randint(6000000000,9999999999)}",
        "last_reported_at": rand_dt(1),
        "source":           "authority_volunteer_portal",
    })
save(rows22, BASE / "22_responders" / "ner_responders.csv")
print(f"✅ 22 Responders:         {len(rows22)} rows")

print("\nAll app-side datasets done.")
