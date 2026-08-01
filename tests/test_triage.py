"""
Unit and integration tests for TechFlow Support Queue triage pipeline.
Tests deterministic rules, Ollama LLM integration, resilience fallback,
sorting by urgency score, and FastAPI multipart CSV endpoint integration.
"""

from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
import httpx

from main import app
from schemas import (
    TicketInput,
    TicketClassification,
    TriagedTicket,
    TriageResponse,
)
from services.triage import (
    RuleEngine,
    OllamaClassifier,
    DefaultFallbackClassifier,
    triage_tickets,
    sort_tickets,
    parse_csv_tickets,
)


# ---------------------------------------------------------------------------
# 1. Deterministic Keyword Matching Tests
# ---------------------------------------------------------------------------

def test_rule_engine_billing_keyword_match():
    """Test deterministic rule engine classifies billing errors as critical billing tickets."""
    rule_engine = RuleEngine()
    ticket = TicketInput(
        ticket_id="TICK-001",
        subject="Billing error on my invoice",
        body="I was double charged for my monthly subscription.",
    )
    result = rule_engine.classify(ticket)
    
    assert result is not None
    assert result.issue_type == "billing"
    assert result.urgency == "critical"


def test_rule_engine_technical_keyword_match():
    """Test deterministic rule engine classifies system outage as critical technical tickets."""
    rule_engine = RuleEngine()
    ticket = TicketInput(
        ticket_id="TICK-002",
        subject="Major system outage",
        body="Can't access dashboard and experiencing data loss.",
    )
    result = rule_engine.classify(ticket)
    
    assert result is not None
    assert result.issue_type == "technical"
    assert result.urgency == "critical"


def test_rule_engine_case_insensitivity():
    """Test keyword matching is case-insensitive."""
    rule_engine = RuleEngine()
    ticket = TicketInput(
        ticket_id="TICK-003",
        subject="UNAUTHORIZED CHARGE ON ACCOUNT",
        body="Please issue a REFUND immediately.",
    )
    result = rule_engine.classify(ticket)
    
    assert result is not None
    assert result.issue_type == "billing"
    assert result.urgency in ["critical", "high"]


def test_rule_engine_returns_none_when_no_match():
    """Test rule engine returns None when no keyword rules match."""
    rule_engine = RuleEngine()
    ticket = TicketInput(
        ticket_id="TICK-004",
        subject="General question about operating hours",
        body="What are the customer support operating hours during holidays?",
    )
    result = rule_engine.classify(ticket)
    
    assert result is None


# ---------------------------------------------------------------------------
# 2. Ollama Gemma Mock Response Handling Tests
# ---------------------------------------------------------------------------

def test_ollama_classifier_successful_classification():
    """Test Ollama LLM classifier parses valid JSON response when rules don't match."""
    classifier = OllamaClassifier()
    ticket = TicketInput(
        ticket_id="TICK-005",
        subject="How to export CSV reports?",
        body="Looking for documentation on downloading user reports.",
    )
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "response": '{"issue_type": "general", "urgency": "low"}'
    }

    with patch("httpx.post", return_value=mock_response):
        result = classifier.classify(ticket)
        assert result is not None
        assert result.issue_type == "general"
        assert result.urgency == "low"


# ---------------------------------------------------------------------------
# 3. Resilience Fallback Tests
# ---------------------------------------------------------------------------

def test_ollama_classifier_connection_error_fallback():
    """Test fallback when Ollama service is unreachable or errors out."""
    classifier = OllamaClassifier()
    fallback_classifier = DefaultFallbackClassifier()
    ticket = TicketInput(
        ticket_id="TICK-006",
        subject="Random query",
        body="Something went wrong in my workflow.",
    )

    with patch("httpx.post", side_effect=httpx.ConnectError("Connection refused")):
        llm_result = classifier.classify(ticket)
        assert llm_result is None
        
        fallback_result = fallback_classifier.classify(ticket)
        assert fallback_result.issue_type == "general"
        assert fallback_result.urgency == "medium"


def test_ollama_classifier_invalid_schema_fallback():
    """Test fallback when Ollama returns invalid schema or non-JSON string."""
    classifier = OllamaClassifier()
    ticket = TicketInput(
        ticket_id="TICK-007",
        subject="Invalid JSON response test",
        body="Ollama returns garbage text.",
    )

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "response": '{"issue_type": "invalid_type", "urgency": "unknown"}'
    }

    with patch("httpx.post", return_value=mock_response):
        result = classifier.classify(ticket)
        # Invalid schema should return None from LLM classifier to trigger safe fallback
        assert result is None


