"""
src/agents/orchestrator_graph.py

Main Orchestrator - wires the full review pipeline into a LangGraph graph:

    START
      |
      +---> technical_rigor_node   \\
      +---> presentation_node       \\
      +---> novelty_node             > run in parallel, all write to
      +---> ethics_node             /  state["critiques"]
      +---> feedback_node          /
      |
    (implicit join - LangGraph waits for all parallel branches)
      |
      v
    meta_reviewer_node
      |
      v
    final_scoring_node
      |
      v
    END

The 5 specialist agents have THREE different native call shapes:
    - technical_rigor_agent, ethics_compliance_agent: class-based,
      `AgentBase.analyze(DocumentInput) -> Critique`
    - presentation_agent, meta_reviewer_agent: functional,
      `agent(state: dict) -> dict`, already LangGraph-shaped
    - novelty_agent, feedback_agent (this repo's): plain functions,
      `evaluate_novelty(paper_id, title, abstract, tier) -> Critique`

Rather than rewrite any of those (they're already tested standalone),
this file adapts each one to a common node signature:
    def node(state: GraphState) -> dict

Each node returns {"critiques": [Critique]} - LangGraph merges these
via the Annotated[list, operator.add] reducer on GraphState.critiques,
so all 5 parallel results accumulate correctly rather than overwriting
each other.
"""

import operator
from typing import Annotated, TypedDict, Optional

from langgraph.graph import StateGraph, START, END

from .schema import Critique, ConsolidatedReview
from .base import DocumentInput
from .rigor_agent import TechnicalRigorAgent
from .ethics_agent import EthicsComplianceAgent
from .presentation_agent import presentation_agent as presentation_node_fn
from .novelty_agent import evaluate_novelty
from .feedback_agent import generate_feedback
from .meta_reviewer_agent import meta_reviewer_agent as meta_reviewer_node_fn
from .final_scoring import build_final_review, CriticalAgentFailure
from .llm_client import LocalLLMClient


# ---------------------------------------------------------------------
# Shared graph state
# ---------------------------------------------------------------------

class GraphState(TypedDict):
    paper_id: str
    title: str
    abstract: str
    full_text: str          # parsed document markdown (from Kavyanga's parsing output)
    document_type: str      # "paper" | "thesis" | "presentation"
    tier: str                # "A*" | "A" | "B" | "C" | "thesis" | "slides"
    # Annotated with operator.add so multiple parallel nodes appending
    # to this key get merged into one list, instead of the last writer
    # silently overwriting everyone else's result.
    critiques: Annotated[list[Critique], operator.add]
    consolidated_summary: Optional[str]
    conflicts_resolved: Optional[list[str]]
    recheck_targets: Optional[list[str]]
    recheck_count: Optional[int]
    final_review: Optional[ConsolidatedReview]
    error: Optional[str]


# Shared LLM client instance for the class-based agents (technical rigor,
# ethics). Reads LLM_BACKEND / LLM_MODEL / LLM_HOST from .env - make sure
# LLM_MODEL is set to a model your team has actually pulled (see the
# task description for the model-name mismatch that needs fixing first).
_llm_client = LocalLLMClient()


# ---------------------------------------------------------------------
# Node adapters - each wraps one agent's native interface to the
# common `(state) -> {"critiques": [...]}` shape.
# ---------------------------------------------------------------------

def _state_to_document_input(state: GraphState) -> DocumentInput:
    return DocumentInput(
        paper_id=state["paper_id"],
        full_text=state["full_text"],
        tier=state["tier"],
        document_type=state.get("document_type", "paper"),
        title=state.get("title"),
        abstract=state.get("abstract"),
    )


def technical_rigor_node(state: GraphState) -> dict:
    agent = TechnicalRigorAgent(llm_client=_llm_client)
    doc = _state_to_document_input(state)
    critique = agent.analyze(doc)
    return {"critiques": [critique]}


def ethics_node(state: GraphState) -> dict:
    agent = EthicsComplianceAgent(llm_client=_llm_client)
    doc = _state_to_document_input(state)
    critique = agent.analyze(doc)
    return {"critiques": [critique]}


def presentation_node(state: GraphState) -> dict:
    # presentation_agent.py is already LangGraph-shaped - pass through,
    # just supply the keys it expects.
    inner_state = {
        "paper_id": state["paper_id"],
        "document_type": state.get("document_type", "paper"),
        "tier": state["tier"],
        "document_text": state["full_text"],
    }
    return presentation_node_fn(inner_state)


