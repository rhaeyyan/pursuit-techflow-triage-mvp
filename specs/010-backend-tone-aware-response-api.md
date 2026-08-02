# SPEC 010: Backend Tone-Aware AI Response Generation API

```markdown
[SPEC]
- **Objective**: Add `tone: str = "formal"` field to `GenerateResponseRequest` in `schemas.py`, update `POST /api/tickets/generate-response` in `main.py`, and update `generate_ticket_response` in `services/triage.py` to produce tone-aware email drafts for Groq, Gemini, and fallback template branches (*formal*, *empathic*, *concise*, *technical*).
- **Inputs/Outputs**:
  - `GenerateResponseRequest`: Includes `tone: str = "formal"`.
  - `generate_ticket_response(ticket_id, subject, body, issue_type, urgency, tone="formal")`: Returns `(suggested_text, source)`.
  - Tone Formatting Rules:
    - `formal`: Corporate, polite greeting & closing.
    - `empathic`: Deeply empathetic apology and reassuring tone.
    - `concise`: Short, bulleted, action-oriented reply.
    - `technical`: SRE/Engineering diagnostic status & telemetry reply.
- **Design Pattern**: Parameterized Request DTO + Strategy-based Response Renderer.
- **Bounded-AI boundary**:
  - **Deterministic**: Request validation via Pydantic, fallback template tone branching rules.
  - **Generative**: Groq & Gemini LLM prompt customization with tone directives.
- **Verification Oracle**: `venv/bin/pytest`
- **Intellectual Control**: Pydantic schema validation ensures default `"formal"` tone fallback when tone is omitted by older API clients.
- **Constraints**:
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/010-backend-tone-aware-response-api.md`
  2. `schemas.py`
  3. `main.py`
  4. `services/triage.py`
  5. `tests/test_triage.py`
```

```markdown
[FORCES]
1. End-to-end backend/frontend tone parity > Stale API DTO definitions
2. Simplicity > Pattern purity
```
