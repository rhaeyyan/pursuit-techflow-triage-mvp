# Pursuit: support-specialist-mvp

## /cycle-02/week-03-and-04/

![TechFlow Support Queue](screenshot/TechFlow-Support.png)

**Stop triaging tickets by hand. Start responding to customers.**

Support teams at mid-size SaaS companies spend the first hour of every morning reading through
hundreds of tickets, deciding what's urgent, and sorting them into buckets — before they even
start helping anyone. TechFlow Support Queue reads the queue for you, flags what's critical,
categorizes the rest, and puts the most urgent tickets at the top of the pile so you can skip
straight to resolving problems.

> The name: TechFlow is the fictional SaaS company Jordan M. works at. The queue is the
> problem — 200 to 300 tickets a week, triaged by hand every single morning.

## The problem with manual triage

Jordan M. is a Support Specialist on a team of four. Every morning, Jordan spends 90 minutes
reading each ticket, deciding whether it's urgent, figuring out the issue type, and sorting
them manually. By the time the team starts responding to customers, the morning is half gone.

And things still slip. Last week a critical billing issue sat in the queue for four hours because
it looked like a routine account question in the subject line. The customer was furious.

Jordan has all the data — ticket type, channel, priority, resolution time, customer satisfaction
scores — but no way to actually use it. Just a spreadsheet every morning.

*"I don't need anything fancy. I just need something that helps me get ahead of the queue
instead of always reacting to it."*

## What this tool does

Given a batch of incoming support tickets (as a CSV upload), TechFlow Support Queue:

1. **Reads each ticket** and determines the issue type (billing, technical, account, etc.).
2. **Flags urgency** -- catches the critical issues hiding behind routine-looking subject lines,
   like the billing problem Jordan missed.
3. **Prioritizes the queue** -- displays a sorted table with the most urgent, highest-impact
   tickets at the top.
4. **Categorizes everything** so the team can route tickets to the right person without reading
   each one first.
5. **Drafts AI customer responses** -- enables specialists to generate, review, and copy AI-driven or template-backed email response drafts for any ticket with one click.
6. **Assigns Workflow Status & Specialists** -- tracks ticket progress (`New`, `In Progress`, `Escalated`, `Resolved`) and lets team leads assign tickets to specialists (*Jordan M.*, *Sofia R.*, *Miguel T.*, *Aisha B.*).

![Batch CSV Ingestion & Urgency Overview](screenshot/Dashboard.png)

Jordan uploads the morning's ticket export, and the app gives back a prioritized, categorized
table that replaces the 90-minute manual sort with something the team can act on immediately.
Filters let Jordan drill into a specific category or urgency level.

![Prioritized Ticket Queue & AI Response Drafting](screenshot/Tickets.png)

## How it decides what's urgent

The tool uses a high-performance deterministic triage engine for ticket classification and prioritization:

- **Multi-Factor 0-100 Priority Scoring Engine**: calculates a continuous priority score ($0 \to 100$) based on base urgency, channel impact, churn risk, legal escalation risk, data loss risk, and financial/refund indicators.
- **Deterministic PII Anonymization Engine**: automatically redacts emails (`[EMAIL_REDACTED]`), IP addresses (`[IP_REDACTED]`), credit cards (`[CARD_REDACTED]`), and API key patterns prior to LLM processing or rendering.
- **Hierarchical Two-Tier Taxonomy & Sub-Category Routing**: classifies tickets into primary categories (`technical`, `billing`, `account`) and granular sub-categories (`database_outage`, `server_crash`, `network`, `payment_gateway`, `auth_security`).
- **Multi-Label Domain Tagging**: surfaces cross-domain tags (`#database`, `#infrastructure`, `#security`, `#refund`) to capture multi-system incident dependencies.
- **Unsupervised Trend & Topic Spike Detection**: extracts n-gram frequency clusters across incoming batches to highlight emerging complaint spikes (*e.g., "Database Deadlock" (18%)*) with one-click filtering.
- **Explainable Triage Signals & Risk Badges**: surfaces explicit reasoning tags for every ticket (e.g. *Churn risk (mentions cancelling)*, *Live phone — customer is waiting*, *Legal escalation risk*, *Possible data loss or outage*, *Money owed / refund risk*).
- **Channel-Aware Risk Weighting**: automatically boosts priority for live channels (*Phone / Chat = +12/+10*) and public channels (*Social Media = +10 reputational risk*).
- **Deterministic Rule Engine**: keyword and pattern matching for known critical signals (e.g. "billing error," "can't access," "data loss", "password reset") categorizes tickets and flags critical urgency instantly without external AI dependencies or GPU overhead.
- **Structured Fallback Classifier**: unclassified or edge-case tickets default to a safe baseline triage (`general` / `medium`), ensuring continuous operational stability.
- **Optional Cloud LLM Integration**: cloud LLM classification (Groq / Gemini) can optionally be enabled via environment variables for edge cases, but no local LLM setup is required.

