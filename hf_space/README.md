---
title: GhostShip Gemma 4 API
emoji: 🚢
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
---

# GhostShip Gemma 4 Docker Space

This folder is ready to publish as a Hugging Face Docker Space that serves Gemma 4 behind a simple HTTP API.

It is tuned for the smallest current Gemma 4 variant, `google/gemma-4-E2B-it`, which is the best fit for a 16 GiB CPU Space.

## What it exposes

- `GET /health` for readiness checks
- `POST /predict` for a simple prompt-based call
- `POST /v1/chat/completions` for OpenAI-style chat requests

## Required Space secret

Add this in the Space settings before the first boot:

- `HF_TOKEN`: a Hugging Face token with access to the Gemma model

Optional variables:

- `MODEL_ID`: defaults to `google/gemma-4-E2B-it`
- `DEFAULT_MAX_NEW_TOKENS`: defaults to `300`
- `LOG_LEVEL`: defaults to `INFO`
- `CPU_THREADS`: defaults to `2`

## Why this version fits better

- Gemma 4 currently comes in `E2B`, `E4B`, `26B-A4B`, and `31B`; `E2B` is the smallest.
- This Space loads the model in `bfloat16` even on CPU, instead of `float32`, which cuts memory pressure significantly.
- The Docker image is CPU-first and avoids the much larger CUDA base image.

## Example request

```bash
curl -X POST "https://<your-space>.hf.space/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a customs fraud analyst."},
      {"role": "user", "content": "Explain why a quantity mismatch matters in trade compliance."}
    ],
    "max_tokens": 250,
    "temperature": 0.3
  }'
```

## Project integration

In the main GhostShip project, set:

```env
GHOSTSHIP_SPACE_URL=https://<your-space>.hf.space
```

The backend will then send Gemma requests to this Space automatically.
