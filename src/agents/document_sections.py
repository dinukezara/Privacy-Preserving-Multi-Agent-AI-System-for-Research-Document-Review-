"""
src/agents/document_sections.py

Splits a parsed paper's Markdown into sections by heading, classifies
each heading into a category by keyword (robust to Marker's inconsistent
heading levels - e.g. "# 4.1 ..." and "#### 4.2 ..." both being
subsections of the same depth), and builds a short, focused excerpt for
a given agent instead of blindly truncating the first N characters
(which mostly grabs title/authors/abstract/intro, not the methodology
or experiments an agent like Rigor actually needs to judge).

This exists because: on this team's hardware, a small local model
(llama3.2:3b) reliably ignores the requested JSON schema when given a
~24,000-character raw prefix of a full paper - it has too much
low-relevance front-matter and not enough signal about what to do with
it. A shorter, section-targeted excerpt fixes this in practice.
"""

import re
from dataclasses import dataclass

# Keyword buckets - a heading matches a category if any of its keywords
# appear in the (uppercased) heading text. Order matters for STOP_AT:
# once a heading matching a stop keyword is seen, everything from that
# point on is dropped (references/appendix bulk is rarely useful and
# can be huge).
CATEGORY_KEYWORDS = {
    "abstract": ["ABSTRACT"],
    "introduction": ["INTRODUCTION"],
    "method": ["METHOD", "APPROACH", "PROBLEM FORMULATION", "MODEL ARCHITECTURE", "PROPOSED"],
    "theory": ["THEORETICAL", "THEORY", "ANALYSIS", "PROOF"],
    "experiments": ["EXPERIMENT", "EVALUATION", "RESULTS", "EMPIRICAL"],
    "ablation": ["ABLATION"],
    "conclusion": ["CONCLUSION", "DISCUSSION", "LIMITATION"],
    "ethics": ["BROADER IMPACT", "ETHIC", "SOCIETAL", "REPRODUCIBILITY"],
}

STOP_AT_KEYWORDS = ["REFERENCES", "ACKNOWLEDG"]  # stop collecting once hit; appendix
# is deliberately NOT a stop keyword on its own, since ethics-relevant
# content occasionally lives in an appendix - but references/bibliography
# never is, and can be enormous.

HEADING_RE = re.compile(r"^#{1,6}\s+(.*)$", re.MULTILINE)


@dataclass
class Section:
    heading: str
    category: str  # one of CATEGORY_KEYWORDS keys, or "other"
    text: str


def _classify(heading: str) -> str:
    upper = heading.upper()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in upper for kw in keywords):
            return category
    return "other"


def split_into_sections(full_text: str) -> list[Section]:
    """Splits on every Markdown heading line (any level), classifies each
    resulting chunk. Stops entirely once a References/Acknowledgments
    heading is reached."""
    matches = list(HEADING_RE.finditer(full_text))
    if not matches:
        # No headings detected at all (unusual, but be safe) - treat the
        # whole document as one "other" section.
        return [Section(heading="(untitled)", category="other", text=full_text)]

    sections = []
    for i, m in enumerate(matches):
        heading = m.group(1).strip()
        upper = heading.upper()
        if any(kw in upper for kw in STOP_AT_KEYWORDS):
            break  # stop entirely - references/acknowledgments and beyond

        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        text = full_text[start:end].strip()

        sections.append(Section(heading=heading, category=_classify(heading), text=text))

    return sections


def build_focused_excerpt(
    full_text: str,
    priority_categories: list[str],
    max_chars: int = 8000,
    always_include_abstract: bool = True,
) -> str:
    """Builds a short excerpt prioritizing the requested categories (in
    the order given), falling back to 'other' sections if there's budget
    left and nothing else fits. Always includes the abstract first (if
    found and requested) for context, since every agent benefits from
    knowing what the paper claims to do."""
    sections = split_into_sections(full_text)

    parts = []
    used_chars = 0

    def add(section: Section):
        nonlocal used_chars
        remaining = max_chars - used_chars
        if remaining <= 0:
            return False
        chunk = f"## {section.heading}\n{section.text}"[:remaining]
        parts.append(chunk)
        used_chars += len(chunk)
        return True

    if always_include_abstract:
        for s in sections:
            if s.category == "abstract":
                add(s)
                break

    for category in priority_categories:
        for s in sections:
            if s.category == category:
                if not add(s):
                    return "\n\n".join(parts)

    # If there's still budget left, fill with whatever's left over
    # (in original document order) rather than wasting the space.
    included_headings = {p.split("\n", 1)[0] for p in parts}
    for s in sections:
        if f"## {s.heading}" in included_headings:
            continue
        if not add(s):
            break

    return "\n\n".join(parts)