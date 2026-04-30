# GhostShip Development Log

## Setup
- [x] Folder structure created
- [x] Dependencies installed
- [x] CSV-based training flow configured
- [x] Local/offline workflow confirmed (no external DB required)

## ML Model
- [x] Feature extraction from 16 fields
- [x] RandomForest training (300 estimators)
- [x] Model persistence with joblib
- [x] Feature importance reporting added
- [x] Training moved to `database/ghostship_dataset_updated.csv`

## Detection Engines
- [x] Physics: Temperature and density checks
- [x] Document: IGM/BOL/Invoice mismatches
- [x] Behavior: Burst, off-hours, trust scores
- [x] Network: Linked companies, shared directors
- [x] Scoring: Adaptive ensemble with stronger rule overrides

## Dataset
- [x] Initial CSV dataset loaded
- [x] Updated dataset loaded: 1150 rows
- [x] Fraud/normal balance confirmed in updated CSV
- [x] Local training works fully offline

## AI Layer
- [x] Human-readable explanations

## Demo
- [x] 5 scenarios covering all fraud types
- [x] Demo runs with saved `model.pkl`

## Current Findings
- [x] Document and behavior signals are strongest in the trained model
- [x] Physics and network signals remain comparatively weak in ML importance
- [x] Project is fully usable offline
- [ ] Future: connect live data source (not implemented)

## Recent Changes
- [x] Added ML features: `temperature_anomaly`, `density_anomaly`, `route_risk_score`
- [x] Added ML features: `pickup_attempts`, `driver_verified`, `value_gap_ratio`
- [x] Updated score blending:
- [x] `>= 0.9` max rule score -> `20% ML + 80% rules`
- [x] `> 0.7` max rule score -> `40% ML + 60% rules`
- [x] Otherwise -> `60% ML + 40% rules`

## Commands
- `python train.py` - Train model from CSV
- `python main.py --demo` - Run demo scenarios
