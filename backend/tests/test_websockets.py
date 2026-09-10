import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_websocket_connection_and_heartbeat():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/alerts") as ws:
            # First message received is connected greeting
            init_msg = ws.receive_json()
            assert init_msg["event"] == "connected"
            assert init_msg["channel"] == "alerts"

            # Test ping/pong
            ws.send_json({"action": "ping"})
            pong = ws.receive_json()
            assert pong["event"] == "pong"
            assert pong["channel"] == "alerts"
            assert "timestamp" in pong


def test_websocket_stats_endpoint():
    with TestClient(app) as client:
        res = client.get("/ws/stats")
        assert res.status_code == 200
        data = res.json()
        assert "connections" in data
        assert "alerts" in data["connections"]
        assert "sos" in data["connections"]


def test_realtime_alert_broadcast():
    with TestClient(app) as client:
        # Connect to alerts stream
        with client.websocket_connect("/ws/alerts") as ws:
            init = ws.receive_json()
            assert init["event"] == "connected"

            # Login as authority
            login_res = client.post(
                "/api/auth/login",
                data={"username": "authority@resqnet.demo", "password": "demo123"},
            )
            assert login_res.status_code == 200
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Post a new alert
            alert_res = client.post(
                "/api/alerts",
                headers=headers,
                json={
                    "message": "URGENT: Flash flood and landslide warning in East Khasi Hills",
                    "severity": "critical",
                    "zone_id": "Z_25.5_91.5",
                },
            )
            assert alert_res.status_code == 201

            # Receive broadcast over WebSocket
            event = ws.receive_json()
            assert event["event"] == "alert_created"
            assert event["data"]["severity"] == "critical"
            assert "East Khasi Hills" in event["data"]["message"]


def test_realtime_sos_creation_and_assignment_broadcast():
    with TestClient(app) as client:
        # Connect to sos stream
        with client.websocket_connect("/ws/sos") as ws:
            init = ws.receive_json()
            assert init["event"] == "connected"

            # Login as citizen
            login_res = client.post(
                "/api/auth/login",
                data={"username": "citizen@resqnet.demo", "password": "demo123"},
            )
            assert login_res.status_code == 200
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Citizen submits SOS
            sos_res = client.post(
                "/api/sos",
                headers=headers,
                json={
                    "type": "Rescue",
                    "zone_id": "A17",
                    "location": "Near NH65 Bridge",
                    "people": 4,
                    "priority": "critical",
                    "citizen_name": "Emergency Citizen",
                },
            )
            assert sos_res.status_code == 201
            sos_data = sos_res.json()
            sos_id = sos_data["id"]

            # WebSocket receives sos_created
            created_event = ws.receive_json()
            assert created_event["event"] == "sos_created"
            assert created_event["data"]["id"] == sos_id
            assert created_event["data"]["type"] == "Rescue"
            assert created_event["data"]["priority"] == "critical"

            # Now login as authority to assign responder
            auth_res = client.post(
                "/api/auth/login",
                data={"username": "authority@resqnet.demo", "password": "demo123"},
            )
            auth_token = auth_res.json()["access_token"]
            auth_headers = {"Authorization": f"Bearer {auth_token}"}

            # Assign responder T01
            assign_res = client.post(
                f"/api/sos/{sos_id}/assign",
                headers=auth_headers,
                json={"responder_id": "T01"},
            )
            assert assign_res.status_code == 201

            # WebSocket receives sos_assigned
            assigned_event = ws.receive_json()
            assert assigned_event["event"] == "sos_assigned"
            assert assigned_event["data"]["request_id"] == sos_id
            assert assigned_event["data"]["status"] == "matched"
            assert assigned_event["data"]["responder_id"] == "T01"


def test_realtime_road_blockage_broadcast():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/routes") as ws:
            init = ws.receive_json()
            assert init["event"] == "connected"

            login_res = client.post(
                "/api/auth/login",
                data={"username": "volunteer@resqnet.demo", "password": "demo123"},
            )
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Report blockage
            blk_res = client.post(
                "/api/blockages",
                headers=headers,
                json={
                    "road_name": "SH-42 Ridge Road",
                    "location": "Shillong, Meghalaya",
                    "zone_id": "Z_25.5_91.8",
                    "blockage_type": "rockfall",
                    "severity": "high",
                    "passable": False,
                    "lat": 25.57,
                    "lng": 91.88,
                },
            )
            assert blk_res.status_code == 201

            # WebSocket receives blockage_reported
            event = ws.receive_json()
            assert event["event"] == "blockage_reported"
            assert event["data"]["road_name"] == "SH-42 Ridge Road"
            assert event["data"]["passable"] is False
