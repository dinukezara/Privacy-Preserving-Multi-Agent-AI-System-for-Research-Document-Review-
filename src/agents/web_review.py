"""JSON stdin/stdout adapter used by the web backend."""

import json
import sys
from typing import Any

from .orchestrator_graph import GraphState, build_graph


def run_review(payload: dict[str, Any]) -> dict[str, Any]:
    paper_id = str(payload.get("paper_id") or "web-review")
    title = str(payload.get("title") or "Untitled document")
    abstract = str(payload.get("abstract") or "")
    full_text = str(payload.get("full_text") or f"Title: {title}\n\nAbstract: {abstract}")
    tier = str(payload.get("tier") or "A")
    document_type = str(payload.get("document_type") or "paper")

    initial_state: GraphState = {
        "paper_id": paper_id,
        "title": title,
        "abstract": abstract,
        "full_text": full_text,
        "document_type": document_type,
        "tier": tier,
        "critiques": [],
        "consolidated_summary": None,
        "conflicts_resolved": None,
        "recheck_targets": None,
        "recheck_count": 0,
        "final_review": None,
        "error": None,
    }

    result = build_graph().invoke(initial_state)
    if result.get("error"):
        raise RuntimeError(result["error"])

    review = result.get("final_review")
    if review is None:
        raise RuntimeError("The review pipeline returned no final review")
    return review.model_dump(mode="json")


def main() -> None:
    try:
        payload = json.load(sys.stdin)
        print(json.dumps(run_review(payload)), flush=True)
    except Exception as error:
        print(json.dumps({"error": str(error)}), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
