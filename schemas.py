"""Pydantic schemas for TechFlow Support Queue triage backend."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class TicketInput(BaseModel):
    ticket_id: str
    subject: str
    body: str
    customer_id: str | None = None
    channel: str | None = None
    created_at: datetime | str | None = None


class TicketClassification(BaseModel):
    issue_type: Literal["billing", "technical", "account", "feature_request", "general"]
    urgency: Literal["critical", "high", "medium", "low"]


class TriagedTicket(BaseModel):
    ticket_id: str
    subject: str
    body: str
    customer_id: str | None = None
    channel: str | None = None
    created_at: datetime | str | None = None
    issue_type: str
    urgency: str
    urgency_score: int = Field(ge=1, le=4)
    score: int = Field(default=50, ge=0, le=100)
    reasons: list[str] = Field(default_factory=list)
    status: Literal["new", "in-progress", "escalated", "resolved"] = "new"
    assignee: str | None = None
    confidence_source: Literal["rule", "llm", "fallback"]


class TriageResponse(BaseModel):
    total_tickets: int
    tickets: list[TriagedTicket]
    urgency_counts: dict[str, int] = Field(default_factory=dict)


class GenerateResponseRequest(BaseModel):
    ticket_id: str
    subject: str
    body: str
    issue_type: str = "general"
    urgency: str = "medium"


class GenerateResponseOutput(BaseModel):
    ticket_id: str
    suggested_response: str
    source: str  # "llm" or "template"


class UpdateTicketRequest(BaseModel):
    status: Literal["new", "in-progress", "escalated", "resolved"] | None = None
    assignee: str | None = None


