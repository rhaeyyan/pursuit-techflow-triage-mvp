"""PII Anonymization & Scrubbing Service for TechFlow Support Queue.

Redacts emails, IP addresses, credit cards, and API keys before LLM processing.
"""

import re

# Regex patterns for common PII
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
IPV4_REGEX = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
API_KEY_REGEX = re.compile(r'\b(?:sk|pk|api|key)_[a-zA-Z0-9_-]{8,64}\b', re.IGNORECASE)
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d[ -]*?){13,16}\b')


def sanitize_text(text: str) -> str:
    """Sanitize input text by masking sensitive PII tokens."""
    if not text:
        return text

    sanitized = text
    sanitized = EMAIL_REGEX.sub('[EMAIL_REDACTED]', sanitized)
    sanitized = IPV4_REGEX.sub('[IP_REDACTED]', sanitized)
    sanitized = API_KEY_REGEX.sub('[KEY_REDACTED]', sanitized)
    sanitized = CREDIT_CARD_REGEX.sub('[CARD_REDACTED]', sanitized)

    return sanitized
