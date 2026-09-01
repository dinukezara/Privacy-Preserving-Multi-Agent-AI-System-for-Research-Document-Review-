"""
src/agents/adapters.py

Converts a record from parse_pdfs_pymupdf.py's output jsonl (raw PDF
text extraction, PMLR-scraped -- no title/abstract/decision metadata)
into the DocumentInput shape agents expect.

This is needed specifically because ICML/UAI PDFs were collected via
download_pmlr_pdfs.py (scrapes PMLR proceedings pages for PDFs only),
NOT via fetch_openreview_data.py / fetch_all_decisions.py (which pull
structured title/abstract/review/decision data from the OpenReview
API). If you later collect ICLR/NeurIPS via the OpenReview scripts,
those jsonl records already have title/abstract/decision_text and
should be mapped directly rather than through this adapter.
"""

from typing import Optional

from base import DocumentInput

# CORE 2023 rankings for the venues currently being collected.
# Extend this as you add venues.
VENUE_TIER_MAP = {
    "ICML": "A*",
    "UAI": "A",
    "ICLR": "A*",
    "NEURIPS": "A*",
}


def _guess_title(full_text: str, max_len: int = 200) -> Optional[str]:
    """
    Best-effort only: take the first non-empty line of extracted text as
    a title guess. pymupdf's plain "text" extraction mode doesn't carry
    font-size/layout info, so this is frequently wrong (running headers,
    conference boilerplate, etc. can end up first). Treat it as a weak
    hint for the agent prompt, not ground truth -- do not rely on it for
    anything requiring accuracy (e.g. novelty matching).
    """
    if not full_text:
        return None
    first_chunk = full_text.strip().split("\n", 1)[0].strip()
    if not first_chunk:
        return None
    return first_chunk[:max_len]


def document_from_parsed_record(
    record: dict,
    tier: Optional[str] = None,
    document_type: str = "paper",
) -> DocumentInput:
    """
    Build a DocumentInput from one line of a parse_pdfs_pymupdf.py
    output jsonl file.

    Expected input record keys (from parse_pdfs_pymupdf.py):
        venue, year, pdf_filename, pdf_path, parse_status, num_pages,
        pages, full_text

    Raises ValueError if parse_status != "success" -- callers should
    skip/log failed-parse records rather than pass them to an agent.
    """
    if record.get("parse_status") != "success":
        raise ValueError(
            f"Record {record.get('pdf_filename')} has parse_status="
            f"'{record.get('parse_status')}', not 'success' -- skip it "
            f"rather than reviewing a failed/partial parse."
        )

    venue = (record.get("venue") or "").upper()
    year = record.get("year")
    pdf_filename = record.get("pdf_filename", "unknown.pdf")
    paper_id = f"{venue.lower()}{year}_{pdf_filename.rsplit('.', 1)[0]}"

    resolved_tier = tier or VENUE_TIER_MAP.get(venue, "B")

    full_text = record.get("full_text", "")

    return DocumentInput(
        paper_id=paper_id,
        full_text=full_text,
        tier=resolved_tier,
        document_type=document_type,
        title=_guess_title(full_text),
        abstract=None,  # not available from PMLR-scraped PDFs
        extra={
            "source": "pmlr_scrape",
            "venue": venue,
            "year": year,
            "pdf_path": record.get("pdf_path"),
            "num_pages": record.get("num_pages"),
            "title_is_guess": True,
        },
    )


def iter_documents_from_jsonl(path: str, tier: Optional[str] = None, skip_failed: bool = True):
    """
    Generator over a parse_pdfs_pymupdf.py output jsonl file, yielding
    DocumentInput objects. Skips (and reports) records with
    parse_status != "success" by default.
    """
    import json

    with open(path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            try:
                yield document_from_parsed_record(record, tier=tier)
            except ValueError as e:
                if skip_failed:
                    print(f"[skip] line {line_no}: {e}")
                    continue
                raise
