"""
src/agents/final_scoring.py

Final Scoring and Ranking — applies tier-specific weights to the specialist
Critiques and produces a final weighted score + recommendation.

This has NO dependency on the LLM or parsed papers — it's pure computation
over already-produced Critique objects, so it's fully buildable and testable
right now.
"""
#to run - python -m src.agents.final_scoring
#bcs this imports from the same package, you need to run it as a module from the root of the package, not as a script from within the src/agents directory.
import math

from .schema import Critique, ConsolidatedReview

# Tier-specific weighting — how much each agent's score counts toward the final.
# These are starting values; adjust once real evaluation data (Spearman
# correlation against OpenReview human scores) tells us which weighting
# actually predicts human decisions best.
TIER_WEIGHTS = {
    "A*": {"rigor": 0.35, "novelty": 0.30, "presentation": 0.10, "ethics": 0.25},
    "A":  {"rigor": 0.30, "novelty": 0.30, "presentation": 0.15, "ethics": 0.25},
    "B":  {"rigor": 0.30, "novelty": 0.25, "presentation": 0.20, "ethics": 0.25},
    "C":  {"rigor": 0.25, "novelty": 0.20, "presentation": 0.30, "ethics": 0.25},
    "thesis": {"rigor": 0.30, "novelty": 0.15, "presentation": 0.30, "ethics": 0.25},
    # Slide decks: presentation quality is the primary thing being judged
    # here (rubrics.py's "slides" rubric text explicitly tells rigor/ethics
    # to go easy on brevity), so weight it heaviest. Novelty gets a smaller
    # weight since slides rarely make a full novelty case the way a paper does.
    "slides": {"rigor": 0.20, "novelty": 0.15, "presentation": 0.40, "ethics": 0.25},
}

# Agents whose failure/timeout should block automatic scoring for that tier,
# rather than silently re-normalizing around the gap. Prevents a paper with a
# genuinely weak dimension (e.g. poor rigor) scoring deceptively high just
# because the one agent that would have caught it happened to fail.
CRITICAL_AGENTS = {
    "A*": {"rigor", "novelty"},
    "A":  {"rigor", "novelty"},
    "B":  {"rigor"},
    "C":  set(),
    "thesis": {"rigor"},
    "slides": {"presentation"},
}

# Score thresholds for the recommendation category.
ACCEPT_THRESHOLDS = {
    "A*": 8.0, "A": 7.0, "B": 6.0, "C": 5.0, "thesis": 5.5, "slides": 5.5,
}

# How far below the accept threshold each lower bracket extends.
MINOR_REVISION_MARGIN = 0.75
MAJOR_REVISION_MARGIN = 1.5


def _validate_tier_weights():
    """Startup check: every tier's weights must sum to 1.00 (within floating-point tolerance).
    Catches configuration typos immediately instead of producing silently-wrong scores."""
    for tier, weights in TIER_WEIGHTS.items():
        total = sum(weights.values())
        assert math.isclose(total, 1.0, rel_tol=1e-6), (
            f"TIER_WEIGHTS['{tier}'] sums to {total}, not 1.00 — check for a typo in the weights."
        )


_validate_tier_weights()  # runs once, at import time


class CriticalAgentFailure(Exception):
    """Raised when a critical agent (per CRITICAL_AGENTS) failed or timed out,
    making the automatic score unreliable for this tier."""
    pass


def compute_weighted_score(critiques: list[Critique], tier: str) -> float:
    """Combines individual agent scores into one tier-weighted final score.
    Skips any agent whose status isn't 'success' (failed/timeout agents have no score).
    Raises CriticalAgentFailure if a tier-critical agent failed, rather than silently
    scoring around the gap."""
    if tier not in TIER_WEIGHTS:
        raise ValueError(f"Unknown tier '{tier}'. Must be one of {list(TIER_WEIGHTS.keys())}")

    weights = TIER_WEIGHTS[tier]
    critical = CRITICAL_AGENTS.get(tier, set())
    total_weight = 0.0
    weighted_sum = 0.0
    skipped_agents = []

    for critique in critiques:
        if critique.status != "success" or critique.score is None:
            skipped_agents.append(critique.agent_name)
            if critique.agent_name in critical:
                raise CriticalAgentFailure(
                    f"Agent '{critique.agent_name}' ({critique.status}) is critical for tier '{tier}' "
                    f"— cannot produce a reliable automatic score. Route to manual review or retry the agent."
                )
            continue

        weight = weights.get(critique.agent_name)
        if weight is None:
            continue  # agent not part of this tier's weighting scheme (e.g. feedback-generation isn't scored)
        weighted_sum += critique.score * weight
        total_weight += weight

    if skipped_agents:
        print(f"  [warn] excluded from scoring (not successful): {skipped_agents}")

    if total_weight == 0:
        raise ValueError("No successful agents available to compute a score — check agent statuses.")

    # Normalize in case not all expected agents reported (e.g. one failed/timed out)
    return round(weighted_sum / total_weight, 2)


