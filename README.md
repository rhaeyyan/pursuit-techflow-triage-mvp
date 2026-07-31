# TechFlow Support Queue

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

Jordan uploads the morning's ticket export, and the app gives back a prioritized, categorized
table that replaces the 90-minute manual sort with something the team can act on immediately.
Filters let Jordan drill into a specific category or urgency level.

## How it decides what's urgent

The tool uses a combination of deterministic rules and LLM-assisted classification:

- **Deterministic rules first**: keyword matching for known critical patterns (e.g. "billing
  error," "can't access," "data loss") catches the obvious signals without any AI call.
- **LLM classification**: for tickets that don't match a clear pattern, a single bounded LLM
  call (powered locally via Ollama using Gemma-4 E2B) reads the ticket body and classifies it
  by issue type and urgency level, returning a structured response validated against a strict schema.
- **No invented data**: the tool categorizes and sorts — it does not generate ticket responses,
  fabricate priority scores, or guess at resolution steps. Every classification is traceable to
  either a rule match or a validated LLM output.

> **Bounded-AI discipline**: the LLM classifies text; it does not compute scores, rank tickets,
> or make routing decisions. All sorting and prioritization logic is deterministic Python code
> that runs on the LLM's structured output. If the LLM is unavailable, the rule-based fallback
> still produces a usable (if less precise) triage.

## The data behind it

The MVP uses a real open-source customer support ticket dataset from Kaggle, selected because
it matches the type of information someone in Jordan's role would actually work with. The
dataset includes fields like ticket subject, body text, category, priority, channel, and
customer satisfaction scores.

This is a learning exercise — TechFlow is a fictional company — but the data is real and the
tool is built to work on any CSV of support tickets with similar structure.

## Try it

*Not yet deployed. Run it locally (see Technical Notes below).*

---

## Technical Notes

### Build order (walking skeleton)

The thinnest end-to-end slice that solves Jordan's problem:

1. **Ingest**: read a CSV of support tickets into structured Python objects (FastAPI endpoint).
2. **Classify**: for each ticket, determine issue type and urgency (rules first, LLM fallback).
3. **Prioritize**: sort tickets by urgency and category, deterministically.
4. **Display**: render the prioritized queue as a filterable table in the React frontend.

Get a single ticket classified and displayed correctly before scaling to the full dataset.

### Explicitly out of scope for V1

- A database (Supabase or otherwise) -- input is CSV upload, processing is in-memory.
- Multi-agent workflows (LangChain, CrewAI) -- a single bounded LLM call suffices.
- MCP tool connectivity -- this tool is used by a human, not by an AI agent.
- User accounts, authentication, or saved history.
- Auto-generated ticket responses.

### Planned V2 scope (only when V1 is complete and working)

- **Trend detection**: surface recurring complaint patterns from historical ticket data.
- **Team routing suggestions**: recommend which team member should handle each ticket based on
  past resolution patterns.
- **Persistent storage** (Supabase): save past triages so Jordan can track patterns over weeks.

### Stack

- **Frontend**: React + TypeScript (Vite SPA). CSV upload, prioritized table, category/urgency
  filters.
- **Backend**: Python 3.12 + FastAPI. CSV parsing, ticket classification (deterministic rules +
  bounded LLM fallback), prioritization logic.
- **AI layer**: single bounded LLM call per ticket for classification powered locally via Ollama
  (using `gemma-4 E2B` or similar lightweight local model). Strict schema validation
  (Pydantic) on all structured output. Rule-based fallback when the LLM is unavailable.
> **No database, no agent framework for V1.** Keep it simple enough that Jordan can upload a
> CSV and see the result.

### Status

Project scaffolding is complete. The agent operating manual (`CLAUDE.md`), reference documents,
and team roster are in place. No product code has been written yet — the first task is to
ingest the Kaggle dataset and classify a single ticket end-to-end.

---

*Built for the Pursuit AI Native Fellowship.*