def test_full_triage_pipeline_fallback():
    """Test full triage pipeline uses fallback confidence_source when LLM fails."""
    ticket = TicketInput(
        ticket_id="TICK-008",
        subject="Unmatched inquiry",
        body="No rules match this body.",
    )

    with patch("httpx.post", side_effect=httpx.TimeoutException("Timeout")):
        triaged = triage_tickets([ticket])[0]
        assert triaged.issue_type == "general"
        assert triaged.urgency == "medium"
        assert triaged.urgency_score == 2
        assert triaged.confidence_source == "fallback"


# ---------------------------------------------------------------------------
# 4. Sorting Tickets Deterministically by Urgency Score & Timestamp
# ---------------------------------------------------------------------------

def test_sort_tickets_by_urgency_score_and_created_at():
    """Test sorting tickets by urgency score (critical=4, high=3, medium=2, low=1) and timestamp."""
    tickets = [
        TriagedTicket(
            ticket_id="T1",
            subject="Low ticket",
            body="Low",
            created_at="2026-07-30T10:00:00",
            issue_type="feature_request",
            urgency="low",
            urgency_score=1,
            confidence_source="llm",
        ),
        TriagedTicket(
            ticket_id="T2",
            subject="Critical ticket",
            body="Critical",
            created_at="2026-07-30T12:00:00",
            issue_type="billing",
            urgency="critical",
            urgency_score=4,
            confidence_source="rule",
        ),
        TriagedTicket(
            ticket_id="T3",
            subject="High ticket",
            body="High",
            created_at="2026-07-30T11:00:00",
            issue_type="technical",
            urgency="high",
            urgency_score=3,
            confidence_source="rule",
        ),
        TriagedTicket(
            ticket_id="T4",
            subject="Medium ticket earlier",
            body="Medium",
            created_at="2026-07-30T08:00:00",
            issue_type="general",
            urgency="medium",
            urgency_score=2,
            confidence_source="fallback",
        ),
        TriagedTicket(
            ticket_id="T5",
            subject="Medium ticket later",
            body="Medium",
            created_at="2026-07-30T09:00:00",
            issue_type="general",
            urgency="medium",
            urgency_score=2,
            confidence_source="fallback",
        ),
    ]

    sorted_tickets = sort_tickets(tickets)
    sorted_ids = [t.ticket_id for t in sorted_tickets]

    # Highest urgency score first (4 -> 3 -> 2 -> 1)
    # T2 (score 4) -> T3 (score 3) -> T4/T5 (score 2) -> T1 (score 1)
    assert sorted_ids[0] == "T2"
    assert sorted_ids[1] == "T3"
    assert sorted_ids[4] == "T1"
    # For equal score (2), earlier created_at should come first or sorted deterministically
    assert sorted_ids[2] == "T4"
    assert sorted_ids[3] == "T5"


# ---------------------------------------------------------------------------
# 5. FastAPI POST /api/tickets/triage Multipart CSV Endpoint Integration
# ---------------------------------------------------------------------------

