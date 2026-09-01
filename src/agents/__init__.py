"""
src/agents package -- specialist review agents for the multi-agent
document review pipeline.

Kept minimal on purpose: agent modules (base.py, technical_rigor_agent.py,
etc.) currently import each other with flat imports (e.g. `from base
import AgentBase`) rather than package-relative imports, because
scripts/test_technical_rigor_standalone.py adds src/agents/ directly to
sys.path so it can be run standalone without installing the project as
a package -- matching the flat-script style already used in
src/data_collection/. If you later package this properly (setup.py /
pyproject.toml) and run everything via `python -m`, switch the internal
imports to relative ones (e.g. `from .base import AgentBase`) and
re-export here instead.
"""
