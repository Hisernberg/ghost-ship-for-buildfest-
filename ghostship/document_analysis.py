from __future__ import annotations

import json
import os
import re
import requests
import structlog
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = structlog.get_logger("ghostship.document_analysis")

_HF_MODEL = "google/gemma-4-E2B-it"
_SPACE_URL = os.environ.get("GHOSTSHIP_SPACE_URL", "").rstrip("/")
_HF_API_URL = (
    f"{_SPACE_URL}/v1/chat/completions"
    if _SPACE_URL
    else f"https://api-inference.huggingface.co/models/{_HF_MODEL}/v1/chat/completions"
)

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - optional dependency until installed
    PdfReader = None

try:
    from PIL import Image
except ImportError:  # pragma: no cover - optional dependency until installed
    Image = None

try:
    import pytesseract
except ImportError:  # pragma: no cover - optional dependency until installed
    pytesseract = None


TESSERACT_CANDIDATE = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if pytesseract is not None and TESSERACT_CANDIDATE.exists():
    pytesseract.pytesseract.tesseract_cmd = str(TESSERACT_CANDIDATE)


DOC_TYPES = ("invoice", "packing_list", "bill_of_lading")
PERISHABLE_KEYWORDS = ("banana", "bananas", "fresh", "fruit", "produce", "avocado")
FIELD_ALIASES = {
    "container_id": [
        "container id",
        "container no",
        "container number",
        "container #",
        "container",
        "cntr no",
    ],
    "shipment_id": ["shipment id", "shipment no", "reference no", "reference number", "booking no"],
    "commodity": ["commodity", "product", "product description", "cargo description", "commodity description"],
    "origin": ["origin", "country of origin", "port of loading", "place of receipt"],
    "destination": ["destination", "port of discharge", "final destination", "destination port"],
    "temperature_celsius": ["temperature", "storage temperature", "temp"],
}


@dataclass
class Issue:
    code: str
    severity: str
    message: str
    score: float
    category: str


class DocumentProcessingError(RuntimeError):
    pass


