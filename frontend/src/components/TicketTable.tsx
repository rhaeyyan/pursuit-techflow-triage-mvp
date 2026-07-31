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

  // Format created_at date safely
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

  // Helper for rendering urgency badges
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

  // Helper for rendering confidence source badges
  const renderConfidenceBadge = (source: string) => {
    const norm = source.toLowerCase();
    if (norm.includes('rule')) {
      return (
        <span className="badge badge-source-rule" title="Triaged using deterministic rule matching engine">
          <Shield size={12} />
          Rule Engine
        </span>
      );
    }
    if (norm.includes('llm') || norm.includes('gemma')) {
      return (
        <span className="badge badge-source-llm" title="Triaged using LLM classification model">
          <Sparkles size={12} />
          LLM Classifier
        </span>
      );
    }
    return (
      <span className="badge badge-source-fallback" title="Triaged using fallback heuristic engine">
        <Cpu size={12} />
        Fallback
      </span>
    );
  };

  // Format issue type
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

  // Sorting
  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortField === 'date') {
      const dA = new Date(a.created_at || 0).getTime();
      const dB = new Date(b.created_at || 0).getTime();
      return sortAsc ? dA - dB : dB - dA;
    }
    if (sortField === 'id') {
      return sortAsc ? a.ticket_id.localeCompare(b.ticket_id) : b.ticket_id.localeCompare(a.ticket_id);
    }
    // Default rank sorting: higher urgency score first
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
        className="glass-panel"
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
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <HelpCircle size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No Matching Tickets Found
          </h3>
          <p className="subtext">
            No support tickets match the current filter or search query. Try adjusting your filters.
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
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.9rem',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderBottom: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '16px 20px', width: '70px', cursor: 'pointer' }} onClick={() => toggleSort('rank')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Rank <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '16px 16px', width: '130px', cursor: 'pointer' }} onClick={() => toggleSort('id')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ticket ID <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '16px 16px' }}>Subject</th>
              <th style={{ padding: '16px 16px', width: '140px' }}>Category</th>
              <th style={{ padding: '16px 16px', width: '140px' }}>Urgency</th>
              <th style={{ padding: '16px 16px', width: '150px' }}>Source</th>
              <th style={{ padding: '16px 16px', width: '140px', cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Created <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '16px 20px', width: '60px', textAlign: 'center' }}></th>
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
                      borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: isExpanded
                        ? 'rgba(30, 41, 59, 0.5)'
                        : index % 2 === 0
                        ? 'transparent'
                        : 'rgba(255, 255, 255, 0.015)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      #{rankNumber}
                    </td>

                    {/* Ticket ID */}
                    <td style={{ padding: '16px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {ticket.ticket_id}
                    </td>

                    {/* Subject */}
                    <td style={{ padding: '16px 16px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '350px' }}>
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

                    {/* Issue Type */}
                    <td style={{ padding: '16px 16px' }}>
                      <span className="badge badge-category">{formatIssueType(ticket.issue_type)}</span>
                    </td>

                    {/* Urgency Badge */}
                    <td style={{ padding: '16px 16px' }}>
                      {renderUrgencyBadge(ticket.urgency, ticket.urgency_score)}
                    </td>

                    {/* Confidence Source */}
                    <td style={{ padding: '16px 16px' }}>
                      {renderConfidenceBadge(ticket.confidence_source)}
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '16px 16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {formatDate(ticket.created_at)}
                    </td>

                    {/* Expand Chevron */}
                    <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                  </tr>

                  {/* Expanded Ticket Detail Row */}
                  {isExpanded && (
                    <tr
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        borderBottom: '1px solid var(--border-glass)',
                      }}
                    >
                      <td colSpan={8} style={{ padding: '20px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            backgroundColor: 'rgba(30, 41, 59, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '20px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                                {ticket.subject}
                              </h4>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {ticket.customer_id && (
                                  <span>Customer ID: <strong style={{ color: 'var(--text-primary)' }}>{ticket.customer_id}</strong></span>
                                )}
                                {ticket.channel && (
                                  <span>Channel: <strong style={{ color: 'var(--text-primary)' }}>{ticket.channel}</strong></span>
                                )}
                                <span>Urgency Score: <strong style={{ color: 'var(--text-primary)' }}>{ticket.urgency_score} / 4</strong></span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                              onClick={(e) => copyToClipboard(ticket.ticket_id, e)}
                            >
                              {copiedId === ticket.ticket_id ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                              {copiedId === ticket.ticket_id ? 'Copied ID!' : 'Copy ID'}
                            </button>
                          </div>

                          <div
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              padding: '16px',
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                              Ticket Body Content:
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
