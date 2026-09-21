"""
src/agents/generate_report.py

Runs the full agent pipeline on one real parsed paper and formats the
result as a clean, human-readable Markdown report - this is the actual
"feedback to the researcher" output the SAD describes (Section 4.1,
"View and Export Review Report"). Useful for demoing what a user
actually receives, not just the raw correlation numbers.

Usage:
    python -m src.agents.generate_report --venue-year iclr2025 --paper-id znhZbonEoe --tier "A*"
"""

import json
import argparse
from pathlib import Path

from .orchestrator_graph import build_graph, GraphState


def format_report(review, title: str) -> str:
    lines = [
        f"# Review Report: {title}",
        "",
        f"**Overall Score:** {review.weighted_score}/10",
        f"**Recommendation:** {review.recommendation}",
        f"**Tier evaluated:** {review.tier}",
        "",
        "## Consolidated Summary",
        review.consolidated_summary,
        "",
    ]

    if review.conflicts_resolved:
        lines += ["## Notable Disagreements Between Reviewers", ""]
        for c in review.conflicts_resolved:
            lines.append(f"- {c}")
        lines.append("")

    for critique in review.critiques:
        if critique.status != "success":
            lines += [f"## {critique.agent_name.title()} — unavailable ({critique.status})", ""]
            continue

        lines += [
            f"## {critique.agent_name.replace('_', ' ').title()} (score: {critique.score}/10)",
            "",
            critique.summary,
            "",
        ]
        if critique.strengths:
            lines.append("**Strengths:**")
            for s in critique.strengths:
                lines.append(f"- {s}")
            lines.append("")
        if critique.weaknesses:
            lines.append("**Weaknesses:**")
            for w in critique.weaknesses:
                lines.append(f"- {w}")
            lines.append("")
        if critique.suggestions:
            lines.append("**Suggestions:**")
            for s in critique.suggestions:
                lines.append(f"- {s}")
            lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--venue-year", required=True, help="e.g. iclr2025")
    parser.add_argument("--paper-id", required=True, help="the folder name, e.g. znhZbonEoe")
    parser.add_argument("--tier", default="A*")
    parser.add_argument("--out", default=None, help="output .md path (default: <paper-id>_report.md)")
    args = parser.parse_args()

    venue = "".join(c for c in args.venue_year if c.isalpha()).upper()
    year = int("".join(c for c in args.venue_year if c.isdigit()))
    full_paper_id = f"{venue.lower()}{year}_{args.paper_id}"

    md_path = Path("data/processed") / args.venue_year / args.paper_id / f"{args.paper_id}.md"
    records_file = Path("data/raw") / args.venue_year / f"{venue.lower()}_{year}_records.jsonl"

    full_text = md_path.read_text(encoding="utf-8", errors="ignore")

    title, abstract = "", ""
    with open(records_file, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if rec["paper_id"] == full_paper_id:
                title = rec.get("title", "")
                abstract = rec.get("abstract", "")
                break

    initial_state: GraphState = {
        "paper_id": full_paper_id,
        "title": title,
        "abstract": abstract,
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
    print(f"Running pipeline on: {title}")
    result = app.invoke(initial_state)

    if result.get("error"):
        print(f"BLOCKED: {result['error']}")
        return

    report = format_report(result["final_review"], title)
    out_path = Path(args.out or f"{args.paper_id}_report.md")
    out_path.write_text(report, encoding="utf-8")
    print(f"Report saved to {out_path}")
    print("\n" + report)


if __name__ == "__main__":
    main()