def recommend(weighted_score: float, tier: str) -> str:
    """Four-bracket recommendation, matching standard conference review categories:
    Accept / Minor Revision / Major Revision / Reject."""
    threshold = ACCEPT_THRESHOLDS.get(tier, 6.0)
    if weighted_score >= threshold:
        return "Accept"
    elif weighted_score >= threshold - MINOR_REVISION_MARGIN:
        return "Minor Revision"
    elif weighted_score >= threshold - MAJOR_REVISION_MARGIN:
        return "Major Revision"
    else:
        return "Reject"


def build_final_review(critiques: list[Critique], tier: str, paper_id: str, consolidated_summary: str,
                        conflicts_resolved: list[str] = None, recheck_targets: list[str] = None) -> ConsolidatedReview:
    """Assembles the full ConsolidatedReview from specialist critiques + tier.
    Raises CriticalAgentFailure if a tier-critical agent failed — caller should
    catch this and route to manual review rather than showing an unreliable score."""
    score = compute_weighted_score(critiques, tier)
    return ConsolidatedReview(
        paper_id=paper_id,
        critiques=critiques,
        consolidated_summary=consolidated_summary,
        conflicts_resolved=conflicts_resolved or [],
        recheck_targets=recheck_targets or [],
        weighted_score=score,
        recommendation=recommend(score, tier),
        tier=tier,
    )


if __name__ == "__main__":
    # Test 1: weight-sum validation already ran at import time above — if we
    # got this far without an AssertionError, all tiers sum to 1.00.
    print("[OK] All tier weights sum to 1.00")

    # Test 2: normal scoring, all agents succeed
    mock_critiques = [
        Critique(paper_id="test_001", agent_name="rigor", tier="A*", summary="Solid baselines, minor stats issues.", score=7.0),
        Critique(paper_id="test_001", agent_name="novelty", tier="A*", summary="Genuinely new angle on the problem.", score=8.5),
        Critique(paper_id="test_001", agent_name="presentation", tier="A*", summary="Clear writing throughout.", score=8.0),
        Critique(paper_id="test_001", agent_name="ethics", tier="A*", summary="No concerns identified.", score=9.0),
    ]
    for tier in ["A*", "B", "thesis"]:
        review = build_final_review(mock_critiques, tier, paper_id="test_001",
                                     consolidated_summary="Strong paper overall.")
        print(f"Tier {tier}: score={review.weighted_score}, recommendation={review.recommendation}")

    # Test 3: non-critical agent fails (presentation) — should still score fine
    print("\n--- Non-critical agent (presentation) fails on tier B ---")
    mock_noncritical_fail = [
        Critique(paper_id="test_002", agent_name="rigor", tier="B", summary="Solid.", score=7.0),
        Critique(paper_id="test_002", agent_name="novelty", tier="B", summary="Good.", score=7.5),
        Critique(paper_id="test_002", agent_name="presentation", tier="B", status="timeout"),
        Critique(paper_id="test_002", agent_name="ethics", tier="B", summary="Fine.", score=8.0),
    ]
    review = build_final_review(mock_noncritical_fail, "B", paper_id="test_002",
                                 consolidated_summary="Presentation agent unavailable, scored on remaining agents.",
                                 recheck_targets=["presentation"])
    print(f"Result: score={review.weighted_score}, recommendation={review.recommendation} (scored successfully, as expected)")

    # Test 4: critical agent fails (rigor, on tier A*) — should raise, not silently score
    print("\n--- Critical agent (rigor) fails on tier A* ---")
    mock_critical_fail = [
        Critique(paper_id="test_003", agent_name="rigor", tier="A*", status="timeout"),
        Critique(paper_id="test_003", agent_name="novelty", tier="A*", summary="Good.", score=9.0),
        Critique(paper_id="test_003", agent_name="presentation", tier="A*", summary="Good.", score=9.0),
        Critique(paper_id="test_003", agent_name="ethics", tier="A*", summary="Fine.", score=9.0),
    ]
    try:
        review = build_final_review(mock_critical_fail, "A*", paper_id="test_003",
                                     consolidated_summary="Should not reach this.")
        print(f"[UNEXPECTED] Got a score anyway: {review.weighted_score}")
    except CriticalAgentFailure as e:
        print(f"[OK] Correctly blocked automatic scoring: {e}")

    # Test 5: Minor Revision bracket — score just below threshold
    print("\n--- Minor Revision bracket (tier B, threshold=6.0) ---")
    for test_score, label in [(6.5, "well above"), (5.7, "just below (Minor Revision)"),
                               (5.0, "further below (Major Revision)"), (3.0, "far below (Reject)")]:
        print(f"  score={test_score} ({label}) -> {recommend(test_score, 'B')}")