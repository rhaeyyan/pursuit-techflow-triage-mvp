"""Unit tests for PII anonymizer service."""

from services.anonymizer import sanitize_text


def test_sanitize_email():
    text = "Please send invoice to john.doe@company.com ASAP."
    sanitized = sanitize_text(text)
    assert "[EMAIL_REDACTED]" in sanitized
    assert "john.doe@company.com" not in sanitized


def test_sanitize_ip_address():
    text = "Server down at 192.168.1.105 failure in cluster."
    sanitized = sanitize_text(text)
    assert "[IP_REDACTED]" in sanitized
    assert "192.168.1.105" not in sanitized


def test_sanitize_api_key():
    text = "My secret key is sk_test_9920148104810248104."
    sanitized = sanitize_text(text)
    assert "[KEY_REDACTED]" in sanitized
    assert "sk_test_9920148104810248104" not in sanitized
