from typing import Optional

from .document_sections import build_focused_excerpt
from .base import AgentBase, DocumentInput
from .rubrics import get_ethics_rubric   # or get_ethics_rubric

MAX_DOCUMENT_CHARS = 24000

OUTPUT_JSON_SPEC = """
Respond with ONLY a single JSON object (no markdown fences, no commentary
outside the JSON) with exactly these fields:
{
  "summary": "1-3 sentence overview of the ethics/compliance posture of this document",
  "strengths": ["specific strength, e.g. clear consent language for a human-data dataset", "..."],
  "weaknesses": ["specific gap, tied to what's missing or unclear", "..."],
  "evidence": ["Section 6", "Broader Impact statement", "Dataset description paragraph", "..."],
  "suggestions": ["specific, actionable disclosure or statement to add", "..."],
  "score": 0-10 (float, overall ethics/compliance score for the applied tier),
  "confidence": 0.0-1.0 (how confident you are given the text you were shown)
}
"""


class EthicsComplianceAgent(AgentBase):
    agent_name = "ethics"

    def build_system_prompt(self, tier: str) -> str:
        rubric_text = get_ethics_rubric(tier)
        return (
            "You are the Ethics and Compliance Checker in a multi-agent "
            "academic peer-review system. Your ONLY job is to evaluate ethics "
            "and compliance disclosures: dataset licensing/consent for "
            "human-derived data, human-subjects/IRB approval where relevant, "
            "broader impact and dual-use/misuse discussion, and conflict of "
            "interest or funding disclosure. Do not comment on methodology "
            "rigor, experimental validity, writing quality, or novelty -- "
            "other agents handle those.\n\n"
            f"Rubric for the selected tier ({tier}):\n{rubric_text}\n\n"
            "Ground every weakness in what the text actually does or doesn't "
            "say. Do not assume a compliance failure occurred just because a "
            "given section wasn't included in the text you were shown (e.g. "
            "if an appendix was omitted) -- distinguish 'not present in this "
            "excerpt' from 'genuinely appears to be missing from the paper'. "
            "Do not fabricate or guess at IRB numbers, funding sources, or "
            "author affiliations that aren't stated in the text.\n\n"
            + OUTPUT_JSON_SPEC
        )

    def build_user_prompt(self, document: DocumentInput, context: Optional[dict]) -> str:
        text = build_focused_excerpt(
            document.full_text,
            priority_categories=["ethics", "conclusion", "experiments"],
            max_chars=8000,
        )
        
        truncated_note = (
            f"\n\n[NOTE: document truncated to {MAX_DOCUMENT_CHARS} characters for this review pass.]"
            if len(document.full_text) > MAX_DOCUMENT_CHARS
            else ""
        )
        title_line = f"Title: {document.title}\n" if document.title else ""
        abstract_line = f"Abstract: {document.abstract}\n\n" if document.abstract else ""

        return (
            f"{title_line}{abstract_line}"
            f"Document type: {document.document_type}\n\n"
            f"--- DOCUMENT TEXT ---\n{text}{truncated_note}\n--- END DOCUMENT TEXT ---"
        )


if __name__ == "__main__":
    # Minimal smoke test using the mock LLM backend -- zero setup required.
    from .llm_client import LocalLLMClient

    doc = DocumentInput(
        paper_id="smoke_test_ethics_0001",
        full_text=(
            "We collect user interaction logs from a production recommender "
            "system involving real users. We do not describe how consent was "
            "obtained or whether the data collection was reviewed by an "
            "ethics board. We do not include a broader impact statement, and "
            "the paper does not discuss potential misuse of the proposed "
            "user-modeling technique."
        ),
        tier="A*",
        document_type="paper",
        title="A Smoke Test Paper",
        abstract="This is a placeholder abstract.",
    )

    agent = EthicsComplianceAgent(llm_client=LocalLLMClient(backend="mock"))
    critique = agent.analyze(doc)
    print(critique.model_dump_json(indent=2))