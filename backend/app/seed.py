from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Alert, Resource, Responder, Shelter, User, Zone
from .security import hash_password


def seed_database(db: Session) -> None:
    if not db.scalar(select(User).limit(1)):
        db.add_all([
            User(name="Demo Citizen", email="citizen@resqnet.demo", password_hash=hash_password("demo123"), role="citizen"),
            User(name="Demo Authority", email="authority@resqnet.demo", password_hash=hash_password("demo123"), role="authority"),
            User(name="Demo NGO", email="ngo@resqnet.demo", password_hash=hash_password("demo123"), role="ngo"),
            User(name="Demo Volunteer", email="volunteer@resqnet.demo", password_hash=hash_password("demo123"), role="volunteer"),
        ])
    if not db.scalar(select(Zone).limit(1)):
        db.add_all([
            Zone(id="A17", name="Zone A17 – Kukatpally", risk="critical", risk_score=97, population=2430, sos=87, rainfall="82 mm/hr", water_level="Rising", lat=17.49, lng=78.39, recommendation="Evacuate vulnerable residents to Shelter S04."),
            Zone(id="B05", name="Zone B05 – Miyapur", risk="high", risk_score=76, population=1820, sos=43, rainfall="65 mm/hr", water_level="High", lat=17.50, lng=78.36, recommendation="Issue evacuation advisory."),
            Zone(id="C12", name="Zone C12 – Bachupally", risk="high", risk_score=68, population=1340, sos=31, rainfall="54 mm/hr", water_level="Moderate", lat=17.52, lng=78.38, recommendation="Pre-position rescue teams."),
            Zone(id="D03", name="Zone D03 – Kondapur", risk="moderate", risk_score=38, population=980, sos=12, rainfall="38 mm/hr", water_level="Low", lat=17.46, lng=78.35, recommendation="Monitor situation."),
            Zone(id="E09", name="Zone E09 – Gachibowli", risk="safe", risk_score=12, population=2100, sos=2, rainfall="12 mm/hr", water_level="Normal", lat=17.44, lng=78.34, recommendation="No immediate action required."),
            Zone(id="F01", name="Zone F01 – Madhapur", risk="safe", risk_score=8, population=3200, sos=0, rainfall="8 mm/hr", water_level="Normal", lat=17.45, lng=78.38, recommendation="No immediate action required."),
        ])
    if not db.scalar(select(Shelter).limit(1)):
        db.add_all([
            Shelter(id="S01", name="BVRIT Relief Center", location="Bachupally", capacity=500, occupied=312, lat=17.52, lng=78.38, status="safe"),
            Shelter(id="S02", name="JNTU Community Hall", location="Kukatpally", capacity=800, occupied=764, lat=17.49, lng=78.39, status="warning"),
            Shelter(id="S03", name="Miyapur School Ground", location="Miyapur", capacity=350, occupied=190, lat=17.50, lng=78.36, status="safe"),
            Shelter(id="S04", name="Kondapur Sports Complex", location="Kondapur", capacity=1000, occupied=420, lat=17.46, lng=78.35, status="safe"),
        ])
    if not db.scalar(select(Resource).limit(1)):
        db.add_all([
            Resource(id="R01", type="Water", available=2400, demand=3200, unit="bottles", provider="NGO Alpha", location="Zone B05"),
            Resource(id="R02", type="Food", available=1800, demand=2400, unit="packets", provider="NGO Beta", location="Zone D03"),
            Resource(id="R03", type="Medicine", available=540, demand=620, unit="kits", provider="Red Cross Unit 7", location="Zone A17"),
            Resource(id="R04", type="Blankets", available=1200, demand=900, unit="pieces", provider="Govt Store", location="Zone E09"),
        ])
    if not db.scalar(select(Responder).limit(1)):
        db.add_all([
            Responder(id="T01", name="NDRF Team Alpha", type="rescue", location="Zone A17", status="busy", members=8),
            Responder(id="V17", name="Volunteer Arjun M.", type="volunteer", location="Zone A17", status="en_route", members=1),
            Responder(id="V09", name="Volunteer Sneha P.", type="volunteer", location="Zone E09", status="available", members=1),
            Responder(id="N01", name="NGO Alpha", type="ngo", location="Zone B05", status="busy", members=12),
        ])
    if not db.scalar(select(Alert).limit(1)):
        db.add_all([
            Alert(message="Zone A17 upgraded to CRITICAL – water levels rising rapidly", severity="critical", zone_id="A17"),
            Alert(message="Water shortage detected – demand exceeds supply", severity="high", zone_id="B05"),
            Alert(message="Shelter S02 nearing capacity", severity="warning", zone_id="B05"),
        ])
    db.commit()
