"""FastAPI application for TechFlow Support Queue backend."""

from collections import Counter
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import TriageResponse
from services.triage import parse_csv_tickets, triage_tickets

app = FastAPI(title="TechFlow Support Queue API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
