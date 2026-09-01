"""
src/data_collection/fetch_all_decisions.py

Fetches ALL submissions for a venue/year (accepted + rejected +
withdrawn + desk-rejected) and, optionally, downloads each one's
PDF directly from OpenReview.

Unlike fetch_openreview_data.py, this does NOT filter by the main
venueid first. It queries the submission invitation directly, then
classifies each note's status from content.venueid — which stays
accurate even when the "Decision" reply invitation is named
differently (or missing) across venues, unlike relying on reply
invitation names.

IMPORTANT: run discover_venue_status_ids.py first for any venue/year
you haven't pulled before, and check the printed venueid strings
against STATUS_PATTERNS below. Naming isn't fully standardized
across venues/years — patterns here are the common OpenReview
convention but may need adjusting.

Usage:
    python fetch_all_decisions.py --venue ICML --year 2025 \
        --outdir data/raw/icml2025_all --include accepted rejected withdrawn \
        --download-pdfs --limit 200   # test run first

    python fetch_all_decisions.py --venue UAI --year 2024 \
        --outdir data/raw/uai2024_all --include all --download-pdfs
"""

import os
import json
import time
import argparse
from pathlib import Path

from dotenv import load_dotenv
from openreview.api import OpenReviewClient
from tqdm import tqdm


VENUE_IDS = {
    ("ICML", 2025): "ICML.cc/2025/Conference",
    ("ICML", 2024): "ICML.cc/2024/Conference",
    ("ICML", 2023): "ICML.cc/2023/Conference",
    ("UAI", 2025): "auai.org/UAI/2025/Conference",
    ("UAI", 2024): "auai.org/UAI/2024/Conference",
}

# Substrings matched (case-insensitive) against content.venueid to
# classify status. Verify these against discover_venue_status_ids.py
# output before trusting them for a new venue/year.
STATUS_PATTERNS = {
    "rejected": ["reject"],       # will also catch "desk_reject" -- checked first below
    "desk_rejected": ["desk_reject", "desk-reject"],
    "withdrawn": ["withdraw"],
    "retracted_acceptance": ["retract"],
}

ALL_STATUSES = ["accepted", "rejected", "withdrawn", "desk_rejected", "retracted_acceptance"]


def classify_status(venueid: str, main_venue_id: str) -> str:
    if not venueid:
        return "unknown"

    v = venueid.lower()

    # Check the more specific categories before generic "reject"
    for status in ("desk_rejected", "withdrawn", "retracted_acceptance"):
        if any(p in v for p in STATUS_PATTERNS[status]):
            return status

    if any(p in v for p in STATUS_PATTERNS["rejected"]):
        return "rejected"

    if venueid == main_venue_id:
        return "accepted"

    return "unknown"


def get_client():
    load_dotenv()
    username = os.environ.get("OPENREVIEW_USERNAME")
    password = os.environ.get("OPENREVIEW_PASSWORD")
    if not username or not password:
        raise EnvironmentError(
            "OPENREVIEW_USERNAME / OPENREVIEW_PASSWORD not found. "
            "Check your .env file exists in the repo root."
        )
    return OpenReviewClient(
        baseurl="https://api2.openreview.net",
        username=username,
        password=password,
    )


def _extract_value(field):
    if isinstance(field, dict):
        return field.get("value")
    return field


def note_to_record(note, venue_name, year, status, main_venue_id):
    content = note.content or {}

    reviews = []
    meta_review = None
    decision_text = None

    for reply in note.details.get("replies", []):
        invitations = reply.get("invitations", []) or [reply.get("invitation", "")]
        reply_content = reply.get("content", {})

        if any("Official_Review" in inv for inv in invitations):
            reviews.append({
                "reviewer_id": reply.get("signatures", ["unknown"])[0],
                "score": _extract_value(reply_content.get("rating")),
                "confidence": _extract_value(reply_content.get("confidence")),
                "review_text": _extract_value(reply_content.get("summary"))
                                or _extract_value(reply_content.get("review")),
            })
        elif any("Meta_Review" in inv for inv in invitations):
            meta_review = {
                "decision_text": _extract_value(reply_content.get("metareview"))
                                  or _extract_value(reply_content.get("summary")),
            }
        elif any("Decision" in inv for inv in invitations):
            decision_text = _extract_value(reply_content.get("decision"))

    return {
        "paper_id": f"{venue_name.lower()}{year}_{note.id}",
        "source": {
            "venue": venue_name,
            "year": year,
            "url": f"https://openreview.net/forum?id={note.id}",
        },
        "status": status,  # accepted / rejected / withdrawn / desk_rejected / retracted_acceptance / unknown
        "raw_venueid": _extract_value(content.get("venueid")),
        "raw_file": {"pdf_path": None, "file_type": "pdf"},
        "title": _extract_value(content.get("title")),
        "abstract": _extract_value(content.get("abstract")),
        "reviews": reviews,
        "meta_review": meta_review or {},
        "decision_text": decision_text,  # best-effort, may be null for many notes
    }


