"""
src/agents/base.py

Shared base class for all specialist review agents (Technical Rigor,
Presentation Quality, Librarian/Novelty, Ethics & Compliance, Feedback
Generation -- per Agent_Development_Division.md).

Each concrete agent only needs to implement:
    - `agent_name`            class attribute, e.g. "technical_rigor"
    - `build_system_prompt(tier)`   -> str
    - `build_user_prompt(document, context)` -> str

`AgentBase.analyze()` then handles the common flow used by every agent:
    1. Build the tier-aware system + user prompts.
    2. Call the local LLM via LocalLLMClient (json_mode=True).
    3. Parse the JSON response into a `Critique`.
    4. If parsing fails, send ONE "fix your JSON" retry before giving
       up and returning a `status="failed"` Critique (never raises --
       downstream orchestrator code should always get a valid object
       back, per the SAD's "one agent thread fails, others continue"
       reliability requirement).

`DocumentInput` is the minimal shape every agent expects for the
parsed document; it matches the output of parse_pdfs_pymupdf.py plus
the paper/thesis/tier metadata the orchestrator attaches before
dispatch.
"""

import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

from pydantic import ValidationError

from schema import Critique
from llm_client import LocalLLMClient, LLMClientError


@dataclass
class DocumentInput:
    """Minimal parsed-document shape every agent consumes."""
    paper_id: str
    full_text: str
    tier: str  # "A*" | "A" | "B" | "C" | "thesis" | "slides"
    document_type: str = "paper"  # "paper" | "thesis" | "presentation"
    title: Optional[str] = None
    abstract: Optional[str] = None
    extra: dict = field(default_factory=dict)  # e.g. {"sections": {...}}


class AgentBase(ABC):
    """Abstract base every specialist agent inherits from."""

    agent_name: str = "base"

    def __init__(self, llm_client: Optional[LocalLLMClient] = None, max_retries: int = 1):
        self.llm = llm_client or LocalLLMClient()
        self.max_retries = max_retries

    # -- must be implemented by concrete agents -------------------------

    @abstractmethod
    def build_system_prompt(self, tier: str) -> str:
        """Return the tier-calibrated system prompt for this agent's role."""
        raise NotImplementedError

    @abstractmethod
    def build_user_prompt(self, document: DocumentInput, context: Optional[dict]) -> str:
        """Return the user-turn prompt containing the document content to review."""
        raise NotImplementedError

    # -- shared flow ------------------------------------------------------

    def analyze(self, document: DocumentInput, context: Optional[dict] = None) -> Critique:
        """
        Run this agent against a parsed document and return a validated
        Critique. Never raises -- failures come back as a Critique with
        status="failed" so the orchestrator can continue with the other
        parallel agents.
        """
        system_prompt = self.build_system_prompt(document.tier)
        user_prompt = self.build_user_prompt(document, context)

        last_error = None
        raw_text = ""
        for attempt in range(self.max_retries + 1):
            try:
                response = self.llm.chat(system_prompt, user_prompt, json_mode=True)
                raw_text = response.text
                payload = self._extract_json(raw_text)
                return self._to_critique(document, payload, confidence_default=1.0)
            except (LLMClientError, json.JSONDecodeError, ValidationError, ValueError) as e:
                last_error = e
                if attempt < self.max_retries:
                    # One repair pass: ask the model to fix its own output.
                    user_prompt = (
                        f"Your previous response was not valid JSON matching the requested "
                        f"schema. Error: {e}\n\nYour previous response was:\n{raw_text}\n\n"
                        f"Return ONLY corrected valid JSON, nothing else."
                    )
                    continue

        return Critique(
            paper_id=document.paper_id,
            document_type=document.document_type,
            agent_name=self.agent_name,
            tier=document.tier,
            status="failed",
            summary=f"Agent failed after {self.max_retries + 1} attempt(s): {last_error}",
            confidence=0.0,
        )

    # -- helpers ------------------------------------------------------

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Parse the LLM's response text as JSON, tolerating markdown fences."""
        text = text.strip()
        fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
        if fenced:
            text = fenced.group(1)
        return json.loads(text)

    def _to_critique(self, document: DocumentInput, payload: dict, confidence_default: float) -> Critique:
        # Merge document-level provenance (venue, year, pdf_path,
        # title_is_guess, etc. -- set by adapters.py) with any
        # agent/LLM-specific extra data, rather than letting the LLM's
        # payload silently overwrite it. Keep them under separate keys
        # so downstream consumers (Meta-Reviewer, report generator)
        # can tell provenance apart from agent-generated metadata.
        combined_extra: dict = {}
        if document.extra:
            combined_extra["document"] = document.extra
        if payload.get("extra"):
            combined_extra["agent"] = payload["extra"]

        return Critique(
            paper_id=document.paper_id,
            document_type=document.document_type,
            agent_name=self.agent_name,
            tier=document.tier,
            status="success",
            summary=payload.get("summary", ""),
            strengths=payload.get("strengths", []),
            weaknesses=payload.get("weaknesses", []),
            evidence=payload.get("evidence", []),
            suggestions=payload.get("suggestions", []),
            score=payload.get("score"),
            confidence=payload.get("confidence", confidence_default),
            extra=combined_extra or None,
        )