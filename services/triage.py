"""Triage service for support tickets using rules, LLM, and fallback."""

import csv
import io
import json
import os
import httpx
from schemas import TicketClassification, TicketInput, TriagedTicket
from services.anonymizer import sanitize_text

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
        (
            ["billing error", "double charged", "unauthorized charge"],
            "billing",
            "payment_gateway",
            "critical",
        ),
        (
            ["refund", "invoice", "payment failed", "credit card"],
            "billing",
            "invoice_refund",
            "high",
        ),
        # Technical
        (
            ["data loss", "database failure", "db crash"],
            "technical",
            "database_outage",
            "critical",
        ),
        (
            ["server down", "system crash", "system outage", "500 error"],
            "technical",
            "server_crash",
            "critical",
        ),
        (
            ["latency", "slow load", "network error", "dns"],
            "technical",
            "network",
            "high",
        ),
        (["bug", "error code"], "technical", "software_bug", "high"),
        # Account & Security
        (
            ["password reset", "account locked", "2fa", "security breach"],
            "account",
            "auth_security",
            "medium",
        ),
        (["change email", "update profile"], "account", "user_maintenance", "low"),
        # Feature Request
        (
            ["feature request", "integration", "add support"],
            "feature_request",
            "product_roadmap",
            "low",
        ),
    ]

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        text = f"{ticket.subject} {ticket.body}".lower()
        for keywords, issue_type, sub_category, urgency in self.RULES:
            for kw in keywords:
                if kw in text:
                    return TicketClassification(
                        issue_type=issue_type,
                        sub_category=sub_category,
                        urgency=urgency,
                    )
        return None


def extract_multi_label_tags(
    ticket: TicketInput, issue_type: str, sub_category: str
) -> list[str]:
    tags: set[str] = set()
    if issue_type:
        tags.add(issue_type)
    if sub_category and sub_category != "general":
        tags.add(sub_category)

    text = f"{ticket.subject} {ticket.body}".lower()
    if any(k in text for k in ["db", "database", "sql", "postgres", "redis"]):
        tags.add("database")
    if any(k in text for k in ["network", "dns", "gateway", "latency", "timeout"]):
        tags.add("network")
    if any(k in text for k in ["invoice", "charge", "refund", "billing", "payment"]):
        tags.add("billing")
    if any(k in text for k in ["security", "auth", "password", "token", "breach"]):
        tags.add("security")
    if any(k in text for k in ["server", "cluster", "outage", "crash"]):
        tags.add("infrastructure")

    return sorted(list(tags))


def _build_classification_prompt(subject: str, body: str) -> str:
    """Shared instruction text for all LLM classifiers (JSON issue_type/urgency)."""
    return (
        "Classify the following support ticket into an issue_type "
        "(billing, technical, account, feature_request, general) and "
        "urgency (critical, high, medium, low). Return JSON with keys 'issue_type' and 'urgency'.\n"
        f"Subject: {subject}\nBody: {body}"
    )


class BaseLLMClassifier:
    """Template Method base for LLM-backed ticket classifiers.

    Subclasses only supply the provider-specific request shape
    (`_build_request`) and response-unwrapping path (`_extract_content`).
    The shared `classify()` owns the POST call, defensive string-or-dict
    JSON parsing, and blanket exception-swallowing (return None on any
    failure) that all providers previously duplicated.
    """

    timeout: float

    def _build_request(self, ticket: TicketInput) -> tuple[str, dict, dict] | None:
        """Return (endpoint, headers, payload), or None to skip the call."""
        raise NotImplementedError

    def _extract_content(self, data: dict) -> str | dict | None:
        """Pull the provider-specific classification text/dict out of `data`."""
        raise NotImplementedError

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        request = self._build_request(ticket)
        if request is None:
            return None
        endpoint, headers, payload = request
        try:
            response = httpx.post(
                endpoint, headers=headers, json=payload, timeout=self.timeout
            )
            if response.status_code != 200:
                return None
            data = response.json()
            content = self._extract_content(data)
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


