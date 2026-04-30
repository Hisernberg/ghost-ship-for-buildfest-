"""Tests for Pydantic validation models."""

import pytest
from ghostship.models import (
    ShipmentInput,
    AnalysisSettings,
    validate_shipment,
    ShipmentValidationError,
)


class TestAnalysisSettings:
    """Test analysis settings validation."""

    def test_default_settings(self):
        settings = AnalysisSettings()
        assert settings.low_risk_max == 30
        assert settings.medium_risk_max == 70
        assert settings.quantity_mismatch_threshold == 0.05

    def test_medium_risk_cannot_be_less_than_low(self):
        settings = AnalysisSettings(low_risk_max=50, medium_risk_max=40)
        assert settings.medium_risk_max == 50  # Should be adjusted to low_risk_max

    def test_threshold_bounds(self):
        with pytest.raises(Exception):
            AnalysisSettings(quantity_mismatch_threshold=1.5)  # > 1.0
        
        with pytest.raises(Exception):
            AnalysisSettings(low_risk_max=-1)  # < 0


class TestShipmentInput:
    """Test shipment input validation."""

    def test_valid_shipment(self):
        shipment = ShipmentInput(
            shipment_id="SHP001",
            commodity="electronics",
            weight_kg=1000,
            declared_value_usd=50000,
        )
        assert shipment.shipment_id == "SHP001"
        assert shipment.commodity == "electronics"  # Normalized to lowercase

    def test_shipment_id_required(self):
        with pytest.raises(Exception):
            ShipmentInput()  # Missing required shipment_id

    def test_shipment_id_too_short(self):
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="AB")  # Min length is 3

    def test_weight_must_be_positive(self):
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", weight_kg=-100)

    def test_temperature_bounds(self):
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", temperature_celsius=150)

    def test_country_normalization(self):
        shipment = ShipmentInput(
            shipment_id="SHP001",
            actual_origin_country="singapore",
            declared_origin_country="SINGAPORE",
        )
        assert shipment.actual_origin_country == "SINGAPORE"
        assert shipment.declared_origin_country == "SINGAPORE"

    def test_commodity_normalization(self):
        shipment = ShipmentInput(
            shipment_id="SHP001",
            commodity="Electronics",
        )
        assert shipment.commodity == "electronics"

    def test_kyc_verified_bounds(self):
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", kyc_verified=2)

    def test_to_dict(self):
        shipment = ShipmentInput(
            shipment_id="SHP001",
            commodity="electronics",
            weight_kg=1000,
        )
        data = shipment.to_dict()
        assert data["shipment_id"] == "SHP001"
        assert data["commodity"] == "electronics"


class TestValidateShipment:
    """Test the validate_shipment helper function."""

    def test_valid_dict(self):
        data = {
            "shipment_id": "SHP001",
            "commodity": "electronics",
            "weight_kg": 1000,
        }
        result = validate_shipment(data)
        assert result.shipment_id == "SHP001"

    def test_invalid_dict_raises_error(self):
        data = {
            "shipment_id": "AB",  # Too short
        }
        with pytest.raises(ShipmentValidationError):
            validate_shipment(data)

    def test_extra_fields_allowed(self):
        data = {
            "shipment_id": "SHP001",
            "custom_field": "custom_value",
        }
        result = validate_shipment(data)
        assert result.shipment_id == "SHP001"


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_none_values_handled(self):
        shipment = ShipmentInput(
            shipment_id="SHP001",
            commodity=None,
            weight_kg=None,
        )
        assert shipment.commodity is None
        assert shipment.weight_kg is None

    def test_whitespace_stripping(self):
        shipment = ShipmentInput(
            shipment_id="  SHP001  ",
            company_name="  Test Company  ",
        )
        assert shipment.shipment_id == "SHP001"
        assert shipment.company_name == "Test Company"

    def test_trust_score_bounds(self):
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", company_trust_score=150)
        
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", company_trust_score=-10)

    def test_submission_hour_bounds(self):
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", submission_hour=25)
        
        with pytest.raises(Exception):
            ShipmentInput(shipment_id="SHP001", submission_hour=-1)
