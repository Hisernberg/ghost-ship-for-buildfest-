from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np

FEATURE_COLUMNS = [
    "quantity_mismatch",
    "value_mismatch",
    "origin_match",
    "burst_count",
    "submission_hour",
    "account_age",
    "trust_score",
    "kyc_verified",
    "linked_company",
    "shared_director",
    "temperature_anomaly",
    "density_anomaly",
    "route_risk_score",
    "pickup_attempts",
    "driver_verified",
    "value_gap_ratio",
]

MODEL_PATH = Path(__file__).resolve().parent.parent / "artifacts" / "model.pkl"
_MODEL_BUNDLE = None


def _to_float(value, default=0.0):
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def _to_bool_int(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value != 0)
    if isinstance(value, str):
        return int(value.strip().lower() in {"1", "true", "yes"})
    return 0


def extract_features(shipment: Dict[str, Any]) -> List[float]:
    igm_qty = _to_float(shipment.get("igm_quantity"))
    bol_qty = _to_float(shipment.get("bol_quantity"))
    inv_qty = _to_float(shipment.get("invoice_quantity"))
    quantities = [q for q in [igm_qty, bol_qty, inv_qty] if q > 0]
    quantity_mismatch = (
        (max(quantities) - min(quantities)) / max(quantities)
        if quantities and max(quantities) > 0
        else 0
    )

    igm_val = _to_float(shipment.get("igm_value"))
    bol_val = _to_float(shipment.get("bol_value"))
    inv_val = _to_float(shipment.get("invoice_value"))
    values = [v for v in [igm_val, bol_val, inv_val] if v > 0]
    value_mismatch = (
        (max(values) - min(values)) / max(values) if values and max(values) > 0 else 0
    )

    actual = str(shipment.get("actual_origin_country", "")).strip().lower()
    declared = str(shipment.get("declared_origin_country", "")).strip().lower()
    origin_match = 1 if actual and declared and actual == declared else 0

    burst_count = _to_float(shipment.get("burst_count"))
    submission_hour = _to_float(shipment.get("submission_hour"))
    account_age = _to_float(shipment.get("account_age_days"))
    trust_score = _to_float(shipment.get("company_trust_score"))
    kyc_verified = _to_bool_int(shipment.get("kyc_verified"))
    linked_company = 1 if shipment.get("linked_company_id") else 0
    shared_director = _to_bool_int(shipment.get("shared_director_flag"))
    route_risk_score = _to_float(shipment.get("route_risk_score")) / 100.0
    pickup_attempts = _to_float(shipment.get("pickup_attempts"))
    driver_verified = _to_bool_int(shipment.get("driver_verified"))

    commodity = str(shipment.get("commodity", "")).strip().lower()
    temperature_celsius = _to_float(shipment.get("temperature_celsius"))
    temperature_anomaly = 1.0 if "banana" in commodity and temperature_celsius < 10 else 0.0

    weight_kg = _to_float(shipment.get("weight_kg"))
    volume_cbm = _to_float(shipment.get("volume_cbm"))
    density = weight_kg / volume_cbm if volume_cbm > 0 else 0.0
    density_anomaly = min(density / 2000.0, 2.0) if density > 0 else 0.0

    declared_value = _to_float(shipment.get("declared_value_usd"))
    physical_value = _to_float(shipment.get("physical_value_usd"))
    reference_value = max(declared_value, physical_value)
    value_gap_ratio = (
        abs(declared_value - physical_value) / reference_value if reference_value > 0 else 0.0
    )

    return [
        quantity_mismatch,
        value_mismatch,
        float(origin_match),
        burst_count,
        submission_hour,
        account_age,
        trust_score,
        float(kyc_verified),
        float(linked_company),
        float(shared_director),
        temperature_anomaly,
        density_anomaly,
        route_risk_score,
        pickup_attempts,
        float(driver_verified),
        value_gap_ratio,
    ]


def _load_model():
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError("Model not found. Run: python train.py")
        _MODEL_BUNDLE = joblib.load(MODEL_PATH)
    return _MODEL_BUNDLE


def predict(shipment: Dict[str, Any]) -> float:
    bundle = _load_model()
    model = bundle["model"]
    x = np.array([extract_features(shipment)], dtype=float)
    return float(model.predict_proba(x)[0][1])
