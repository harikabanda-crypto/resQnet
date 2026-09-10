import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ml_engine import MLEngine, get_ml_engine


def test_ml_engine_loads_model_and_metadata():
    engine = get_ml_engine()
    assert engine.booster is not None
    assert len(engine.features) == 18
    assert "elevation" in engine.features
    assert "slope" in engine.features
    assert "rainfall_24h" in engine.features


def test_ml_engine_predict_default_zone():
    engine = get_ml_engine()
    result = engine.predict("A17", {"rainfall_mm_hr": 5.0, "soil_moisture": 15.0, "water_level": 5.0})
    assert result.risk in ["safe", "low", "moderate", "high", "critical"]
    assert 0.0 <= result.score <= 100.0
    assert 0.0 <= result.ml_probability <= 1.0
    assert len(result.factors) > 0


def test_ml_engine_predict_heavy_rainfall_triggers_critical():
    engine = get_ml_engine()
    result = engine.predict("A17", {"rainfall_mm_hr": 85.0, "soil_moisture": 80.0, "water_level": 70.0})
    assert result.risk in ["high", "critical"]
    assert result.score >= 60.0
    # Must contain rainfall explanation
    assert any("rainfall" in f.lower() for f in result.factors)


def test_ml_engine_shap_factors_returned():
    engine = get_ml_engine()
    result = engine.predict("A17", {"rainfall_mm_hr": 70.0})
    assert isinstance(result.shap_factors, dict)
    assert len(result.shap_factors) > 0


def test_predict_api_requires_authority_and_returns_ml_output():
    with TestClient(app) as client:
        # First login as authority to get token
        login_res = client.post(
            "/api/auth/login",
            data={"username": "authority@resqnet.demo", "password": "demo123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Predict with simulated rainfall
        pred_res = client.post(
            "/api/predict",
            headers=headers,
            json={
                "zone_id": "A17",
                "rainfall_mm_hr": 82.0,
                "soil_moisture": 75.0,
                "water_level": 60.0,
            },
        )
        assert pred_res.status_code == 200
        data = pred_res.json()
        assert data["zone_id"] == "A17"
        assert data["risk"] in ["high", "critical"]
        assert data["score"] >= 60.0
        assert len(data["factors"]) > 0
        assert data["ml_probability"] is not None
        assert data["shap_factors"] is not None


def test_zone_ml_inspection_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/risk/zones/A17/inspection")
        assert res.status_code == 200
        data = res.json()
        assert data["zone_id"] == "A17"
        assert "risk" in data
        assert "score" in data
        assert "confidence" in data
        assert "ml_probability" in data
        assert "shap_factors" in data
        assert "features" in data
