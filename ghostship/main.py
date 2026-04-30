#!/usr/bin/env python3
import sys
import structlog
from collections import Counter

from .ai import AIExplainer
from .demo import SCENARIOS
from .engines import (
    BehaviorEngine,
    DocumentEngine,
    NetworkEngine,
    PhysicsEngine,
    ScoringEngine,
)
from .model import MODEL_PATH, predict
from .models import ShipmentValidationError, validate_shipment

logger = structlog.get_logger("ghostship.main")


DEFAULT_ANALYSIS_SETTINGS = {
    "low_risk_max": 30,
    "medium_risk_max": 70,
    "quantity_mismatch_threshold": 0.05,
    "value_mismatch_threshold": 0.05,
    "density_threshold": 2000.0,
    "banana_temperature_floor": 10.0,
}


def _coerce_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def normalize_analysis_settings(settings=None):
    merged = {**DEFAULT_ANALYSIS_SETTINGS, **(settings or {})}
    low_risk = int(_coerce_float(merged.get("low_risk_max"), DEFAULT_ANALYSIS_SETTINGS["low_risk_max"]))
    medium_risk = int(_coerce_float(merged.get("medium_risk_max"), DEFAULT_ANALYSIS_SETTINGS["medium_risk_max"]))
    if medium_risk < low_risk:
        medium_risk = low_risk

    return {
        "low_risk_max": max(0, min(low_risk, 100)),
        "medium_risk_max": max(low_risk, min(medium_risk, 100)),
        "quantity_mismatch_threshold": max(0.01, min(_coerce_float(merged.get("quantity_mismatch_threshold"), 0.05), 1.0)),
        "value_mismatch_threshold": max(0.01, min(_coerce_float(merged.get("value_mismatch_threshold"), 0.05), 1.0)),
        "density_threshold": max(100.0, _coerce_float(merged.get("density_threshold"), 2000.0)),
        "banana_temperature_floor": max(-20.0, min(_coerce_float(merged.get("banana_temperature_floor"), 10.0), 40.0)),
    }


def analyze_shipment(shipment, all_shipments=None, settings=None):
    # Validate input data
    try:
        validated = validate_shipment(shipment)
        shipment_data = validated.to_dict()
    except ShipmentValidationError as e:
        logger.warning("shipment_validation_failed", error=str(e), shipment_id=shipment.get("shipment_id"))
        raise
    
    analysis_settings = normalize_analysis_settings(settings)
    physics = PhysicsEngine(analysis_settings)
    document = DocumentEngine(analysis_settings)
    behavior = BehaviorEngine()
    network = NetworkEngine()
    scoring = ScoringEngine(analysis_settings)

    results = {
        "physics": physics.check(shipment_data),
        "document": document.check(shipment_data),
        "behavior": behavior.check(shipment_data),
        "network": network.check(shipment_data, all_shipments),
    }

    try:
        ml_prob = predict(shipment_data)
    except Exception as e:
        logger.debug("ml_prediction_skipped", error=str(e))
        ml_prob = None

    final = scoring.calculate(results, ml_prob)

    explainer = AIExplainer()
    explanation = explainer.explain(results, final["risk_score"])

    logger.info("shipment_analyzed", 
                shipment_id=shipment_data.get("shipment_id"),
                risk_score=final["risk_score"],
                classification=final["classification"])

    return {
        "shipment_id": shipment_data.get("shipment_id"),
        "risk_score": final["risk_score"],
        "classification": final["classification"],
        "action": final["recommended_action"],
        "engine_scores": final["engine_breakdown"],
        "explanation": explanation,
        "details": {k: v["details"] for k, v in results.items() if v["details"]},
    }


def _parse_route_destination(route_str):
    """Extract destination from route string like 'Singapore → India' or 'Singapore -> India'."""
    if not route_str or not isinstance(route_str, str):
        return None
    # Try Unicode arrow first
    parts = route_str.split("\u2192")
    if len(parts) >= 2:
        return parts[-1].strip()
    # Try ASCII arrow
    parts = route_str.split("->")
    if len(parts) >= 2:
        return parts[-1].strip()
    # Try hyphen
    parts = route_str.split("-")
    if len(parts) >= 2:
        return parts[-1].strip()
    return None


