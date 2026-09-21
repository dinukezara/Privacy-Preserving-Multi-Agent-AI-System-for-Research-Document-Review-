import json
from novelty_agent import evaluate_novelty

RECORDS_FILE = "data/raw/iclr2025/iclr_2025_records.jsonl"

def load_paper_by_index(idx=250):
    """Loads one paper (default: #250, outside the 200 used to build the index,
    so this is a genuine 'new paper' test, not one already in the corpus)."""
    with open(RECORDS_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i == idx:
                return json.loads(line)
    raise IndexError(f"No paper at index {idx}")

if __name__ == "__main__":
    paper = load_paper_by_index(250)
    result = evaluate_novelty(
        paper_id=paper["paper_id"],
        title=paper["title"],
        abstract=paper["abstract"],
        tier="A*",
    )
    print(result.model_dump_json(indent=2))