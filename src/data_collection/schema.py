"""
src/agents/schema.py
Shared Critique output schema — the single source of truth every agent
must return.
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field


class Critique(BaseModel):
    """Standard output every specialist agent produces."""
    paper_id: str = Field(..., description="Unique document ID")
    document_type: Literal["paper", "thesis", "presentation"] = Field(
        default="paper",
        description="Type of document evaluated to tailor critique rendering"
    )
    agent_name: str = Field(..., description="Agent identifier (e.g., 'presentation', 'rigor')")
    tier: str = Field(..., description="Applied rubric tier ('A*', 'A', 'B', 'C', 'thesis')")
    status: Literal["success", "failed", "timeout"] = Field(
        default="success",
        description="Execution status of the specialist agent"
    )
    summary: str = Field(default="", description="1-3 sentence overview of assessment")
    strengths: list[str] = Field(default_factory=list, description="Positive observations")
    weaknesses: list[str] = Field(default_factory=list, description="Issues or flaws identified")
    evidence: list[str] = Field(
        default_factory=list,
        description="Specific sections, slide numbers, or quotes grounding the feedback"
    )
    suggestions: list[str] = Field(default_factory=list, description="Actionable improvements")
    score: Optional[float] = Field(default=None, ge=0.0, le=10.0, description="Dimension score (0-10)")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Self-reported agent confidence")
    revision_count: int = Field(default=0, description="Number of re-check cycles executed")
    extra: Optional[dict] = Field(default=None, description="Agent-specific structured metadata")


class ConsolidatedReview(BaseModel):
    """Output produced by Meta-Reviewer and Final Scoring."""
    paper_id: str = Field(..., description="Unique document ID")
    critiques: list[Critique] = Field(..., description="Collected individual specialist critiques")
    consolidated_summary: str = Field(..., description="Synthesized meta-review across all agents")
    conflicts_resolved: list[str] = Field(
        default_factory=list,
        description="Disagreements between specialist agents and how they were resolved"
    )
    recheck_targets: list[str] = Field(
        default_factory=list,
        description="Agents flagged by Meta-Reviewer for re-evaluation if critique was flawed"
    )
    weighted_score: float = Field(..., ge=0.0, le=10.0, description="Final tier-weighted score")
    recommendation: str = Field(..., description="e.g., 'Accept', 'Reject', 'Major Revision'")
    tier: str = Field(..., description="Target tier evaluated against")


if __name__ == "__main__":
    example = Critique(
        paper_id="kdd2025_0456",
        document_type="paper",
        agent_name="presentation",
        tier="B",
        status="success",
        summary="Well-structured paper with clear flow.",
        strengths=["Clear abstract"],
        weaknesses=["Table 3 lacks a caption"],
        evidence=["Section 4.2", "Table 3"],
        suggestions=["Add captions to all tables"],
        score=7.5,
        confidence=0.9,
    )
    print(example.model_dump_json(indent=2))
