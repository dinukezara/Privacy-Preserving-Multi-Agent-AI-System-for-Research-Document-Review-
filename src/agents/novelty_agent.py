"""
src/agents/novelty_agent.py
Librarian / Novelty Evaluator Agent.
Retrieves similar existing papers from the vector index, then asks the
LLM to assess novelty relative to that retrieved context, returning a
structured Critique (per schema.py).
"""
import json
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, ChatOllama

from .schema import Critique

INDEX_DIR = "data/novelty_index"
CHAT_MODEL = "llama3.2:3b"   # use the smaller model for fast local dev
TOP_K = 5                     # how many similar papers to retrieve

embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectordb = Chroma(persist_directory=INDEX_DIR, embedding_function=embeddings)
llm = ChatOllama(model=CHAT_MODEL, temperature=0.2)


def retrieve_similar_papers(query_text: str, k: int = TOP_K):
    """Returns the top-k most similar papers already in the index."""
    results = vectordb.similarity_search_with_score(query_text, k=k)
    similar = []
    for doc, score in results:
        similar.append({
            "paper_id": doc.metadata.get("paper_id"),
            "title": doc.metadata.get("title"),
            "excerpt": doc.page_content[:300],
            "distance": score,   # lower = more similar (Chroma default is L2 distance)
        })
    return similar


def build_prompt(paper_title: str, paper_abstract: str, similar_papers: list) -> str:
    similar_block = "\n\n".join(
        f"- \"{p['title']}\" (paper_id: {p['paper_id']}): {p['excerpt']}..."
        for p in similar_papers
    )

    return f"""You are a novelty evaluator for academic peer review.
Assess whether the following paper's contribution is novel, given the most
similar existing papers retrieved from a reference corpus. Do NOT act as a
plagiarism checker — focus on whether the core contribution is substantively
different from prior work, not on exact text overlap.

PAPER UNDER REVIEW
Title: {paper_title}
Abstract: {paper_abstract}

MOST SIMILAR EXISTING PAPERS (retrieved from corpus)
{similar_block}

Respond ONLY with a JSON object with these exact fields:
{{
  "summary": "1-3 sentence overview of the novelty assessment",
  "strengths": ["list of novel aspects, if any"],
  "weaknesses": ["list of overlaps or concerns with prior work, if any"],
  "suggestions": ["actionable suggestions to strengthen novelty claims"],
  "score": <float 0-10, where 10 = highly novel, 0 = essentially duplicate of prior work>,
  "confidence": <float 0-1, your confidence in this assessment>
}}
No text outside the JSON object.
"""


def evaluate_novelty(paper_id: str, title: str, abstract: str, tier: str = "A*") -> Critique:
    similar_papers = retrieve_similar_papers(f"{title}\n\n{abstract}")

    prompt = build_prompt(title, abstract, similar_papers)
    response = llm.invoke(prompt)

    raw_text = response.content.strip()
    # Strip accidental markdown code fences if the model adds them
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        # Fallback: mark as failed rather than crashing the pipeline
        return Critique(
            paper_id=paper_id,
            agent_name="novelty",
            tier=tier,
            status="failed",
            summary="Failed to parse LLM output as JSON.",
            extra={"raw_output": raw_text[:500]},
        )

    return Critique(
        paper_id=paper_id,
        agent_name="novelty",
        tier=tier,
        status="success",
        summary=parsed.get("summary", ""),
        strengths=parsed.get("strengths", []),
        weaknesses=parsed.get("weaknesses", []),
        suggestions=parsed.get("suggestions", []),
        score=parsed.get("score"),
        confidence=parsed.get("confidence", 1.0),
        extra={"similar_papers": similar_papers},
    )


if __name__ == "__main__":
    # Quick manual test
    result = evaluate_novelty(
        paper_id="test_0001",
        title="Your Language Model Secretly Contains Personality Subnetworks",
        abstract=(
            "Humans shift between different personas depending on social context. "
            "Large Language Models (LLMs) demonstrate a similar flexibility in "
            "adopting different personas and behaviors..."
        ),
        tier="A*",
    )
    print(result.model_dump_json(indent=2))