# SPEC 009: Tone-Aware AI Draft Regeneration

```markdown
[SPEC]
- **Objective**: Fix the AI draft response regeneration mechanism so that selecting a tone (*formal*, *empathic*, *concise*, *technical*) or clicking the "Regenerate" button automatically passes the selected tone parameter through to `onGenerateResponse(ticketId, tone)` in `frontend/src/components/TicketDetailDrawer.tsx` and `frontend/src/components/TicketTable.tsx`, generating tone-customized draft replies via both backend API and client fallback generator (`buildFallbackResponseTemplate`).
- **Inputs/Outputs**:
  - `onGenerateResponse`: `(ticketId: string, tone?: string) => Promise<void>`.
  - Dropdown `onChange`: Updates `selectedTone` AND triggers `onGenerateResponse(ticket.ticket_id, newTone)` if a draft is already displayed.
  - `buildFallbackResponseTemplate(subject, issueType, urgency, tone)`: Adjusts tone prefix, empathy statements, or technical formatting according to the `tone` argument.
- **Design Pattern**: Parameterized Event Callback + Tone-Aware Fallback Engine.
- **Bounded-AI boundary**:
  - **Deterministic**: Tone selection state, parameter forwarding, template tone variation rules (*Formal*, *Empathic*, *Concise*, *Technical*).
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Forwarding `tone` through `onGenerateResponse` ensures consistency between backend API requests and frontend offline fallback generation.
- **Constraints**:
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/009-tone-aware-ai-draft-regeneration.md`
  2. `frontend/src/components/TicketDetailDrawer.tsx`
  3. `frontend/src/components/TicketTable.tsx`
  4. `frontend/src/lib/fallbackResponseTemplate.ts`
  5. `frontend/src/__tests__/ToneRegeneration.test.tsx`
```

```markdown
[FORCES]
1. Immediate tone-specific feedback > Static fallback text
2. Simplicity > Pattern purity
```
