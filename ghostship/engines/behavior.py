class BehaviorEngine:
    def check(self, shipment):
        scores = []
        details = {}

        burst = shipment.get("burst_count", 0)
        if burst > 5:
            scores.append(min(burst / 10, 1.0))
            details["burst_activity"] = f"{burst} rapid submissions"

        hour = shipment.get("submission_hour", 12)
        if 0 <= hour < 6:
            scores.append(0.60)
            details["off_hours"] = f"Submitted at {hour}:00"

        age = shipment.get("account_age_days", 365)
        value = shipment.get("declared_value_usd", 0)
        if age < 30 and value > 50000:
            scores.append(0.70)
            details["new_account_high_value"] = f"${value:,.0f} from {age}-day account"

        trust = shipment.get("company_trust_score", 50)
        if trust < 30:
            scores.append((30 - trust) / 30)
            details["low_trust"] = f"Trust score {trust}/100"

        if shipment.get("kyc_verified", 1) == 0:
            scores.append(0.50)
            details["unverified_kyc"] = "KYC not verified"

        return {"score": max(scores) if scores else 0, "details": details}
