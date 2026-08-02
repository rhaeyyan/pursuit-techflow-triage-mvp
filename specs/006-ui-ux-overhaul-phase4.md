# SPEC 006: UI/UX Overhaul Phase 4 — Command Palette & Power-User Navigation

```markdown
[SPEC]
- **Objective**: Add a global `Cmd+K` / `Ctrl+K` Command Palette overlay in `frontend/src/App.tsx` providing fast keyboard-driven navigation, instant filter triggers, theme toggling, and demo dataset loading.
- **Inputs/Outputs**:
  - Global `KeyDown` listener intercepting `Cmd+K` and `Ctrl+K`.
  - Command Palette Overlay (`data-testid="command-palette-modal"`).
  - Palette Search Input (`data-testid="command-palette-input"`).
  - Quick Actions List (`data-testid="command-palette-actions"`):
    - `[ Filter Critical Tickets ]`
    - `[ Reset All Queue Filters ]`
    - `[ Toggle Dark / Light Theme ]`
    - `[ Load 250 Demo Tickets ]`
- **Design Pattern**: Command Menu Pattern + Global Hotkey Portal.
- **Bounded-AI boundary**:
  - **Deterministic**: Action dispatching, keyboard shortcut event listeners, query string filtering.
- **Verification Oracle**: `npm run test` or `npm run build` in `frontend/`.
- **Intellectual Control**: Isolated command modal state avoids interfering with main queue filtering state.
- **Constraints**:
  - Escape key closes palette.
  - Max 5 files touched in this task.
- **Target Files**:
  1. `specs/006-ui-ux-overhaul-phase4.md`
  2. `frontend/src/App.tsx`
  3. `frontend/src/__tests__/CommandPalette.test.tsx`
```

```markdown
[FORCES]
1. Power-user productivity > Minimal UI surface
2. Simplicity > Pattern purity
```
