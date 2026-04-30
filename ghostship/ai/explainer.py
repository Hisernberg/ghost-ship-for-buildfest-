from __future__ import annotations

import os
import requests
import structlog

logger = structlog.get_logger("ghostship.ai.explainer")

HF_MODEL = "google/gemma-4-E2B-it"
# Set GHOSTSHIP_SPACE_URL env var to your HF Space URL, e.g.:
# https://<username>-ghostship-gemma-api.hf.space
_SPACE_URL = os.environ.get("GHOSTSHIP_SPACE_URL", "").rstrip("/")
HF_API_URL = (
    f"{_SPACE_URL}/v1/chat/completions"
    if _SPACE_URL
    else f"https://api-inference.huggingface.co/models/{HF_MODEL}/v1/chat/completions"
)

_TRANSLATIONS = {
    "temperature_anomaly": "Cargo condition anomaly",
    "density_anomaly": "Physical inconsistency",
    "quantity_mismatch": "Document inconsistency",
    "value_mismatch": "Declared value variance",
    "origin_fraud": "Origin inconsistency detected",
    "burst_activity": "Submission pattern alert",
    "off_hours": "Timing anomaly",
    "new_account_high_value": "Entity profile alert",
    "low_trust": "Entity verification alert",
    "unverified_kyc": "Unverified identity",
    "linked_company": "Relationship signal",
    "shared_director": "Shared director detected",
    "linked_to_fraud": "Linked to prior discrepancies",
}


class AIExplainer:
    def __init__(self):
        self._token = os.environ.get("HF_TOKEN")
        if self._token:
            logger.info("hf_explainer_ready", model=HF_MODEL)
        else:
            logger.warning("hf_token_missing_falling_back_to_rules")

    def explain(self, engine_results: dict, final_score: int) -> str:
        if self._token:
            try:
                return self._hf_explain(engine_results, final_score)
            except Exception as exc:
                logger.warning("hf_explain_failed", error=str(exc))
        return self._fallback_explain(engine_results, final_score)

    def _hf_explain(self, engine_results: dict, final_score: int) -> str:
        signals = []
        for engine, result in engine_results.items():
            score = result.get("score", 0)
            if score > 0.3:
                for key, val in result.get("details", {}).items():
                    signals.append(f"- {engine.upper()} engine ({score:.2f}): {key} = {val}")

        signals_text = "\n".join(signals) if signals else "No major fraud signals detected."
        risk_level = "HIGH" if final_score > 70 else "MEDIUM" if final_score > 30 else "LOW"

        prompt = f"""You are a customs fraud analyst AI for GhostShip, a port intelligence system used by DP World.

A shipment has been assigned a risk score of {final_score}/100 ({risk_level} risk).

Detected fraud signals:
{signals_text}

Write a concise, professional 2-3 sentence explanation for the customs officer that:
1. States what the primary fraud indicators are and why they raised the score
2. Connects the signals to the likely fraud pattern (e.g. document manipulation, origin misdeclaration, smuggling)
3. Recommends an immediate next step

Use specific customs and trade terminology. Be direct. No bullet points or headers."""

        headers = {"Content-Type": "application/json"}
        if not _SPACE_URL:
            headers["Authorization"] = f"Bearer {self._token}"

        response = requests.post(
            HF_API_URL,
            headers=headers,
            json={
                "model": HF_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
                "temperature": 0.3,
            },
            timeout=60,
        )
        response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"].strip()
        logger.info("hf_explanation_generated", score=final_score, chars=len(text))
        return text

    def _fallback_explain(self, engine_results: dict, final_score: int) -> str:
        explanations = []
        for _engine, result in engine_results.items():
            if result.get("score", 0) > 0.3:
                for key in result.get("details", {}):
                    if key in _TRANSLATIONS:
                        explanations.append(_TRANSLATIONS[key])

        if not explanations:
            return "No significant anomalies detected. Shipment appears normal."

        return f"Risk Score: {final_score}/100. Key concerns: " + "; ".join(explanations[:3])
