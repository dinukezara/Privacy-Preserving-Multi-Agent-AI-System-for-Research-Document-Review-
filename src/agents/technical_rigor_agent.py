"""
src/agents/technical_rigor_agent.py

Technical Rigor Assessor -- covers both SRS 3.1.4 (Methodology Agent)
and SRS 3.1.5 (Experimental Rigor Agent) as one combined agent, per the
5-agent split in Agent_Development_Division.md:

    "Technical Rigor Assessor ... parsed paper text goes in, a
    structured Critique comes out, using rubric-specific prompts."

It evaluates:
    - Theoretical / mathematical soundness (notation consistency,
      whether claims are actually justified, proof gaps).
    - Experimental validity (baselines present and fair, dataset size
      adequacy, statistical reporting, ablations).

Runs standalone (no orchestrator / LangGraph dependency) so it can be
built and tested in isolation first, per the recommended build order
in Agent_Development_Division.md section 3.
"""

from typing import Optional

from base import AgentBase, DocumentInput
from rubrics import get_rigor_rubric

# Cap how much raw document text goes into the prompt. A real
# implementation should chunk long theses chapter-by-chapter (per the
# proposal's "multi-agent chapter-by-chapter chunking strategy") rather
# than truncate -- this is a simple guard for the standalone version.
MAX_DOCUMENT_CHARS = 24000

OUTPUT_JSON_SPEC = """
Respond with ONLY a single JSON object (no markdown fences, no commentary
outside the JSON) with exactly these fields:
{
  "summary": "1-3 sentence overview of the technical rigor of this document",
  "strengths": ["specific strength", "..."],
  "weaknesses": ["specific weakness, tied to a section/equation/table if possible", "..."],
  "evidence": ["Section 4.2", "Equation 3", "Table 2", "..."],
  "suggestions": ["specific, actionable improvement", "..."],
  "score": 0-10 (float, overall technical rigor score for the applied tier),
  "confidence": 0.0-1.0 (how confident you are in this assessment given the
                          text you were shown)
}
"""


class TechnicalRigorAgent(AgentBase):
    agent_name = "technical_rigor"

    def build_system_prompt(self, tier: str) -> str:
        rubric_text = get_rigor_rubric(tier)
        return (
            "You are the Technical Rigor Assessor in a multi-agent academic "
            "peer-review system. Your ONLY job is to evaluate the theoretical "
            "soundness of the methodology and the validity of the experimental "
            "evaluation. Do not comment on writing style, presentation, novelty, "
            "or ethics -- other agents handle those.\n\n"
            f"Rubric for the selected tier ({tier}):\n{rubric_text}\n\n"
            "Ground every weakness in specific evidence from the text (an "
            "equation, a stated baseline, a missing ablation, a claimed result "
            "without a corresponding table/figure). Do not invent details that "
            "are not in the text -- if something is unclear because it wasn't "
            "included in what you were shown, say so rather than assuming it's "
            "missing from the actual paper.\n\n"
            + OUTPUT_JSON_SPEC
        )

    def build_user_prompt(self, document: DocumentInput, context: Optional[dict]) -> str:
        text = document.full_text[:MAX_DOCUMENT_CHARS]
        truncated_note = (
            f"\n\n[NOTE: document truncated to {MAX_DOCUMENT_CHARS} characters for this review pass.]"
            if len(document.full_text) > MAX_DOCUMENT_CHARS
            else ""
        )
        title_line = f"Title: {document.title}\n" if document.title else ""
        abstract_line = f"Abstract: {document.abstract}\n\n" if document.abstract else ""

        extra_note = ""
        if context and context.get("known_flaws_injected"):
            # Support for the SRS 5-evaluation-plan "sensitivity testing" use
            # case: injecting known flaws (e.g. deleted equations) to check
            # agents reliably flag them. Left as a no-op hook by default.
            extra_note = "\n[Evaluation harness: sensitivity test run.]"

        return (
            f"{title_line}{abstract_line}"
            f"Document type: {document.document_type}\n\n"
            f"--- DOCUMENT TEXT ---\n{text}{truncated_note}\n--- END DOCUMENT TEXT ---"
            f"{extra_note}"
        )


if __name__ == "__main__":
    # Minimal smoke test -- uses the mock LLM backend so it runs with zero
    # setup. See scripts/test_technical_rigor_standalone.py for a fuller
    # CLI version that accepts a real parsed paper + a live Ollama backend.
    from llm_client import LocalLLMClient

    doc = DocumentInput(
        paper_id="smoke_test_0001",
        full_text=(
            "We propose Method X. We prove Theorem 1 under assumption A "
            "(full derivation in the appendix, omitted here). We evaluate "
            "on Dataset D against Baseline B, reporting a single run with "
            "no error bars."
        ),
        tier="A",
        document_type="paper",
        title="A Smoke Test Paper",
        abstract="This is a placeholder abstract.",
    )

    agent = TechnicalRigorAgent(llm_client=LocalLLMClient(backend="mock"))
    critique = agent.analyze(doc)
    print(critique.model_dump_json(indent=2))
