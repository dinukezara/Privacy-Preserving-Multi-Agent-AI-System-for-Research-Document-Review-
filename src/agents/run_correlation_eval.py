"""
src/agents/run_correlation_eval.py

Batch-runs the full agent pipeline (orchestrator_graph.py) against every
parsed paper found in data/processed/<venue+year>/, matches each one back
to its original scraped record (for the human reviewer ground-truth
score), and computes Spearman + Pearson correlation between AI-generated
weighted_score and the average human review score.

RESUMABLE: writes one result per line to a .jsonl file as it goes. Safe
to stop and re-run - already-processed paper_ids are skipped.

Usage (run from repo root):
    python -m src.agents.run_correlation_eval --venue-years iclr2025 iclr2024 iclr2026 --tier "A*"
"""

import json
import argparse
from pathlib import Path
from statistics import mean

from scipy.stats import spearmanr, pearsonr

from .orchestrator_graph import build_graph, GraphState


def load_original_records(records_file: Path) -> dict:
    """Loads a venue's scraped records.jsonl into a dict keyed by paper_id,
    so we can look up title/abstract/human review scores by paper_id."""
    records = {}
    if not records_file.exists():
        print(f"  [warn] records file not found: {records_file}")
        return records
    with open(records_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            records[rec["paper_id"]] = rec
    return records


def human_avg_score(record: dict) -> float | None:
    """Averages the numeric review scores across all reviewers for one paper.
    Returns None if there are no scored reviews (can't use this paper for
    correlation, but it's still fine to have been reviewed by our agents -
    just excluded from the correlation calculation)."""
    numeric_scores = []
    for r in record.get("reviews", []):
        raw = r.get("score")
        if raw is None:
            continue
        try:
            # Handles both plain numbers and strings like "6" or
            # "6: marginally above the acceptance threshold" (some years'
            # OpenReview schema embeds the rating inside a longer string).
            numeric_part = str(raw).split(":")[0].strip()
            numeric_scores.append(float(numeric_part))
        except (ValueError, TypeError):
            continue  # genuinely unparseable, skip this one review's score

    if not numeric_scores:
        return None
    return mean(numeric_scores)


def find_parsed_papers(processed_dir: Path):
    """Yields (folder_name, md_path) for every parsed paper folder found."""
    if not processed_dir.exists():
        print(f"  [warn] processed dir not found: {processed_dir}")
        return
    for folder in sorted(processed_dir.iterdir()):
        if not folder.is_dir():
            continue
        md_path = folder / f"{folder.name}.md"
        if md_path.exists():
            yield folder.name, md_path
        else:
            print(f"  [warn] no .md file found in {folder}, skipping")


def load_already_done(out_file: Path) -> set:
    done = set()
    if out_file.exists():
        with open(out_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    done.add(rec["paper_id"])
                except (json.JSONDecodeError, KeyError):
                    continue
    return done


def run_one_venue_year(venue_year: str, tier: str, app, out_f, already_done: set):
    """venue_year like 'iclr2025' -> venue='ICLR', year=2025."""
    venue = "".join(c for c in venue_year if c.isalpha()).upper()
    year = int("".join(c for c in venue_year if c.isdigit()))

    processed_dir = Path("data/processed") / venue_year
    records_file = Path("data/raw") / venue_year / f"{venue.lower()}_{year}_records.jsonl"

    original_records = load_original_records(records_file)
    print(f"\n=== {venue_year} ===")
    print(f"Loaded {len(original_records)} original records for matching.")

    matched, unmatched, no_human_score = 0, 0, 0

    for folder_name, md_path in find_parsed_papers(processed_dir):
        paper_id = f"{venue.lower()}{year}_{folder_name}"

        if paper_id in already_done:
            continue

        original = original_records.get(paper_id)
        if original is None:
            unmatched += 1
            print(f"  [warn] no original record found for {paper_id}, skipping (parsed but not in scraped data)")
            continue

        h_score = human_avg_score(original)
        if h_score is None:
            no_human_score += 1
            print(f"  [warn] {paper_id} has no numeric human review scores, skipping")
            continue

        full_text = md_path.read_text(encoding="utf-8", errors="ignore")

        initial_state: GraphState = {
            "paper_id": paper_id,
            "title": original.get("title", ""),
            "abstract": original.get("abstract", ""),
            "full_text": full_text,
            "document_type": "paper",
            "tier": tier,
            "critiques": [],
            "consolidated_summary": None,
            "conflicts_resolved": None,
            "recheck_targets": None,
            "recheck_count": 0,
            "final_review": None,
            "error": None,
        }

        try:
            result = app.invoke(initial_state)
        except Exception as e:
            print(f"  [warn] pipeline crashed for {paper_id}: {e}, skipping")
            continue

        if result.get("error"):
            print(f"  [warn] {paper_id} blocked: {result['error']}")
            out_record = {
                "paper_id": paper_id,
                "venue_year": venue_year,
                "human_avg_score": h_score,
                "ai_weighted_score": None,
                "recommendation": None,
                "blocked_reason": result["error"],
            }
        else:
            review = result["final_review"]
            out_record = {
                "paper_id": paper_id,
                "venue_year": venue_year,
                "human_avg_score": h_score,
                "ai_weighted_score": review.weighted_score,
                "recommendation": review.recommendation,
                "blocked_reason": None,
            }

        out_f.write(json.dumps(out_record, ensure_ascii=False) + "\n")
        out_f.flush()
        matched += 1
        print(f"  [{matched}] {paper_id}: human={h_score:.2f}, ai={out_record['ai_weighted_score']}")

    print(f"{venue_year} summary: matched={matched}, unmatched={unmatched}, no_human_score={no_human_score}")


def compute_and_print_correlation(out_file: Path):
    human_scores, ai_scores = [], []
    with open(out_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            if rec["ai_weighted_score"] is not None:
                human_scores.append(rec["human_avg_score"])
                ai_scores.append(rec["ai_weighted_score"])

    n = len(human_scores)
    print(f"\n=== Correlation results (n={n} papers with both scores) ===")
    if n < 3:
        print("Not enough data points to compute a meaningful correlation yet.")
        return

    spearman_corr, spearman_p = spearmanr(human_scores, ai_scores)
    pearson_corr, pearson_p = pearsonr(human_scores, ai_scores)

    print(f"Spearman correlation: {spearman_corr:.4f} (p={spearman_p:.4f})")
    print(f"Pearson correlation:  {pearson_corr:.4f} (p={pearson_p:.4f})")
    print(f"\n(Your proposal's target: Spearman >= 0.40, industry baseline ~0.42)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--venue-years", nargs="+", required=True,
                         help="e.g. iclr2024 iclr2025 iclr2026")
    parser.add_argument("--tier", default="A*")
    parser.add_argument("--out", default="data/eval_results.jsonl")
    args = parser.parse_args()

    out_file = Path(args.out)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    already_done = load_already_done(out_file)
    if already_done:
        print(f"Resuming: {len(already_done)} papers already evaluated in {out_file}")

    print("Building agent graph...")
    app = build_graph()

    with open(out_file, "a", encoding="utf-8") as out_f:
        for venue_year in args.venue_years:
            run_one_venue_year(venue_year, args.tier, app, out_f, already_done)

    compute_and_print_correlation(out_file)


if __name__ == "__main__":
    main()