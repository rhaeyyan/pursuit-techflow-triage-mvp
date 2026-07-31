# SPEC 001: Backend CSV Ingestion, Classification & Prioritization API

```markdown
[SPEC]
- **Objective**: Implement a FastAPI POST endpoint at `/api/tickets/triage` that accepts a CSV upload of support tickets, parses records into structured schemas, classifies each ticket's issue type and urgency via a bounded multi-stage pipeline (deterministic keyword rules -> local Ollama Gemma LLM fallback -> safe default fallback), deterministically prioritizes tickets by urgency score and timestamp, and returns a structured JSON response.
- **Inputs/Outputs**:
  - **HTTP Endpoint**: `POST /api/tickets/triage`
  - **HTTP Request Input**: `multipart/form-data` with form field `file` (`UploadFile` containing CSV data).
  - **CSV Column Schema**:
    - Required: `ticket_id`, `subject`, `body`
    - Optional: `customer_id`, `channel`, `created_at`
  - **Pydantic Schemas**:
    - `TicketInput`: `ticket_id: str`, `subject: str`, `body: str`, `customer_id: str | None = None`, `channel: str | None = None`, `created_at: datetime | str | None = None`
    - `TicketClassification`: `issue_type: Literal["billing", "technical", "account", "feature_request", "general"]`, `urgency: Literal["critical", "high", "medium", "low"]`
    - `TriagedTicket`: All fields from `TicketInput` + `issue_type: str`, `urgency: str`, `urgency_score: int` (critical=4, high=3, medium=2, low=1), `confidence_source: Literal["rule", "llm", "fallback"]`
    - `TriageResponse`: `total_tickets: int`, `tickets: list[TriagedTicket]`
- **Design Pattern**: Chain of Responsibility / Strategy Pattern (`RuleEngine` -> `OllamaClassifier` -> `DefaultFallbackClassifier`).
- **Bounded-AI boundary**:
  - **Deterministic Logic**:
    - Keyword Rule Engine runs first. Scans subject/body for critical patterns (e.g., "billing error", "refund", "unauthorized charge" -> `issue_type="billing"`, `urgency="critical"`/`"high"`; "can't access", "data loss", "outage" -> `issue_type="technical"`, `urgency="critical"`).
    - Prioritization: Pure Python sorting by `urgency_score` (descending: critical=4, high=3, medium=2, low=1) and `created_at` timestamp.
    - Default Safe Fallback: If Ollama is unreachable, times out (>5s), or returns invalid JSON/schema, fallback automatically to `issue_type="general"`, `urgency="medium"`, `confidence_source="fallback"`.
  - **Bounded LLM Logic**:
    - Invoked only when keyword rule engine returns `None`.
    - Sends HTTP POST request to Ollama endpoint (`http://localhost:11434/api/generate` or `/api/chat`) with model `gemma-4 E2B` or `gemma:2b` and `format="json"`.
    - Strict schema validation (Pydantic `TicketClassification`) on response JSON. The LLM solely categorizes text; it does not rank, score, or compute triage order.
- **Verification Oracle**: `pytest tests/test_triage.py`
- **Intellectual Control**: Decoupling triage into explicit stages guarantees system stability regardless of local LLM connectivity. Mocking Ollama responses in pytest enables isolated, reproducible, fast test execution.
- **Constraints**:
  - Python 3.12 + FastAPI + Pydantic v2 + `httpx` (for Ollama HTTP calls).
  - Target files <= 5 files.
  - Zero database dependency; in-memory processing.
- **Edge Cases**:
  - Empty CSV or missing required headers -> 400 Bad Request with error detail.
  - Optional fields missing (`customer_id`, `channel`, `created_at`) -> handled gracefully with default values.
  - Ollama offline / connection refused / timeout / malformed JSON output -> seamless fallback to default classification.
  - Mixed upper/lower case keywords -> case-insensitive string matching.
- **Target Files**:
  1. `main.py`
  2. `schemas.py`
  3. `services/triage.py`
  4. `tests/test_triage.py`
```

```markdown
[FORCES]
1. Multi-stage resilience (Rule -> LLM -> Fallback) > LLM availability
2. Simplicity > Pattern purity
```