def summarize_shipments(shipments, settings=None):
    if not shipments:
        raise ValueError("No shipments provided for analysis")
    
    if len(shipments) > 10000:
        raise ValueError("Maximum 10,000 shipments allowed per analysis")

    logger.info("summarize_shipments_started", count=len(shipments))
    
    analysis_settings = normalize_analysis_settings(settings)
    results = []
    errors = []
    
    for idx, shipment in enumerate(shipments):
        try:
            result = analyze_shipment(shipment, shipments, analysis_settings)
            results.append(result)
        except ShipmentValidationError as e:
            errors.append({"row": idx + 1, "error": str(e)})
            logger.warning("shipment_skipped_due_to_validation", row=idx + 1, error=str(e))
    
    if not results:
        raise ShipmentValidationError(f"All shipments failed validation: {errors[:5]}")
    
    if errors:
        logger.warning("some_shipments_failed_validation", error_count=len(errors))
    
    counts = Counter(result["classification"] for result in results)
    top_result = max(results, key=lambda item: item["risk_score"])
    top_shipment = next(
        (shipment for shipment in shipments if shipment.get("shipment_id") == top_result["shipment_id"]),
        shipments[0],
    )
    
    logger.info("summarize_shipments_completed", 
                total=len(results),
                high_risk=counts.get("HIGH", 0),
                medium_risk=counts.get("MEDIUM", 0))

    return {
        "summary": {
            "total_shipments": len(shipments),
            "high_risk_alerts": counts.get("HIGH", 0),
            "medium_risk": counts.get("MEDIUM", 0),
            "cleared_shipments": counts.get("LOW", 0),
        },
        "top_result": {
            "risk_score": top_result["risk_score"],
            "status": top_result["classification"],
            "recommended_action": top_result["action"],
            "engine_breakdown": {
                key.capitalize(): value for key, value in top_result["engine_scores"].items()
            },
            "explanation": top_result["explanation"],
            "shipment_details": {
                "commodity": top_shipment.get("commodity", "Unknown"),
                "company": top_shipment.get("company_name")
                or top_shipment.get("company_id")
                or top_shipment.get("importer_name")
                or top_shipment.get("exporter_name")
                or top_shipment.get("consignee_name")
                or "Unknown",
                "origin": top_shipment.get("declared_origin_country")
                or top_shipment.get("actual_origin_country")
                or "Unknown",
                "destination": top_shipment.get("destination_country")
                or top_shipment.get("destination_port")
                or top_shipment.get("port_of_discharge")
                or _parse_route_destination(top_shipment.get("route"))
                or "Unknown",
                "quantity": top_shipment.get("invoice_quantity")
                or top_shipment.get("bol_quantity")
                or top_shipment.get("igm_quantity")
                or "Unknown",
                "value": top_shipment.get("invoice_value")
                or top_shipment.get("declared_value_usd")
                or top_shipment.get("igm_value")
                or "Unknown",
                "shipment_id": top_shipment.get("shipment_id", "N/A"),
            },
        },
        "results": results,
        "settings": analysis_settings,
    }


def run_demo():
    logger.info("demo_started")
    
    print("=" * 70)
    print("GHOSTSHIP - PORT INTELLIGENCE SYSTEM")
    print("   DP World Hackathon Demo")
    print("=" * 70)

    print("\nRUNNING 5 DEMO SCENARIOS\n")

    for i, scenario in enumerate(SCENARIOS, 1):
        print(f"{'-' * 70}")
        print(f"SCENARIO {i}: {scenario['name']}")
        print(f"Description: {scenario['description']}")
        print(f"{'-' * 70}")

        try:
            result = analyze_shipment(scenario["data"], [s["data"] for s in SCENARIOS])

            status = (
                "FRAUD"
                if result["classification"] == "HIGH"
                else "MEDIUM"
                if result["classification"] == "MEDIUM"
                else "LOW"
            )

            print(f"\nRisk Score: {result['risk_score']}/100 {status}")
            print(f"Action: {result['action']}")
            print(f"\nAI Explanation: {result['explanation']}")

            print("\nEngine Breakdown:")
            for engine, score in result["engine_scores"].items():
                bar = "#" * int(score * 20) + "." * (20 - int(score * 20))
                print(f"  {engine:12} [{bar}] {score:.2f}")

            if result["details"]:
                print("\nDetected Anomalies:")
                for engine, details in result["details"].items():
                    for _key, value in details.items():
                        print(f"  * {engine}: {value}")
            print()
        except Exception as e:
            logger.error("demo_scenario_failed", scenario=scenario['name'], error=str(e))
            print(f"\nError analyzing scenario: {e}\n")
    
    logger.info("demo_completed")


def main():
    logger.info("main_started", args=sys.argv[1:])
    
    if len(sys.argv) > 1 and sys.argv[1] == "--train":
        from .train import train as train_model

        train_model()
    elif len(sys.argv) > 1 and sys.argv[1] == "--demo":
        if not MODEL_PATH.exists():
            print("Model not found. Running demo with rule-based scoring only.\n")
            logger.info("demo_running_without_model")
        run_demo()
    else:
        print("GhostShip Fraud Detection")
        print("Usage:")
        print("  python main.py --train    # Train model")
        print("  python main.py --demo     # Run demo")
        logger.info("showing_usage")


if __name__ == "__main__":
    main()
