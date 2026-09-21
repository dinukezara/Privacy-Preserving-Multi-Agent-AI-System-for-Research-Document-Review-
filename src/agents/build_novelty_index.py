import json
import argparse
from pathlib import Path
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

DEFAULT_INDEX_DIR = "data/novelty_index"
DEFAULT_SAMPLE_SIZE = 200  # start small — expand later once this works

def load_sample_abstracts(records_file: Path, n: int):
    papers = []
    with open(records_file, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= n:
                break
            rec = json.loads(line)
            if rec.get("abstract"):
                papers.append({
                    "paper_id": rec["paper_id"],
                    "title": rec.get("title", ""),
                    "abstract": rec["abstract"],
                })
    return papers

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--records", required=True, help="Path to a *_records.jsonl file (must have title+abstract).")
    parser.add_argument("--index-dir", default=DEFAULT_INDEX_DIR)
    parser.add_argument("--sample-size", type=int, default=DEFAULT_SAMPLE_SIZE)
    args = parser.parse_args()

    records_file = Path(args.records)
    if not records_file.exists():
        raise FileNotFoundError(
            f"{records_file} not found. Run fetch_openreview_data.py or "
            f"fetch_all_decisions.py for that venue/year first."
        )

    index_dir = args.index_dir
    papers = load_sample_abstracts(records_file, args.sample_size)
    print(f"Loaded {len(papers)} abstracts to index from {records_file}.")

    if not papers:
        raise ValueError(
            f"No records with a non-empty abstract found in {records_file} -- "
            f"nothing to index."
        )

    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    texts = [f"{p['title']}\n\n{p['abstract']}" for p in papers]
    metadatas = [{"paper_id": p["paper_id"], "title": p["title"]} for p in papers]

    vectordb = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        persist_directory=index_dir,
    )
    print(f"Index built and saved to {index_dir}")

if __name__ == "__main__":
    main()