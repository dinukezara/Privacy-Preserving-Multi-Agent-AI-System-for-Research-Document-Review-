"""
src/agents/run_single_paper.py

End-to-end smoke test for the agent pipeline: picks one real ICML 2025
paper (by OpenReview note id), downloads its PDF DIRECTLY from
OpenReview (not PMLR) so the filename matches the note id and therefore
matches icml_2025_records.jsonl's paper_id exactly -- your PMLR-scraped
PDFs (download_pmlr_pdfs.py) use different filenames and don't line up
1:1 with the OpenReview records, which is exactly why adapters.py has to
guess titles for those.

Parses the PDF to Markdown and saves it into the
    data/processed/<venue_year>/<note_id>/<note_id>.md
layout that generate_report.py and run_correlation_eval.py already
expect, then runs the full orchestrator_graph pipeline and prints +
saves the ConsolidatedReview.

Requires:
    - .env with OPENREVIEW_USERNAME / OPENREVIEW_PASSWORD and
      LLM_MODEL=llama3.2:3b (or whatever model you've pulled)
    - Ollama running locally with that model pulled
    - A novelty index already built at data/novelty_index
      (python -m src.agents.build_novelty_index) -- if missing, the
      novelty node will fail; everything else will still run.

Usage:
    python -m src.agents.run_single_paper --note-id <id> --tier "A*"
    # or, to just grab the first record with a real abstract:
    python -m src.agents.run_single_paper --tier "A*"
"""

import os
import json
import argparse
from pathlib import Path

from dotenv import load_dotenv
import pymupdf4llm
from openreview.api import OpenReviewClient

from .orchestrator_graph import build_graph, GraphState

RECORDS_FILE = Path("data/raw/icml2025/icml_2025_records.jsonl")
VENUE_YEAR = "icml2025"


def get_client():
    load_dotenv()
    username = os.environ.get("OPENREVIEW_USERNAME")
    password = os.environ.get("OPENREVIEW_PASSWORD")
    if not username or not password:
        raise EnvironmentError("OPENREVIEW_USERNAME / OPENREVIEW_PASSWORD not found in .env")
    return OpenReviewClient(
        baseurl="https://api2.openreview.net", username=username, password=password
    )


def find_record(note_id: str = None) -> dict:
    with open(RECORDS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if note_id:
                if rec["paper_id"].endswith(note_id):
                    return rec
            elif rec.get("abstract"):
                return rec
    raise ValueError(
        f"No matching record found in {RECORDS_FILE}"
        + (f" for note id '{note_id}'" if note_id else " with a non-empty abstract")
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--note-id", default=None,
                         help="OpenReview note id. Default: first record in the file with a real abstract.")
    parser.add_argument("--tier", default="A*")
    args = parser.parse_args()

    record = find_record(args.note_id)
    note_id = record["paper_id"].split("_", 1)[1]
    print(f"Selected paper: {record['title']}")
    print(f"Note id:        {note_id}")

    paper_dir = Path("data/processed") / VENUE_YEAR / note_id
    paper_dir.mkdir(parents=True, exist_ok=True)
    md_path = paper_dir / f"{note_id}.md"

    if not md_path.exists():
        client = get_client()
        print("Downloading PDF from OpenReview...")
        pdf_bytes = client.get_pdf(note_id)
        pdf_path = paper_dir / f"{note_id}.pdf"
        pdf_path.write_bytes(pdf_bytes)

        print("Parsing PDF to Markdown (pymupdf4llm)...")
        page_chunks = pymupdf4llm.to_markdown(
            str(pdf_path), page_chunks=True, table_strategy="lines_strict"
        )
        markdown_text = "\n\n".join(chunk["text"] for chunk in page_chunks)
        md_path.write_text(markdown_text, encoding="utf-8")
    else:
        print(f"Using already-parsed file: {md_path}")

    full_text = md_path.read_text(encoding="utf-8", errors="ignore")

    initial_state: GraphState = {
        "paper_id": record["paper_id"],
        "title": record["title"],
        "abstract": record["abstract"],
        "full_text": full_text,
        "document_type": "paper",
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
    out_path = paper_dir / f"{note_id}_review.json"
    out_path.write_text(review.model_dump_json(indent=2), encoding="utf-8")

    print(f"Saved full review to: {out_path}\n")
    print(review.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
