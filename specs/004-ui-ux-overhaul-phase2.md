# SPEC 004: UI/UX Overhaul Phase 2 — Enterprise Bulk Actions & SLA Telemetry

```markdown
[SPEC]
- **Objective**: Upgrade `frontend/src/components/TicketTable.tsx` with multi-select bulk row operations (floating bulk action bar for bulk status/urgency updates, bulk assignment, and selective CSV/JSON export) and add SLA breach countdown badges (`<30m` critical pulse, `30m-2h` warning, `>2h` standard).
- **Inputs/Outputs**:
  - Multi-select row state (`selectedIds: Set<string>`).
  - Floating Bulk Action Bar displaying:
    - Selected item counter (`data-testid="bulk-selected-count"`).
    - `[ Select All / Clear ]` toggle button.
    - `[ Bulk Update Urgency ]` dropdown menu.
    - `[ Export Selected ]` action button (`data-testid="bulk-export-btn"`).
  - SLA Countdown Badge per row (`data-testid="sla-badge-{ticket_id}"`).
- **Design Pattern**: Controlled Multi-Select State + Animated Floating Overlay.
- **Bounded-AI boundary**:
  - **Deterministic**: Multi-select ID tracking, bulk array operations, SLA countdown timestamp arithmetic, JSON/CSV formatting.
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Pure local selection state avoids array mutations. Standardized ISO timestamp arithmetic guarantees SLA countdown precision.
- **Constraints**:
  - Floating bulk bar must use fixed/sticky positioning with accessible focus management.
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/004-ui-ux-overhaul-phase2.md`
  2. `frontend/src/components/TicketTable.tsx`
  3. `frontend/src/__tests__/TicketTableBulk.test.tsx`
```

```markdown
[FORCES]
1. Multi-select UX performance > Complex state abstractions
2. Simplicity > Pattern purity
```
