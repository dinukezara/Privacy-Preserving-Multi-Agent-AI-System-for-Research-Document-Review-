"""
src/agents/rubrics.py

Tier-calibrated rubric text injected into agent system prompts. This is
what SRS 3.1.2 ("Target Tier Selection & Prompt Adjustment") and SAD
5.2.3 ("Rubric Manager") describe: the same agent code, different
strictness/expectations depending on the user-selected target tier.

Keep this data-only (no logic) so non-engineers can tune wording
without touching agent code, per SAD 11.2 ("tier system completely
decoupled from agent execution logic").
"""

TECHNICAL_RIGOR_RUBRICS = {
    "A*": (
        "Apply top-tier (CORE A*, e.g. NeurIPS/ICML/ICLR-level) standards. "
        "Expect rigorous theoretical justification for every claim, formally "
        "stated assumptions, tight or at least clearly-scoped bounds, multiple "
        "strong baselines, ablations isolating each contribution, statistical "
        "significance testing (not just single-seed numbers), and honest "
        "discussion of limitations. Flag any hand-wavy derivation, missing "
        "proof, cherry-picked baseline, or unreported variance as a serious "
        "weakness, not a minor nitpick."
    ),
    "A": (
        "Apply strong (CORE A) standards. Expect solid theoretical grounding "
        "and reasonably comprehensive experiments with credible baselines and "
        "at least basic robustness checks (multiple seeds or error bars). "
        "Minor gaps in formal rigor are acceptable if the empirical evidence "
        "is convincing, but unsupported claims should still be flagged."
    ),
    "B": (
        "Apply solid mid-tier (CORE B) standards. Focus on whether the "
        "method is described clearly enough to be reproducible and whether "
        "the experiments plausibly support the paper's claims. Formal proofs "
        "are a bonus, not a requirement. Be constructive rather than harsh "
        "about missing state-of-the-art baselines, but do flag missing "
        "sanity-check baselines (e.g. no comparison to a trivial baseline)."
    ),
    "C": (
        "Apply CORE C / workshop-level standards. Prioritize whether the "
        "core idea is technically sound and the experiments are not "
        "obviously flawed (no data leakage, no broken evaluation protocol). "
        "Be lenient on the breadth of baselines and ablations; focus "
        "feedback on correctness and clarity over completeness."
    ),
    "thesis": (
        "Apply postgraduate thesis standards. Expect a clear, self-contained "
        "explanation of the methodology (a thesis committee member should be "
        "able to follow it without external references), and experiments "
        "that demonstrate the stated contributions, even if the scope is "
        "narrower than a conference paper. Flag places where a chapter "
        "assumes prior knowledge it hasn't itself established."
    ),
    "slides": (
        "This document is a presentation slide deck, not prose. Do not "
        "penalize brevity. Focus only on whether the methodology and "
        "results claims shown on the slides are technically coherent and "
        "not misleading (e.g. a chart implying significance without error "
        "bars, or a claimed result not actually shown)."
    ),
}

DEFAULT_TIER = "B"


def get_rigor_rubric(tier: str) -> str:
    """Look up the rubric text for a tier, case/format tolerant, defaulting to B."""
    if not tier:
        return TECHNICAL_RIGOR_RUBRICS[DEFAULT_TIER]
    key = tier.strip()
    # normalize a few common variants users might pass in
    normalized = {"a*": "A*", "a": "A", "b": "B", "c": "C", "thesis": "thesis", "slides": "slides"}
    key = normalized.get(key.lower(), key)
    return TECHNICAL_RIGOR_RUBRICS.get(key, TECHNICAL_RIGOR_RUBRICS[DEFAULT_TIER])