def test_triage_csv_upload_endpoint_success():
    """Test POST /api/tickets/triage with valid multipart CSV upload."""
    client = TestClient(app)
    csv_content = (
        "ticket_id,subject,body,customer_id,channel,created_at\n"
        'TCK-101,"Billing error","Unauthorized charge on account",CUST-1,email,2026-07-30T10:00:00\n'
        'TCK-102,"Feature suggestion","Add dark mode",CUST-2,web,2026-07-30T10:05:00\n'
    )
    
    files = {"file": ("tickets.csv", csv_content.encode("utf-8"), "text/csv")}
    
    with patch("httpx.post") as mock_ollama:
        mock_ollama.return_value.status_code = 200
        mock_ollama.return_value.json.return_value = {
            "response": '{"issue_type": "feature_request", "urgency": "low"}'
        }
        response = client.post("/api/tickets/triage", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "total_tickets" in data
    assert data["total_tickets"] == 2
    assert "tickets" in data
    assert len(data["tickets"]) == 2
    
    # First ticket should be the critical billing error due to prioritization
    assert data["tickets"][0]["ticket_id"] == "TCK-101"
    assert data["tickets"][0]["issue_type"] == "billing"
    assert data["tickets"][0]["urgency"] == "critical"
    assert data["tickets"][0]["urgency_score"] == 4


def test_triage_csv_upload_endpoint_invalid_csv():
    """Test POST /api/tickets/triage returns 400 Bad Request for empty or headerless CSV."""
    client = TestClient(app)
    csv_content = "invalid_column_1,invalid_column_2\nval1,val2\n"
    files = {"file": ("bad.csv", csv_content.encode("utf-8"), "text/csv")}
    
    response = client.post("/api/tickets/triage", files=files)
    assert response.status_code == 400
    assert "detail" in response.json()


def test_parse_csv_flexible_headers():
    """Test parse_csv_tickets successfully parses CSV files with varied column header names."""
    csv_bytes_1 = (
        "Ticket ID,Ticket Subject,Ticket Description,Customer Name,Channel,Date Created\n"
        'TCK-201,"Payment Issue","Cannot process payment",CUST-88,Email,2026-07-30T14:00:00\n'
    ).encode("utf-8")

    tickets_1 = parse_csv_tickets(csv_bytes_1)
    assert len(tickets_1) == 1
    assert tickets_1[0].ticket_id == "TCK-201"
    assert tickets_1[0].subject == "Payment Issue"
    assert tickets_1[0].body == "Cannot process payment"
    assert tickets_1[0].customer_id == "CUST-88"
    assert tickets_1[0].channel == "Email"
    assert tickets_1[0].created_at == "2026-07-30T14:00:00"

    csv_bytes_2 = (
        "Ticket ID,Subject,Description,Customer ID,Channel,created_at\n"
        'TCK-202,"Login Bug","Unable to login",CUST-99,Web,2026-07-30T15:00:00\n'
    ).encode("utf-8")

    tickets_2 = parse_csv_tickets(csv_bytes_2)
    assert len(tickets_2) == 1
    assert tickets_2[0].ticket_id == "TCK-202"
    assert tickets_2[0].subject == "Login Bug"
    assert tickets_2[0].body == "Unable to login"
    assert tickets_2[0].customer_id == "CUST-99"
    assert tickets_2[0].channel == "Web"
    assert tickets_2[0].created_at == "2026-07-30T15:00:00"


# ---------------------------------------------------------------------------
# 6. Cloud LLM Provider Fallback Tests
# ---------------------------------------------------------------------------

def test_cloud_llm_provider_fallback(monkeypatch):
    """Test triage service supports cloud LLM providers (Groq / Gemini) via env vars."""
    ticket = TicketInput(
        ticket_id="TICK-CLOUD-001",
        subject="Cloud deployment questions",
        body="Asking about API rate limits for cloud setup.",
    )

    # 1. Test Groq cloud provider via LLM_PROVIDER="groq" and GROQ_API_KEY
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_groq_key_12345")

    mock_groq_response = MagicMock()
    mock_groq_response.status_code = 200
    mock_groq_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"issue_type": "technical", "urgency": "medium"}'
                }
            }
        ]
    }

    with patch("httpx.post", return_value=mock_groq_response) as mock_post:
        triaged = triage_tickets([ticket])[0]
        assert triaged.issue_type == "technical"
        assert triaged.urgency == "medium"
        assert triaged.confidence_source == "llm"
        assert mock_post.called

    # 2. Test Gemini cloud provider via LLM_PROVIDER="gemini" and GEMINI_API_KEY
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "AIzaSy_test_gemini_key_67890")

    mock_gemini_response = MagicMock()
    mock_gemini_response.status_code = 200
    mock_gemini_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": '{"issue_type": "billing", "urgency": "high"}'}
                    ]
                }
            }
        ]
    }

    with patch("httpx.post", return_value=mock_gemini_response) as mock_post:
        triaged_gemini = triage_tickets([ticket])[0]
        assert triaged_gemini.issue_type == "billing"
        assert triaged_gemini.urgency == "high"
        assert triaged_gemini.confidence_source == "llm"
        assert mock_post.called


# ---------------------------------------------------------------------------
# 7. AI & Template Suggested Response Generation Tests
# ---------------------------------------------------------------------------

def test_generate_ticket_response_template_fallback():
    """Test generate_ticket_response falls back to smart template when no LLM API key is present."""
    from services.triage import generate_ticket_response

    text, source = generate_ticket_response(
        ticket_id="TCK-999",
        subject="Database connection timeout",
        body="Database timed out on primary cluster.",
        issue_type="technical",
        urgency="critical",
    )
    assert source == "template"
    assert "Database connection timeout" in text
    assert "TechFlow Support Team" in text


def test_generate_ticket_response_endpoint():
    """Test POST /api/tickets/generate-response endpoint."""
    client = TestClient(app)
    payload = {
        "ticket_id": "TCK-500",
        "subject": "Invoice refund request",
        "body": "Double charge on account invoice #123",
        "issue_type": "billing",
        "urgency": "high",
    }
    response = client.post("/api/tickets/generate-response", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticket_id"] == "TCK-500"
    assert "suggested_response" in data
    assert "Invoice refund request" in data["suggested_response"]



