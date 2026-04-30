# GhostShip

GhostShip is an AI-powered port intelligence platform built for **Solution Challenge 2026 - Build with AI**. It helps customs officers and port operations teams detect suspicious shipments, validate trade documents, prioritize inspections, and generate plain-language risk explanations using modern AI services.

## Challenge Theme

This project is designed around the "Build with AI" track by combining:

- structured fraud detection logic
- machine learning-based shipment scoring
- AI-assisted document field extraction
- LLM-generated operational explanations
- cloud-hosted model inference for scalable deployment

## Problem

Ports and customs teams process large volumes of cargo every day, but most fraud is hidden inside data, declarations, and document inconsistencies rather than visible physical tampering.

Current review workflows are often:

- manual and slow
- dependent on human experience
- fragmented across documents, watchlists, and shipment systems
- weak at explaining why something is risky

This creates a serious need for a system that can flag high-risk cases early, explain them clearly, and support better inspection decisions.

## Solution

GhostShip provides a multi-layer risk intelligence system that analyzes shipment records, uploaded shipping documents, company behavior signals, and compliance indicators in one workflow.

The platform:

- scores suspicious shipments
- validates invoice, packing list, and bill of lading consistency
- extracts missing fields from documents using AI
- generates customs-friendly explanations with Gemma 4
- supports officers through queues, watchlists, and review dashboards

## Key Features

- CSV shipment intake and risk analysis
- Document upload and document consistency checks
- AI-assisted field extraction from shipping paperwork
- Human-readable AI explanation for flagged shipments
- Audit queue for customs review workflow
- Sanctions and watchlist management
- Shipper portal for vessel/document submissions

## AI Integration

GhostShip uses AI in multiple layers:

- `Gemma 4` for explanation generation and document field extraction fallback
- `Hugging Face Spaces` to host the live Gemma 4 inference API
- `Google AI / Gemini-ready integration` through the backend stack for future or extended AI workflows

This makes the project a strong fit for the Solution Challenge AI theme because AI is embedded directly into the decision-making flow, not added as a separate demo feature.

## How It Works

1. A shipper uploads a CSV manifest or trade documents.
2. The Flask backend validates and normalizes the data.
3. Multiple risk engines analyze shipment anomalies, behavioral patterns, and document mismatches.
4. The system computes a final risk score.
5. If needed, Gemma 4 generates a short explanation and recommended next step.
6. Officers review the case in the dashboard and decide whether to clear, inspect, or escalate it.

## System Architecture

### Frontend

- React
- Vite
- CSS-based dashboard UI

### Backend

- Flask API
- Pydantic validation
- Structlog logging
- Modular analysis engines inside `ghostship/`

### Data / ML

- pandas
- numpy
- scikit-learn
- joblib

### Document Processing

- pypdf
- Pillow
- pytesseract

### AI / Cloud

- Hugging Face Spaces
- Gemma 4
- Google AI integration path via `google-genai`

### Database

- SQLite for MVP/local use
- MySQL-ready path already present in backend code

## Repo Layout

```text
ghostship/   # Backend package: engines, document analysis, ML, API logic
frontend/    # React + Vite frontend
hf_space/    # Hugging Face Docker Space for Gemma 4 API serving
uploads/     # Uploaded shipper/officer files
api.py       # Entrypoint for the Flask API
README.md
```

## Local Demo Credentials

### Customs Officer

- Username: `manager01`
- Password: `manager123`

### Shipper Demo

- Username: `3361`
- Password: `3361`

## Running The Project

### Backend

```bash
python api.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Default Local URLs

- Frontend: `http://localhost:5175`
- API: `http://127.0.0.1:5001`

## Gemma 4 Space Integration

The project can call a live Hugging Face Space for AI features through:

```env
GHOSTSHIP_SPACE_URL=https://<your-space>.hf.space
HF_TOKEN=<your-token>
```

This powers:

- AI customs explanations
- AI field extraction support for document parsing

## Why This Project Stands Out

- Combines deterministic fraud rules with ML and LLMs
- Built for real operational workflows, not only model benchmarking
- Explains risk in language customs teams can act on
- Uses cloud-hosted AI in a modular, scalable way
- Addresses a real logistics and border-control problem with measurable operational value

## Future Scope

- live sanctions and vessel feed integration
- stronger graph/network fraud detection
- multilingual document understanding
- role-based enterprise access control
- deeper Google AI / Gemini multimodal workflows
- analytics and audit export features
