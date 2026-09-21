"""
src/agents/feedback_agent.py
Feedback Generation Agent.
Takes a parsed paper (title + abstract, or full text) and turns it into
constructive, actionable feedback as a structured Critique.
"""
import json
from langchain_ollama import ChatOllama

from .schema import Critique

CHAT_MODEL = "llama3.2:3b"

llm = ChatOllama(model=CHAT_MODEL, temperature=0.3)


def build_prompt(title: str, abstract: str, tier: str) -> str:
    return f"""You are a constructive feedback generator for academic peer review.
Given the paper below, produce actionable, specific, and constructive feedback
the authors could use to improve their work. Be encouraging but honest. Do not
just summarize the abstract — give concrete, actionable suggestions.

Target venue tier: {tier}

PAPER
Title: {title}
Abstract: {abstract}

Respond ONLY with a JSON object with these exact fields:
{{
  "summary": "1-3 sentence overview of your overall feedback",
  "strengths": ["list of things the paper does well"],
  "weaknesses": ["list of areas that could be improved"],
  "suggestions": ["specific, actionable suggestions the authors could act on"],
  "score": <float 0-10, overall quality/readiness score>,
  "confidence": <float 0-1, your confidence in this assessment>
}}
No text outside the JSON object.
"""


def generate_feedback(paper_id: str, title: str, abstract: str, tier: str = "A*") -> Critique:
    prompt = build_prompt(title, abstract, tier)
    response = llm.invoke(prompt)

    raw_text = response.content.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        return Critique(
            paper_id=paper_id,
            agent_name="feedback_generation",
            tier=tier,
            status="failed",
            summary="Failed to parse LLM output as JSON.",
            extra={"raw_output": raw_text[:500]},
        )

    return Critique(
        paper_id=paper_id,
        agent_name="feedback_generation",
        tier=tier,
        status="success",
        summary=parsed.get("summary", ""),
        strengths=parsed.get("strengths", []),
        weaknesses=parsed.get("weaknesses", []),
        suggestions=parsed.get("suggestions", []),
        score=parsed.get("score"),
        confidence=parsed.get("confidence", 1.0),
    )


if __name__ == "__main__":
    result = generate_feedback(
        paper_id="test_0002",
        title="Your Language Model Secretly Contains Personality Subnetworks",
        abstract=(
            "Humans shift between different personas depending on social context. "
            "Large Language Models (LLMs) demonstrate a similar flexibility in "
            "adopting different personas and behaviors..."
        ),
        tier="A*",
    )
    print(result.model_dump_json(indent=2))