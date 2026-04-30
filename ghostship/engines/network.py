class NetworkEngine:
    def check(self, shipment, all_shipments=None):
        scores = []
        details = {}

        linked = shipment.get("linked_company_id")
        if linked:
            scores.append(0.40)
            details["linked_company"] = f"Links to {linked}"

        if shipment.get("shared_director_flag", 0) == 1:
            scores.append(0.50)
            details["shared_director"] = "Shared director detected"

        if all_shipments and linked:
            linked_frauds = sum(
                1
                for s in all_shipments
                if s.get("company_id") == linked and s.get("is_anomalous")
            )
            if linked_frauds > 0:
                scores.append(0.80)
                details["linked_to_fraud"] = (
                    f"Linked company has {linked_frauds} prior discrepancy cases"
                )

        return {"score": max(scores) if scores else 0, "details": details}
