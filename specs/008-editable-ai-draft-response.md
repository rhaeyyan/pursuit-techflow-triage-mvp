# SPEC 008: Editable AI Draft Response Textarea

```markdown
[SPEC]
- **Objective**: Refactor the AI-generated draft response container in `frontend/src/components/TicketDetailDrawer.tsx` into an interactive, editable `<textarea data-testid="ai-draft-textarea">` allowing support specialists to modify the draft before copying or sending.
- **Inputs/Outputs**:
  - State: `editedDraftText: string` (initialized/synced whenever `generatedResponse` updates).
  - Component: `<textarea data-testid="ai-draft-textarea" value={editedDraftText} onChange={(e) => setEditedDraftText(e.target.value)}>`
  - Copy & Send Actions: `handleCopyResponse` and `handleSendResponse` consume `editedDraftText`.
- **Design Pattern**: Controlled Form Control + Unidirectional Synchronized State.
- **Bounded-AI boundary**:
  - **Deterministic**: Textarea state binding, text change handling, clipboard API copy, notification toast dispatch.
  - **Generative**: Initial draft content produced by backend LLM.
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Synchronizing state via `useEffect` on `generatedResponse` guarantees draft edits reset cleanly when a new tone response is generated.
- **Constraints**:
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/008-editable-ai-draft-response.md`
  2. `frontend/src/components/TicketDetailDrawer.tsx`
  3. `frontend/src/__tests__/EditableAIDraft.test.tsx`
```

```markdown
[FORCES]
1. Specialist edit flexibility & control > Static draft presentation
2. Simplicity > Pattern purity
```
