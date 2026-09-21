"""
src/agents/run_single_presentation.py

End-to-end test of the agent pipeline on one already-parsed presentation
(slide deck). Unlike run_single_paper.py, there's no download/parse step
here -- Kavyanga's presentation collection already produced Marker output
at data/processed/presentations/<id>/<id>.md, matching the folder layout
generate_report.py / run_correlation_eval.py expect.

Sets document_type="presentation" and tier="slides" -- see final_scoring.py
for the "slides" tier weights this requires (rigor/ethics agents already
have slide-specific rubric text in rubrics.py; final_scoring.py needed a
"slides" TIER_WEIGHTS entry added to actually score with that tier).

Usage:
    python -m src.agents.run_single_presentation --paper-id <id>
    # or, to just grab the first record in the file:
    python -m src.agents.run_single_presentation
"""

import json
import argparse
from pathlib import Path

from .orchestrator_graph import build_graph, GraphState

RECORDS_FILE = Path("data/raw/presentations/records.jsonl")
PROCESSED_DIR = Path("data/processed/presentations")


def find_record(paper_id: str = None) -> dict:
    with open(RECORDS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if paper_id:
                if rec["paper_id"] == paper_id or rec["paper_id"].endswith(paper_id):
                    return rec
            else:
                return rec
    raise ValueError(f"No matching record found in {RECORDS_FILE}" + (f" for '{paper_id}'" if paper_id else ""))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--paper-id", default=None,
                         help="e.g. presentation_7704065 or just 7704065. Default: first record in the file.")
    parser.add_argument("--tier", default="slides")
    args = parser.parse_args()

    record = find_record(args.paper_id)
    # paper_id in records.jsonl is like "presentation_7704065" -- the
    # on-disk folder is just the numeric id after the prefix.
    local_id = record["paper_id"].split("_", 1)[1]

    md_path = PROCESSED_DIR / local_id / f"{local_id}.md"
    if not md_path.exists():
        raise FileNotFoundError(
            f"{md_path} not found. Make sure the presentations archive was "
            f"extracted so processed/<id>/<id>.md lands at {PROCESSED_DIR}/<id>/<id>.md"
        )

    print(f"Selected presentation: {record['title']}")
    print(f"Local id:              {local_id}")

    full_text = md_path.read_text(encoding="utf-8", errors="ignore")

    initial_state: GraphState = {
        "paper_id": record["paper_id"],
        "title": record.get("title", ""),
        # abstract field in records.jsonl has raw HTML (<p>...</p>) --
        # strip crudely rather than pull in a full HTML parser for this.
        "abstract": (record.get("abstract") or "").replace("<p>", "").replace("</p>", "").strip(),
        "full_text": full_text,
        "document_type": "presentation",
        "tier": args.tier,
        "critiques": [],
        "consolidated_summary": None,
        "conflicts_resolved": None,
        "recheck_targets": None,
        "recheck_count": 0,
        "final_review": None,
        "error": None,
    }

    app = build_graph()
    print("\nRunning full agent pipeline (rigor, presentation, novelty, ethics, feedback -> meta-reviewer -> final scoring)...\n")
    result = app.invoke(initial_state)

    if result.get("error"):
        print(f"BLOCKED: {result['error']}")
        return

    review = result["final_review"]
    out_path = PROCESSED_DIR / local_id / f"{local_id}_review.json"
    out_path.write_text(review.model_dump_json(indent=2), encoding="utf-8")

    print(f"Saved full review to: {out_path}\n")
    print(review.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
