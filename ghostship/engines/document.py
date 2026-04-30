class DocumentEngine:
    def __init__(self, settings=None):
        self.settings = settings or {}

    def check(self, shipment):
        scores = []
        details = {}
        quantity_threshold = float(self.settings.get("quantity_mismatch_threshold", 0.05))
        value_threshold = float(self.settings.get("value_mismatch_threshold", 0.05))

        igm_qty = shipment.get("igm_quantity", 0)
        bol_qty = shipment.get("bol_quantity", 0)
        inv_qty = shipment.get("invoice_quantity", 0)
        quantities = [q for q in [igm_qty, bol_qty, inv_qty] if q > 0]

        if len(quantities) >= 2:
            deviation = (max(quantities) - min(quantities)) / max(quantities)
            if deviation > quantity_threshold:
                scores.append(min(deviation * 2, 1.0))
                details["quantity_mismatch"] = f"{deviation:.1%} deviation"

        igm_val = shipment.get("igm_value", 0)
        bol_val = shipment.get("bol_value", 0)
        inv_val = shipment.get("invoice_value", 0)
        values = [v for v in [igm_val, bol_val, inv_val] if v > 0]

        if len(values) >= 2:
            deviation = (max(values) - min(values)) / max(values)
            if deviation > value_threshold:
                scores.append(min(deviation * 2, 1.0))
                details["value_mismatch"] = f"{deviation:.1%} deviation"

        actual = shipment.get("actual_origin_country", "")
        declared = shipment.get("declared_origin_country", "")
        if actual and declared and actual != declared:
            scores.append(0.90)
            details["origin_fraud"] = f"Declared {declared}, Actual {actual}"

        return {"score": max(scores) if scores else 0, "details": details}
