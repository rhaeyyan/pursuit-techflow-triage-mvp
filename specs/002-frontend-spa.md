# SPEC 002: Frontend SPA React + TypeScript App

```markdown
[SPEC]
- **Objective**: Implement a single-page React + TypeScript application built with Vite and Vanilla CSS in `frontend/` that provides an interactive, dark-mode glassmorphic interface for CSV ticket ingestion, real-time statistics, multi-criteria filtering/searching, color-coded urgency badges, and confidence source indicators.
- **Inputs/Outputs**:
  - **TypeScript Interfaces & Data Schemas**:
    - `TriagedTicket`:
      - `ticket_id: string`
      - `subject: string`
      - `body: string`
      - `customer_id?: string | null`
      - `channel?: string | null`
      - `created_at?: string | null`
      - `issue_type: "billing" | "technical" | "account" | "feature_request" | "general"`
      - `urgency: "critical" | "high" | "medium" | "low"`
      - `urgency_score: number` (critical=4, high=3, medium=2, low=1)
      - `confidence_source: "rule" | "llm" | "fallback"`
    - `TriageResponse`:
      - `total_tickets: number`
      - `tickets: TriagedTicket[]`
    - `FilterState`:
      - `urgencyFilter: "all" | "critical" | "high" | "medium" | "low"`
      - `categoryFilter: "all" | "billing" | "technical" | "account" | "feature_request" | "general"`
      - `searchQuery: string`
  - **Component Contracts**:
    - `UploadCard`: Accepts `onFileUpload: (file: File) => void`, `onLoadDemo: () => void`, `isUploading: boolean`. Triggers drag-and-drop or file picker ingestion, provides sample CSV download button, and demo loader.
    - `StatSummary`: Accepts `tickets: TriagedTicket[]`. Renders cards for Total Tickets, Critical Count, High Count, Medium Count, and Low Count with badge counts and visual icons.
    - `FilterBar`: Accepts `filters: FilterState`, `onFilterChange: (updated: FilterState) => void`. Renders urgency pills/dropdown, category filter dropdown, and live text search input (matching subject, body, customer_id).
    - `TicketTable`: Accepts `tickets: TriagedTicket[]`. Displays prioritized ticket rows with color-coded urgency badges (Critical=red, High=orange, Medium=blue, Low=gray) and confidence source indicators (`rule`, `ollama`/`llm`, `fallback`).
- **Design Pattern**: State Lifting & Modular Controlled Component Architecture. UI state (uploaded tickets, active filters, upload status) resides in root `App.tsx` and flows down to presentation components.
- **Bounded-AI boundary**:
  - **Deterministic Logic**:
    - Client-side filtering by urgency, category, and multi-field text search query (`subject`, `body`, `customer_id`).
    - Stat card count aggregations (Total, Critical, High, Medium, Low).
    - Sample CSV downloading and mock demo dataset loading.
    - Deterministic styling maps for urgency badges (`critical` -> red, `high` -> orange, `medium` -> blue, `low` -> gray) and confidence sources (`rule` -> green/emerald, `ollama`/`llm` -> purple, `fallback` -> yellow/amber).
  - **Bounded LLM Logic**: None inside frontend layer. Frontend interacts with backend POST endpoint (`/api/tickets/triage`) which handles LLM Gemma-4 classification and fallback logic.
- **Verification Oracle**: `npm run build` from `frontend/` directory (Vite TypeScript build verification executing `tsc && vite build`).
- **Intellectual Control**: Strict TypeScript types prevent runtime prop mismatches. Independent presentation components ensure maintainability and modular testing.
- **Constraints**:
  - Vite + React 18 + TypeScript + Vanilla CSS in `frontend/`.
  - Dark mode glassmorphic UI design system (CSS variables, backdrop-filter blur, subtle glowing borders, sleek typography, smooth hover/transition micro-animations).
  - Target files <= 5 files/directories (`frontend/package.json`, `frontend/index.html`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/components/`).
- **Edge Cases**:
  - Upload network error or server failure -> render glassmorphic error message alert with retry button.
  - Zero search/filter results -> show stylized empty state with "Reset Filters" action.
  - Large CSV datasets -> virtualized or responsive scrollable table container.
  - Missing optional ticket metadata (`customer_id`, `created_at`) -> elegant placeholder/dash fallback display.
- **Target Files**:
  1. `frontend/package.json`
  2. `frontend/index.html`
  3. `frontend/src/App.tsx`
  4. `frontend/src/index.css`
  5. `frontend/src/components/` (UploadCard, TicketTable, StatSummary, FilterBar)
```

```markdown
[FORCES]
1. User experience & visual polish > Additional dependency weight
2. Simplicity > Pattern purity
```
