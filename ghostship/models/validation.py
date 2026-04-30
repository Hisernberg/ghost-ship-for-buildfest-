"""Pydantic validation models for GhostShip."""

from typing import Optional, List
from pydantic import BaseModel, Field, validator, field_validator, ConfigDict


ISO_COUNTRIES = {
    "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
    "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO",
    "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO",
    "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG",
    "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE",
    "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA",
    "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO",
    "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU",
    "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD",
    "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE",
    "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL",
    "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM",
    "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD",
    "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN",
    "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG",
    "VI", "WF", "EH", "YE", "ZM", "ZW",
}


class ShipmentValidationError(Exception):
    """Raised when shipment validation fails."""
    pass


class AnalysisSettings(BaseModel):
    """Analysis configuration settings."""
    model_config = ConfigDict(strict=False)
    
    low_risk_max: int = Field(default=30, ge=0, le=100, description="Maximum score for low risk")
    medium_risk_max: int = Field(default=70, ge=0, le=100, description="Maximum score for medium risk")
    quantity_mismatch_threshold: float = Field(default=0.05, ge=0.01, le=1.0)
    value_mismatch_threshold: float = Field(default=0.05, ge=0.01, le=1.0)
    density_threshold: float = Field(default=2000.0, ge=100.0)
    banana_temperature_floor: float = Field(default=10.0, ge=-20.0, le=40.0)
    
    @field_validator('medium_risk_max')
    @classmethod
    def medium_must_be_greater_than_low(cls, v: int, info) -> int:
        if 'low_risk_max' in info.data and v < info.data['low_risk_max']:
            return info.data['low_risk_max']
        return v


class ShipmentInput(BaseModel):
    """Validated shipment input model."""
    model_config = ConfigDict(strict=False, extra='allow')
    
    # Required fields
    shipment_id: str = Field(..., min_length=3, max_length=100, description="Unique shipment identifier")
    
    # Physical properties
    weight_kg: Optional[float] = Field(None, gt=0, lt=1000000, description="Weight in kilograms")
    volume_cbm: Optional[float] = Field(None, gt=0, lt=100000, description="Volume in cubic meters")
    temperature_celsius: Optional[float] = Field(None, ge=-100, le=100, description="Temperature in Celsius")
    commodity: Optional[str] = Field(None, min_length=1, max_length=200, description="Type of commodity")
    
    # Document quantities
    igm_quantity: Optional[float] = Field(None, ge=0, description="IGM quantity")
    bol_quantity: Optional[float] = Field(None, ge=0, description="BOL quantity")
    invoice_quantity: Optional[float] = Field(None, ge=0, description="Invoice quantity")
    
    # Document values
    igm_value: Optional[float] = Field(None, ge=0, description="IGM value in USD")
    bol_value: Optional[float] = Field(None, ge=0, description="BOL value in USD")
    invoice_value: Optional[float] = Field(None, ge=0, description="Invoice value in USD")
    declared_value_usd: Optional[float] = Field(None, ge=0, description="Declared value in USD")
    physical_value_usd: Optional[float] = Field(None, ge=0, description="Physical value in USD")
    
    # Origin/Destination
    actual_origin_country: Optional[str] = Field(None, max_length=100)
    declared_origin_country: Optional[str] = Field(None, max_length=100)
    destination_country: Optional[str] = Field(None, max_length=100)
    
    # Company/Entity info
    company_id: Optional[str] = Field(None, max_length=100)
    company_name: Optional[str] = Field(None, max_length=200)
    account_age_days: Optional[float] = Field(None, ge=0, description="Account age in days")
    company_trust_score: Optional[float] = Field(None, ge=0, le=100, description="Trust score 0-100")
    kyc_verified: Optional[int] = Field(None, ge=0, le=1, description="KYC verification status")
    
    # Behavioral indicators
    submission_hour: Optional[int] = Field(None, ge=0, le=23, description="Hour of submission (0-23)")
    burst_count: Optional[float] = Field(None, ge=0, description="Rapid submission count")
    
    # Network indicators
    linked_company_id: Optional[str] = Field(None, max_length=100)
    shared_director_flag: Optional[int] = Field(None, ge=0, le=1)
    
    # Additional fields
    pickup_attempts: Optional[float] = Field(None, ge=0)
    driver_verified: Optional[int] = Field(None, ge=0, le=1)
    route_risk_score: Optional[float] = Field(None, ge=0, le=100)
    
    # Labels (for training)
    is_anomalous: Optional[int] = Field(None, ge=0, le=1)
    fraud_type: Optional[str] = Field(None, max_length=100)
    
    @field_validator('actual_origin_country', 'declared_origin_country', 'destination_country')
    @classmethod
    def normalize_country(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip().upper()
    
    @field_validator('commodity')
    @classmethod
    def normalize_commodity(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip().lower()
    
    @field_validator('shipment_id', 'company_id', 'company_name')
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for engine processing."""
        return self.model_dump()


class DocumentUpload(BaseModel):
    """Document upload validation."""
    model_config = ConfigDict(strict=False)
    
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: Optional[str] = None
    size_bytes: int = Field(..., gt=0, le=50 * 1024 * 1024)  # Max 50MB
    
    @field_validator('filename')
    @classmethod
    def validate_extension(cls, v: str) -> str:
        allowed = {'.pdf', '.txt', '.png', '.jpg', '.jpeg', '.tif', '.tiff'}
        v_lower = v.lower()
        if not any(v_lower.endswith(ext) for ext in allowed):
            raise ValueError(f"File must be one of: {', '.join(allowed)}")
        return v


class CSVUpload(BaseModel):
    """CSV upload validation."""
    model_config = ConfigDict(strict=False)
    
    filename: str = Field(..., min_length=1, max_length=255)
    size_bytes: int = Field(..., gt=0, le=10 * 1024 * 1024)  # Max 10MB
    row_count: int = Field(..., gt=0, le=10000)  # Max 10k rows
    
    @field_validator('filename')
    @classmethod
    def validate_csv_extension(cls, v: str) -> str:
        if not v.lower().endswith('.csv'):
            raise ValueError("File must be a CSV")
        return v


def validate_shipment(data: dict) -> ShipmentInput:
    """
    Validate a shipment dictionary.
    
    Args:
        data: Raw shipment data dictionary
        
    Returns:
        Validated ShipmentInput model
        
    Raises:
        ShipmentValidationError: If validation fails
    """
    try:
        return ShipmentInput(**data)
    except Exception as e:
        raise ShipmentValidationError(f"Invalid shipment data: {e}") from e


def validate_shipments(data_list: List[dict]) -> List[ShipmentInput]:
    """
    Validate multiple shipments.
    
    Args:
        data_list: List of shipment dictionaries
        
    Returns:
        List of validated ShipmentInput models
    """
    validated = []
    errors = []
    
    for idx, data in enumerate(data_list):
        try:
            validated.append(ShipmentInput(**data))
        except Exception as e:
            errors.append(f"Row {idx + 1}: {e}")
    
    if errors:
        raise ShipmentValidationError(
            f"Validation failed for {len(errors)} shipments:\n" + "\n".join(errors[:10])
        )
    
    return validated
