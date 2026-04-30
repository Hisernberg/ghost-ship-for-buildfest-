try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()

LOW_RISK = 30
MEDIUM_RISK = 70

WEIGHTS = {
    "physics": 0.20,
    "document": 0.25,
    "behavior": 0.20,
    "network": 0.20,
    "scoring": 0.15,
}
