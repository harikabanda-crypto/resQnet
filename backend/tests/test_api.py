from app.main import app, health_check


def test_health_check():
    assert health_check() == {"status": "ok"}


def test_expected_api_routes_are_documented():
    paths = app.openapi()["paths"]
    assert "/api/auth/login" in paths
    assert "/api/sos" in paths
    assert "/api/predict" in paths
    assert "/api/dashboard/summary" in paths
