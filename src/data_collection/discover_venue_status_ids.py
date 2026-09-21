"""
src/data_collection/discover_venue_status_ids.py

Run this FIRST for any new venue/year before fetch_all_decisions.py.
It prints every distinct content.venueid found among all submissions,
with counts, so you can confirm the actual strings OpenReview uses
for accepted / rejected / withdrawn / desk-rejected before trusting
the classifier in fetch_all_decisions.py.

Usage:
    python discover_venue_status_ids.py --venue ICML --year 2025
    python discover_venue_status_ids.py --venue UAI --year 2024
"""

import argparse
from collections import Counter

from dotenv import load_dotenv
import os
from openreview.api import OpenReviewClient


VENUE_IDS = {
    ("ICLR", 2024): "ICLR.cc/2024/Conference",
    ("ICLR", 2025): "ICLR.cc/2025/Conference",
    ("NeurIPS", 2023): "NeurIPS.cc/2023/Conference",
    ("NeurIPS", 2024): "NeurIPS.cc/2024/Conference",
    ("ICML", 2026): "ICML.cc/2026/Conference",
    ("ICML", 2025): "ICML.cc/2025/Conference",
    ("ICML", 2024): "ICML.cc/2024/Conference",
    ("ICML", 2023): "ICML.cc/2023/Conference",
    ("UAI", 2025): "auai.org/UAI/2025/Conference",
    ("UAI", 2024): "auai.org/UAI/2024/Conference",
}


def get_client():
    load_dotenv()
    username = os.environ.get("OPENREVIEW_USERNAME")
    password = os.environ.get("OPENREVIEW_PASSWORD")
    if not username or not password:
        raise EnvironmentError(
            "OPENREVIEW_USERNAME / OPENREVIEW_PASSWORD not found in .env"
        )
    return OpenReviewClient(
        baseurl="https://api2.openreview.net",
        username=username,
        password=password,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--venue", required=True, choices=["ICML", "UAI", "ICLR", "NeurIPS"])
    parser.add_argument("--year", required=True, type=int)
    args = parser.parse_args()

    venue_id = VENUE_IDS.get((args.venue, args.year))
    if not venue_id:
        raise ValueError(f"No venue id mapped for {args.venue} {args.year}")

    client = get_client()

    print(f"Fetching ALL submissions (any status) for {venue_id} ...")
    submissions = client.get_all_notes(
        invitation=f"{venue_id}/-/Submission"
    )
    print(f"Total submissions found: {len(submissions)}")
    print()

    venueid_counts = Counter()
    for note in submissions:
        content = note.content or {}
        v = content.get("venueid")
        v = v.get("value") if isinstance(v, dict) else v
        venueid_counts[v] += 1

    print("Distinct content.venueid values found (this is what you classify on):")
    for venueid, count in venueid_counts.most_common():
        print(f"  {count:5d}  {venueid}")

    print()
    print("Sanity check: the sum above should equal the total submissions count.")
    print(
        "Use these exact strings to update STATUS_PATTERNS in "
        "fetch_all_decisions.py if they don't match the defaults "
        "(look for 'Reject', 'Withdraw', 'Desk_Reject' substrings)."
    )


if __name__ == "__main__":
    main()