def novelty_node(state: GraphState) -> dict:
    critique = evaluate_novelty(
        paper_id=state["paper_id"],
        title=state.get("title", ""),
        abstract=state.get("abstract", ""),
        tier=state["tier"],
    )
    return {"critiques": [critique]}


def feedback_node(state: GraphState) -> dict:
    critique = generate_feedback(
        paper_id=state["paper_id"],
        title=state.get("title", ""),
        abstract=state.get("abstract", ""),
        tier=state["tier"],
    )
    return {"critiques": [critique]}


def meta_reviewer_node(state: GraphState) -> dict:
    result = meta_reviewer_node_fn({
        "critiques": state["critiques"],
        "recheck_count": state.get("recheck_count", 0),
    })
    return result  # {"consolidated_summary", "conflicts_resolved", "recheck_targets", "recheck_count"}


def final_scoring_node(state: GraphState) -> dict:
    try:
        review = build_final_review(
            critiques=state["critiques"],
            tier=state["tier"],
            paper_id=state["paper_id"],
            consolidated_summary=state.get("consolidated_summary", ""),
            conflicts_resolved=state.get("conflicts_resolved", []),
            recheck_targets=state.get("recheck_targets", []),
        )
        return {"final_review": review}
    except CriticalAgentFailure as e:
        # A tier-critical agent (rigor/novelty) failed - do NOT produce a
        # misleading automatic score. Route to manual review instead.
        return {"error": f"Blocked automatic scoring: {e}"}


# ---------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------

def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("technical_rigor", technical_rigor_node)
    graph.add_node("presentation", presentation_node)
    graph.add_node("novelty", novelty_node)
    graph.add_node("ethics", ethics_node)
    graph.add_node("feedback", feedback_node)
    graph.add_node("meta_reviewer", meta_reviewer_node)
    graph.add_node("final_scoring", final_scoring_node)

    # Fan-out: START feeds all 5 specialists in parallel
    for specialist in ("technical_rigor", "presentation", "novelty", "ethics", "feedback"):
        graph.add_edge(START, specialist)

    # Join: all 5 must complete before Meta-Reviewer runs.
    # LangGraph waits for every incoming edge to a node before running it,
    # so pointing all 5 specialists at meta_reviewer implicitly joins them.
    for specialist in ("technical_rigor", "presentation", "novelty", "ethics", "feedback"):
        graph.add_edge(specialist, "meta_reviewer")

    graph.add_edge("meta_reviewer", "final_scoring")
    graph.add_edge("final_scoring", END)

    return graph.compile()


# ---------------------------------------------------------------------
# Standalone test - run the whole pipeline on one real ICLR paper
# ---------------------------------------------------------------------

if __name__ == "__main__":
    import json
    import sys

    RECORDS_FILE = "data/raw/iclr2025/iclr_2025_records.jsonl"
    paper_index = int(sys.argv[1]) if len(sys.argv) > 1 else 100

    with open(RECORDS_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i == paper_index:
                paper = json.loads(line)
                break
        else:
            raise IndexError(f"No paper at index {paper_index}")

    # NOTE: full_text is a placeholder (title + abstract) until Kavyanga's
    # real parsed Markdown output is available - swap this out once the
    # parsed .md files land, per the "combine agents pipeline while we
    # wait for parsed papers" plan.
    placeholder_full_text = f"Title: {paper['title']}\n\nAbstract: {paper['abstract']}"

    initial_state: GraphState = {
        "paper_id": paper["paper_id"],
        "title": paper["title"],
        "abstract": paper["abstract"],
        "full_text": placeholder_full_text,
        "document_type": "paper",
        "tier": "A*",
        "critiques": [],
        "consolidated_summary": None,
        "conflicts_resolved": None,
        "recheck_targets": None,
        "recheck_count": 0,
        "final_review": None,
        "error": None,
    }

    app = build_graph()
    print(f"Running full pipeline on: {paper['title']}\n")
    result = app.invoke(initial_state)

    if result.get("error"):
        print(f"BLOCKED: {result['error']}")
    else:
        review: ConsolidatedReview = result["final_review"]
        print(review.model_dump_json(indent=2))