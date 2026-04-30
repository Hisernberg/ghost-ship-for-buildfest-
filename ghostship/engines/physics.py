class PhysicsEngine:
    def __init__(self, settings=None):
        self.settings = settings or {}

    def check(self, shipment):
        scores = []
        details = {}

        temp = shipment.get("temperature_celsius", 20)
        commodity = str(shipment.get("commodity", "")).lower()
        banana_temp_floor = float(self.settings.get("banana_temperature_floor", 10))

        if "banana" in commodity and temp < banana_temp_floor:
            scores.append(0.95)
            details["temperature_anomaly"] = f"Bananas at {temp}C"

        weight = shipment.get("weight_kg", 0)
        volume = shipment.get("volume_cbm", 1)
        density = weight / volume if volume > 0 else 0
        density_threshold = float(self.settings.get("density_threshold", 2000))

        if density > density_threshold:
            scores.append(0.85)
            details["density_anomaly"] = f"Density {density:.1f} kg/m^3"

        return {"score": max(scores) if scores else 0, "details": details}