def _decode_text_file(raw_bytes: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return raw_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise DocumentProcessingError("Unable to decode uploaded text file")


def _extract_from_pdf(raw_bytes: bytes) -> str:
    if PdfReader is None:
        raise DocumentProcessingError("PDF extraction dependency missing. Install pypdf.")

    try:
        reader = PdfReader(BytesIO(raw_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if text:
            return text
        raise DocumentProcessingError(
            "PDF contains no embedded text. OCR is required for scanned PDFs."
        )
    except DocumentProcessingError:
        raise
    except Exception:
        # File may be a text file saved with a .pdf extension — try decoding it
        try:
            return _decode_text_file(raw_bytes)
        except DocumentProcessingError:
            raise DocumentProcessingError(
                "Could not read this file. Please upload a valid PDF or text file."
            )


def _extract_from_image(raw_bytes: bytes) -> str:
    if Image is None or pytesseract is None:
        raise DocumentProcessingError(
            "Image OCR dependencies missing. Install Pillow and pytesseract, and ensure Tesseract is available."
        )
    image = Image.open(BytesIO(raw_bytes))
    text = pytesseract.image_to_string(image)
    if not text.strip():
        raise DocumentProcessingError("OCR could not extract text from the uploaded image")
    return text


def extract_text(file_storage) -> str:
    filename = (file_storage.filename or "uploaded_document").lower()
    suffix = Path(filename).suffix
    raw_bytes = file_storage.read()
    file_storage.stream.seek(0)

    if suffix in {".txt", ".text", ".md"}:
        return _decode_text_file(raw_bytes)
    if suffix == ".pdf":
        return _extract_from_pdf(raw_bytes)
    if suffix in {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}:
        return _extract_from_image(raw_bytes)

    raise DocumentProcessingError(
        f"Unsupported file type '{suffix or 'unknown'}'. Use PDF, TXT, or image files."
    )


def _search_alias_value(text: str, aliases: List[str]) -> Optional[str]:
    patterns = []
    for alias in aliases:
        safe = re.escape(alias)
        patterns.extend(
            [
                rf"{safe}\s*[:#-]\s*(.+)",
                rf"{safe}\s+(.+)",
            ]
        )

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = match.group(1).strip().splitlines()[0].strip(" .")
            if value:
                return value
    return None


def _extract_float(patterns: List[str], text: str) -> Optional[float]:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = re.sub(r"[^\d.\-]", "", match.group(1))
            if value:
                try:
                    return float(value)
                except ValueError:
                    continue
    return None


def _extract_int(patterns: List[str], text: str) -> Optional[int]:
    value = _extract_float(patterns, text)
    if value is None:
        return None
    return int(round(value))


def _extract_container_id(text: str) -> Optional[str]:
    alias_value = _search_alias_value(text, FIELD_ALIASES["container_id"])
    if alias_value:
        return alias_value.split()[0].upper()

    match = re.search(r"\b[A-Z]{4}\d{7}\b", text, flags=re.IGNORECASE)
    if match:
        return match.group(0).upper()
    return None


def _extract_commodity(text: str) -> Optional[str]:
    alias_value = _search_alias_value(text, FIELD_ALIASES["commodity"])
    if alias_value:
        return alias_value
    return None


def _hf_extract_fields(text: str, document_type: str) -> Dict[str, object]:
    """Use Gemma via HF Inference API to fill any fields the regex parser missed."""
    token = os.environ.get("HF_TOKEN")
    if not token:
        return {}

    prompt = f"""You are a customs document parser. Extract structured data from this {document_type.replace('_', ' ')} shipping document.

Return ONLY a valid JSON object with these exact keys (use null for any field not found):
{{
  "container_id": "string - container number like ABCD1234567",
  "shipment_id": "string - shipment/booking/reference number",
  "commodity": "string - cargo description",
  "quantity": number,
  "weight_kg": number,
  "volume_cbm": number,
  "declared_value": number,
  "temperature_celsius": number,
  "origin": "string - country or port of origin",
  "destination": "string - destination country or port"
}}

Document text:
{text[:3000]}

Respond with only the JSON object, no explanation."""

    try:
        headers = {"Content-Type": "application/json"}
        if not _SPACE_URL:
            headers["Authorization"] = f"Bearer {token}"

        response = requests.post(
            _HF_API_URL,
            headers=headers,
            json={
                "model": _HF_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 400,
                "temperature": 0.1,
            },
            timeout=60,
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"].strip()
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            logger.info("hf_field_extraction_success", doc_type=document_type)
            return parsed
    except Exception as exc:
        logger.warning("hf_field_extraction_failed", doc_type=document_type, error=str(exc))
    return {}


def parse_document(text: str, document_type: str) -> Dict[str, Optional[object]]:
    normalized = re.sub(r"\r", "", text)

    quantity = _extract_int(
        [
            r"quantity\s*[:#-]?\s*([\d,]+)",
            r"([\d,]+)\s*(?:units|cartons|crates|packages|pkg|pkgs)",
            r"number of packages\s*[:#-]?\s*([\d,]+)",
        ],
        normalized,
    )
    weight = _extract_float(
        [
            r"gross weight\s*[:#-]?\s*([\d,\.]+)\s*(?:kg|kgs|kilograms)",
            r"net weight\s*[:#-]?\s*([\d,\.]+)\s*(?:kg|kgs|kilograms)",
            r"weight\s*[:#-]?\s*([\d,\.]+)\s*(?:kg|kgs|kilograms)",
        ],
        normalized,
    )
    volume = _extract_float(
        [
            r"(?:volume|measurement|cbm|m3)\s*[:#-]?\s*([\d,\.]+)\s*(?:cbm|m3)?",
            r"([\d,\.]+)\s*(?:cbm|m3)",
        ],
        normalized,
    )
    value = _extract_float(
        [
            r"(?:invoice value|declared value|cargo value|total value|fob value|value)\s*[:#-]?\s*(?:usd|us\$|\$)?\s*([\d,\.]+)",
            r"(?:usd|us\$|\$)\s*([\d,\.]+)",
        ],
        normalized,
    )
    temperature = _extract_float(
        [
            r"(?:temperature|storage temperature|temp)\s*[:#-]?\s*(-?[\d,\.]+)\s*(?:c|c|celsius)?",
        ],
        normalized,
    )

    regex_result = {
        "document_type": document_type,
        "container_id": _extract_container_id(normalized),
        "shipment_id": _search_alias_value(normalized, FIELD_ALIASES["shipment_id"]),
        "commodity": _extract_commodity(normalized),
        "quantity": quantity,
        "weight_kg": weight,
        "volume_cbm": volume,
        "declared_value": value,
        "temperature_celsius": temperature,
        "origin": _search_alias_value(normalized, FIELD_ALIASES["origin"]),
        "destination": _search_alias_value(normalized, FIELD_ALIASES["destination"]),
        "raw_text": normalized.strip(),
    }

    # Fill any missing fields with Gemini extraction
    missing = [k for k, v in regex_result.items() if v is None and k not in ("document_type", "raw_text")]
    if missing:
        hf_fields = _hf_extract_fields(text, document_type)
        for field in missing:
            if hf_fields.get(field) is not None:
                regex_result[field] = hf_fields[field]

    return regex_result


def _pick_consensus_value(documents: Dict[str, Dict[str, object]], field: str) -> Optional[object]:
    values = [doc.get(field) for doc in documents.values() if doc.get(field) not in (None, "")]
    if not values:
        return None
    counts: Dict[str, int] = {}
    for value in values:
        key = str(value)
        counts[key] = counts.get(key, 0) + 1
    winner = max(counts, key=counts.get)
    for value in values:
        if str(value) == winner:
            return value
    return values[0]


def _percentage_gap(values: List[float]) -> float:
    positives = [value for value in values if value is not None and value > 0]
    if len(positives) < 2:
        return 0.0
    return (max(positives) - min(positives)) / max(positives)


def _severity_from_score(score: float) -> str:
    if score >= 0.75:
        return "HIGH"
    if score >= 0.4:
        return "MEDIUM"
    return "LOW"


def _classify_risk(score: int) -> Tuple[str, str]:
    if score >= 70:
        return "HIGH", "Physical inspection required"
    if score >= 35:
        return "MEDIUM", "Secondary document and compliance review"
    return "LOW", "Clear for processing"


def analyze_document_set(files: Dict[str, object]) -> Dict[str, object]:
    missing = [doc_type for doc_type in DOC_TYPES if doc_type not in files or not files[doc_type].filename]
    if missing:
        raise DocumentProcessingError(
            "Missing required documents: " + ", ".join(doc_type.replace("_", " ") for doc_type in missing)
        )

    extracted_docs: Dict[str, Dict[str, object]] = {}
    for doc_type in DOC_TYPES:
        text = extract_text(files[doc_type])
        parsed = parse_document(text, doc_type)
        extracted_docs[doc_type] = {
            "file_name": files[doc_type].filename,
            "text_excerpt": text[:1200],
            "parsed_fields": {key: value for key, value in parsed.items() if key != "raw_text"},
            "raw_text": parsed["raw_text"],
        }

    parsed_docs = {doc_type: payload["parsed_fields"] for doc_type, payload in extracted_docs.items()}
    issues: List[Issue] = []

    for field in ("container_id", "commodity", "origin", "destination"):
        values = [parsed_docs[doc_type].get(field) for doc_type in DOC_TYPES if parsed_docs[doc_type].get(field)]
        distinct = {str(value).strip().lower() for value in values if value not in (None, "")}
        if len(distinct) > 1:
            label = field.replace("_", " ").title()
            issues.append(
                Issue(
                    code=f"{field}_mismatch",
                    severity="HIGH" if field == "container_id" else "MEDIUM",
                    message=f"{label} differs across uploaded documents",
                    score=0.8 if field == "container_id" else 0.5,
                    category="document",
                )
            )

    quantity_gap = _percentage_gap([parsed_docs[doc].get("quantity") for doc in DOC_TYPES])
    if quantity_gap > 0.05:
        issues.append(
            Issue(
                code="quantity_mismatch",
                severity="HIGH" if quantity_gap > 0.2 else "MEDIUM",
                message=f"Quantity mismatch detected across documents ({quantity_gap:.1%} deviation)",
                score=min(0.35 + quantity_gap * 1.8, 0.92),
                category="document",
            )
        )

    value_gap = _percentage_gap([parsed_docs[doc].get("declared_value") for doc in DOC_TYPES])
    if value_gap > 0.05:
        issues.append(
            Issue(
                code="value_mismatch",
                severity="HIGH" if value_gap > 0.25 else "MEDIUM",
                message=f"Declared value mismatch detected across documents ({value_gap:.1%} deviation)",
                score=min(0.4 + value_gap * 1.8, 0.95),
                category="document",
            )
        )

    weight_gap = _percentage_gap([parsed_docs[doc].get("weight_kg") for doc in DOC_TYPES])
    if weight_gap > 0.08:
        issues.append(
            Issue(
                code="weight_mismatch",
                severity="MEDIUM",
                message=f"Weight declarations are inconsistent across documents ({weight_gap:.1%} deviation)",
                score=min(0.3 + weight_gap * 1.4, 0.8),
                category="document",
            )
        )

    missing_fields = []
    required_fields = ("container_id", "commodity", "quantity", "weight_kg", "declared_value", "origin")
    for doc_type, doc in parsed_docs.items():
        for field in required_fields:
            if doc.get(field) in (None, ""):
                missing_fields.append(f"{doc_type.replace('_', ' ').title()}: {field.replace('_', ' ')}")
    if missing_fields:
        issues.append(
            Issue(
                code="missing_fields",
                severity="MEDIUM" if len(missing_fields) <= 2 else "HIGH",
                message="Critical shipment fields are missing: " + "; ".join(missing_fields[:5]),
                score=min(0.3 + len(missing_fields) * 0.08, 0.88),
                category="document",
            )
        )

    consensus = {
        field: _pick_consensus_value(parsed_docs, field)
        for field in (
            "container_id",
            "shipment_id",
            "commodity",
            "quantity",
            "weight_kg",
            "volume_cbm",
            "declared_value",
            "temperature_celsius",
            "origin",
            "destination",
        )
    }

    commodity = str(consensus.get("commodity") or "").lower()
    temperature = consensus.get("temperature_celsius")
    if any(keyword in commodity for keyword in PERISHABLE_KEYWORDS) and temperature is not None and temperature < 10:
        issues.append(
            Issue(
                code="temperature_anomaly",
                severity="HIGH",
                message=f"Perishable cargo '{consensus.get('commodity')}' declared at {temperature:.1f}C",
                score=0.96,
                category="physics",
            )
        )

    weight = consensus.get("weight_kg")
    volume = consensus.get("volume_cbm")
    if weight and volume:
        density = weight / volume if volume > 0 else 0
        if density > 1200:
            issues.append(
                Issue(
                    code="density_anomaly",
                    severity="HIGH" if density > 2000 else "MEDIUM",
                    message=f"Declared cargo density appears abnormal ({density:.0f} kg/CBM)",
                    score=0.86 if density > 2000 else 0.58,
                    category="physics",
                )
            )

    if value_gap > 0.25 and quantity_gap > 0.15:
        issues.append(
            Issue(
                code="coordinated_document_fraud",
                severity="HIGH",
                message="Combined quantity and value deviations indicate coordinated document manipulation",
                score=0.92,
                category="document",
            )
        )

    category_scores = {"physics": 0.0, "document": 0.0, "behavior": 0.0, "network": 0.0}
    for issue in issues:
        category_scores[issue.category] = max(category_scores.get(issue.category, 0.0), issue.score)

    weighted_score = (
        category_scores["physics"] * 0.3
        + category_scores["document"] * 0.55
        + category_scores["behavior"] * 0.1
        + category_scores["network"] * 0.05
    )
    severity_bonus = min(sum(issue.score for issue in issues) * 0.12, 0.3)
    final_score = min(100, round((weighted_score + severity_bonus) * 100))
    status, action = _classify_risk(final_score)
    confidence = min(97, max(62, round(68 + max(category_scores.values()) * 24 + len(issues) * 2)))

    if issues:
        explanation = (
            f"GhostShip flagged this shipment as {status.lower()} risk because "
            + "; ".join(issue.message.rstrip(".") for issue in issues[:3])
            + "."
        )
    else:
        explanation = (
            "GhostShip did not find a material anomaly cluster across the uploaded documents. "
            "Core shipment fields are aligned and cargo declarations appear plausible."
        )

    anomaly_rows = [
        {
            "type": issue.message,
            "severity": issue.severity,
            "status": "Open" if issue.severity == "HIGH" else "Review",
            "timestamp": f"{index + 1} min ago",
        }
        for index, issue in enumerate(issues)
    ]

    if not anomaly_rows:
        anomaly_rows = [
            {
                "type": "No material anomalies detected",
                "severity": "LOW",
                "status": "Closed",
                "timestamp": "Just now",
            }
        ]

    risk_tags = []
    if category_scores["document"] >= 0.35:
        risk_tags.append("DOCUMENT FRAUD")
    if category_scores["physics"] >= 0.35:
        risk_tags.append("PHYSICAL IMPOSSIBILITY")
    if missing_fields:
        risk_tags.append("DATA COMPLETENESS")
    if not risk_tags:
        risk_tags.append("CLEARANCE READY")

    container_id = consensus.get("container_id") or "Pending Identification"
    shipment_id = consensus.get("shipment_id") or container_id
    value_text = (
        f"USD {int(consensus['declared_value']):,}" if consensus.get("declared_value") is not None else "Unknown"
    )

    return {
        "ok": True,
        "mode": "documents",
        "documents": {
            doc_type: {
                "file_name": payload["file_name"],
                "parsed_fields": payload["parsed_fields"],
                "text_excerpt": payload["text_excerpt"],
            }
            for doc_type, payload in extracted_docs.items()
        },
        "summary": {
            "total_shipments": 1,
            "high_risk_alerts": 1 if status == "HIGH" else 0,
            "medium_risk": 1 if status == "MEDIUM" else 0,
            "cleared_shipments": 1 if status == "LOW" else 0,
        },
        "top_result": {
            "risk_score": final_score,
            "status": status,
            "recommended_action": action,
            "engine_breakdown": {
                "Physics": round(category_scores["physics"], 2),
                "Document": round(category_scores["document"], 2),
                "Behavior": round(category_scores["behavior"], 2),
                "Network": round(category_scores["network"], 2),
            },
            "explanation": explanation,
            "confidence": confidence,
            "risk_tags": risk_tags,
            "shipment_details": {
                "shipment_id": shipment_id,
                "container_id": container_id,
                "commodity": consensus.get("commodity") or "Unknown",
                "origin": consensus.get("origin") or "Unknown",
                "destination": consensus.get("destination") or "Unknown",
                "quantity": consensus.get("quantity") or "Unknown",
                "value": consensus.get("declared_value"),
                "temperature_celsius": consensus.get("temperature_celsius"),
                "weight_kg": consensus.get("weight_kg"),
                "volume_cbm": consensus.get("volume_cbm"),
            },
        },
        "results": [
            {
                "shipment_id": shipment_id,
                "classification": status,
                "risk_score": final_score,
                "action": action,
                "explanation": explanation,
                "details": {
                    issue.category: {
                        issue.code: issue.message
                        for issue in issues
                        if issue.category == category
                    }
                    for category in category_scores
                    if any(issue.category == category for issue in issues)
                },
            }
        ],
        "anomalies": anomaly_rows,
    }

