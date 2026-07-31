"""Triage service for support tickets using rules, LLM, and fallback."""

import csv
import io
import json
import httpx
from schemas import TicketInput, TicketClassification, TriagedTicket

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


class OllamaClassifier:
    """Ollama LLM classifier fallback."""

    def __init__(
        self,
        endpoint: str = "http://localhost:11434/api/generate",
        timeout: float = 3.0,
    ):
        self.endpoint = endpoint
        self.timeout = timeout

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
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
            response = httpx.post(self.endpoint, json=payload, timeout=self.timeout)
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
    ollama_classifier = OllamaClassifier()
    fallback_classifier = DefaultFallbackClassifier()

    triaged: list[TriagedTicket] = []

    for ticket in tickets:
        classification = rule_engine.classify(ticket)
        confidence_source = "rule"

        if classification is None:
            classification = ollama_classifier.classify(ticket)
            confidence_source = "llm"

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


def parse_csv_tickets(content_bytes: bytes) -> list[TicketInput]:
    try:
        text = content_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("Invalid encoding in CSV file")

    stream = io.StringIO(text)
    reader = csv.DictReader(stream)

    if not reader.fieldnames:
        raise ValueError("CSV file is empty or headerless")

    fieldnames = [f.strip() for f in reader.fieldnames if f]
    required = {"ticket_id", "subject", "body"}
    if not required.issubset(set(fieldnames)):
        raise ValueError(f"CSV missing required headers: {required - set(fieldnames)}")

    tickets: list[TicketInput] = []
    for row in reader:
        cleaned_row = {k.strip(): (v.strip() if v else None) for k, v in row.items() if k}
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
