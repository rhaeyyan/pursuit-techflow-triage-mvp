"""Unit tests for trend & topic discovery engine."""

from schemas import TriagedTicket
from services.trends import detect_emerging_topics


def test_detect_emerging_topics():
    tickets = [
        TriagedTicket(
            ticket_id="TCK-1",
            subject="Database deadlock error on postgres cluster",
            body="Primary database deadlock occurred causing 500 server crashes.",
            issue_type="technical",
            urgency="critical",
            urgency_score=4,
            confidence_source="rule",
        ),
        TriagedTicket(
            ticket_id="TCK-2",
            subject="Database deadlock failure in production",
            body="Another database deadlock reported by infrastructure monitoring.",
            issue_type="technical",
            urgency="critical",
            urgency_score=4,
            confidence_source="rule",
        ),
        TriagedTicket(
            ticket_id="TCK-3",
            subject="Payment failed on subscription renewal",
            body="Credit card gateway error on renewal invoice.",
            issue_type="billing",
            urgency="high",
            urgency_score=3,
            confidence_source="rule",
        ),
    ]

    trends = detect_emerging_topics(tickets)
    assert len(trends) > 0
    top_topic = trends[0]
    assert top_topic["count"] == 2
    assert "database" in top_topic["phrase"] or "deadlock" in top_topic["phrase"]
