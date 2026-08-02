# SPEC 007: AI Draft "Respond" Button & Record Update Notification

```markdown
[SPEC]
- **Objective**: Add a prominent "Respond" button (`data-testid="respond-btn"`) near the AI-generated draft response in `frontend/src/components/TicketDetailDrawer.tsx`. When clicked, it displays a "Message Sent" notification alert/toast (`data-testid="message-sent-toast"`) and updates the ticket record (`status: 'resolved'`, `updated_at`).
- **Inputs/Outputs**:
  - `TicketDetailDrawerProps`:
    - `ticket: TriagedTicket`
    - `onSaveTicket?: (updated: TriagedTicket) => void`
  - Action Button: `<button data-testid="respond-btn" onClick={handleSendResponse}>` ("Send Response" / "Respond").
  - Notification Toast / Alert: `<div data-testid="message-sent-toast">` displaying `"Message Sent"`.
  - Record Update: Triggers `onSaveTicket({ ...ticket, status: 'resolved', updated_at: new Date().toISOString() })`.
- **Design Pattern**: Action Event Handler + Optimistic UI Record Mutation & Toast Telemetry.
- **Bounded-AI boundary**:
  - **Deterministic**: Button click handler, notification state toggle, timestamp formatting, ticket status state update (`status: 'resolved'`).
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Isolated notification state prevents persistent drawer pollution while ensuring immediate visual feedback.
- **Constraints**:
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/007-ticket-respond-button.md`
  2. `frontend/src/components/TicketDetailDrawer.tsx`
  3. `frontend/src/__tests__/TicketRespondButton.test.tsx`
```

```markdown
[FORCES]
1. Immediate user feedback & operational closure > Complex network sync
2. Simplicity > Pattern purity
```
