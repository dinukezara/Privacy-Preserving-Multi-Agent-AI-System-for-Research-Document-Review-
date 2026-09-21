"""
src/agents/meta_reviewer_agent.py

Meta-Reviewer Agent — reads all specialist Critiques, synthesizes a real
consolidated summary, identifies genuine disagreements between agents, and
can flag a successful-but-suspicious critique for re-check (not just failed
agents, which are already handled deterministically).

Calls the local Ollama server directly, same pattern as presentation_agent.py.
"""

import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:3b"

SYSTEM_PROMPT = """You are the Meta-Reviewer agent in an academic document review system.

You will be given the individual critiques written by several specialist agents
(Rigor, Novelty, Presentation, Ethics, Feedback) who each independently reviewed
the same document. Your job is NOT to re-review the document yourself — you have
not read it. Your job is to synthesize what the specialists already found.

Do the following:
1. Write a consolidated summary combining the specialists' findings into one
   coherent overview.
2. Identify any real disagreements between agents — for example, one agent
   giving a high score while another raises serious concerns, or agents
   making contradictory claims. If there are no real disagreements, say so.
3. Only if a specific agent's critique looks unusually thin, vague, generic,
   or internally inconsistent (not just because you disagree with its
   conclusion), name that agent as needing a re-check. Do not flag an agent
   just because it gave a low score — a low score can be a correct, well-
   justified finding.

You MUST respond with ONLY a valid JSON object, no other text, matching exactly:
{
  "consolidated_summary": "a real synthesis, not a restatement of each critique in order",
  "conflicts_found": ["description of any real disagreement between agents"],
  "llm_recheck_targets": ["agent_name"]
}
If there are no conflicts, use an empty list. If no agent's critique looks
suspicious, use an empty list for llm_recheck_targets too."""


def call_ollama_for_synthesis(critiques_summary: str) -> dict:
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Specialist critiques:\n\n{critiques_summary}"},
        ],
        "format": "json",
        "stream": False,
        "keep_alive": "30m",
    }
    resp = requests.post(OLLAMA_URL, json=payload, timeout=300)
    resp.raise_for_status()
    return json.loads(resp.json()["message"]["content"])


def _critiques_to_text(critiques) -> str:
    """Turns the list of Critique objects into readable text for the prompt."""
    parts = []
    for c in critiques:
        if c.status != "success":
            parts.append(f"--- {c.agent_name.upper()} AGENT ---\nStatus: {c.status} (no output available)\n")
            continue
        parts.append(
            f"--- {c.agent_name.upper()} AGENT (score: {c.score}/10) ---\n"
            f"Summary: {c.summary}\n"
            f"Strengths: {', '.join(c.strengths) if c.strengths else 'none listed'}\n"
            f"Weaknesses: {', '.join(c.weaknesses) if c.weaknesses else 'none listed'}\n"
        )
    return "\n".join(parts)


def meta_reviewer_agent(state: dict) -> dict:
    """
    LangGraph-compatible node. Deduplicates critiques (keep latest per
    agent), deterministically flags failed/timeout agents for recheck,
    then calls the LLM to actually synthesize the successful ones.
    """
    critiques = state["critiques"]
    latest_critiques = {}
    for c in critiques:
        latest_critiques[c.agent_name] = c

    active_critiques = list(latest_critiques.values())
    successful = [c for c in active_critiques if c.status == "success"]
    failed = [c for c in active_critiques if c.status != "success"]

    # Deterministic: failed/timeout agents always need a recheck — not a judgment call.
    recheck_targets = [c.agent_name for c in failed]
    current_rechecks = state.get("recheck_count", 0)

    if not successful:
        return {
            "consolidated_summary": "No agents completed successfully — nothing to synthesize.",
            "conflicts_resolved": [],
            "recheck_targets": recheck_targets,
            "recheck_count": current_rechecks + (1 if recheck_targets else 0),
        }

    try:
        critiques_text = _critiques_to_text(successful)
        result = call_ollama_for_synthesis(critiques_text)
        summary = result.get("consolidated_summary", "")
        conflicts = result.get("conflicts_found", [])
        llm_flagged = result.get("llm_recheck_targets", [])
        # Only trust LLM-flagged agents that actually exist among our real critiques
        valid_agent_names = {c.agent_name for c in successful}
        llm_flagged = [a for a in llm_flagged if a in valid_agent_names]
        recheck_targets = list(set(recheck_targets + llm_flagged))
    except Exception as e:
        print(f"  [meta_reviewer_agent] LLM synthesis failed: {e}, falling back to basic summary")
        avg_score = round(sum(c.score for c in successful) / len(successful), 2)
        summary = f"{len(successful)}/{len(active_critiques)} agents completed. Average score: {avg_score}."
        conflicts = []

    return {
        "consolidated_summary": summary,
        "conflicts_resolved": conflicts,
        "recheck_targets": recheck_targets,
        "recheck_count": current_rechecks + (1 if recheck_targets else 0),
    }


if __name__ == "__main__":
    # Standalone test using fake critiques — no need for real agents to be
    # done yet, per the team's build order (test standalone before wiring in).
    import sys
    sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent.parent))
    from src.agents.schema import Critique

    fake_critiques = [
        Critique(paper_id="test_001", agent_name="rigor", tier="B", status="success",
                 summary="Solid experimental design, though baselines are a bit dated.",
                 strengths=["Clear methodology"], weaknesses=["Old baselines"], score=6.5),
        Critique(paper_id="test_001", agent_name="presentation", tier="B", status="success",
                 summary="Very well written and clearly structured.",
                 strengths=["Excellent clarity"], weaknesses=[], score=9.0),
        Critique(paper_id="test_001", agent_name="novelty", tier="B", status="success",
                 summary="Limited novelty — very similar to prior work.",
                 strengths=[], weaknesses=["Incremental contribution"], score=4.0),
    ]

    state = {"critiques": fake_critiques, "recheck_count": 0}
    result = meta_reviewer_agent(state)
    print(json.dumps(result, indent=2))
