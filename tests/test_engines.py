"""Tests for detection engines."""

import pytest
from ghostship.engines import (
    PhysicsEngine,
    DocumentEngine,
    BehaviorEngine,
    NetworkEngine,
    ScoringEngine,
)


class TestPhysicsEngine:
    """Test physics detection engine."""

    def test_banana_temperature_anomaly(self):
        engine = PhysicsEngine()
        shipment = {
            "commodity": "bananas",
            "temperature_celsius": -18,
        }
        result = engine.check(shipment)
        assert result["score"] > 0.9
        assert "temperature_anomaly" in result["details"]

    def test_banana_normal_temperature(self):
        engine = PhysicsEngine()
        shipment = {
            "commodity": "bananas",
            "temperature_celsius": 15,
        }
        result = engine.check(shipment)
        assert result["score"] == 0
        assert result["details"] == {}

    def test_density_anomaly(self):
        engine = PhysicsEngine()
        shipment = {
            "weight_kg": 5000,
            "volume_cbm": 1,
        }
        result = engine.check(shipment)
        assert result["score"] > 0.8
        assert "density_anomaly" in result["details"]

    def test_normal_density(self):
        engine = PhysicsEngine()
        shipment = {
            "weight_kg": 1000,
            "volume_cbm": 10,
        }
        result = engine.check(shipment)
        assert result["score"] == 0

    def test_custom_temperature_threshold(self):
        engine = PhysicsEngine({"banana_temperature_floor": 15})
        shipment = {
            "commodity": "bananas",
            "temperature_celsius": 12,
        }
        result = engine.check(shipment)
        assert result["score"] > 0.9


class TestDocumentEngine:
    """Test document detection engine."""

    def test_quantity_mismatch(self):
        engine = DocumentEngine()
        shipment = {
            "igm_quantity": 100,
            "bol_quantity": 85,
            "invoice_quantity": 120,
        }
        result = engine.check(shipment)
        assert result["score"] > 0
        assert "quantity_mismatch" in result["details"]

    def test_value_mismatch(self):
        engine = DocumentEngine()
        shipment = {
            "igm_value": 50000,
            "bol_value": 45000,
            "invoice_value": 60000,
        }
        result = engine.check(shipment)
        assert result["score"] > 0
        assert "value_mismatch" in result["details"]

    def test_origin_fraud(self):
        engine = DocumentEngine()
        shipment = {
            "actual_origin_country": "North Korea",
            "declared_origin_country": "Vietnam",
        }
        result = engine.check(shipment)
        assert result["score"] > 0.8
        assert "origin_fraud" in result["details"]

    def test_matching_origins(self):
        engine = DocumentEngine()
        shipment = {
            "actual_origin_country": "Singapore",
            "declared_origin_country": "Singapore",
        }
        result = engine.check(shipment)
        assert result["score"] == 0

    def test_no_quantities_provided(self):
        engine = DocumentEngine()
        shipment = {}
        result = engine.check(shipment)
        assert result["score"] == 0

    def test_custom_threshold(self):
        engine = DocumentEngine({"quantity_mismatch_threshold": 0.5})
        shipment = {
            "igm_quantity": 100,
            "bol_quantity": 80,  # 20% deviation
        }
        result = engine.check(shipment)
        # Should not flag with 0.5 threshold
        assert result["score"] == 0


class TestBehaviorEngine:
    """Test behavior detection engine."""

    def test_burst_activity(self):
        engine = BehaviorEngine()
        shipment = {"burst_count": 10}
        result = engine.check(shipment)
        assert result["score"] > 0
        assert "burst_activity" in result["details"]

    def test_off_hours_submission(self):
        engine = BehaviorEngine()
        shipment = {"submission_hour": 3}
        result = engine.check(shipment)
        assert result["score"] > 0.5
        assert "off_hours" in result["details"]

    def test_new_account_high_value(self):
        engine = BehaviorEngine()
        shipment = {
            "account_age_days": 15,
            "declared_value_usd": 100000,
        }
        result = engine.check(shipment)
        assert result["score"] > 0.5
        assert "new_account_high_value" in result["details"]

    def test_low_trust_score(self):
        engine = BehaviorEngine()
        shipment = {"company_trust_score": 20}
        result = engine.check(shipment)
        assert result["score"] > 0.3
        assert "low_trust" in result["details"]

    def test_unverified_kyc(self):
        engine = BehaviorEngine()
        shipment = {"kyc_verified": 0}
        result = engine.check(shipment)
        assert result["score"] > 0
        assert "unverified_kyc" in result["details"]

    def test_normal_behavior(self):
        engine = BehaviorEngine()
        shipment = {
            "burst_count": 1,
            "submission_hour": 10,
            "account_age_days": 365,
            "company_trust_score": 80,
            "kyc_verified": 1,
        }
        result = engine.check(shipment)
        assert result["score"] == 0


class TestNetworkEngine:
    """Test network detection engine."""

    def test_linked_company(self):
        engine = NetworkEngine()
        shipment = {"linked_company_id": "COMP_SUSPICIOUS"}
        result = engine.check(shipment)
        assert result["score"] > 0
        assert "linked_company" in result["details"]

    def test_shared_director(self):
        engine = NetworkEngine()
        shipment = {"shared_director_flag": 1}
        result = engine.check(shipment)
        assert result["score"] > 0
        assert "shared_director" in result["details"]

    def test_linked_to_fraud(self):
        engine = NetworkEngine()
        shipment = {"linked_company_id": "COMP_FRAUD"}
        all_shipments = [
            {"company_id": "COMP_FRAUD", "is_anomalous": 1},
        ]
        result = engine.check(shipment, all_shipments)
        assert result["score"] > 0.7
        assert "linked_to_fraud" in result["details"]

    def test_no_network_flags(self):
        engine = NetworkEngine()
        shipment = {}
        result = engine.check(shipment)
        assert result["score"] == 0


class TestScoringEngine:
    """Test scoring engine."""

    def test_low_risk_classification(self):
        engine = ScoringEngine()
        results = {
            "physics": {"score": 0},
            "document": {"score": 0},
            "behavior": {"score": 0},
            "network": {"score": 0},
        }
        final = engine.calculate(results)
        assert final["classification"] == "LOW"
        assert final["recommended_action"] == "Direct clearance"

    def test_high_risk_classification(self):
        engine = ScoringEngine()
        results = {
            "physics": {"score": 0.9},
            "document": {"score": 0.9},
            "behavior": {"score": 0.9},
            "network": {"score": 0.9},
        }
        final = engine.calculate(results)
        assert final["classification"] == "HIGH"
        assert final["recommended_action"] == "Full inspection"

    def test_ml_probability_blend(self):
        engine = ScoringEngine()
        results = {
            "physics": {"score": 0.5},
            "document": {"score": 0.5},
            "behavior": {"score": 0.5},
            "network": {"score": 0.5},
        }
        final = engine.calculate(results, ml_probability=0.8)
        # Should blend ML and rule scores
        assert "risk_score" in final
        assert 0 <= final["risk_score"] <= 100

    def test_engine_breakdown(self):
        engine = ScoringEngine()
        results = {
            "physics": {"score": 0.5},
            "document": {"score": 0.3},
            "behavior": {"score": 0.7},
            "network": {"score": 0.2},
        }
        final = engine.calculate(results)
        assert "engine_breakdown" in final
        assert final["engine_breakdown"]["physics"] == 0.5
