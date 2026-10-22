"""
backend/core/llm.py - Centralized LLM client for VeriAPH (SIH26261).
OWNER: P2

HARD RULES:
- LLM calls go ONLY through this module.
- Reads LLM_PROVIDER and LLM_API_KEY from env.
- If no key is set or provider is disabled, degrades gracefully:
    - Field extraction falls back to regex / heuristic extraction.
    - Finding explainer returns "LLM unavailable".
    - Never crashes or raises unhandled errors.
- Rules, forensics and issuer verification decide pass/fail.
  An LLM may ONLY extract fields or explain findings.
  Never let an LLM decide a status or a flag.
"""

import os
from typing import Any, Dict, Optional


def get_llm_config() -> Dict[str, Optional[str]]:
    """Return configured provider and key from environment."""
    return {
        "provider": os.getenv("LLM_PROVIDER", "").strip().lower() or None,
        "api_key": os.getenv("LLM_API_KEY", "").strip() or None,
    }


def is_llm_available() -> bool:
    """Check if LLM credentials are configured."""
    config = get_llm_config()
    return bool(config["provider"] and config["api_key"])


def explain_finding(finding_reason: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate natural language explanation for an existing finding.
    Degrades gracefully to 'LLM unavailable' if credentials are not configured.
    """
    if not is_llm_available():
        return "LLM unavailable"

    # Future integration with Groq / OpenAI / Gemini provider
    # Always handled safely without crashing
    try:
        # Placeholder for external LLM call
        return f"AI Analysis: {finding_reason}"
    except Exception:
        return "LLM unavailable"


def extract_fields_fallback(text: str) -> Dict[str, Any]:
    """
    Regex and heuristic fallback for document field extraction.
    Used when LLM is unavailable or for deterministic baseline extraction.
    """
    extracted: Dict[str, Any] = {}
    # Basic deterministic regex matching will be populated by P4
    return extracted
