"""
Unit and integration tests for Tone-Aware AI Response Generation API (SPEC 010).
Tests GenerateResponseRequest schema defaults, generate_ticket_response service
with tone strategies (formal, empathic, concise, technical), LLM prompt tone inclusion
for Groq and Gemini providers, and POST /api/tickets/generate-response API endpoint.
"""

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from schemas import GenerateResponseRequest
from services.triage import generate_ticket_response


# ---------------------------------------------------------------------------
# 1. Pydantic Schema Validation Tests
# ---------------------------------------------------------------------------

def test_generate_response_request_schema_default_tone():
    """Test GenerateResponseRequest defaults tone to 'formal' when omitted by older clients."""
    req = GenerateResponseRequest(
        ticket_id="TCK-100",
        subject="Payment issue",
        body="Charge failed on card ending 1234",
    )
    assert hasattr(req, "tone")
    assert req.tone == "formal"


def test_generate_response_request_schema_custom_tones():
    """Test GenerateResponseRequest accepts custom tone values."""
    for tone_val in ["formal", "empathic", "concise", "technical"]:
        req = GenerateResponseRequest(
            ticket_id="TCK-101",
            subject="Bug report",
            body="500 internal server error on checkout",
            tone=tone_val,
        )
        assert req.tone == tone_val


# ---------------------------------------------------------------------------
# 2. Template Strategy Tone Branching Tests
# ---------------------------------------------------------------------------

def test_generate_ticket_response_template_formal_tone():
    """Test generate_ticket_response produces formal corporate polite greeting & closing by default."""
    text, source = generate_ticket_response(
        ticket_id="TCK-201",
        subject="Billing inquiry",
        body="Questions about invoice charges",
        issue_type="billing",
        urgency="medium",
        tone="formal",
    )
    assert source == "template"
    assert "Thank you for reaching out to TechFlow Support" in text
    assert "TechFlow Support Team" in text


def test_generate_ticket_response_template_empathic_tone():
    """Test generate_ticket_response produces deeply empathetic apology and reassuring tone."""
    text, source = generate_ticket_response(
        ticket_id="TCK-202",
        subject="Data loss after crash",
        body="All my files disappeared during system outage!",
        issue_type="technical",
        urgency="critical",
        tone="empathic",
    )
    assert source == "template"
    # Tone formatting rule for empathic: apology and reassuring tone
    assert any(w in text.lower() for w in ["apologize", "sorry", "understand how frustrating", "sincerely apologize"])


def test_generate_ticket_response_template_concise_tone():
    """Test generate_ticket_response produces short bulleted action-oriented reply."""
    text, source = generate_ticket_response(
        ticket_id="TCK-203",
        subject="Reset password",
        body="How do I reset my account password?",
        issue_type="account",
        urgency="low",
        tone="concise",
    )
    assert source == "template"
    # Concise should be bulleted or short action steps
    assert "-" in text or "*" in text or "1." in text or len(text.splitlines()) <= 6


def test_generate_ticket_response_template_technical_tone():
    """Test generate_ticket_response produces SRE/Engineering diagnostic status & telemetry reply."""
    text, source = generate_ticket_response(
        ticket_id="TCK-204",
        subject="API Gateway Latency Spike",
        body="504 gateway timeout on POST /v1/ingest",
        issue_type="technical",
        urgency="high",
        tone="technical",
    )
    assert source == "template"
    # Technical tone rule: SRE/Engineering diagnostic status & telemetry reply
    assert any(term in text.lower() for term in ["sre", "telemetry", "diagnostic", "logs", "incident", "metric", "engineering"])


# ---------------------------------------------------------------------------
# 3. LLM Prompt Tone Customization Tests (Groq & Gemini)
# ---------------------------------------------------------------------------

def test_generate_ticket_response_groq_tone_prompt(monkeypatch):
    """Test Groq LLM response generation includes requested tone in prompt."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_key_12345")

    mock_groq_response = MagicMock()
    mock_groq_response.status_code = 200
    mock_groq_response.json.return_value = {
        "choices": [{"message": {"content": "Empathic response draft from Groq."}}]
    }

    with patch("httpx.post", return_value=mock_groq_response) as mock_post:
        text, source = generate_ticket_response(
            ticket_id="TCK-301",
            subject="Service down",
            body="Cannot access dashboard",
            issue_type="technical",
            urgency="critical",
            tone="empathic",
        )
        assert source == "llm"
        assert text == "Empathic response draft from Groq."

        # Verify prompt sent to Groq contains the specified tone directive
        call_kwargs = mock_post.call_args.kwargs
        payload = call_kwargs["json"]
        prompt_content = payload["messages"][0]["content"]
        assert "empathic" in prompt_content.lower()


def test_generate_ticket_response_gemini_tone_prompt(monkeypatch):
    """Test Gemini LLM response generation includes requested tone in prompt."""
    monkeypatch.setenv("GROQ_API_KEY", "")
    monkeypatch.setenv("GEMINI_API_KEY", "AIzaSy_test_key_67890")

    mock_gemini_response = MagicMock()
    mock_gemini_response.status_code = 200
    mock_gemini_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Technical SRE response from Gemini."}]}}]
    }

    with patch("httpx.post", return_value=mock_gemini_response) as mock_post:
        text, source = generate_ticket_response(
            ticket_id="TCK-302",
            subject="Database connection failure",
            body="High latency and timeout",
            issue_type="technical",
            urgency="high",
            tone="technical",
        )
        assert source == "llm"
        assert text == "Technical SRE response from Gemini."

        call_kwargs = mock_post.call_args.kwargs
        payload = call_kwargs["json"]
        prompt_content = payload["contents"][0]["parts"][0]["text"]
        assert "technical" in prompt_content.lower()


# ---------------------------------------------------------------------------
# 4. FastAPI POST /api/tickets/generate-response Endpoint Tone Parity Tests
# ---------------------------------------------------------------------------

def test_endpoint_generate_response_default_tone():
    """Test POST /api/tickets/generate-response endpoint defaults to formal tone when omitted."""
    client = TestClient(app)
    payload = {
        "ticket_id": "TCK-401",
        "subject": "Invoice question",
        "body": "Need copy of last month invoice",
        "issue_type": "billing",
        "urgency": "medium",
    }
    response = client.post("/api/tickets/generate-response", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticket_id"] == "TCK-401"
    assert "suggested_response" in data


def test_endpoint_generate_response_empathic_tone():
    """Test POST /api/tickets/generate-response endpoint passes empathic tone parameter."""
    client = TestClient(app)
    payload = {
        "ticket_id": "TCK-402",
        "subject": "System crash lost work",
        "body": "I lost 4 hours of unsaved work due to bug",
        "issue_type": "technical",
        "urgency": "critical",
        "tone": "empathic",
    }
    response = client.post("/api/tickets/generate-response", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticket_id"] == "TCK-402"
    assert "suggested_response" in data
    # Response should contain empathic wording
    assert any(w in data["suggested_response"].lower() for w in ["apologize", "sorry", "understand"])


def test_endpoint_generate_response_technical_tone():
    """Test POST /api/tickets/generate-response endpoint passes technical tone parameter."""
    client = TestClient(app)
    payload = {
        "ticket_id": "TCK-403",
        "subject": "Cluster node memory leak",
        "body": "OOM killer terminating pod instance",
        "issue_type": "technical",
        "urgency": "high",
        "tone": "technical",
    }
    response = client.post("/api/tickets/generate-response", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticket_id"] == "TCK-403"
    assert "suggested_response" in data
