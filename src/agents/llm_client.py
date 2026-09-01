"""
src/agents/llm_client.py

Thin wrapper around a locally running LLM runtime. Every agent calls
through this client instead of hitting Ollama/vLLM directly, so the
inference backend can be swapped without touching agent code -- this
matches the "Local Isolation Boundary" rule in the Software
Architecture Document (Section 8.1): all local-LLM dependencies stay
encapsulated in the Infrastructure layer.

Supported backends:
    ollama      Default. Talks to Ollama's native /api/chat endpoint.
                Requires `ollama serve` running locally (default
                http://localhost:11434) and the target model pulled
                (e.g. `ollama pull llama3:8b-instruct`).
    vllm        Talks to an OpenAI-compatible /v1/chat/completions
                endpoint (vLLM's --api-server, or anything else that
                speaks the OpenAI chat schema).
    mock        Returns a canned, schema-valid JSON response without
                calling any model. Use this to test agent plumbing
                before a local LLM is set up (see the --mock flag on
                the standalone test scripts).

Env vars (all optional, sensible local defaults):
    LLM_BACKEND     "ollama" | "vllm" | "mock"   (default: "ollama")
    LLM_HOST        base URL for the backend      (default depends on backend)
    LLM_MODEL       model name/tag                (default: "llama3:8b-instruct")
    LLM_TIMEOUT_S   request timeout in seconds     (default: 120)
"""

import os
import json
import time
from dataclasses import dataclass
from typing import Optional

import requests
from dotenv import load_dotenv

load_dotenv()

DEFAULT_HOSTS = {
    "ollama": "http://localhost:11434",
    "vllm": "http://localhost:8000",
}


class LLMClientError(Exception):
    """Raised when the local LLM backend cannot be reached or errors out."""


@dataclass
class LLMResponse:
    text: str
    raw: dict
    latency_s: float


class LocalLLMClient:
    """
    Backend-agnostic client for local LLM inference.

    Usage:
        client = LocalLLMClient()
        resp = client.chat(
            system_prompt="You are a strict reviewer...",
            user_prompt="Paper text here...",
            json_mode=True,
        )
        print(resp.text)
    """

    def __init__(
        self,
        backend: Optional[str] = None,
        host: Optional[str] = None,
        model: Optional[str] = None,
        timeout_s: Optional[float] = None,
    ):
        self.backend = (backend or os.environ.get("LLM_BACKEND", "ollama")).lower()
        self.host = host or os.environ.get("LLM_HOST", DEFAULT_HOSTS.get(self.backend, ""))
        self.model = model or os.environ.get("LLM_MODEL", "llama3:8b")
        self.timeout_s = timeout_s or float(os.environ.get("LLM_TIMEOUT_S", 120))

        if self.backend not in ("ollama", "vllm", "mock"):
            raise ValueError(f"Unknown LLM_BACKEND '{self.backend}'. Use ollama, vllm, or mock.")

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        temperature: float = 0.2,
    ) -> LLMResponse:
        if self.backend == "mock":
            return self._chat_mock(system_prompt, user_prompt)
        if self.backend == "ollama":
            return self._chat_ollama(system_prompt, user_prompt, json_mode, temperature)
        return self._chat_vllm(system_prompt, user_prompt, json_mode, temperature)

    # ------------------------------------------------------------------
    # Backend implementations
    # ------------------------------------------------------------------

    def _chat_ollama(self, system_prompt, user_prompt, json_mode, temperature) -> LLMResponse:
        url = f"{self.host}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "options": {"temperature": temperature},
        }
        if json_mode:
            payload["format"] = "json"

        start = time.time()
        try:
            r = requests.post(url, json=payload, timeout=self.timeout_s)
            r.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise LLMClientError(
                f"Could not reach Ollama at {self.host} (is `ollama serve` running "
                f"and is '{self.model}' pulled?): {e}"
            ) from e

        data = r.json()
        content = data.get("message", {}).get("content", "")
        return LLMResponse(text=content, raw=data, latency_s=time.time() - start)

    def _chat_vllm(self, system_prompt, user_prompt, json_mode, temperature) -> LLMResponse:
        url = f"{self.host}/v1/chat/completions"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        start = time.time()
        try:
            r = requests.post(url, json=payload, timeout=self.timeout_s)
            r.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise LLMClientError(f"Could not reach vLLM server at {self.host}: {e}") from e

        data = r.json()
        content = data["choices"][0]["message"]["content"]
        return LLMResponse(text=content, raw=data, latency_s=time.time() - start)

    def _chat_mock(self, system_prompt, user_prompt) -> LLMResponse:
        """
        Deterministic canned response so agent code + Critique parsing
        can be validated without any model running. Real agents will
        overwrite paper_id/tier/agent_name themselves after parsing,
        so this only needs to be structurally valid JSON.
        """
        canned = {
            "summary": "[MOCK] Placeholder summary generated without a live LLM.",
            "strengths": ["[MOCK] Strength placeholder"],
            "weaknesses": ["[MOCK] Weakness placeholder"],
            "evidence": ["[MOCK] Section 3"],
            "suggestions": ["[MOCK] Suggestion placeholder"],
            "score": 6.5,
            "confidence": 0.5,
        }
        return LLMResponse(text=json.dumps(canned), raw={"mock": True}, latency_s=0.0)