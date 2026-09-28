from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import joblib

app = FastAPI(
    title="Cyclone Impact Forecaster API",
    version="1.0.0"
)

# Allow the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_PATH = BASE_DIR / "models" / "cyclone_flood_rf.joblib"

model = joblib.load(MODEL_PATH)

def load_json(filename):
    path = DATA_DIR / filename

    if not path.exists():
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/")
def root():
    return {
        "project": "Cyclone Impact Forecaster",
        "status": "API running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/routing")
def routing():
    data = load_json("routing_api_payload_wgs84.json")

    if data is None:
        return {
            "error": "Routing data not found"
        }

    return data


@app.get("/advisory")
def advisory():
    path = BASE_DIR / "output" / "gemini_advisory.txt"

    if not path.exists():
        return {
            "error": "Advisory not found"
        }

    return {
        "advisory": path.read_text(encoding="utf-8")
    }
