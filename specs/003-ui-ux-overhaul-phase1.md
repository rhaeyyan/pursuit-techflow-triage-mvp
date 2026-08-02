# SPEC 003: UI/UX Overhaul Phase 1 — Design System Tokens & Bento Grid Header

```markdown
[SPEC]
- **Objective**: Upgrade the CSS design system tokens in `frontend/src/index.css` to enterprise-grade WCAG 2.2 AA standards (slate/zinc dark mode, obsidian/ivory light mode, tabular-nums font variants) and refactor `frontend/src/components/StatSummary.tsx` into a 4-card responsive Bento Grid Header displaying real-time SLA Telemetry, Urgency Distribution Ratios, AI Triage Source Breakdown, and Queue Velocity.
- **Inputs/Outputs**:
  - `StatSummaryProps`:
    - `tickets: TriagedTicket[]`
    - `onFilterSelect?: (urgency: string) => void`
  - **Bento Grid Cards**:
    - Card 1 (SLA Telemetry): Displays total tickets, active critical breaches (<2h), and status gauge indicator.
    - Card 2 (Urgency Ratio): Interactive progress bars showing % of Critical, High, Medium, and Low tickets. Clicking a bar filters queue.
    - Card 3 (AI Triage Breakdown): Percentage split meter for Rule Engine vs Cloud LLM vs Fallback Classifier.
    - Card 4 (Queue Velocity): Active ticket throughput indicator, average urgency score, and overall triage state badge.
- **Design Pattern**: Bento Grid Layout + Semantic CSS Custom Properties (Tokens).
- **Bounded-AI boundary**:
  - **Deterministic**: SLA countdown calculations, urgency counts/percentages, confidence source counts (`rule`, `llm`, `fallback`), tabular data layout.
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Isolated CSS token variables prevent style leaking. Pure prop-driven metrics calculation guarantees deterministic layout rendering.
- **Constraints**:
  - CSS custom properties must pass WCAG 2.2 AA (4.5:1 contrast).
  - Responsive Bento Grid layout (1 col on mobile, 2 col on tablet, 4 col on desktop).
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/003-ui-ux-overhaul-phase1.md`
  2. `frontend/src/index.css`
  3. `frontend/src/components/StatSummary.tsx`
  4. `frontend/src/App.tsx`
```

```markdown
[FORCES]
1. User experience & visual polish > Additional dependency weight
2. Simplicity > Pattern purity
```
