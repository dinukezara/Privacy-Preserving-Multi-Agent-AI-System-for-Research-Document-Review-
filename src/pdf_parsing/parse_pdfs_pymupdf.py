import argparse
import json
from pathlib import Path

import pymupdf
from tqdm import tqdm


def clean_text(text: str) -> str:
    return " ".join(text.split())


def extract_pdf(pdf_path: Path):
    doc = pymupdf.open(pdf_path)

    pages = []
    full_text_parts = []

    for page_number, page in enumerate(doc):
        text = page.get_text("text")
        text = clean_text(text)

        pages.append(
            {
                "page": page_number + 1,
                "text": text,
            }
        )

        if text:
            full_text_parts.append(text)

    doc.close()

    full_text = "\n\n".join(full_text_parts)

    return {
        "pages": pages,
        "full_text": full_text,
        "num_pages": len(pages),
    }


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--venue", required=True)
    parser.add_argument("--year", required=True, type=int)
    parser.add_argument("--limit", type=int, default=None)

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = (
        output_dir
        / f"{args.venue.lower()}_{args.year}_parsed.jsonl"
    )

    failed_file = output_dir / "failed_parsing.txt"

    pdf_files = sorted(input_dir.glob("*.pdf"))

    if args.limit:
        pdf_files = pdf_files[: args.limit]

    already_done = set()

    if output_file.exists():
        with open(output_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line)
                    already_done.add(record["pdf_filename"])
                except Exception:
                    pass

    failed = []

    with open(output_file, "a", encoding="utf-8") as out:
        for pdf_path in tqdm(pdf_files, desc="Parsing PDFs"):

            if pdf_path.name in already_done:
                continue

            try:
                parsed = extract_pdf(pdf_path)

                record = {
                    "venue": args.venue,
                    "year": args.year,
                    "pdf_filename": pdf_path.name,
                    "pdf_path": str(pdf_path),
                    "parse_status": "success",
                    "num_pages": parsed["num_pages"],
                    "pages": parsed["pages"],
                    "full_text": parsed["full_text"],
                }

                out.write(
                    json.dumps(record, ensure_ascii=False)
                    + "\n"
                )

                out.flush()

            except Exception as e:
                failed.append(
                    (pdf_path.name, str(e))
                )

    if failed:
        with open(
            failed_file,
            "w",
            encoding="utf-8",
        ) as f:
            for filename, reason in failed:
                f.write(
                    f"{filename}\t{reason}\n"
                )

    print()
    print(f"Output: {output_file}")
    print(f"Failed: {len(failed)}")


if __name__ == "__main__":
    main()