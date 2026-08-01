"""FastAPI application for TechFlow Support Queue backend."""

from collections import Counter
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import TriageResponse, GenerateResponseRequest, GenerateResponseOutput, UpdateTicketRequest, TriagedTicket
from services.triage import parse_csv_tickets, triage_tickets, generate_ticket_response

app = FastAPI(title="TechFlow Support Queue API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response



@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/tickets/triage", response_model=TriageResponse)
async def triage_csv_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        tickets_input = parse_csv_tickets(content)
        triaged_tickets = triage_tickets(tickets_input)

        urgency_counts = dict(Counter(t.urgency for t in triaged_tickets))

        return TriageResponse(
            total_tickets=len(triaged_tickets),
            tickets=triaged_tickets,
            urgency_counts=urgency_counts,
        )
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Internal processing error: {err}")


@app.post("/api/tickets/generate-response", response_model=GenerateResponseOutput)
def generate_response_endpoint(request: GenerateResponseRequest):
    try:
        suggested_text, source = generate_ticket_response(
            ticket_id=request.ticket_id,
            subject=request.subject,
            body=request.body,
            issue_type=request.issue_type,
            urgency=request.urgency,
        )
        return GenerateResponseOutput(
            ticket_id=request.ticket_id,
            suggested_response=suggested_text,
            source=source,
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {err}")


from services.trends import detect_emerging_topics


from datetime import datetime, timezone


@app.patch("/api/tickets/{ticket_id}")
def update_ticket_endpoint(ticket_id: str, request: UpdateTicketRequest):
    updated_at = datetime.now(timezone.utc).isoformat()
    return {
        "status": "ok",
        "ticket_id": ticket_id,
        "updated_at": updated_at,
        "updated_fields": request.model_dump(exclude_unset=True),
        "message": f"Successfully updated ticket {ticket_id}",
    }


@app.post("/api/tickets/trends")
def detect_trends_endpoint(tickets: list[TriagedTicket]):
    trends = detect_emerging_topics(tickets)
    return {"trends": trends, "total_clusters": len(trends)}


