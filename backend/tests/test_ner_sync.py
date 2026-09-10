import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Alert, EnvironmentalData, Resource, Responder, RiskHistory, Shelter, Zone
from app.seed import get_ner_region_name
from sqlalchemy import func, select


def test_ner_regional_name_classifier():
    assert "Sikkim" in get_ner_region_name(27.5, 88.5)
    assert "Meghalaya" in get_ner_region_name(25.5, 91.5)
    assert "Arunachal Pradesh" in get_ner_region_name(28.0, 94.0)
    assert "Nagaland" in get_ner_region_name(26.0, 94.5)
    assert "Mizoram" in get_ner_region_name(23.5, 93.0)


def test_seeded_ner_entities_present():
    with SessionLocal() as db:
        zone_count = db.scalar(select(func.count(Zone.id)))
        shelter_count = db.scalar(select(func.count(Shelter.id)))
        resource_count = db.scalar(select(func.count(Resource.id)))
        responder_count = db.scalar(select(func.count(Responder.id)))
        alert_count = db.scalar(select(func.count(Alert.id)))

        assert zone_count >= 320, f"Expected >= 320 zones, found {zone_count}"
        assert shelter_count >= 30, f"Expected >= 30 shelters, found {shelter_count}"
        assert resource_count >= 30, f"Expected >= 30 resources, found {resource_count}"
        assert responder_count >= 40, f"Expected >= 40 responders, found {responder_count}"
        assert alert_count >= 5, f"Expected >= 5 alerts, found {alert_count}"


def test_list_zones_pagination_and_filter():
    with TestClient(app) as client:
        # Test pagination
        res = client.get("/api/risk/zones?limit=10&offset=0")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 10

        # Test filtering by risk level
        res_crit = client.get("/api/risk/zones?risk=critical")
        assert res_crit.status_code == 200
        for z in res_crit.json():
            assert z["risk"] == "critical"


def test_get_ner_risk_summary():
    with TestClient(app) as client:
        res = client.get("/api/risk/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["total_zones"] >= 320
        assert "risk_counts" in data
        assert "top_risk_zones" in data
        assert len(data["top_risk_zones"]) <= 10


def test_sync_live_weather_endpoint_with_auth():
    with TestClient(app) as client:
        # Login as authority
        login_res = client.post(
            "/api/auth/login",
            data={"username": "authority@resqnet.demo", "password": "demo123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Trigger live sync
        sync_res = client.post("/api/risk/sync-live-weather", headers=headers)
        assert sync_res.status_code == 200
        data = sync_res.json()
        assert data["status"] == "success"
        assert data["zones_updated"] >= 300
        assert "risk_breakdown" in data


def test_risk_trend_endpoint_has_history():
    with TestClient(app) as client:
        res = client.get("/api/risk/trend/Z_22.0_88.0?limit=5")
        assert res.status_code == 200
        points = res.json()
        assert isinstance(points, list)
        if points:
            assert "score" in points[0]
            assert "risk" in points[0]
            assert "time" in points[0]
