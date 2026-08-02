# SPEC 005: UI/UX Overhaul Phase 3 — Multi-Tab Detail Drawer & AI Response Tone Controls

```markdown
[SPEC]
- **Objective**: Upgrade `frontend/src/components/TicketDetailDrawer.tsx` to a multi-tab enterprise flyout drawer with tabbed sections (`Overview & AI Draft`, `Customer Metadata`, `Lifecycle Audit Trail`) and an interactive AI Response Tone selector (*Formal*, *Empathic*, *Concise*, *Technical*) that customizes AI draft responses.
- **Inputs/Outputs**:
  - `TicketDetailDrawerProps`:
    - `ticket: TriagedTicket | null`
    - `onClose: () => void`
    - `onSaveTicket?: (updated: TriagedTicket) => void`
  - Drawer Navigation Tabs (`data-testid="drawer-tab-overview"`, `data-testid="drawer-tab-customer"`, `data-testid="drawer-tab-audit"`).
  - Tone Selector Dropdown (`data-testid="ai-tone-select"`).
  - Customer Metadata panel (`data-testid="customer-tier-badge"`, `data-testid="customer-past-volume"`).
  - Audit Trail Timeline (`data-testid="audit-timeline"`).
- **Design Pattern**: Tabbed Panel Layout + Dynamic Prompt Modifier.
- **Bounded-AI boundary**:
  - **Deterministic**: Tab navigation state, tone template fallback logic, customer tier heuristic mapping based on customer ID, formatted audit timestamps.
  - **Generative**: Backend LLM draft generation response modified by selected tone parameter.
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Isolated drawer tab state prevents re-renders of underlying queue table.
- **Constraints**:
  - Escape key closes drawer seamlessly.
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/005-ui-ux-overhaul-phase3.md`
  2. `frontend/src/components/TicketDetailDrawer.tsx`
  3. `frontend/src/__tests__/TicketDetailDrawerTone.test.tsx`
```

```markdown
[FORCES]
1. Responsive detail drawer UX > Flat static dialogs
2. Simplicity > Pattern purity
```
