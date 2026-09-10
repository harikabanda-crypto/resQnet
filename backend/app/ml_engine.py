from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import xgboost as xgb


@dataclass
class PredictionResult:
    risk: str
    score: float
    confidence: float
    factors: list[str]
    ml_probability: float
    shap_factors: dict[str, float] = field(default_factory=dict)
    feature_values: dict[str, float] = field(default_factory=dict)


class MLEngine:
    """XGBoost ML Risk Inference Engine for ResQNet.

    Loads the pre-trained XGBoost model and metadata, computes calibrated
    landslide hazard scores combining ML probability with physical factors,
    and extracts Tree SHAP feature contributions for explainability.
    """

    DEFAULT_FEATURE_NAMES = [
        "elevation",
        "slope",
        "aspect",
        "curvature",
        "land_cover_code",
        "historical_landslide_density",
        "rainfall_1h",
        "rainfall_3h",
        "rainfall_6h",
        "rainfall_12h",
        "rainfall_24h",
        "rainfall_3day",
        "rainfall_7day",
        "soil_moisture_0_7cm",
        "soil_moisture_7_28cm",
        "earthquake_count_7d",
        "nearest_eq_distance_km",
        "max_eq_magnitude",
    ]

    HUMAN_READABLE_NAMES: dict[str, str] = {
        "elevation": "Terrain elevation",
        "slope": "Terrain slope steepness",
        "aspect": "Slope aspect exposure",
        "curvature": "Profile curvature",
        "land_cover_code": "Vegetation / Land cover type",
        "historical_landslide_density": "Historical landslide frequency",
        "rainfall_1h": "1-hour intense rainfall",
        "rainfall_3h": "3-hour cumulative rainfall",
        "rainfall_6h": "6-hour cumulative rainfall",
        "rainfall_12h": "12-hour cumulative rainfall",
        "rainfall_24h": "24-hour cumulative rainfall",
        "rainfall_3day": "3-day antecedent rainfall",
        "rainfall_7day": "7-day cumulative rainfall",
        "soil_moisture_0_7cm": "Topsoil moisture saturation (0-7cm)",
        "soil_moisture_7_28cm": "Subsoil moisture saturation (7-28cm)",
        "earthquake_count_7d": "Recent seismic event count (7d)",
        "nearest_eq_distance_km": "Distance to nearest earthquake epicenter",
        "max_eq_magnitude": "Recent maximum earthquake magnitude",
    }

    def __init__(self, model_path: Path | str | None = None, meta_path: Path | str | None = None) -> None:
        self.model_path = self._resolve_path(model_path, "resqnet_model.json")
        self.meta_path = self._resolve_path(meta_path, "model_metadata.json")
        self.features: list[str] = self.DEFAULT_FEATURE_NAMES
        self.metadata: dict[str, Any] = {}
        self.booster: xgb.Booster | None = None
        self.zone_cache: dict[str, dict[str, float]] = {}

        self._load_metadata()
        self._load_model()
        self._load_zone_cache()

    def _resolve_path(self, path: Path | str | None, filename: str) -> Path:
        if path:
            p = Path(path)
            if p.exists():
                return p

        candidates = [
            Path(__file__).resolve().parent.parent.parent / "datasets" / "ml_ready" / filename,
            Path(__file__).resolve().parent.parent.parent / "datasets" / "processed" / filename,
            Path.cwd() / "datasets" / "ml_ready" / filename,
            Path.cwd().parent / "datasets" / "ml_ready" / filename,
        ]
        for c in candidates:
            if c.exists():
                return c
        return candidates[0]

    def _load_metadata(self) -> None:
        if self.meta_path.exists():
            with open(self.meta_path, encoding="utf-8") as f:
                self.metadata = json.load(f)
            if "features" in self.metadata:
                self.features = self.metadata["features"]

    def _load_model(self) -> None:
        if self.model_path.exists():
            self.booster = xgb.Booster()
            self.booster.load_model(str(self.model_path))

    def _load_zone_cache(self) -> None:
        candidates = [
            Path(__file__).resolve().parent.parent.parent / "datasets" / "processed" / "ner_zone_predictions.csv",
            Path.cwd() / "datasets" / "processed" / "ner_zone_predictions.csv",
        ]
        for c in candidates:
            if c.exists():
                try:
                    df = pd.read_csv(c)
                    for _, row in df.iterrows():
                        zid = str(row["zone_id"])
                        feats = {f: float(row[f]) for f in self.features if f in row and pd.notna(row[f])}
                        self.zone_cache[zid] = feats
                    break
                except Exception:
                    pass

    def get_baseline_features(self, zone_id: str) -> dict[str, float]:
        """Return baseline features for a zone or realistic regional defaults."""
        if zone_id in self.zone_cache:
            return dict(self.zone_cache[zone_id])

        demo_archetypes: dict[str, dict[str, float]] = {
            "A17": {"elevation": 540.0, "slope": 35.0, "aspect": 180.0, "curvature": 0.05, "land_cover_code": 2.0, "historical_landslide_density": 0.75},
            "B05": {"elevation": 560.0, "slope": 28.0, "aspect": 160.0, "curvature": 0.03, "land_cover_code": 2.0, "historical_landslide_density": 0.50},
            "C12": {"elevation": 570.0, "slope": 24.0, "aspect": 150.0, "curvature": 0.02, "land_cover_code": 3.0, "historical_landslide_density": 0.40},
            "D03": {"elevation": 580.0, "slope": 18.0, "aspect": 140.0, "curvature": 0.01, "land_cover_code": 1.0, "historical_landslide_density": 0.20},
            "E09": {"elevation": 530.0, "slope": 10.0, "aspect": 120.0, "curvature": 0.00, "land_cover_code": 1.0, "historical_landslide_density": 0.05},
            "F01": {"elevation": 510.0, "slope": 8.0, "aspect": 110.0, "curvature": 0.00, "land_cover_code": 1.0, "historical_landslide_density": 0.02},
        }

        base = demo_archetypes.get(zone_id, {
            "elevation": 600.0,
            "slope": 20.0,
            "aspect": 150.0,
            "curvature": 0.01,
            "land_cover_code": 2.0,
            "historical_landslide_density": 0.15,
        })

        defaults: dict[str, float] = {
            "rainfall_1h": 0.0,
            "rainfall_3h": 0.0,
            "rainfall_6h": 0.0,
            "rainfall_12h": 0.0,
            "rainfall_24h": 0.0,
            "rainfall_3day": 0.0,
            "rainfall_7day": 0.0,
            "soil_moisture_0_7cm": 0.25,
            "soil_moisture_7_28cm": 0.25,
            "earthquake_count_7d": 0.0,
            "nearest_eq_distance_km": 500.0,
            "max_eq_magnitude": 0.0,
        }
        defaults.update(base)
        return defaults

    def predict(self, zone_id: str, overrides: dict[str, Any] | None = None) -> PredictionResult:
        """Run ML prediction with optional real-time overrides."""
        feat_dict = self.get_baseline_features(zone_id)
        overrides = overrides or {}

        if "rainfall_mm_hr" in overrides and overrides["rainfall_mm_hr"] is not None:
            r_rate = float(overrides["rainfall_mm_hr"])
            feat_dict["rainfall_1h"] = r_rate
            feat_dict["rainfall_3h"] = round(r_rate * 2.2, 2)
            feat_dict["rainfall_6h"] = round(r_rate * 3.5, 2)
            feat_dict["rainfall_12h"] = round(r_rate * 4.8, 2)
            feat_dict["rainfall_24h"] = round(r_rate * 6.5, 2)
            feat_dict["rainfall_3day"] = round(max(feat_dict.get("rainfall_3day", 0.0), r_rate * 8.0), 2)
            feat_dict["rainfall_7day"] = round(max(feat_dict.get("rainfall_7day", 0.0), r_rate * 10.0), 2)

        if "soil_moisture" in overrides and overrides["soil_moisture"] is not None:
            sm_val = float(overrides["soil_moisture"])
            sm_ratio = sm_val / 100.0 if sm_val > 1.0 else sm_val
            feat_dict["soil_moisture_0_7cm"] = round(sm_ratio, 3)
            feat_dict["soil_moisture_7_28cm"] = round(sm_ratio * 0.95, 3)

        for f in self.features:
            if f in overrides and overrides[f] is not None:
                feat_dict[f] = float(overrides[f])

        df_row = pd.DataFrame([{col: feat_dict.get(col, 0.0) for col in self.features}])

        raw_prob = 0.05
        shap_values: dict[str, float] = {}

        if self.booster is not None:
            dmatrix = xgb.DMatrix(df_row)
            preds = self.booster.predict(dmatrix)
            raw_prob = float(preds[0])

            contribs = self.booster.predict(dmatrix, pred_contribs=True)[0]
            for i, col in enumerate(self.features):
                shap_values[col] = float(contribs[i])

        r24 = feat_dict.get("rainfall_24h", 0.0)
        r7d = feat_dict.get("rainfall_7day", 0.0)
        sm0 = feat_dict.get("soil_moisture_0_7cm", 0.20)
        slp = feat_dict.get("slope", 20.0)
        susc = feat_dict.get("historical_landslide_density", 0.0)
        eq_d = feat_dict.get("nearest_eq_distance_km", 500.0)
        eq_m = feat_dict.get("max_eq_magnitude", 0.0)

        rain_score = float(np.clip(r24 / 80.0, 0, 1) * 0.5 + np.clip(r7d / 200.0, 0, 1) * 0.5)
        sm_score = float(np.clip((sm0 - 0.10) / 0.35, 0, 1))
        slope_score = float(np.clip(slp / 55.0, 0, 1))
        susc_score = float(np.clip(susc, 0, 1))
        eq_score = float(np.clip(eq_m / 7.0, 0, 1) * np.clip(1.0 - eq_d / 300.0, 0, 1))

        cal_score = (
            0.35 * rain_score
            + 0.25 * sm_score
            + 0.20 * slope_score
            + 0.10 * susc_score
            + 0.05 * eq_score
            + 0.05 * raw_prob
        )
        cal_score = float(np.clip(cal_score, 0.0, 1.0))
        score_pct = round(cal_score * 100.0, 1)

        if score_pct >= 75.0:
            risk_tier = "critical"
        elif score_pct >= 50.0:
            risk_tier = "high"
        elif score_pct >= 25.0:
            risk_tier = "moderate"
        else:
            risk_tier = "safe"

        confidence = round(float(min(99.0, max(72.0, 70.0 + abs(score_pct - 50.0) * 0.5))), 1)

        factors = self._build_factor_explanations(feat_dict, shap_values, rain_score, sm_score, slope_score)

        return PredictionResult(
            risk=risk_tier,
            score=score_pct,
            confidence=confidence,
            factors=factors,
            ml_probability=round(raw_prob, 4),
            shap_factors={k: round(v, 4) for k, v in sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:8]},
            feature_values=feat_dict,
        )

    def _build_factor_explanations(
        self,
        features: dict[str, float],
        shap: dict[str, float],
        rain_score: float,
        sm_score: float,
        slope_score: float,
    ) -> list[str]:
        explanations: list[tuple[float, str]] = []

        r24 = features.get("rainfall_24h", 0.0)
        if r24 >= 50.0 or rain_score > 0.6:
            explanations.append((rain_score * 1.5, f"Heavy cumulative rainfall ({r24:g} mm/24h) — High Impact"))
        elif r24 >= 25.0:
            explanations.append((rain_score, f"Moderate rainfall accumulation ({r24:g} mm/24h) — Moderate Impact"))

        sm = features.get("soil_moisture_0_7cm", 0.0)
        if sm >= 0.40 or sm_score > 0.6:
            explanations.append((sm_score * 1.3, f"Saturated topsoil moisture ({sm:.2f} m³/m³) — High Impact"))
        elif sm >= 0.28:
            explanations.append((sm_score, f"Elevated soil moisture ({sm:.2f} m³/m³) — Moderate Impact"))

        slp = features.get("slope", 0.0)
        if slp >= 30.0:
            explanations.append((slope_score * 1.2, f"Steep terrain slope ({slp:g}°) — High Impact"))
        elif slp >= 20.0:
            explanations.append((slope_score, f"Moderate incline slope ({slp:g}°) — Moderate Impact"))

        susc = features.get("historical_landslide_density", 0.0)
        if susc >= 0.4:
            explanations.append((susc, "Known historical landslide zone — Moderate Impact"))

        eq_m = features.get("max_eq_magnitude", 0.0)
        eq_d = features.get("nearest_eq_distance_km", 500.0)
        if eq_m >= 4.0 and eq_d <= 200.0:
            explanations.append((eq_m / 10.0, f"Recent seismic activity (M{eq_m:g}, {eq_d:g}km) — Secondary Driver"))

        if shap:
            sorted_shap = sorted(shap.items(), key=lambda x: x[1], reverse=True)
            for feat, val in sorted_shap:
                if val > 0.15 and len(explanations) < 5:
                    human_name = self.HUMAN_READABLE_NAMES.get(feat, feat.replace("_", " ").title())
                    fval = features.get(feat, 0.0)
                    item = (val, f"{human_name} ({fval:g}) — Model SHAP Factor")
                    if not any(human_name in e[1] for e in explanations):
                        explanations.append(item)

        explanations.sort(key=lambda x: x[0], reverse=True)
        results = [e[1] for e in explanations[:5]]
        return results or ["Stable conditions across environmental and terrain metrics"]


_ml_engine_instance: MLEngine | None = None


def get_ml_engine() -> MLEngine:
    """Return singleton instance of MLEngine."""
    global _ml_engine_instance
    if _ml_engine_instance is None:
        _ml_engine_instance = MLEngine()
    return _ml_engine_instance
