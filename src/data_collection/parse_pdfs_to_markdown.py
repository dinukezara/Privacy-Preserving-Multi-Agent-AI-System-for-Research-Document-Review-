import argparse
import json
import re
from pathlib import Path

import pymupdf4llm
from tqdm import tqdm

TABLE_SEP_RE = re.compile(r"^\|[-:\| ]+\|$", re.MULTILINE)


def parse_pdf_to_markdown(pdf_path: Path, table_strategy: str, embed_images: bool, image_dir: Path = None):
    """
    Returns (markdown_text, num_pages).
    """
    kwargs = dict(
        page_chunks=True,
        table_strategy=table_strategy,
    )
    if embed_images:
        kwargs["write_images"] = True
        kwargs["image_path"] = str(image_dir)
        kwargs["image_format"] = "png"

    page_chunks = pymupdf4llm.to_markdown(str(pdf_path), **kwargs)

    md_parts = [chunk["text"] for chunk in page_chunks]
    markdown_text = "\n\n".join(md_parts)

    return markdown_text, len(page_chunks)


def count_tables(markdown_text: str) -> int:
    # Each Markdown table has exactly one header-separator row like |---|---|
    return len(TABLE_SEP_RE.findall(markdown_text))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True, help="Directory of source PDFs.")
    parser.add_argument("--output-dir", required=True, help="Where markdown/ and the manifest go.")
    parser.add_argument("--venue", required=True)
    parser.add_argument("--year", required=True, type=int)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument(
        "--table-strategy",
        default="lines_strict",
        choices=["lines_strict", "lines", "text"],
        help="PyMuPDF table-detection strategy. 'lines_strict' (default) is "
             "most conservative/accurate for bordered tables; try 'lines' or "
             "'text' if tables are being missed for a given venue's template.",
    )
    parser.add_argument(
        "--embed-images",
        action="store_true",
        help="Extract embedded images (figures, and any equations that are "
             "raster images rather than text) as PNGs and link them in the "
             ".md file, instead of silently dropping them.",
    )
    parser.add_argument("--overwrite", action="store_true",
                         help="Re-parse PDFs even if a .md already exists.")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    md_dir = output_dir / "markdown"
    md_dir.mkdir(parents=True, exist_ok=True)

    image_dir = output_dir / "images"
    if args.embed_images:
        image_dir.mkdir(parents=True, exist_ok=True)

    manifest_file = output_dir / f"{args.venue.lower()}_{args.year}_parse_manifest.jsonl"
    failed_file = output_dir / "failed_parsing.txt"

    pdf_files = sorted(input_dir.glob("*.pdf"))
    if args.limit:
        pdf_files = pdf_files[: args.limit]

    # Resume support: skip PDFs whose .md already exists (unless --overwrite)
    already_done = set()
    if manifest_file.exists() and not args.overwrite:
        with open(manifest_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line)
                    if record.get("parse_status") == "success":
                        already_done.add(record["pdf_filename"])
                except Exception:
                    pass

    failed = []

    with open(manifest_file, "a", encoding="utf-8") as manifest_out:
        for pdf_path in tqdm(pdf_files, desc="Parsing PDFs to Markdown"):
            md_path = md_dir / f"{pdf_path.stem}.md"

            if pdf_path.name in already_done and md_path.exists() and not args.overwrite:
                continue

            try:
                markdown_text, num_pages = parse_pdf_to_markdown(
                    pdf_path,
                    table_strategy=args.table_strategy,
                    embed_images=args.embed_images,
                    image_dir=image_dir,
                )

                md_path.write_text(markdown_text, encoding="utf-8")

                record = {
                    "venue": args.venue,
                    "year": args.year,
                    "pdf_filename": pdf_path.name,
                    "pdf_path": str(pdf_path),
                    "md_path": str(md_path),
                    "parse_status": "success",
                    "num_pages": num_pages,
                    "num_tables_detected": count_tables(markdown_text),
                    "char_count": len(markdown_text),
                }

                manifest_out.write(json.dumps(record, ensure_ascii=False) + "\n")
                manifest_out.flush()

            except Exception as e:
                failed.append((pdf_path.name, str(e)))

                record = {
                    "venue": args.venue,
                    "year": args.year,
                    "pdf_filename": pdf_path.name,
                    "pdf_path": str(pdf_path),
                    "md_path": None,
                    "parse_status": "failed",
                    "error": str(e),
                }
                manifest_out.write(json.dumps(record, ensure_ascii=False) + "\n")
                manifest_out.flush()

    if failed:
        with open(failed_file, "w", encoding="utf-8") as f:
            for filename, reason in failed:
                f.write(f"{filename}\t{reason}\n")

    print()
    print(f"Markdown files written to: {md_dir}")
    print(f"Manifest:                 {manifest_file}")
    print(f"Failed:                   {len(failed)}")
    if failed:
        print(f"See:                       {failed_file}")


if __name__ == "__main__":
    main()
