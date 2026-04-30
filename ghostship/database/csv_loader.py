from pathlib import Path

import pandas as pd


DEFAULT_CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "ghostship_dataset_updated.csv"


def fetch_shipments_from_csv(csv_path=None):
    path = Path(csv_path) if csv_path else DEFAULT_CSV_PATH
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found at {path}")

    dataframe = pd.read_csv(path)
    return dataframe.where(pd.notnull(dataframe), None).to_dict(orient="records")
