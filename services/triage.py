"""Triage service for support tickets using rules, LLM, and fallback."""

import csv
import io
import json
import os
import httpx
from schemas import TicketClassification, TicketInput, TriagedTicket

URGENCY_SCORES = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


class RuleEngine:
    """Deterministic keyword matching engine for ticket classification."""

    RULES = [
        # Billing
        (["billing error", "double charged", "unauthorized charge"], "billing", "critical"),
        (["refund", "invoice", "payment failed", "credit card"], "billing", "high"),
        # Technical
        (
            [
                "can't access",
                "data loss",
                "500 error",
                "server down",
                "system crash",
                "system outage",
                "outage",
            ],
            "technical",
            "critical",
        ),
        (["bug"], "technical", "high"),
        # Account
        (["password reset", "account locked"], "account", "medium"),
        (["change email"], "account", "low"),
    ]

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        text = f"{ticket.subject} {ticket.body}".lower()
        for keywords, issue_type, urgency in self.RULES:
            for kw in keywords:
                if kw in text:
                    return TicketClassification(issue_type=issue_type, urgency=urgency)
        return None


class GroqClassifier:
    """Groq LLM classifier fallback using gemma2-9b-it."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "gemma2-9b-it",
        timeout: float = 3.0,
    ):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        api_key = self.api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            return None
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        prompt = (
            "Classify the following support ticket into an issue_type "
            "(billing, technical, account, feature_request, general) and "
            "urgency (critical, high, medium, low). Return JSON with keys 'issue_type' and 'urgency'.\n"
            f"Subject: {ticket.subject}\nBody: {ticket.body}"
        )
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
        }
        try:
            response = httpx.post(
                self.endpoint, headers=headers, json=payload, timeout=self.timeout
            )
            if response.status_code != 200:
                return None
            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                return None
            content = choices[0].get("message", {}).get("content")
            if not content:
                return None
            if isinstance(content, str):
                parsed = json.loads(content)
            elif isinstance(content, dict):
                parsed = content
            else:
                return None
            return TicketClassification(**parsed)
        except Exception:
            return None


class GeminiClassifier:
    """Gemini LLM classifier fallback using gemini-2.5-flash."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "gemini-2.5-flash",
        timeout: float = 3.0,
    ):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        api_key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={api_key}"
        prompt = (
            "Classify the following support ticket into an issue_type "
            "(billing, technical, account, feature_request, general) and "
            "urgency (critical, high, medium, low). Return JSON with keys 'issue_type' and 'urgency'.\n"
            f"Subject: {ticket.subject}\nBody: {ticket.body}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        try:
            response = httpx.post(endpoint, json=payload, timeout=self.timeout)
            if response.status_code != 200:
                return None
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                return None
            raw_res = parts[0].get("text")
            if not raw_res:
                return None
            if isinstance(raw_res, str):
                parsed = json.loads(raw_res)
            elif isinstance(raw_res, dict):
                parsed = raw_res
            else:
                return None
            return TicketClassification(**parsed)
        except Exception:
            return None


class OllamaClassifier:
    """Ollama LLM classifier fallback."""

    def __init__(
        self,
        endpoint: str | None = None,
        timeout: float = 3.0,
    ):
        self.endpoint = endpoint
        self.timeout = timeout

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        endpoint = self.endpoint or os.getenv(
            "OLLAMA_ENDPOINT", "http://localhost:11434/api/generate"
        )
        prompt = (
            "Classify the following support ticket into an issue_type "
            "(billing, technical, account, feature_request, general) and "
            "urgency (critical, high, medium, low). Return JSON with keys 'issue_type' and 'urgency'.\n"
            f"Subject: {ticket.subject}\nBody: {ticket.body}"
        )
        payload = {
            "model": "gemma-4 E2B",
            "prompt": prompt,
            "format": "json",
            "stream": False,
        }
        try:
            response = httpx.post(endpoint, json=payload, timeout=self.timeout)
            if response.status_code != 200:
                return None
            data = response.json()
            raw_res = data.get("response")
            if not raw_res:
                return None
            if isinstance(raw_res, str):
                parsed = json.loads(raw_res)
            elif isinstance(raw_res, dict):
                parsed = raw_res
            else:
                return None
            return TicketClassification(**parsed)
        except Exception:
            return None


class DefaultFallbackClassifier:
    """Safe fallback classifier when rules and LLM fail/are unavailable."""

    def classify(self, ticket: TicketInput) -> TicketClassification:
        return TicketClassification(issue_type="general", urgency="medium")


def triage_tickets(tickets: list[TicketInput]) -> list[TriagedTicket]:
    rule_engine = RuleEngine()
    groq_classifier = GroqClassifier()
    gemini_classifier = GeminiClassifier()
    ollama_classifier = OllamaClassifier()
    fallback_classifier = DefaultFallbackClassifier()

    triaged: list[TriagedTicket] = []

    for ticket in tickets:
        provider = os.getenv("LLM_PROVIDER", "auto").lower()
        groq_key = os.getenv("GROQ_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")

        # Step 1: Rule Engine
        classification = rule_engine.classify(ticket)
        confidence_source = "rule"

        # Step 2: If LLM_PROVIDER == "groq" or GROQ_API_KEY present -> GroqClassifier
        if classification is None and (provider == "groq" or (provider == "auto" and groq_key)):
            classification = groq_classifier.classify(ticket)
            if classification is not None:
                confidence_source = "llm"

        # Step 3: If LLM_PROVIDER == "gemini" or GEMINI_API_KEY present -> GeminiClassifier
        if classification is None and (provider == "gemini" or (provider == "auto" and gemini_key)):
            classification = gemini_classifier.classify(ticket)
            if classification is not None:
                confidence_source = "llm"

        # Step 4: If LLM_PROVIDER == "ollama" or LLM_PROVIDER == "auto" -> OllamaClassifier
        if classification is None and provider in ("ollama", "auto"):
            classification = ollama_classifier.classify(ticket)
            if classification is not None:
                confidence_source = "llm"

        # Step 5: Default Fallback
        if classification is None:
            classification = fallback_classifier.classify(ticket)
            confidence_source = "fallback"

        score = URGENCY_SCORES.get(classification.urgency, 2)

        triaged.append(
            TriagedTicket(
                ticket_id=ticket.ticket_id,
                subject=ticket.subject,
                body=ticket.body,
                customer_id=ticket.customer_id,
                channel=ticket.channel,
                created_at=ticket.created_at,
                issue_type=classification.issue_type,
                urgency=classification.urgency,
                urgency_score=score,
                confidence_source=confidence_source,
            )
        )

    return sort_tickets(triaged)


def sort_tickets(tickets: list[TriagedTicket]) -> list[TriagedTicket]:
    return sorted(
        tickets,
        key=lambda t: (
            -t.urgency_score,
            str(t.created_at) if t.created_at is not None else "",
        ),
    )


HEADER_ALIASES = {
    # ticket_id
    "ticket_id": "ticket_id",
    "ticket id": "ticket_id",
    "id": "ticket_id",
    "ticket_number": "ticket_id",
    "ticket number": "ticket_id",
    # subject
    "subject": "subject",
    "ticket subject": "subject",
    "title": "subject",
    "issue_title": "subject",
    "issue title": "subject",
    # body
    "body": "body",
    "ticket description": "body",
    "description": "body",
    "details": "body",
    "issue_details": "body",
    "issue details": "body",
    "message": "body",
    # customer_id
    "customer_id": "customer_id",
    "customer id": "customer_id",
    "customer_name": "customer_id",
    "customer name": "customer_id",
    "user_id": "customer_id",
    "user id": "customer_id",
    # channel
    "channel": "channel",
    "source": "channel",
    "ticket_channel": "channel",
    "ticket channel": "channel",
    # created_at
    "created_at": "created_at",
    "created at": "created_at",
    "date created": "created_at",
    "date_created": "created_at",
    "timestamp": "created_at",
}


def _normalize_header(header: str) -> str | None:
    cleaned = header.strip().lower()
    if cleaned in HEADER_ALIASES:
        return HEADER_ALIASES[cleaned]
    snake = cleaned.replace(" ", "_")
    if snake in HEADER_ALIASES:
        return HEADER_ALIASES[snake]
    return None


def parse_csv_tickets(content_bytes: bytes) -> list[TicketInput]:
    try:
        text = content_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("Invalid encoding in CSV file")

    stream = io.StringIO(text)
    reader = csv.DictReader(stream)

    if not reader.fieldnames:
        raise ValueError("CSV file is empty or headerless")

    header_map: dict[str, str] = {}
    for raw_header in reader.fieldnames:
        if raw_header:
            canonical = _normalize_header(raw_header)
            if canonical:
                header_map[raw_header] = canonical

    required = {"ticket_id", "subject", "body"}
    mapped_fields = set(header_map.values())
    if not required.issubset(mapped_fields):
        raise ValueError(f"CSV missing required headers: {required - mapped_fields}")

    tickets: list[TicketInput] = []
    for row in reader:
        cleaned_row: dict[str, str] = {}
        for raw_k, v in row.items():
            if raw_k and raw_k in header_map and v:
                v_clean = v.strip()
                if v_clean:
                    cleaned_row[header_map[raw_k]] = v_clean

        t_id = cleaned_row.get("ticket_id")
        subj = cleaned_row.get("subject")
        body = cleaned_row.get("body")

        if not t_id or not subj or not body:
            continue

        tickets.append(
            TicketInput(
                ticket_id=t_id,
                subject=subj,
                body=body,
                customer_id=cleaned_row.get("customer_id"),
                channel=cleaned_row.get("channel"),
                created_at=cleaned_row.get("created_at"),
            )
        )

    if not tickets:
        raise ValueError("CSV contains no valid ticket records")

    return tickets
