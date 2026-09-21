"""
src/agents/presentation_agent.py

Presentation Quality Checker Agent — evaluates structure, clarity, narrative
flow, readability, and organization (per the Software Architecture
Document's Presentation Agent description). Explicitly does NOT judge
technical correctness, novelty, or experimental rigor — those belong to
other specialist agents.

Calls the local Ollama server directly (no cloud API), parses the response
into the shared Critique schema.
"""

import json
import requests

from .schema import Critique

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:3b"

SYSTEM_PROMPT = """You are the Presentation Quality Checker agent in an academic document review system.

Your job is to evaluate the STRUCTURE, CLARITY, NARRATIVE FLOW, READABILITY, and ORGANIZATION
of the document you are given — NOT its technical correctness, novelty, or experimental rigor.
Those are handled by other specialist agents; stay focused on presentation quality only.

Evaluate:
- Is the document well-structured with a clear, logical flow?
- Is the writing clear and easy to follow?
- Are transitions between sections/ideas logical?
- If this is a presentation/slide deck: is content organized in a way that works well as slides
  (concise points, logical progression, not overly dense)?

You MUST respond with ONLY a valid JSON object, no other text, matching exactly this shape:
{
  "summary": "1-3 sentence overview of your assessment",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "evidence": ["specific section, heading, or quote grounding a claim you made"],
  "suggestions": ["actionable improvement 1", "actionable improvement 2"],
  "score": <number 0-10>,
  "confidence": <number 0-1>
}
IMPORTANT: "strengths", "weaknesses", "evidence", and "suggestions" must each be a
JSON ARRAY of strings, even if there is only one item — never a single string.
Do not include any text outside the JSON object."""


def _as_list(value) -> list:
    """Coerces a field that should be a list of strings but sometimes comes
    back from the LLM as a single string (e.g. 'Section 3.1, Section 3.1.1'
    instead of ['Section 3.1', 'Section 3.1.1']). This is a real, observed
    failure mode on llama3.2:3b — wrap every list-typed field with this
    rather than trusting the model followed the schema exactly."""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [str(value)]


def _as_float(value, default: float) -> float:
    """Coerces score/confidence fields, tolerating the model returning a
    numeric string or a string like '7/10' instead of a plain number."""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    try:
        # handle things like "7", "7.5", or "7/10" (take the first number)
        cleaned = str(value).split("/")[0].strip()
        return float(cleaned)
    except (ValueError, TypeError):
        return default


def call_ollama(document_text: str, tier: str) -> dict:
    """Sends the document to Ollama, returns the parsed JSON response as a dict."""
    # Truncate as a safety net — presentations are usually short, but this
    # guards against an unexpectedly long one blowing the context window.
    user_prompt = f"Target tier: {tier}\n\nDocument to review:\n\n{document_text[:12000]}"

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "format": "json",   # asks Ollama to constrain output to valid JSON
        "stream": False,
        "keep_alive": "30m",  # keep the model loaded between calls, avoid reload cost
    }

    resp = requests.post(OLLAMA_URL, json=payload, timeout=300)
    resp.raise_for_status()
    raw_content = resp.json()["message"]["content"]
    return json.loads(raw_content)


def presentation_agent(state: dict) -> dict:
    """
    LangGraph-compatible node. Expects state with: paper_id, document_type,
    tier, document_text. Returns {"critiques": [Critique]} — same shape
    every other agent (real or placeholder) in the graph returns.
    """
    paper_id = state["paper_id"]
    document_type = state.get("document_type", "presentation")
    tier = state["tier"]
    document_text = state["document_text"]

    try:
        result = call_ollama(document_text, tier)
        critique = Critique(
            paper_id=paper_id,
            document_type=document_type,
            agent_name="presentation",
            tier=tier,
            status="success",
            summary=str(result.get("summary", "")),
            strengths=_as_list(result.get("strengths")),
            weaknesses=_as_list(result.get("weaknesses")),
            evidence=_as_list(result.get("evidence")),
            suggestions=_as_list(result.get("suggestions")),
            score=_as_float(result.get("score"), default=0.0),
            confidence=_as_float(result.get("confidence"), default=0.5),
        )
    except Exception as e:
        print(f"  [presentation_agent] failed: {e}")
        critique = Critique(
            paper_id=paper_id,
            document_type=document_type,
            agent_name="presentation",
            tier=tier,
            status="failed",
        )

    return {"critiques": [critique]}


if __name__ == "__main__":
    # Standalone test — feed it ONE real parsed presentation directly,
    # per the team's build order: test standalone before wiring into the graph.
    import sys
    from pathlib import Path

    if len(sys.argv) < 2:
        print("Usage: python3 -m src.agents.presentation_agent <path_to_parsed_md_file>")
        sys.exit(1)

    md_path = Path(sys.argv[1])
    text = md_path.read_text(encoding="utf-8", errors="ignore")

    state = {
        "paper_id": md_path.stem,
        "document_type": "presentation",
        "tier": "presentation",
        "document_text": text,
    }

    result = presentation_agent(state)
    critique = result["critiques"][0]
    print(critique.model_dump_json(indent=2))