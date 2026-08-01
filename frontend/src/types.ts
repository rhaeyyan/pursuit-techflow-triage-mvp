export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type IssueType = 'billing' | 'technical' | 'account' | 'feature_request' | 'general';

export type ConfidenceSource = 'rule' | 'llm' | 'fallback';

export interface TriagedTicket {
  ticket_id: string;
  subject: string;
  body: string;
  customer_id?: string | null;
  channel?: string | null;
  created_at?: string | null;
  issue_type: IssueType | string;
  urgency: UrgencyLevel;
  urgency_score: number; // 4: critical, 3: high, 2: medium, 1: low
  score?: number; // 0 to 100 numerical urgency score
  reasons?: string[]; // Explainable triage reasons/signals
  status?: 'new' | 'in-progress' | 'escalated' | 'resolved';
  assignee?: string | null;
  confidence_source: ConfidenceSource | string;
}

export interface TriageResponse {
  total_tickets: number;
  tickets: TriagedTicket[];
  urgency_counts?: Record<string, number>;
}

export interface FilterState {
  urgencyFilter: 'all' | UrgencyLevel;
  categoryFilter: 'all' | IssueType | string;
  searchQuery: string;
}

export interface GenerateResponseOutput {
  ticket_id: string;
  suggested_response: string;
  source: string;
}

