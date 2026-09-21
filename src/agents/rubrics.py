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


# ---------------------------------------------------------------------
# Ethics and Compliance Checker rubrics
# ---------------------------------------------------------------------
# Covers: dataset licensing/consent, human-subjects/IRB considerations,
# broader-impact / dual-use / misuse discussion, conflict-of-interest
# and funding disclosure. Does NOT cover methodology rigor, writing
# quality, or novelty -- those belong to other agents.

ETHICS_COMPLIANCE_RUBRICS = {
    "A*": (
        "Apply top-tier (CORE A*) standards, matching what NeurIPS/ICML-level "
        "venues now require. Expect a dedicated Broader Impact / Ethics "
        "statement discussing potential positive AND negative societal "
        "consequences, explicit dataset licensing and consent information for "
        "any human-derived data, IRB or equivalent ethics-board approval "
        "referenced for any human-subjects research, honest engagement with "
        "dual-use or misuse risks where the method could plausibly enable "
        "harm, and disclosed funding sources / conflicts of interest. Treat "
        "a missing or purely pro-forma broader-impact statement (e.g. one "
        "sentence with no real engagement) as a real weakness, not a minor "
        "nitpick."
    ),
    "A": (
        "Apply strong (CORE A) standards. Expect dataset licensing/consent to "
        "be mentioned for any human-derived data, and IRB approval referenced "
        "if human subjects were involved. A full broader-impact essay is "
        "good practice but its absence is a moderate rather than severe "
        "weakness if the work is low-risk (e.g. purely algorithmic/benchmark "
        "work with no human data or foreseeable dual-use concern)."
    ),
    "B": (
        "Apply solid mid-tier (CORE B) standards. Check the basics: is "
        "dataset provenance/licensing mentioned where relevant, and is there "
        "any indication of human-subjects approval if the work involved "
        "people? Do not require a polished broader-impact essay -- focus "
        "feedback on missing disclosures that would actually matter (e.g. "
        "no mention of consent for a dataset built from personal data), not "
        "on stylistic absence of an ethics section."
    ),
    "C": (
        "Apply CORE C / workshop-level standards. Only flag clear red flags: "
        "use of apparently non-consensual personal data, undisclosed "
        "human-subject experimentation, or a plainly unethical practice "
        "described in the text. Do not penalize the absence of a formal "
        "ethics section if nothing in the paper suggests an actual ethical "
        "concern."
    ),
    "thesis": (
        "Apply postgraduate thesis standards. Expect a considerations/ethics "
        "section appropriate to institutional requirements -- a reference to "
        "ethics approval (or an explicit statement that none was required "
        "and why) if human data or participants were involved, consent "
        "language for any collected human data, and proper attribution/"
        "licensing of external datasets, models, or tools used in the work."
    ),
    "slides": (
        "This document is a presentation slide deck, not prose -- do not "
        "penalize brevity or the absence of a dedicated ethics slide. Only "
        "flag: a slide presenting human-subject results with no visible "
        "mention of consent/approval, or content that appears to promote a "
        "harmful application of the method without any caveat or discussion "
        "of risk."
    ),
}


def get_ethics_rubric(tier: str) -> str:
    """Look up the ethics/compliance rubric text for a tier, defaulting to B."""
    if not tier:
        return ETHICS_COMPLIANCE_RUBRICS[DEFAULT_TIER]
    key = tier.strip()
    normalized = {"a*": "A*", "a": "A", "b": "B", "c": "C", "thesis": "thesis", "slides": "slides"}
    key = normalized.get(key.lower(), key)
    return ETHICS_COMPLIANCE_RUBRICS.get(key, ETHICS_COMPLIANCE_RUBRICS[DEFAULT_TIER])