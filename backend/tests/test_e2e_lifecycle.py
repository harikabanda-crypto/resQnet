import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app


def test_auth_registration_and_rbac_restrictions():
    with TestClient(app) as client:
        # 1. Register a new citizen
        unique_email = f"citizen_e2e_{uuid4().hex[:8]}@resqnet.test"
        reg_res = client.post(
            "/api/auth/register",
            json={
                "name": "E2E Citizen",
                "email": unique_email,
                "password": "securepassword123",
                "role": "citizen",
                "phone": "+919876543210",
            },
        )
        assert reg_res.status_code == 201
        user_data = reg_res.json()
        assert user_data["email"] == unique_email
        assert user_data["role"] == "citizen"

        # 2. Duplicate registration rejected
        dup_res = client.post(
            "/api/auth/register",
            json={
                "name": "Duplicate Citizen",
                "email": unique_email,
                "password": "securepassword123",
                "role": "citizen",
            },
        )
        assert dup_res.status_code == 409

        # 3. Invalid role rejected
        bad_role_res = client.post(
            "/api/auth/register",
            json={
                "name": "Invalid Role",
                "email": "invalid_role@resqnet.test",
                "password": "password123",
                "role": "superadmin",
            },
        )
        assert bad_role_res.status_code == 400

        # 4. Login with incorrect password rejected
        bad_login = client.post(
            "/api/auth/login",
            data={"username": unique_email, "password": "wrongpassword"},
        )
        assert bad_login.status_code == 401

        # 5. Successful login
        login_res = client.post(
            "/api/auth/login",
            data={"username": unique_email, "password": "securepassword123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {token}"}

        # 6. Verify /me endpoint
        me_res = client.get("/api/auth/me", headers=citizen_headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == unique_email

        # 7. Citizen forbidden from authority-only actions
        forbidden_alert = client.post(
            "/api/alerts",
            headers=citizen_headers,
            json={"message": "Unauthorized alert broadcast", "severity": "critical"},
        )
        assert forbidden_alert.status_code == 403

        forbidden_predict = client.post(
            "/api/predict",
            headers=citizen_headers,
            json={"zone_id": "A17"},
        )
        assert forbidden_predict.status_code == 403


def test_complete_sos_emergency_lifecycle():
    with TestClient(app) as client:
        # Step 1: Login as Citizen
        citizen_login = client.post(
            "/api/auth/login",
            data={"username": "citizen@resqnet.demo", "password": "demo123"},
        )
        assert citizen_login.status_code == 200
        citizen_token = citizen_login.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

        # Step 2: Citizen posts an urgent distress call
        sos_res = client.post(
            "/api/sos",
            headers=citizen_headers,
            json={
                "type": "Trapped / Medical",
                "zone_id": "A17",
                "location": "Flat 3A, Hillside Apartments, Kukatpally",
                "people": 5,
                "priority": "critical",
                "description": "Rising water, family trapped on first floor",
                "citizen_name": "Ravi Kumar",
            },
        )
        assert sos_res.status_code == 201
        sos = sos_res.json()
        sos_id = sos["id"]
        assert sos["status"] == "received"
        assert sos["priority"] == "critical"

        # Step 3: Login as Authority
        auth_login = client.post(
            "/api/auth/login",
            data={"username": "authority@resqnet.demo", "password": "demo123"},
        )
        assert auth_login.status_code == 200
        auth_token = auth_login.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {auth_token}"}

        # Step 4: Authority reviews pending SOS list
        queue_res = client.get("/api/sos?status=received", headers=auth_headers)
        assert queue_res.status_code == 200
        received_ids = [item["id"] for item in queue_res.json()]
        assert sos_id in received_ids

        # Step 5: Authority assigns NDRF Team T01
        assign_res = client.post(
            f"/api/sos/{sos_id}/assign",
            headers=auth_headers,
            json={"responder_id": "T01"},
        )
        assert assign_res.status_code == 201
        assigned_data = assign_res.json()
        assert assigned_data["status"] == "assigned"

        # Verify request status transitioned to 'matched'
        check_sos = client.get(f"/api/sos/{sos_id}")
        assert check_sos.status_code == 200
        assert check_sos.json()["status"] == "matched"
        assert "NDRF" in check_sos.json()["assigned_team"]

        # Step 6: Login as Volunteer to update transit status
        vol_login = client.post(
            "/api/auth/login",
            data={"username": "volunteer@resqnet.demo", "password": "demo123"},
        )
        vol_token = vol_login.json()["access_token"]
        vol_headers = {"Authorization": f"Bearer {vol_token}"}

        # Transition to out_for_delivery
        dispatch_res = client.put(
            f"/api/sos/{sos_id}",
            headers=vol_headers,
            json={"status": "out_for_delivery"},
        )
        assert dispatch_res.status_code == 200
        assert dispatch_res.json()["status"] == "out_for_delivery"

        # Transition to delivered / resolved
        resolved_res = client.put(
            f"/api/sos/{sos_id}",
            headers=vol_headers,
            json={"status": "delivered"},
        )
        assert resolved_res.status_code == 200
        assert resolved_res.json()["status"] == "delivered"


def test_community_hazard_reporting():
    with TestClient(app) as client:
        # Citizen login
        citizen_login = client.post(
            "/api/auth/login",
            data={"username": "citizen@resqnet.demo", "password": "demo123"},
        )
        token = citizen_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Post hazard report
        report_res = client.post(
            "/api/reports",
            headers=headers,
            json={
                "zone_id": "A17",
                "category": "road_crack",
                "description": "Deep tension crack appearing across mountain road shoulder",
            },
        )
        assert report_res.status_code == 201
        report = report_res.json()
        assert report["category"] == "road_crack"
        assert report["zone_id"] == "A17"

        # Retrieve reports
        list_res = client.get("/api/reports")
        assert list_res.status_code == 200
        assert any(r["id"] == report["id"] for r in list_res.json())


def test_api_404_error_handling():
    with TestClient(app) as client:
        auth_login = client.post(
            "/api/auth/login",
            data={"username": "authority@resqnet.demo", "password": "demo123"},
        )
        token = auth_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Nonexistent zone
        assert client.get("/api/risk/zones/ZONE_99999").status_code == 404
        assert client.get("/api/risk/trend/ZONE_99999").status_code == 404
        assert client.get("/api/risk/zones/ZONE_99999/inspection").status_code == 404

        # Nonexistent SOS
        assert client.get("/api/sos/99999999").status_code == 404
        assert client.put("/api/sos/99999999", headers=headers, json={"status": "resolved"}).status_code == 404
        assert client.post("/api/sos/99999999/assign", headers=headers, json={"responder_id": "T01"}).status_code == 404

        # Nonexistent Alert
        assert client.put("/api/alerts/99999999", headers=headers, json={"status": "lifted"}).status_code == 404

        # Nonexistent Road Blockage
        assert client.put("/api/blockages/RB_UNKNOWN_99", headers=headers, json={"status": "cleared"}).status_code == 404