class GroqClassifier(BaseLLMClassifier):
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

    def _build_request(self, ticket: TicketInput) -> tuple[str, dict, dict] | None:
        api_key = self.api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            return None
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        prompt = _build_classification_prompt(
            sanitize_text(ticket.subject), sanitize_text(ticket.body)
        )
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
        }
        return self.endpoint, headers, payload

    def _extract_content(self, data: dict) -> str | dict | None:
        choices = data.get("choices", [])
        if not choices:
            return None
        return choices[0].get("message", {}).get("content")


class GeminiClassifier(BaseLLMClassifier):
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

    def _build_request(self, ticket: TicketInput) -> tuple[str, dict, dict] | None:
        api_key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={api_key}"
        prompt = _build_classification_prompt(
            sanitize_text(ticket.subject), sanitize_text(ticket.body)
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        return endpoint, {}, payload

    def _extract_content(self, data: dict) -> str | dict | None:
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None
        return parts[0].get("text")


class OllamaClassifier(BaseLLMClassifier):
    """Ollama LLM classifier fallback."""

    def __init__(
        self,
        endpoint: str | None = None,
        timeout: float = 1.5,
    ):
        self.endpoint = endpoint
        self.timeout = timeout
        self._checked_availability = False
        self._is_available = False

    def check_availability(self) -> bool:
        if self._checked_availability:
            return self._is_available
        self._checked_availability = True
        endpoint = self.endpoint or os.getenv(
            "OLLAMA_ENDPOINT", "http://localhost:11434/api/generate"
        )
        try:
            # Quick health check to verify if local Ollama daemon is active
            tags_endpoint = endpoint.rsplit("/", 1)[0] + "/tags"
            resp = httpx.get(tags_endpoint, timeout=0.3)
            self._is_available = resp.status_code == 200
        except Exception:
            self._is_available = False
        return self._is_available

    def classify(self, ticket: TicketInput) -> TicketClassification | None:
        if not self.check_availability():
            return None
        return super().classify(ticket)

    def _build_request(self, ticket: TicketInput) -> tuple[str, dict, dict] | None:
        endpoint = self.endpoint or os.getenv(
            "OLLAMA_ENDPOINT", "http://localhost:11434/api/generate"
        )
        prompt = _build_classification_prompt(ticket.subject, ticket.body)
        payload = {
            "model": "gemma-4 E2B",
            "prompt": prompt,
            "format": "json",
            "stream": False,
        }
        return endpoint, {}, payload

    def _extract_content(self, data: dict) -> str | dict | None:
        return data.get("response")


class DefaultFallbackClassifier:
    """Safe fallback classifier when rules and LLM fail/are unavailable."""

    def classify(self, ticket: TicketInput) -> TicketClassification:
        return TicketClassification(issue_type="general", urgency="medium")


def compute_ticket_score_and_reasons(
    ticket: TicketInput, issue_type: str, urgency: str, confidence_source: str
) -> tuple[int, list[str]]:
    reasons: list[str] = []

    # 1. Base Urgency Score
    base_scores = {
        "critical": 65,
        "high": 50,
        "medium": 35,
        "low": 20,
    }
    base = base_scores.get(urgency.lower(), 35)

    if issue_type == "billing":
        reasons.append("Billing inquiry")
    elif issue_type == "technical":
        reasons.append("Technical issue")
    elif issue_type == "account":
        reasons.append("Account request")
    elif issue_type == "feature_request":
        reasons.append("Feature request")
    else:
        reasons.append("General inquiry")

    # 2. Text Keyword & Risk Signals
    text = f"{ticket.subject} {ticket.body}".lower()

    # Churn Risk
    churn_keywords = [
        "cancel",
        "cancellation",
        "switching",
        "closing account",
        "churn",
        "close my account",
    ]
    if any(kw in text for kw in churn_keywords):
        base += 12
        reasons.append("Churn risk (mentions cancelling)")

    # Legal / Escalation Risk
    legal_keywords = [
        "lawyer",
        "legal",
        "sue",
        "attorney",
        "regulator",
        "compliance",
        "unauthorized",
        "fraud",
    ]
    if any(kw in text for kw in legal_keywords):
        base += 12
        reasons.append("Legal escalation risk")

    # Financial / Refund Risk
    financial_keywords = [
        "refund",
        "double charged",
        "overcharged",
        "money owed",
        "invoice",
    ]
    if any(kw in text for kw in financial_keywords):
        base += 8
        reasons.append("Money owed / refund risk")

    # Data Loss / Outage Risk
    outage_keywords = [
        "data loss",
        "outage",
        "system down",
        "500 error",
        "server down",
        "can't access",
    ]
    if any(kw in text for kw in outage_keywords):
        base += 10
        reasons.append("Possible data loss or outage")

    # Time-sensitive Language
    urgent_keywords = ["asap", "urgent", "immediately", "blocker", "emergency"]
    if any(kw in text for kw in urgent_keywords):
        base += 5
        reasons.append("Customer flagged as urgent")

    # 3. Channel Risk Weighting
    channel = (ticket.channel or "").lower()
    if channel in ["phone", "call"]:
        base += 12
        reasons.append("Live phone — customer is waiting")
    elif channel == "chat":
        base += 10
        reasons.append("Live chat — customer is waiting")
    elif channel == "social":
        base += 10
        reasons.append("Public on social — reputational risk")

    # Cap score between 10 and 100
    final_score = max(10, min(100, base))

    return final_score, reasons


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
        if classification is None and (
            provider == "groq" or (provider == "auto" and groq_key)
        ):
            classification = groq_classifier.classify(ticket)
            if classification is not None:
                confidence_source = "llm"

        # Step 3: If LLM_PROVIDER == "gemini" or GEMINI_API_KEY present -> GeminiClassifier
        if classification is None and (
            provider == "gemini" or (provider == "auto" and gemini_key)
        ):
            classification = gemini_classifier.classify(ticket)
            if classification is not None:
                confidence_source = "llm"

        # Step 4: If LLM_PROVIDER == "ollama" or OLLAMA_ENDPOINT present -> OllamaClassifier
        if classification is None and (
            provider == "ollama" or os.getenv("OLLAMA_ENDPOINT")
        ):
            classification = ollama_classifier.classify(ticket)
            if classification is not None:
                confidence_source = "llm"

        # Step 5: Default Fallback
        if classification is None:
            classification = fallback_classifier.classify(ticket)
            confidence_source = "fallback"

        score_tier = URGENCY_SCORES.get(classification.urgency, 2)
        score, reasons = compute_ticket_score_and_reasons(
            ticket, classification.issue_type, classification.urgency, confidence_source
        )

        sub_cat = getattr(classification, "sub_category", "general")
        tags = extract_multi_label_tags(ticket, classification.issue_type, sub_cat)

        triaged.append(
            TriagedTicket(
                ticket_id=ticket.ticket_id,
                subject=ticket.subject,
                body=ticket.body,
                customer_id=ticket.customer_id,
                channel=ticket.channel,
                created_at=ticket.created_at,
                issue_type=classification.issue_type,
                sub_category=sub_cat,
                tags=tags,
                urgency=classification.urgency,
                urgency_score=score_tier,
                score=score,
                reasons=reasons,
                status="new",
                assignee=None,
                confidence_source=confidence_source,
            )
        )

    return sort_tickets(triaged)


def sort_tickets(tickets: list[TriagedTicket]) -> list[TriagedTicket]:
    return sorted(
        tickets,
        key=lambda t: (
            -t.score,
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


def generate_ticket_response(
    ticket_id: str,
    subject: str,
    body: str,
    issue_type: str = "general",
    urgency: str = "medium",
) -> tuple[str, str]:
    """Generates an AI or template-driven suggested response for a support ticket.
    Returns (suggested_response_text, source_string).
    """
    # 1. Try Groq LLM if API key available
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            }
            prompt = (
                "You are an expert customer support specialist for TechFlow SaaS. "
                "Draft a polite, professional, and helpful customer email response for this ticket.\n"
                f"Ticket ID: {ticket_id}\n"
                f"Issue Category: {issue_type}\n"
                f"Urgency Level: {urgency}\n"
                f"Subject: {subject}\n"
                f"Body: {body}\n\n"
                "Requirements:\n"
                "- Write a direct, empathetic, and professional response.\n"
                "- Include appropriate next steps based on the issue category.\n"
                "- Keep the response concise (2-4 paragraphs).\n"
                "- Do not include placeholders like [Your Name] — sign off as 'TechFlow Support Team'."
            )
            payload = {
                "model": "gemma2-9b-it",
                "messages": [{"role": "user", "content": prompt}],
            }
            res = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=4.0,
            )
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices:
                    text = choices[0].get("message", {}).get("content", "").strip()
                    if text:
                        return text, "llm"
        except Exception:
            pass

    # 2. Try Gemini LLM if API key available
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            prompt = (
                "You are an expert customer support specialist for TechFlow SaaS. "
                "Draft a polite, professional, and helpful customer email response for this ticket.\n"
                f"Ticket ID: {ticket_id}\n"
                f"Issue Category: {issue_type}\n"
                f"Urgency Level: {urgency}\n"
                f"Subject: {subject}\n"
                f"Body: {body}\n\n"
                "Sign off as 'TechFlow Support Team'."
            )
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = httpx.post(endpoint, json=payload, timeout=4.0)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        if text:
                            return text, "llm"
        except Exception:
            pass

    # 3. Deterministic Smart Template Fallback
    category_norm = issue_type.lower()
    urgency_norm = urgency.lower()

    greeting = "Hello,\n\nThank you for reaching out to TechFlow Support."

    if "billing" in category_norm:
        if urgency_norm == "critical":
            body_reply = (
                f"We have flagged your ticket regarding '{subject}' as Critical Priority. "
                "Our billing operations and finance team has been immediately notified to audit your transaction records. "
                "Any erroneous billing charges or duplicate invoices will be reversed promptly within 1 business day."
            )
        else:
            body_reply = (
                f"We have received your billing inquiry regarding '{subject}'. "
                "Our accounting team is reviewing invoice details for your account and will confirm payment adjustments or credit status shortly."
            )
    elif "technical" in category_norm:
        if urgency_norm == "critical":
            body_reply = (
                f"We have escalated your report '{subject}' to our Senior Infrastructure & Site Reliability Engineering team as a Critical Incident. "
                "Our engineers are actively investigating server logs and system metrics. We will provide real-time updates as we work toward resolution."
            )
        else:
            body_reply = (
                f"Our technical engineering team is investigating your report regarding '{subject}'. "
                "We are testing steps to reproduce the issue and will share diagnostic findings or a patch update shortly."
            )
    elif "account" in category_norm:
        body_reply = (
            f"We have received your account security inquiry regarding '{subject}'. "
            "To safeguard your account integrity, our security desk is verifying session logs and access controls. "
            "If you are unable to access your portal, please ensure your multi-factor authentication device is active."
        )
    elif "feature_request" in category_norm:
        body_reply = (
            f"Thank you for sharing your feature suggestion regarding '{subject}'! "
            "We love hearing feedback from our community. Your request has been logged with our Product Management team for evaluation during upcoming roadmap planning cycles."
        )
    else:
        body_reply = (
            f"We have received your ticket regarding '{subject}' and assigned it to the appropriate specialist team. "
            "We are currently reviewing your request details and will follow up with further information shortly."
        )

    closing = "\n\nPlease let us know if you have any additional details to add in the meantime.\n\nBest regards,\nTechFlow Support Team"
    return f"{greeting}\n\n{body_reply}\n{closing}", "template"
