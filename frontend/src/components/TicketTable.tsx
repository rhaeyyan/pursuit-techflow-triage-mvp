import React, { useState } from 'react';
import { TriagedTicket } from '../types';
import { ChevronDown, ChevronUp, Copy, Check, Sparkles, Cpu, Shield, HelpCircle, ArrowUpDown } from 'lucide-react';

interface TicketTableProps {
  tickets: TriagedTicket[];
  onResetFilters?: () => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({ tickets, onResetFilters }) => {
  const [expandedTicketIds, setExpandedTicketIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'rank' | 'date' | 'id'>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const toggleExpand = (ticketId: string) => {
    setExpandedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr?: string | null) => {
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

  const renderUrgencyBadge = (urgency: string, score: number) => {
    const norm = urgency.toLowerCase();
    let badgeClass = 'badge-low';
    let label = `Low (${score || 1})`;

    if (norm === 'critical' || score === 4) {
      badgeClass = 'badge-critical';
      label = `Critical (${score || 4})`;
    } else if (norm === 'high' || score === 3) {
      badgeClass = 'badge-high';
      label = `High (${score || 3})`;
    } else if (norm === 'medium' || score === 2) {
      badgeClass = 'badge-medium';
      label = `Medium (${score || 2})`;
    }

    return (
      <span className={`badge ${badgeClass}`}>
        {norm === 'critical' && <span className="critical-pulse-dot" style={{ width: '6px', height: '6px' }} />}
        {label}
      </span>
    );
  };

  const renderConfidenceBadge = (source: string, isTopRow = false) => {
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

  const formatIssueType = (issueType: string) => {
    const map: Record<string, string> = {
      technical: 'Technical',
      billing: 'Billing',
      account: 'Account Security',
      feature_request: 'Feature Request',
      general: 'General',
    };
    return map[issueType.toLowerCase()] || issueType;
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortField === 'date') {
      const dA = new Date(a.created_at || 0).getTime();
      const dB = new Date(b.created_at || 0).getTime();
      return sortAsc ? dA - dB : dB - dA;
    }
    if (sortField === 'id') {
      return sortAsc ? a.ticket_id.localeCompare(b.ticket_id) : b.ticket_id.localeCompare(a.ticket_id);
    }
    const scoreDiff = b.urgency_score - a.urgency_score;
    return sortAsc ? scoreDiff : -scoreDiff;
  });

  const toggleSort = (field: 'rank' | 'date' | 'id') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (tickets.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <HelpCircle size={28} />
        </div>
        <div>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            No Matching Tickets
          </h3>
          <p className="subtext">
            No tickets match the current filters. Try adjusting your search or filters.
          </p>
        </div>
        {onResetFilters && (
          <button type="button" className="btn-secondary" onClick={onResetFilters}>
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-table-header)',
                borderBottom: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)',
                fontSize: '0.725rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <th
                style={{ padding: '14px 20px', width: '64px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('rank')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Rank <ArrowUpDown size={11} style={{ opacity: sortField === 'rank' ? 1 : 0.4 }} />
                </div>
              </th>
              <th
                style={{ padding: '14px 16px', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('id')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ticket ID <ArrowUpDown size={11} style={{ opacity: sortField === 'id' ? 1 : 0.4 }} />
                </div>
              </th>
              <th style={{ padding: '14px 16px' }}>Subject</th>
              <th style={{ padding: '14px 16px', width: '130px' }}>Category</th>
              <th style={{ padding: '14px 16px', width: '130px' }}>Urgency</th>
              <th style={{ padding: '14px 16px', width: '145px' }}>Source</th>
              <th
                style={{ padding: '14px 16px', width: '135px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('date')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Created <ArrowUpDown size={11} style={{ opacity: sortField === 'date' ? 1 : 0.4 }} />
                </div>
              </th>
              <th style={{ padding: '14px 20px', width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedTickets.map((ticket, index) => {
              const isExpanded = expandedTicketIds.has(ticket.ticket_id);
              const rankNumber = index + 1;

              return (
                <React.Fragment key={ticket.ticket_id}>
                  <tr
                    onClick={() => toggleExpand(ticket.ticket_id)}
                    style={{
                      borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)',
                      backgroundColor: isExpanded
                        ? 'var(--bg-table-row-expanded)'
                        : index % 2 === 0
                        ? 'transparent'
                        : 'var(--bg-table-row-alt)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Rank */}
                    <td
                      style={{
                        padding: '14px 20px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontSize: '0.825rem',
                      }}
                    >
                      #{rankNumber}
                    </td>

                    {/* Ticket ID */}
                    <td
                      style={{
                        padding: '14px 16px',
                        fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
                        fontWeight: 600,
                        fontSize: '0.825rem',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {ticket.ticket_id}
                    </td>

                    {/* Subject */}
                    <td
                      style={{
                        padding: '14px 16px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        maxWidth: '340px',
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={ticket.subject}
                      >
                        {ticket.subject}
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-category">{formatIssueType(ticket.issue_type)}</span>
                    </td>

                    {/* Urgency */}
                    <td style={{ padding: '14px 16px' }}>
                      {renderUrgencyBadge(ticket.urgency, ticket.urgency_score)}
                    </td>

                    {/* Source with Tooltip */}
                    <td style={{ padding: '14px 16px' }}>
                      {renderConfidenceBadge(ticket.confidence_source, index < 2)}
                    </td>

                    {/* Date */}
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {formatDate(ticket.created_at)}
                    </td>

                    {/* Expand */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <tr
                      style={{
                        backgroundColor: 'var(--bg-table-header)',
                        borderBottom: '1px solid var(--border-primary)',
                      }}
                    >
                      <td colSpan={8} style={{ padding: '20px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            backgroundColor: 'var(--bg-expanded-detail)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '18px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: '12px',
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                  marginBottom: '6px',
                                }}
                              >
                                {ticket.subject}
                              </h4>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '20px',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                  flexWrap: 'wrap',
                                }}
                              >
                                {ticket.customer_id && (
                                  <span>
                                    Customer:{' '}
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                      {ticket.customer_id}
                                    </strong>
                                  </span>
                                )}
                                {ticket.channel && (
                                  <span>
                                    Channel:{' '}
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                      {ticket.channel}
                                    </strong>
                                  </span>
                                )}
                                <span>
                                  Urgency Score:{' '}
                                  <strong style={{ color: 'var(--text-primary)' }}>
                                    {ticket.urgency_score} / 4
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              onClick={(e) => copyToClipboard(ticket.ticket_id, e)}
                            >
                              {copiedId === ticket.ticket_id ? (
                                <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
                              ) : (
                                <Copy size={13} />
                              )}
                              {copiedId === ticket.ticket_id ? 'Copied!' : 'Copy ID'}
                            </button>
                          </div>

                          <div
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '14px 16px',
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              lineHeight: 1.65,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color: 'var(--text-muted)',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                display: 'block',
                                marginBottom: '8px',
                              }}
                            >
                              Ticket Body
                            </span>
                            {ticket.body}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
