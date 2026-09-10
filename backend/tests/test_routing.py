import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import RoadBlockage, Shelter, Zone
from app.routing_engine import calculate_safe_routes, haversine_km


def test_haversine_calculation():
    # Distance between Guwahati (26.14, 91.73) and Shillong (25.57, 91.88) ~ 65-70 km
    d = haversine_km(26.14, 91.73, 25.57, 91.88)
    assert 60.0 <= d <= 75.0


def test_routes_demo_zone_a17():
    with TestClient(app) as client:
        res = client.get("/api/routes?zone_id=A17")
        assert res.status_code == 200
        routes = res.json()
        assert len(routes) == 3

        # Route B (Ring Road) should be recommended
        route_b = next(r for r in routes if r["id"] == "route_b")
        assert route_b["recommended"] is True
        assert route_b["safety_score"] >= 80

        # Route A (NH65 Direct) should have high risk due to flooding
        route_a = next(r for r in routes if r["id"] == "route_a")
        assert route_a["recommended"] is False
        assert "NH65" in route_a["name"]


def test_routes_ner_zone_dynamic_evaluation():
    with TestClient(app) as client:
        res = client.get("/api/routes?zone_id=Z_22.0_88.0")
        assert res.status_code == 200
        routes = res.json()
        assert len(routes) == 3

        # Check structure
        recommended_count = sum(1 for r in routes if r["recommended"])
        assert recommended_count == 1, "Exactly one route should be recommended"

        for r in routes:
            assert "distance" in r
            assert "time" in r
            assert "safety_score" in r
            assert "safetyScore" in r
            assert "destination_shelter" in r
            assert 0 <= r["safety_score"] <= 100


def test_list_blockages():
    with TestClient(app) as client:
        res = client.get("/api/blockages")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 40

        # Filter by active
        res_act = client.get("/api/blockages?status=active")
        assert res_act.status_code == 200
        for b in res_act.json():
            assert b["status"] == "active"


def test_create_and_update_blockage_with_auth():
    with TestClient(app) as client:
        # Login as volunteer
        login_res = client.post(
            "/api/auth/login",
            data={"username": "volunteer@resqnet.demo", "password": "demo123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create blockage
        create_res = client.post(
            "/api/blockages",
            headers=headers,
            json={
                "road_name": "NH-102 Mountain Pass",
                "location": "Tamenglong, Manipur",
                "zone_id": "Z_24.5_93.5",
                "blockage_type": "landslide_debris",
                "severity": "critical",
                "passable": False,
                "lat": 24.8,
                "lng": 93.5,
            },
        )
        assert create_res.status_code == 201
        blockage = create_res.json()
        blockage_id = blockage["id"]
        assert blockage["road_name"] == "NH-102 Mountain Pass"
        assert blockage["passable"] is False

        # Update blockage to cleared
        update_res = client.put(
            f"/api/blockages/{blockage_id}",
            headers=headers,
            json={"status": "cleared", "passable": True},
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["status"] == "cleared"
        assert updated["passable"] is True
