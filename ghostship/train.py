import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, recall_score
from sklearn.model_selection import train_test_split

from .model import FEATURE_COLUMNS, MODEL_PATH, extract_features


DATASET_PATH = Path(__file__).resolve().parent / "database" / "ghostship_dataset_updated.csv"


def train():
    print("Loading dataset from CSV...")

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    print(f"Loaded {len(df)} shipments")
    print(f"Fraud cases: {df['is_anomalous'].sum()}")
    print(f"Normal cases: {(df['is_anomalous'] == 0).sum()}")

    shipments = df.to_dict("records")

    print(f"\nTraining on {len(shipments)} shipments...")
    print(json.dumps({"dataset_path": str(DATASET_PATH)}, indent=2))

    X = np.array([extract_features(s) for s in shipments])
    y = np.array([int(s.get("is_anomalous", 0)) for s in shipments])

    if len(np.unique(y)) < 2:
        raise RuntimeError("Need both normal (0) and fraud (1) samples")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    fraud_rate = recall_score(y_test, y_pred, pos_label=1, zero_division=0)

    feature_importance = sorted(
        zip(FEATURE_COLUMNS, model.feature_importances_),
        key=lambda item: item[1],
        reverse=True,
    )

    joblib.dump({"model": model, "features": FEATURE_COLUMNS}, MODEL_PATH)

    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Fraud Detection Rate: {fraud_rate:.4f}")
    print("\nTop Feature Importances:")
    for feature, importance in feature_importance[:10]:
        print(f"  {feature}: {importance:.4f}")


if __name__ == "__main__":
    train()
