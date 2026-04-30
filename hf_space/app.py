import logging
import os
import time
import uuid
from typing import Any, Dict, List, Optional

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("ghostship.hf_space")

MODEL_ID = os.getenv("MODEL_ID", "google/gemma-4-E2B-it")
DEFAULT_MAX_NEW_TOKENS = int(os.getenv("DEFAULT_MAX_NEW_TOKENS", "300"))
MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "12000"))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.bfloat16
CPU_THREADS = int(os.getenv("CPU_THREADS", "2"))

app = FastAPI(title="GhostShip Gemma 4 API", version="1.0.0")

_tokenizer = None
_model = None
_startup_error = None


class PredictRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    max_tokens: int = Field(DEFAULT_MAX_NEW_TOKENS, ge=1, le=2048)
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    top_p: float = Field(0.95, gt=0.0, le=1.0)
    system_prompt: Optional[str] = Field(
        default="You are GhostShip's customs fraud analysis assistant."
    )


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: int = Field(DEFAULT_MAX_NEW_TOKENS, ge=1, le=2048)
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    top_p: float = Field(0.95, gt=0.0, le=1.0)
    model: Optional[str] = None


def _load_model() -> None:
    global _tokenizer, _model, _startup_error

    hf_token = os.getenv("HF_TOKEN")
    try:
        logger.info("loading_model", extra={"model_id": MODEL_ID, "device": DEVICE})
        if DEVICE == "cpu":
            torch.set_num_threads(max(1, CPU_THREADS))
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=hf_token)
        load_kwargs = {
            "token": hf_token,
            "torch_dtype": DTYPE,
            "low_cpu_mem_usage": True,
        }
        if DEVICE == "cuda":
            load_kwargs["device_map"] = "auto"
        _model = AutoModelForCausalLM.from_pretrained(MODEL_ID, **load_kwargs)
        if DEVICE == "cpu":
            _model = _model.to(DEVICE)
        _model.eval()
        logger.info("model_ready", extra={"model_id": MODEL_ID, "device": DEVICE})
    except Exception as exc:  # pragma: no cover - startup failure path
        _startup_error = str(exc)
        logger.exception("model_load_failed")


def _require_model() -> None:
    if _startup_error:
        raise HTTPException(status_code=503, detail=f"Model failed to load: {_startup_error}")
    if _tokenizer is None or _model is None:
        raise HTTPException(status_code=503, detail="Model is not ready yet")


def _normalize_messages(messages: List[ChatMessage]) -> List[Dict[str, str]]:
    if not messages:
        raise HTTPException(status_code=400, detail="At least one message is required")

    normalized: List[Dict[str, str]] = []
    for message in messages:
        role = message.role.strip().lower()
        if role not in {"system", "user", "assistant"}:
            raise HTTPException(status_code=400, detail=f"Unsupported message role: {message.role}")
        content = message.content.strip()
        if not content:
            raise HTTPException(status_code=400, detail="Message content cannot be empty")
        normalized.append({"role": role, "content": content[:MAX_INPUT_CHARS]})
    return normalized


def _generate(messages: List[Dict[str, str]], max_tokens: int, temperature: float, top_p: float) -> str:
    _require_model()

    prompt = _tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    inputs = _tokenizer(prompt, return_tensors="pt")
    inputs = {key: value.to(_model.device) for key, value in inputs.items()}

    with torch.inference_mode():
        output = _model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=temperature > 0,
            temperature=max(temperature, 1e-5),
            top_p=top_p,
            pad_token_id=_tokenizer.eos_token_id,
            eos_token_id=_tokenizer.eos_token_id,
        )

    generated = output[0][inputs["input_ids"].shape[-1]:]
    text = _tokenizer.decode(generated, skip_special_tokens=True).strip()
    return text


@app.on_event("startup")
def startup_event() -> None:
    _load_model()


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "service": "GhostShip Gemma 4 API",
        "model": MODEL_ID,
        "ready": _startup_error is None and _model is not None,
        "docs": "/docs",
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": _startup_error is None and _model is not None,
        "model": MODEL_ID,
        "device": DEVICE,
        "error": _startup_error,
    }


@app.post("/predict")
def predict(payload: PredictRequest) -> Dict[str, Any]:
    messages = []
    if payload.system_prompt:
        messages.append({"role": "system", "content": payload.system_prompt.strip()[:MAX_INPUT_CHARS]})
    messages.append({"role": "user", "content": payload.prompt.strip()[:MAX_INPUT_CHARS]})

    started = time.time()
    text = _generate(
        messages=messages,
        max_tokens=payload.max_tokens,
        temperature=payload.temperature,
        top_p=payload.top_p,
    )
    duration = round(time.time() - started, 3)
    return {
        "text": text,
        "model": MODEL_ID,
        "duration_seconds": duration,
    }


@app.post("/call/predict")
def call_predict(payload: PredictRequest) -> Dict[str, Any]:
    return predict(payload)


@app.post("/v1/chat/completions")
def chat_completions(payload: ChatCompletionRequest) -> Dict[str, Any]:
    normalized_messages = _normalize_messages(payload.messages)
    started = time.time()
    text = _generate(
        messages=normalized_messages,
        max_tokens=payload.max_tokens,
        temperature=payload.temperature,
        top_p=payload.top_p,
    )
    duration = round(time.time() - started, 3)
    return {
        "id": f"chatcmpl-{uuid.uuid4().hex}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": payload.model or MODEL_ID,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": text},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": None,
            "completion_tokens": None,
            "total_tokens": None,
        },
        "duration_seconds": duration,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7860")))
