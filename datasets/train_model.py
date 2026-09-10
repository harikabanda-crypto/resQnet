"""
Step 2 — Train XGBoost landslide risk model.

Input:  datasets/ml_ready/ner_feature_matrix.csv
Output: datasets/ml_ready/resqnet_model.json      (XGBoost model)
        datasets/ml_ready/model_metadata.json     (thresholds, feature list, metrics)
        datasets/ml_ready/feature_importance.csv  (SHAP mean absolute values)

Usage:
    python3 train_model.py
"""

import json
import warnings
import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (roc_auc_score, classification_report,
                             confusion_matrix, average_precision_score)
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

BASE   = Path(__file__).parent
ML_DIR = BASE / "ml_ready"

# ── Load feature matrix ────────────────────────────────────────────────────
df = pd.read_csv(ML_DIR / "ner_feature_matrix.csv")
print(f"Loaded {len(df)} rows | positives: {df['landslide_occurrence'].sum()}")

FEATURE_COLS = [
    "elevation", "slope", "aspect", "curvature",
    "land_cover_code", "historical_landslide_density",
    "rainfall_1h", "rainfall_3h", "rainfall_6h", "rainfall_12h",
    "rainfall_24h", "rainfall_3day", "rainfall_7day",
    "soil_moisture_0_7cm", "soil_moisture_7_28cm",
    "earthquake_count_7d", "nearest_eq_distance_km", "max_eq_magnitude",
]
TARGET = "landslide_occurrence"

# Keep only columns present in data
FEATURE_COLS = [c for c in FEATURE_COLS if c in df.columns]
X = df[FEATURE_COLS].copy()
y = df[TARGET].astype(int)

# Fill remaining NaNs with column medians
X = X.fillna(X.median())

print(f"Features: {FEATURE_COLS}")
print(f"Class balance — 0: {(y==0).sum()}  1: {(y==1).sum()}")

# ── Train/test split ──────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Class weight ──────────────────────────────────────────────────────────
neg_pos_ratio = (y_train == 0).sum() / max((y_train == 1).sum(), 1)

# ── XGBoost model ─────────────────────────────────────────────────────────
model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=neg_pos_ratio,
    eval_metric="logloss",
    random_state=42,
    n_jobs=-1,
    use_label_encoder=False,
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

# ── Evaluation ────────────────────────────────────────────────────────────
y_prob  = model.predict_proba(X_test)[:, 1]
y_pred  = (y_prob >= 0.5).astype(int)
auc_roc = roc_auc_score(y_test, y_prob)
auc_pr  = average_precision_score(y_test, y_prob)
cv_auc  = cross_val_score(model, X, y, cv=StratifiedKFold(5), scoring="roc_auc", n_jobs=-1).mean()

print(f"\n── Evaluation ──────────────────────────────────")
print(f"AUC-ROC   : {auc_roc:.4f}")
print(f"AUC-PR    : {auc_pr:.4f}")
print(f"CV AUC-ROC: {cv_auc:.4f}  (5-fold)")
print(classification_report(y_test, y_pred, target_names=["No Landslide", "Landslide"]))
cm = confusion_matrix(y_test, y_pred)
print(f"Confusion matrix:\n{cm}")

# ── SHAP feature importance ────────────────────────────────────────────────
print("\nComputing SHAP values (sample of 500)...")
sample = X_test.sample(min(500, len(X_test)), random_state=42)
explainer   = shap.TreeExplainer(model)
shap_values = explainer.shap_values(sample)

shap_importance = pd.DataFrame({
    "feature":    FEATURE_COLS,
    "shap_mean_abs": np.abs(shap_values).mean(axis=0),
}).sort_values("shap_mean_abs", ascending=False)

shap_importance.to_csv(ML_DIR / "feature_importance.csv", index=False)
print("SHAP feature importance:")
print(shap_importance.to_string(index=False))

# ── Save model ────────────────────────────────────────────────────────────
model_path = ML_DIR / "resqnet_model.json"
model.save_model(str(model_path))

# ── Save metadata ─────────────────────────────────────────────────────────
metadata = {
    "model_type":    "XGBoostClassifier",
    "trained_at":    pd.Timestamp.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "n_estimators":  300,
    "features":      FEATURE_COLS,
    "n_features":    len(FEATURE_COLS),
    "training_rows": len(X_train),
    "test_rows":     len(X_test),
    "metrics": {
        "auc_roc":    round(auc_roc, 4),
        "auc_pr":     round(auc_pr, 4),
        "cv_auc_roc": round(cv_auc, 4),
    },
    "risk_thresholds": {
        "LOW":      [0.00, 0.25],
        "MODERATE": [0.25, 0.50],
        "HIGH":     [0.50, 0.75],
        "CRITICAL": [0.75, 1.00],
    },
    "shap_top5": shap_importance.head(5)["feature"].tolist(),
}

with open(ML_DIR / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ Model saved       → {model_path.name}")
print(f"✅ Metadata saved    → model_metadata.json")
print(f"✅ SHAP importance   → feature_importance.csv")
