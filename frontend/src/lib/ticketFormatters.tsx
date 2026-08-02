import { Shield, Sparkles, Cpu } from 'lucide-react';
import { TriagedTicket, TicketStatus } from '../types';

/** Numeric 0-100 priority score badge, color-tiered by threshold. */
export const renderScoreBadge = (score?: number) => {
  const s = score !== undefined ? score : 50;
  let badgeClass = 'score-low';
  if (s >= 80) badgeClass = 'score-critical';
  else if (s >= 60) badgeClass = 'score-high';
  else if (s >= 40) badgeClass = 'score-medium';

  return (
    <span className={`score-badge ${badgeClass}`} title={`Multi-factor priority score: ${s}/100`}>
      {s}
    </span>
  );
};

/**
 * Editable status pill. Takes the effective status and a change callback
 * explicitly rather than closing over component state, so it stays a pure
 * presentational function.
 */
export const renderStatusBadge = (
  ticket: TriagedTicket,
  effectiveStatus: TicketStatus,
  onStatusChange: (ticketId: string, status: TicketStatus) => void
) => {
  const tId = ticket.ticket_id;
  const st = effectiveStatus;
  let pillClass = 'status-new';
  if (st === 'in-progress') pillClass = 'status-in-progress';
  else if (st === 'escalated') pillClass = 'status-escalated';
  else if (st === 'resolved') pillClass = 'status-resolved';

  return (
    <select
      className={`status-pill ${pillClass}`}
      value={st}
      aria-label={`Update status for ticket ${tId}`}
      onChange={(e) => {
        e.stopPropagation();
        onStatusChange(tId, e.target.value as TicketStatus);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: 'pointer' }}
    >
      <option value="new">New</option>
      <option value="in-progress">In Progress</option>
      <option value="escalated">Escalated</option>
      <option value="resolved">Resolved</option>
    </select>
  );
};

export const renderUrgencyBadge = (urgency: string, score: number) => {
  const norm = urgency.toLowerCase();
  let badgeClass = 'badge-low';
  let label = `Low`;

  if (norm === 'critical' || score === 4) {
    badgeClass = 'badge-critical';
    label = `Critical`;
  } else if (norm === 'high' || score === 3) {
    badgeClass = 'badge-high';
    label = `High`;
  } else if (norm === 'medium' || score === 2) {
    badgeClass = 'badge-medium';
    label = `Medium`;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {norm === 'critical' && <span className="critical-pulse-dot" style={{ width: '6px', height: '6px' }} />}
      {label}
    </span>
  );
};

export const renderConfidenceBadge = (source: string, isTopRow = false) => {
  const norm = source.toLowerCase();
  const wrapperClass = `tooltip-wrapper ${isTopRow ? 'tooltip-bottom' : ''}`;
  if (norm.includes('rule')) {
    return (
      <span className={wrapperClass}>
        <span className="badge badge-source-rule">
          <Shield size={11} />
          Rule Engine
        </span>
        <span className="tooltip-content">
          <strong>Deterministic Rule Engine</strong><br />
          Classified using keyword and pattern matching against known critical signals (e.g. "billing error," "can't access," "data loss"). Fast, predictable, and traceable — no AI model involved.
        </span>
      </span>
    );
  }
  if (norm.includes('llm') || norm.includes('gemma')) {
    return (
      <span className={wrapperClass}>
        <span className="badge badge-source-llm">
          <Sparkles size={11} />
          LLM Classifier
        </span>
        <span className="tooltip-content">
          <strong>LLM Classifier</strong><br />
          Classified using a cloud large language model (Groq / Gemini) for edge-case tickets that didn't match deterministic rules. Provides nuanced categorization for ambiguous ticket content.
        </span>
      </span>
    );
  }
  return (
    <span className={wrapperClass}>
      <span className="badge badge-source-fallback">
        <Cpu size={11} />
        Fallback
      </span>
      <span className="tooltip-content">
        <strong>Fallback Classifier</strong><br />
        Applied when neither the rule engine nor the LLM could confidently classify this ticket. Defaults to a safe baseline triage (general / medium) to ensure no ticket is left unprocessed.
      </span>
    </span>
  );
};

export const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatIssueType = (issueType: string) => {
  const map: Record<string, string> = {
    technical: 'Technical',
    billing: 'Billing',
    account: 'Account Security',
    feature_request: 'Feature Request',
    general: 'General',
  };
  return map[issueType.toLowerCase()] || issueType;
};

export const formatSubCategory = (subCat?: string) => {
  if (!subCat || subCat === 'general') return null;
  const map: Record<string, string> = {
    database_outage: 'Database',
    server_crash: 'Server Crash',
    network: 'Network',
    software_bug: 'Software Bug',
    payment_gateway: 'Payment Gateway',
    invoice_refund: 'Invoice Refund',
    auth_security: 'Security & Auth',
    user_maintenance: 'User Maintenance',
    product_roadmap: 'Product Roadmap',
  };
  return map[subCat.toLowerCase()] || subCat.replace('_', ' ');
};

export type SortField = 'score' | 'rank' | 'date' | 'id';

/** Pure sort comparator extracted from TicketTable's render pass. */
export const sortTicketsForDisplay = (
  tickets: TriagedTicket[],
  sortField: SortField,
  sortAsc: boolean
): TriagedTicket[] => {
  return [...tickets].sort((a, b) => {
    if (sortField === 'date') {
      const dA = new Date(a.created_at || 0).getTime();
      const dB = new Date(b.created_at || 0).getTime();
      return sortAsc ? dA - dB : dB - dA;
    }
    if (sortField === 'id') {
      return sortAsc ? a.ticket_id.localeCompare(b.ticket_id) : b.ticket_id.localeCompare(a.ticket_id);
    }
    if (sortField === 'score') {
      const sA = a.score !== undefined ? a.score : a.urgency_score * 25;
      const sB = b.score !== undefined ? b.score : b.urgency_score * 25;
      return sortAsc ? sB - sA : sA - sB;
    }
    const scoreDiff = b.urgency_score - a.urgency_score;
    return sortAsc ? scoreDiff : -scoreDiff;
  });
};
