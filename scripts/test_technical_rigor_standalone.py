"""
scripts/test_technical_rigor_standalone.py

Standalone test harness for the Technical Rigor Assessor agent --
run this BEFORE wiring the agent into the LangGraph graph, per the
build order in Agent_Development_Division.md:

    "Each person builds and tests their agent(s) standalone first --
    feed it a parsed sample paper directly, confirm it reliably
    returns a valid Critique object, before wiring it into the graph."

Usage:
    # No local LLM required -- validates the plumbing only:
    python test_technical_rigor_standalone.py --mock

    # Against a real local Ollama model (must be running + pulled):
    python test_technical_rigor_standalone.py --backend ollama --model llama3:8b-instruct

    # Against a custom parsed paper (same shape as parse_pdfs_pymupdf.py output,
    # plus paper_id/tier/document_type -- see sample_data/sample_parsed_paper.json):
    python test_technical_rigor_standalone.py --input path/to/parsed_paper.json --tier "A*"
"""

import argparse
import json
import sys
from pathlib import Path

# Allow running this script directly without installing the package --
# matches the flat-script style already used in src/data_collection/.
AGENTS_DIR = Path(__file__).resolve().parent.parent / "src" / "agents"
sys.path.insert(0, str(AGENTS_DIR))

from base import DocumentInput  # noqa: E402
from llm_client import LocalLLMClient, LLMClientError  # noqa: E402
from technical_rigor_agent import TechnicalRigorAgent  # noqa: E402
from adapters import document_from_parsed_record  # noqa: E402


DEFAULT_SAMPLE = Path(__file__).resolve().parent.parent / "sample_data" / "sample_parsed_paper.json"


def load_document(path: Path, tier_override: str | None) -> DocumentInput:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return DocumentInput(
        paper_id=data.get("paper_id", path.stem),
        full_text=data.get("full_text", ""),
        tier=tier_override or data.get("tier", "B"),
        document_type=data.get("document_type", "paper"),
        title=data.get("title"),
        abstract=data.get("abstract"),
    )


def load_document_from_jsonl(
    path: Path, tier_override: str | None, pdf_filename: str | None, line_index: int | None
) -> DocumentInput:
    """
    Pull one record out of a parse_pdfs_pymupdf.py output jsonl file
    (e.g. data/parsed/icml2025/icml_2025_parsed.jsonl) and adapt it into
    a DocumentInput. Select the record either by --pdf-filename (exact
    match on the pdf_filename field) or --line-index (0-based line
    number in the file); defaults to the first successfully-parsed line.
    """
    with open(path, "r", encoding="utf-8") as f:
        lines = [json.loads(l) for l in f if l.strip()]

    if pdf_filename:
        matches = [r for r in lines if r.get("pdf_filename") == pdf_filename]
        if not matches:
            print(f"No record with pdf_filename='{pdf_filename}' found in {path}")
            sys.exit(1)
        record = matches[0]
    elif line_index is not None:
        if line_index >= len(lines):
            print(f"--line-index {line_index} out of range (file has {len(lines)} lines)")
            sys.exit(1)
        record = lines[line_index]
    else:
        successful = [r for r in lines if r.get("parse_status") == "success"]
        if not successful:
            print(f"No successfully-parsed records found in {path}")
            sys.exit(1)
        record = successful[0]

    return document_from_parsed_record(record, tier=tier_override)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input", type=Path, default=None,
        help=f"Path to a single parsed paper JSON, DocumentInput-shaped (default: {DEFAULT_SAMPLE.name})",
    )
    parser.add_argument(
        "--jsonl", type=Path, default=None,
        help="Path to a parse_pdfs_pymupdf.py output .jsonl file (e.g. data/parsed/icml2025/icml_2025_parsed.jsonl). "
             "Overrides --input.",
    )
    parser.add_argument("--pdf-filename", default=None, help="With --jsonl: select the record matching this pdf_filename")
    parser.add_argument("--line-index", type=int, default=None, help="With --jsonl: select record by 0-based line number")
    parser.add_argument("--tier", default=None, help="Override the tier in the input file (A*, A, B, C, thesis, slides)")
    parser.add_argument("--mock", action="store_true", help="Shortcut for --backend mock")
    parser.add_argument("--backend", default="ollama", choices=["ollama", "vllm", "mock"])
    parser.add_argument("--model", default=None, help="Model name/tag override")
    parser.add_argument("--host", default=None, help="Backend base URL override")
    args = parser.parse_args()

    backend = "mock" if args.mock else args.backend

    if args.jsonl:
        if not args.jsonl.exists():
            print(f"jsonl file not found: {args.jsonl}")
            sys.exit(1)
        try:
            document = load_document_from_jsonl(args.jsonl, args.tier, args.pdf_filename, args.line_index)
        except ValueError as e:
            print(f"Could not load that record: {e}")
            sys.exit(1)
    else:
        input_path = args.input or DEFAULT_SAMPLE
        if not input_path.exists():
            print(f"Input file not found: {input_path}")
            sys.exit(1)
        document = load_document(input_path, args.tier)

    print(f"Loaded '{document.paper_id}' (tier={document.tier}, "
          f"{len(document.full_text)} chars) -- running Technical Rigor Assessor "
          f"[backend={backend}]...\n")

    client = LocalLLMClient(backend=backend, host=args.host, model=args.model)
    agent = TechnicalRigorAgent(llm_client=client)

    try:
        critique = agent.analyze(document)
    except LLMClientError as e:
        print(f"LLM backend error: {e}")
        sys.exit(1)

    print(critique.model_dump_json(indent=2))

    if critique.status != "success":
        print(f"\n[!] Agent did not return status='success' (got '{critique.status}').")
        sys.exit(1)

    print(f"\nOK -- valid Critique returned (score={critique.score}, "
          f"confidence={critique.confidence}).")


if __name__ == "__main__":
    main()
