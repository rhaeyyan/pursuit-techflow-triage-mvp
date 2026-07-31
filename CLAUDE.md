# TechFlow Support Queue Tool — Agent Operating Manual

## Project Context
This assignment is to build a ticket management tool for Jordan M., a Support Specialist at TechFlow. The tool will help process 200-300 weekly support tickets by automatically reading, categorizing, and prioritizing them so the support team can move from manual triaging to direct resolution.
Data source for MVP: Kaggle open-source ticket dataset.

**References:**
- Source guidelines: [`documents/20260716_Role categories_1.md`](file:///home/rayan/Documents/Python-Projects/techflow-support-queue/documents/20260716_Role%20categories_1.md)
- Role context & email from Jordan M.: [`documents/20260716_Role categories_2.md`](file:///home/rayan/Documents/Python-Projects/techflow-support-queue/documents/20260716_Role%20categories_2.md)

## MVP Stack (Walking Skeleton)
- **Frontend:** React + TypeScript (Vite SPA). Jordan uploads a CSV, sees a prioritized/categorized table, filters by urgency or category.
- **Backend:** Python 3.12 + FastAPI. Handles CSV parsing, ticket classification (deterministic rule engine + fallback classifier), and deterministic prioritization.
- **Agentic Layers:** None. No MCP, no LangChain, no CrewAI, no database.

## Configuration & Quality Gates

### Python Linting (ruff)
- **`target-version`**: `py312` (Matches backend requirement).
- **Rule sets**: `E,W,F,I,B,UP,SIM,D` (Baseline + Google convention). `S` (bandit) is included to validate safe handling of mock user data/LLM routing. Strictness is relaxed for prototype.
- **`line-length`**: `88` (Standard Python/Black convention).

### Security-Isolation Gate
- **Assessment**: None — first-party code, no live creds/PII. 
- **Rationale**: The assignment processes open-source Kaggle data for a fictional company prototype. No real user PII or live production credentials are in scope at this stage.

### Test-Quality Gates
- **Gate**: TDD PostToolUse Hook (New source files flagged if no sibling test file).
- **Rationale**: Reinforces Rule 4's Behavioral/Integration test-first ordering mechanically for L1 MVPs.

## Build/Test/Run Commands
- **Install Backend**: `pip install -r requirements.txt`
- **Run Backend**: `uvicorn main:app --reload`
- **Test Backend**: `pytest`
- **Install Frontend**: `npm install` (from `frontend/`)
- **Run Frontend**: `npm run dev` (from `frontend/`)
- **Test Frontend**: `npm run test` (from `frontend/`)

## Verification Oracles
An **oracle** is the specific environment in which a failure is observable. It is named by string in every `[SPEC]`. For this project, an oracle is typically a `pytest` test (backend classification/prioritization logic), a `vitest` test (frontend component behavior), or a browser-visible result (upload flow, table rendering).
- Every bug fix leaves an assertion behind.
- Cypress FAILs any bug-fix task that leaves no assertion.

## The Orchestrator (the main session)
Subagents cannot invoke other subagents — every arrow in the pipeline is the main session relaying a handoff block between two agents that otherwise share no context. The main session therefore owns:
- **Persisting the SPEC, then relaying its *path*.** Write every approved `[SPEC]`/`[SPIKE]` to `specs/NNN-slug.md` **first**, then dispatch by citing that path. Relay short blocks (`[COMPLIANCE-REPORT]`, `[COMPLETION-REPORT]`) inline and verbatim.
- **Counting the rejection loop.** Subagents are stateless; the main session tracks retries before escalating to Banyan (Workflow Rule 9).
- **Retry via continuation, not respawn.** When Cypress fails a builder, continue that same agent.
- **Worktree isolation.** Spawning the builder agent with worktree isolation for that task.

## Team Roster (`.claude/agents/`)
Every workflow has one definitive owner. Tool restrictions are enforced by each agent's frontmatter.

**Default roster** (in the path for most tasks):
| Agent | Role / Title | May edit files? | Job |
|---|---|---|---|
| `cedar` | Tech Lead | No (read-only) | Turn goals into `[SPEC]`/`[SPIKE]` + `[FORCES]` (≤5 files); sole dependency/schema authority |
| `cypress` | SDET | Tests only | Produce the red in the declared oracle; audit for correctness, Bounded-AI, security |
| `redwood` | Software Engineer | Yes | Build the deterministic data layer + backend API |
| `magnolia`| UI/UX Engineer | Yes | Build the frontend (CSV upload, priority table, filters) |

**On-demand** (invoke only on their trigger):
| Agent | Role / Title | May edit files? | Trigger |
|---|---|---|---|
| `pine` | API Gateway / Intake | No (read-only) | The lane (INVARIANT/OBSERVABLE/UNKNOWN) is genuinely unclear |
| `birch` | Systems Analyst | No (read-only) | Codebase context is non-trivial; Cedar requests a `[CONTEXT-PACKET]` |
| `banyan` | Platform Engineer / Reviewer | Yes (refactors only) | Coupling/bloat smell, tree-wide refactor, or a stalled rejection loop |

## Workflow Rules
1. **Plan before building.** Non-trivial features start with a Cedar `[SPEC]`. Cedar rejects ambiguous goals and recommends `/grill-me`. The human approves the plan before code is written.
2. **Intake & routing by failure mode.** INVARIANT (silent failure) → Cedar `[SPEC]`; OBSERVABLE (visible on sight) → straight to Magnolia/Redwood; UNKNOWN (no oracle yet) → Cedar `[SPIKE]`.
3. **Red in the oracle before green.** Every `[SPEC]` declares a `Verification Oracle`; Cypress produces the failure *there* before a builder starts. Prefer behavioral/black-box assertions.
4. **Task granularity.** No task modifies more than 5 files. Cedar splits anything bigger and limits SPEC references to 3 items. High-risk ops run a dry-run rehearsal first.
5. **Walking skeleton first.** Thinnest end-to-end slice, then grow. No big-bang builds.
6. **Context diet.** Read only what the task needs. Birch retrieves via ripgrep + AST/LSP.
7. **Patterns are earned.** Apply a GoF pattern only when variance analysis shows real variation. Default force: `Simplicity > Pattern purity`.
8. **Dependency authority.** Only Cedar authorizes new PIP/NPM deps. Redwood/Magnolia halt and request a `[SPEC]` update — no shadow IT.
9. **Rejection loop (circuit breaker).** Cypress FAIL → developer retries. **Max 2 cycles**, then escalate to Banyan; only then to the human.
10. **Git protocol.** Conventional Commits (`feat:`, `fix:`). Parallel work in Git Worktrees. Never commit secrets/PII. Record verification in the commit with a `Verified-With:` trailer. **Never add a `Co-Authored-By` AI trailer.**

## Quality Standards
### Bounded AI (the core discipline)
- **Compute deterministically, summarize generatively.** Do not let an LLM do raw math or data ranking if code can do it. Use LLMs strictly for text classification/extraction.
- Enforce strict schema validation (Zod/Pydantic) on structured LLM output (e.g. ticket categorizations).

### Security (Zero-Trust)
- No secrets/API keys/PII in LLM context or commits. Env vars only; `.gitignore` covers `.env*`.
- Treat all LLM output as untrusted: sanitize/validate before rendering or executing.

## Handoff Schemas
Every inter-agent handoff uses one of these blocks, verbatim.

### [SPEC] / [SPIKE] — Cedar → Cypress → Redwood / Magnolia
```markdown
[SPEC] / [SPIKE]
- **Objective**: <what the code must achieve>
- **Inputs/Outputs**: <types, schemas, JSON shapes>
- **Design Pattern**: <GoF pattern + justification, or "none — simple case">
- **Bounded-AI boundary**: <what is computed deterministically vs. LLM-generated>
- **Verification Oracle**: <REQUIRED. Where the failure is observable, named precisely>
- **Intellectual Control**: <why this approach; why it won't break at scale>
- **Constraints**: <performance, forbidden libraries, style>
- **Edge Cases**: <error handling, null states>
- **Files**: <max 5 files this task may touch>
```

### [FORCES] — attached to every SPEC
```markdown
[FORCES]
1. <Primary force> > <Secondary force>
2. Simplicity > Pattern purity   (always present unless explicitly overridden)
```

### [COMPLIANCE-REPORT] — Cypress → Cedar / Redwood
```markdown
[COMPLIANCE-REPORT]
- **Status**: PASS | FAIL
- **Oracle run**: <the SPEC's declared oracle, the exact command, and its verdict>
- **Environment parity**: <did the oracle match the environment the issue was reported in? name gaps>
- **Critical violations**: <must fix before merge; empty if PASS>
- **Recommendations**: <non-blocking improvements>
- **Test results**: <every suite run + summary of output>
```

### [COMPLETION-REPORT] — Redwood / Magnolia → Cypress
```markdown
[COMPLETION-REPORT]
- **Files changed**: <list>
- **Spec items satisfied**: <checklist against the SPEC>
- **Oracle status**: <the declared oracle, the command run, and its verdict — green, or why not>
- **Complexity justification**: <prove Jevon's Paradox was avoided; defend any lines added against bloat>
- **Known gaps**: <anything deferred, or "none">
```

## Session Continuity
- **Start of session:** read `SESSION_STATE.md` if present.
- **Append-only, newest first, ~10 lines per session.** Three things: what shipped, what is blocked, the next step. Never re-summarize or restructure old entries.
- **Never its own commit.** Fold the ledger edit into the code commit it describes.
- **Durable facts belong in durable places.** A root cause worth remembering becomes an assertion in the oracle; a decision becomes a line in a `[SPEC]`. The ledger is for *in-flight* state only.
- **Record verification in the commit, not in prose.** Add a `Verified-With:` trailer naming the oracle that was run.
- Treat `SESSION_STATE.md` as episodic memory; the repo (`src/`, `tests/`, `.claude/agents/`, the data) is the source of truth. Where a doc and a test disagree, **the test wins.**