def download_pdf(client, note, outdir: Path, sleep_seconds=1.0):
    try:
        pdf_bytes = client.get_pdf(note.id)
        save_path = outdir / f"{note.id}.pdf"
        with open(save_path, "wb") as f:
            f.write(pdf_bytes)
        time.sleep(sleep_seconds)
        return str(save_path)
    except Exception as e:
        # Common causes: PDF withdrawn by authors, access restricted
        # post-decision, or note has no PDF field.
        print(f"  [warn] could not download PDF for {note.id}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--venue", required=True, choices=["ICML", "UAI"])
    parser.add_argument("--year", required=True, type=int)
    parser.add_argument("--outdir", required=True)
    parser.add_argument(
        "--include",
        nargs="+",
        default=["all"],
        choices=ALL_STATUSES + ["all"],
        help="Which statuses to keep/download PDFs for. Default: all.",
    )
    parser.add_argument("--download-pdfs", action="store_true")
    parser.add_argument("--sleep", type=float, default=1.0)
    parser.add_argument("--limit", type=int, default=None,
                         help="Only process first N submissions -- use for a test run first.")
    args = parser.parse_args()

    venue_id = VENUE_IDS.get((args.venue, args.year))
    if not venue_id:
        raise ValueError(f"No venue id mapped for {args.venue} {args.year}")

    include = set(ALL_STATUSES) if "all" in args.include else set(args.include)

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    pdf_dir = outdir / "pdfs"
    if args.download_pdfs:
        pdf_dir.mkdir(exist_ok=True)

    client = get_client()

    print(f"Fetching ALL submissions for {venue_id} (any status) ...")
    submissions = client.get_all_notes(invitation=f"{venue_id}/-/Submission")
    print(f"Found {len(submissions)} total submissions.")

    if args.limit:
        submissions = submissions[: args.limit]
        print(f"Limiting to first {args.limit} for this run.")

    out_file = outdir / f"{args.venue.lower()}_{args.year}_all_records.jsonl"

    status_counts = {s: 0 for s in ALL_STATUSES + ["unknown"]}
    pdf_failed = []

    with open(out_file, "w", encoding="utf-8") as f:
        for note in tqdm(submissions, desc="Processing"):
            content = note.content or {}
            venueid = _extract_value(content.get("venueid"))
            status = classify_status(venueid, venue_id)
            status_counts[status] += 1

            if status not in include:
                continue

            # Need replies for reviews/decision text -- fetch details per note
            note_full = client.get_note(note.id, details="replies")

            record = note_to_record(note_full, args.venue, args.year, status, venue_id)

            if args.download_pdfs:
                pdf_path = download_pdf(client, note, pdf_dir, sleep_seconds=args.sleep)
                record["raw_file"]["pdf_path"] = pdf_path
                if pdf_path is None:
                    pdf_failed.append(note.id)

            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print()
    print("Status breakdown (across ALL submissions fetched, not just --include):")
    for status, count in status_counts.items():
        print(f"  {status:15s}: {count}")

    print()
    print(f"Saved records ({', '.join(sorted(include))}) to {out_file}")

    if pdf_failed:
        failed_file = outdir / "failed_pdf_downloads.txt"
        with open(failed_file, "w", encoding="utf-8") as f:
            for note_id in pdf_failed:
                f.write(note_id + "\n")
        print(f"{len(pdf_failed)} PDFs failed to download -- see {failed_file}")


if __name__ == "__main__":
    main()