> **Deterministic-First Discipline**: all sorting, multi-factor scoring ($0 \to 100$), PII scrubbing, and prioritization logic is 100% deterministic Python code. The core system operates entirely without local LLM daemons (like Ollama), offering sub-millisecond execution speeds and zero local VRAM overhead.

## The data behind it

A real open-source customer support ticket dataset from Kaggle ships in
[`data/customer_support_tickets.csv`](file:///home/rayan/Documents/Python-Projects/techflow-support-queue/data/customer_support_tickets.csv)
(~8,469 rows) as a reference / manual-upload sample — it was selected because it matches the
type of information someone in Jordan's role would actually work with: fields like ticket
subject, body text, category, priority, channel, and customer satisfaction scores. Upload it
through the CSV ingestion flow to see the tool run against authentic ticket text; the app
computes its own category and urgency from that text rather than trusting Kaggle's
pre-existing labels.

The one-click "Load Demo Dataset" button and the smaller sample CSVs
(`data/sample_kaggle_tickets.csv`, `data/sample_250_tickets.csv`) are curated, hand-written
walkthrough tickets built to showcase specific triage scenarios (critical outages, billing
disputes, churn risk, etc.) — not sampled from the Kaggle file.

This is a learning exercise — TechFlow is a fictional company — but the Kaggle data is real
and the tool is built to work on any CSV of support tickets with similar structure.

## Industry Case Study Reference & Influences

TechFlow Support Queue's architecture incorporates core insights from the industry case study **[karolzak/support-tickets-classification](https://github.com/karolzak/support-tickets-classification)** (developed in collaboration with Microsoft Commercial Software Engineering and Endava):

- **Deterministic PII Anonymization**: Implemented automated PII scrubbing ([`services/anonymizer.py`](file:///home/rayan/Documents/Python-Projects/techflow-support-queue/services/anonymizer.py)) to redact emails (`[EMAIL_REDACTED]`), IP addresses (`[IP_REDACTED]`), credit cards (`[CARD_REDACTED]`), and API keys before sending ticket text to external AI models or rendering.
- **Hierarchical Two-Tier Taxonomy**: Structured tickets into primary issue types (`technical`, `billing`, `account`) and granular sub-categories (`database_outage`, `server_crash`, `network`, `payment_gateway`, `auth_security`).
- **Multi-Label Domain Tagging**: Added cross-domain tag extraction (`#database`, `#infrastructure`, `#security`) to capture multi-system incident dependencies.
- **Unsupervised Trend & Topic Spike Detection**: Integrated n-gram topic clustering ([`services/trends.py`](file:///home/rayan/Documents/Python-Projects/techflow-support-queue/services/trends.py)) to detect emerging complaint spikes (*e.g., "Database Deadlock" (18%)*) across incoming ticket batches.

## Try it

**Live Demo**: [https://pursuit-techflow-triage-mvp.vercel.app/](https://pursuit-techflow-triage-mvp.vercel.app/)

*(Note: The backend is deployed on Render's free tier, so it may take 30-60 seconds to wake up on the first visit if it has been inactive).*

---

## Technical Notes

### System Architecture & Execution Flow

The diagram below illustrates the end-to-end execution flow of TechFlow Support Queue, explicitly distinguishing between the **Deterministic Domain** (100% predictable Python logic & React state) and the **LLM/AI Domain** (optional cloud AI generation via Groq / Gemini):

```mermaid
flowchart TD
    %% Inputs 
    UserCSV[\"Customer Support Tickets<br/>(CSV Upload)"\] --> CSVParser

    subgraph Phase1 ["Phase 1: Ingestion, Scrubbing, Classification & Scoring"]
        direction TD
        CSVParser("CSV Header Normalization<br/>& Ingestion") --> PIIScrubber("Deterministic PII Anonymization<br/>(Redacts Emails, IPs, Cards & Keys)")
        PIIScrubber --> RuleEngineCheck{"Match Keyword Rules?"}
        
        RuleEngineCheck ==>|"YES (Match)"| RuleResult("Rule Engine Classification<br/>(Urgency Tier, Category)")
        RuleEngineCheck -->|"NO (Unmatched)"| CheckLLMConfig{"LLM Configured?"}
        
        CheckLLMConfig -->|"YES (Cloud)"| LLMClassify{{"Cloud LLM Classification<br/>(Structured JSON Output)"}}
        CheckLLMConfig -.->|"NO (Offline)"| DefaultFallback("Safe Default Fallback<br/>(general, medium)")
        
        RuleResult ==> MultiTagging("Taxonomy & Domain Tagging<br/>(Sub-Category & Multi-Label)")
        LLMClassify --> MultiTagging
        DefaultFallback -.-> MultiTagging

        MultiTagging ==> PrioritySort("Multi-Factor Scoring Engine<br/>(0-100 Priority Score & Risk)")
        PrioritySort ==> TrendEngine("Unsupervised Trend Discovery<br/>(N-Gram Spike Cluster Extractor)")
        TrendEngine ==> RenderUI(["React SPA Queue Table,<br/>Filters & Trend Banner"])
    end

    subgraph Phase2 ["Phase 2: Response Generation & Workflow"]
        direction TD
        RenderUI -.->|"User Updates Status"| PatchUpdate("Workflow Status & Assignee<br/>(PATCH /api/tickets/id)")
        RenderUI -->|"Clicks 'Draft AI Response'"| CheckDraftLLM{"LLM API Key Active?"}
        
        CheckDraftLLM -->|"YES"| LLMResponseGen{{"Generate AI Customer Email Draft<br/>(Cloud LLM)"}}
        CheckDraftLLM -.->|"NO"| TemplateDraft("Smart Template Generator<br/>(Deterministic Draft)")
        
        LLMResponseGen --> DisplayDraft[\"Customer Response<br/>Draft Interface"\]
        TemplateDraft -.-> DisplayDraft
    end

    %% Class Assignments
    class UserCSV,DisplayDraft inputOutput;
    class CSVParser,PIIScrubber,RuleResult,MultiTagging,DefaultFallback,PrioritySort,TrendEngine,RenderUI,TemplateDraft,PatchUpdate deterministic;
    class LLMClassify,LLMResponseGen aiDomain;
    class RuleEngineCheck,CheckDraftLLM,CheckLLMConfig decision;

    %% Styling Definitions
    classDef deterministic fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef aiDomain fill:#3b0764,stroke:#c084fc,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef inputOutput fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
```

> **Legend**:
> - **Blue Nodes** (`deterministic`): 100% predictable Python logic & React SPA UI (sub-millisecond execution).
> - **Purple Nodes** (`aiDomain`): Optional Cloud AI/LLM domain (Groq Gemma / Gemini Flash).
> - **Amber Diamonds** (`decision`): Routing & configuration decision logic.
> - **Green Nodes** (`inputOutput`): CSV Data Ingestion & Customer Response Draft Output.

### Build order (walking skeleton)

The thinnest end-to-end slice that solves Jordan's problem:

1. **Ingest**: read a CSV of support tickets into structured Python objects (FastAPI endpoint).
2. **Classify**: for each ticket, determine issue type and urgency (rules first, fallback classifier).
3. **Prioritize**: sort tickets by urgency and category, deterministically.
4. **Display**: render the prioritized queue as a filterable table in the React frontend.

Get a single ticket classified and displayed correctly before scaling to the full dataset.

### Explicitly out of scope for V1

- A database (Supabase or otherwise) -- input is CSV upload, processing is in-memory.
- Multi-agent workflows (LangChain, CrewAI) -- rule engine + lightweight fallback suffices.
- MCP tool connectivity -- this tool is used by a human, not by an AI agent.
- User accounts, authentication, or saved history.

### Planned V2 scope (only when V1 is complete and working)

- **Trend detection**: surface recurring complaint patterns from historical ticket data.
- **Team routing suggestions**: recommend which team member should handle each ticket based on
  past resolution patterns.
- **Persistent storage** (Supabase): save past triages so Jordan can track patterns over weeks.

### Stack

- **Frontend**: React 18 + TypeScript (Vite SPA), Lucide icons, Vanilla CSS custom properties design system with light/dark theme support.
- **Backend**: Python 3.12 + FastAPI. Flexible CSV parsing with header alias normalization, ticket classification pipeline (deterministic rule engine + safe fallback classifier), urgency prioritization logic.
- **Classification Engine**: Fast, sub-millisecond keyword and pattern-matching rule engine. Optional cloud LLM providers (Groq / Gemini) can be configured via env vars without requiring local GPU setups.

### Status

**V1 Full-Stack MVP Complete & Verified.**

- **Backend Core**: Flexible CSV parsing with header alias normalization, multi-factor $0–100$ priority scoring algorithm, channel risk weighting, explainable triage reason extraction, classification pipeline (deterministic rule engine + safe default fallback), AI customer response draft generator (`/api/tickets/generate-response`), and FastAPI REST API endpoints (`/api/tickets/triage`, `/health`). 100% test coverage with 15/15 passing `pytest` suite.
- **Frontend SPA**: Modern, corporate-friendly UI with:
  - **Light/Dark Theme System**: Warm corporate cream palette for light mode alongside polished dark mode with smooth theme transitions and `localStorage` persistence.
  - **Batch CSV Upload & Drag-and-Drop**: Supports arbitrary CSV uploads, custom header alias mapping, and one-click demo data loading.
  - **Prioritized Triage Table**: Ranked ticket queue sorted by $0–100$ priority score, live search, issue category filtering, expandable ticket body previews, and column sorting.
  - **Explainable Triage Badges**: Surfaces explicit reasoning tags (*Churn risk*, *Live phone*, *Legal escalation risk*, *Refund risk*, *Data loss*).
  - **Workflow Management**: Interactive status badges (`New`, `In Progress`, `Escalated`, `Resolved`) and specialist assignment controls (*Jordan M.*, *Sofia R.*, *Miguel T.*, *Aisha B.*).
  - **AI-Assisted Draft Responses**: On-demand AI draft response generation inside expanded ticket views with one-click copy functionality.
  - **Interactive Tooltips**: Contextual tooltips explaining classification sources (*Rule Engine*, *LLM Classifier*, *Fallback*) and API connection status (*API Connected* / *Standalone Mode*).
  - **Queue Management**: One-click queue reset to return to clean upload state.
- **Demo Datasets**: One-click curated walkthrough (10 hand-authored demo tickets), a synthetic 250-ticket sample CSV (`data/sample_250_tickets.csv`) for volume testing, and the real Kaggle dataset (`data/customer_support_tickets.csv`, ~8,469 rows) for testing against authentic ticket text.

---

*Built for Pursuit's AI-Native Fellowship.*
[GitHub Repository](https://github.com/rhaeyyan/pursuit-techflow-triage-mvp) • [rayankhan.io](https://rayankhan.io) • [LinkedIn](https://www.linkedin.com/in/rayan-khan-3b90a2356/)
