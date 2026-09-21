"""
src/agents/orchestrator.py

Main Orchestrator — LangGraph state machine with cyclic re-check support.
"""

import operator
from typing import TypedDict, Annotated, Optional, Literal

from langgraph.graph import StateGraph, START, END

from .schema import Critique, ConsolidatedReview
from .final_scoring import build_final_review, CriticalAgentFailure

MAX_RECHECKS = 2


class PipelineState(TypedDict):
    paper_id: str
    document_type: str
    tier: str
    document_text: str
    critiques: Annotated[list[Critique], operator.add]
    consolidated_summary: Optional[str]
    conflicts_resolved: Optional[list[str]]
    recheck_targets: Optional[list[str]]
    recheck_count: int
    final_review: Optional[ConsolidatedReview]
    status: str


def _make_placeholder_agent(agent_name: str, mock_score: float, mock_summary: str):
    def agent_fn(state: PipelineState) -> dict:
        recheck_cnt = state.get("recheck_count", 0)
        critique = Critique(
            paper_id=state["paper_id"],
            document_type=state["document_type"],
            agent_name=agent_name,
            tier=state["tier"],
            status="success",
            summary=f"{mock_summary} (Revision {recheck_cnt})",
            score=mock_score,
            evidence=["[placeholder]"],
            revision_count=recheck_cnt,
        )
        return {"critiques": [critique]}
    return agent_fn


rigor_agent = _make_placeholder_agent("rigor", 7.0, "[PLACEHOLDER] Rigor agent.")
ethics_agent = _make_placeholder_agent("ethics", 9.0, "[PLACEHOLDER] Ethics agent.")
novelty_agent = _make_placeholder_agent("novelty", 8.0, "[PLACEHOLDER] Novelty agent.")
feedback_agent = _make_placeholder_agent("feedback", 7.5, "[PLACEHOLDER] Feedback agent.")
presentation_agent = _make_placeholder_agent("presentation", 8.0, "[PLACEHOLDER] Presentation agent.")


def meta_reviewer_node(state: PipelineState) -> dict:
    critiques = state["critiques"]
    latest_critiques = {}
    for c in critiques:
        latest_critiques[c.agent_name] = c

    active_critiques = list(latest_critiques.values())
    successful = [c for c in active_critiques if c.status == "success"]
    failed = [c for c in active_critiques if c.status != "success"]

    summary = (
        f"{len(successful)}/{len(active_critiques)} agents completed successfully. "
        f"Average score: {round(sum(c.score for c in successful) / len(successful), 2) if successful else 'N/A'}."
    )

    recheck_targets = [c.agent_name for c in failed]
    current_rechecks = state.get("recheck_count", 0)

    return {
        "consolidated_summary": summary,
        "conflicts_resolved": [],
        "recheck_targets": recheck_targets,
        "recheck_count": current_rechecks + (1 if recheck_targets else 0),
    }


def final_scoring_node(state: PipelineState) -> dict:
    latest_critiques = {}
    for c in state["critiques"]:
        latest_critiques[c.agent_name] = c

    try:
        review = build_final_review(
            critiques=list(latest_critiques.values()),
            tier=state["tier"],
            paper_id=state["paper_id"],
            consolidated_summary=state["consolidated_summary"],
            conflicts_resolved=state["conflicts_resolved"],
            recheck_targets=state["recheck_targets"],
        )
        return {"final_review": review, "status": "complete"}
    except CriticalAgentFailure as e:
        print(f"  [orchestrator] {e}")
        return {"final_review": None, "status": "needs_manual_review"}


def route_meta_reviewer(state: PipelineState) -> Literal["rigor", "novelty", "presentation", "ethics", "feedback", "final_scoring"]:
    recheck_targets = state.get("recheck_targets", [])
    recheck_count = state.get("recheck_count", 0)

    if recheck_targets and recheck_count <= MAX_RECHECKS:
        target = recheck_targets[0]
        if target in ["rigor", "novelty", "presentation", "ethics", "feedback"]:
            print(f"  [loop] Re-routing to '{target}' (Attempt {recheck_count}/{MAX_RECHECKS})")
            return target

    return "final_scoring"


def build_graph(agents_override=None):
    graph = StateGraph(PipelineState)
    agents = agents_override or {
        "rigor": rigor_agent, "novelty": novelty_agent, "presentation": presentation_agent,
        "ethics": ethics_agent, "feedback": feedback_agent,
    }

    for name, fn in agents.items():
        graph.add_node(name, fn)
    graph.add_node("meta_reviewer", meta_reviewer_node)
    graph.add_node("final_scoring", final_scoring_node)

    for agent_node in agents:
        graph.add_edge(START, agent_node)
        graph.add_edge(agent_node, "meta_reviewer")

    graph.add_conditional_edges(
        "meta_reviewer", route_meta_reviewer,
        {**{name: name for name in agents}, "final_scoring": "final_scoring"}
    )
    graph.add_edge("final_scoring", END)
    return graph.compile()


if __name__ == "__main__":
    print("=== Test 1: normal run, everything succeeds first try ===")
    app = build_graph()
    result = app.invoke({
        "paper_id": "kdd2025_0456", "document_type": "paper", "tier": "B",
        "document_text": "[sample text]", "critiques": [],
        "consolidated_summary": None, "conflicts_resolved": None,
        "recheck_targets": None, "recheck_count": 0,
        "final_review": None, "status": "in_progress",
    })
    print(f"Status: {result['status']}, recheck_count: {result['recheck_count']}, recommendation: {result['final_review'].recommendation if result['final_review'] else 'N/A'}")

    print("\n=== Test 2: rigor fails on attempt 1, succeeds on attempt 2 ===")
    def flaky_rigor_agent(state: PipelineState) -> dict:
        attempt = state.get("recheck_count", 0)
        if attempt == 0:
            critique = Critique(paper_id=state["paper_id"], document_type=state["document_type"],
                                 agent_name="rigor", tier=state["tier"], status="timeout")
            print(f"    -> rigor attempt {attempt}: FAILED (simulated)")
        else:
            critique = Critique(paper_id=state["paper_id"], document_type=state["document_type"],
                                 agent_name="rigor", tier=state["tier"], status="success",
                                 summary="Recovered on retry.", score=7.0, revision_count=attempt)
            print(f"    -> rigor attempt {attempt}: SUCCESS (simulated recovery)")
        return {"critiques": [critique]}

    agents2 = {"rigor": flaky_rigor_agent, "novelty": novelty_agent, "presentation": presentation_agent,
               "ethics": ethics_agent, "feedback": feedback_agent}
    app2 = build_graph(agents_override=agents2)
    result2 = app2.invoke({
        "paper_id": "test_flaky", "document_type": "paper", "tier": "B",
        "document_text": "[sample text]", "critiques": [],
        "consolidated_summary": None, "conflicts_resolved": None,
        "recheck_targets": None, "recheck_count": 0,
        "final_review": None, "status": "in_progress",
    })
    print(f"Final status: {result2['status']}, total recheck_count: {result2['recheck_count']}")
    print(f"Recommendation: {result2['final_review'].recommendation if result2['final_review'] else 'N/A'}")