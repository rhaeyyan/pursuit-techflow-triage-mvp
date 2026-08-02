import React, { useState } from 'react';
import { TriagedTicket, DensityMode, UrgencyLevel } from '../types';
import { ChevronDown, ChevronUp, Copy, Check, Sparkles, HelpCircle, ArrowUpDown, RefreshCw, Bot, Save, X, Clock, Rows, AlignJustify, PanelRight, Download } from 'lucide-react';
import { useTicketEdits } from '../hooks/useTicketEdits';
import { generateTicketResponse } from '../lib/ticketsApi';
import { buildFallbackResponseTemplate } from '../lib/fallbackResponseTemplate';
import { TicketDetailDrawer } from './TicketDetailDrawer';
import {
  renderScoreBadge,
  renderStatusBadge,
  renderUrgencyBadge,
  renderConfidenceBadge,
  formatDate,
  formatIssueType,
  formatSubCategory,
  sortTicketsForDisplay,
  SortField,
} from '../lib/ticketFormatters';

interface TicketTableProps {
  tickets: TriagedTicket[];
  density?: DensityMode;
  onToggleDensity?: () => void;
  onResetFilters?: () => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({ tickets, density = 'standard', onToggleDensity, onResetFilters }) => {
  const [expandedTicketIds, setExpandedTicketIds] = useState<Set<string>>(new Set());
  const [drawerTicket, setDrawerTicket] = useState<TriagedTicket | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [urgencyOverrides, setUrgencyOverrides] = useState<Record<string, { urgency: UrgencyLevel; urgency_score: number }>>({});

  // Persistence & Edit state (pending vs. saved vs. server) lives in this hook.
  const {
    getEffectiveStatus,
    getEffectiveAssignee,
    getEffectiveUpdatedAt,
    hasUnsavedChanges,
    setPendingStatus,
    setPendingAssignee,
    handleSaveTicket,
    handleDiscardChanges,
    savingIds,
    saveSuccessIds,
  } = useTicketEdits();

  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [generatedResponses, setGeneratedResponses] = useState<Record<string, { text: string; source: string }>>({});
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [copiedResponseId, setCopiedResponseId] = useState<string | null>(null);

  const getEffectiveUrgency = (ticket: TriagedTicket): UrgencyLevel => {
    return urgencyOverrides[ticket.ticket_id]?.urgency || (ticket.urgency as UrgencyLevel);
  };

  const getEffectiveUrgencyScore = (ticket: TriagedTicket): number => {
    return urgencyOverrides[ticket.ticket_id]?.urgency_score ?? (ticket.urgency_score !== undefined ? ticket.urgency_score : 1);
  };

  const toggleSelect = (ticketId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedTickets.length && sortedTickets.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTickets.map((t) => t.ticket_id)));
    }
  };

  const handleBulkUrgencyUpdate = (newUrgency: UrgencyLevel) => {
    const scoreMap: Record<UrgencyLevel, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    const newScore = scoreMap[newUrgency];
    setUrgencyOverrides((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = { urgency: newUrgency, urgency_score: newScore };
      });
      return next;
    });
  };

  const handleBulkExport = () => {
    const selectedTickets = tickets.filter((t) => selectedIds.has(t.ticket_id));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedTickets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `selected_tickets_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderSlaBadge = (ticket: TriagedTicket) => {
    if (!ticket.created_at) return null;
    const createdMs = new Date(ticket.created_at).getTime();
    const diffMinutes = (Date.now() - createdMs) / (1000 * 60);

    if (diffMinutes < 30) {
      return (
        <span
          data-testid={`sla-badge-${ticket.ticket_id}`}
          className="badge animate-pulse"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 6px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={10} /> &lt;30m SLA
        </span>
      );
    } else if (diffMinutes <= 120) {
      return (
        <span
          data-testid={`sla-badge-${ticket.ticket_id}`}
          className="badge"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 6px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={10} /> 30m-2h SLA
        </span>
      );
    } else {
      return (
        <span
          data-testid={`sla-badge-${ticket.ticket_id}`}
          className="badge"
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 6px',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={10} /> &gt;2h SLA
        </span>
      );
    }
  };

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

  const handleGenerateResponse = async (ticket: TriagedTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    const tId = ticket.ticket_id;
    setGeneratingIds((prev) => new Set(prev).add(tId));

    try {
      const result = await generateTicketResponse({
        ticket_id: ticket.ticket_id,
        subject: ticket.subject,
        body: ticket.body,
        issue_type: ticket.issue_type,
        urgency: ticket.urgency,
      });
      setGeneratedResponses((prev) => ({ ...prev, [tId]: result }));
    } catch {
      // Fallback smart response template generator if API endpoint is offline
      const templateText = buildFallbackResponseTemplate(ticket.subject, ticket.issue_type, ticket.urgency);
      setGeneratedResponses((prev) => ({
        ...prev,
        [tId]: { text: templateText, source: 'template' },
      }));
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(tId);
        return next;
      });
    }
  };

  const sortedTickets = sortTicketsForDisplay(tickets, sortField, sortAsc);

  const toggleSort = (field: SortField) => {
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

  const cellPadding = density === 'compact' ? '8px 10px' : '14px 16px';
  const tableFontSize = density === 'compact' ? '0.8125rem' : '0.875rem';

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      {/* Table Bar Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          backgroundColor: 'var(--bg-table-header)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            Prioritized Queue ({sortedTickets.length})
          </span>
        </div>
        {onToggleDensity && (
          <button
            type="button"
            className="btn-secondary"
            data-testid="density-toggle-btn"
            onClick={onToggleDensity}
            aria-label={`Switch table density to ${density === 'standard' ? 'compact' : 'standard'} mode`}
            title={`Switch to ${density === 'standard' ? 'compact' : 'standard'} density`}
            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '6px' }}
          >
            {density === 'compact' ? <AlignJustify size={14} /> : <Rows size={14} />}
            {density === 'compact' ? 'Compact Mode' : 'Standard Mode'}
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: tableFontSize,
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
              <th style={{ padding: cellPadding, width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  data-testid="select-all-checkbox"
                  checked={selectedIds.size === sortedTickets.length && sortedTickets.length > 0}
                  onChange={toggleSelectAll}
                  aria-label="Select all tickets"
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th
                style={{ padding: cellPadding, width: '56px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('rank')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Rank <ArrowUpDown size={11} style={{ opacity: sortField === 'rank' ? 1 : 0.4 }} />
                </div>
              </th>
              <th
                style={{ padding: cellPadding, width: '70px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('score')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Score <ArrowUpDown size={11} style={{ opacity: sortField === 'score' ? 1 : 0.4 }} />
                </div>
              </th>
              <th
                style={{ padding: cellPadding, width: '110px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('id')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ticket ID <ArrowUpDown size={11} style={{ opacity: sortField === 'id' ? 1 : 0.4 }} />
                </div>
              </th>
              <th style={{ padding: cellPadding }}>Subject & Triage Signals</th>
              <th style={{ padding: cellPadding, width: '120px' }}>Category</th>
              <th style={{ padding: cellPadding, width: '100px' }}>Status</th>
              <th style={{ padding: cellPadding, width: '125px' }}>Source</th>
              <th
                style={{ padding: cellPadding, width: '125px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('date')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Created <ArrowUpDown size={11} style={{ opacity: sortField === 'date' ? 1 : 0.4 }} />
                </div>
              </th>
              <th style={{ padding: cellPadding, width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedTickets.map((ticket, index) => {
              const isExpanded = expandedTicketIds.has(ticket.ticket_id);
              const rankNumber = index + 1;
              const reasonsList = ticket.reasons || [];
              const assignedUser = getEffectiveAssignee(ticket);

              return (
                <React.Fragment key={ticket.ticket_id}>
                  <tr
                    role="button"
                    data-testid={`ticket-row-${ticket.ticket_id}`}
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`Ticket ${ticket.ticket_id}: ${ticket.subject}`}
                    onClick={() => toggleExpand(ticket.ticket_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        // Prevent toggling if user presses space/enter while focused on an inline select or input
                        const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
                        if (targetTag !== 'select' && targetTag !== 'input' && targetTag !== 'button') {
                          e.preventDefault();
                          toggleExpand(ticket.ticket_id);
                        }
                      }
                    }}
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
                    {/* Multi-select checkbox */}
                    <td
                      style={{ padding: cellPadding, width: '40px', textAlign: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        data-testid={`select-ticket-${ticket.ticket_id}`}
                        checked={selectedIds.has(ticket.ticket_id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(ticket.ticket_id);
                        }}
                        aria-label={`Select ticket ${ticket.ticket_id}`}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    {/* Rank */}
                    <td
                      style={{
                        padding: cellPadding,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontSize: '0.825rem',
                      }}
                    >
                      #{rankNumber}
                    </td>

                    {/* Numerical Score */}
                    <td style={{ padding: cellPadding }}>
                      {renderScoreBadge(ticket.score)}
                    </td>

                    {/* Ticket ID */}
                    <td
                      style={{
                        padding: cellPadding,
                        fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
                        fontWeight: 600,
                        fontSize: '0.825rem',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {ticket.ticket_id}
                    </td>

                    {/* Subject & Reason Tags */}
                    <td
                      style={{
                        padding: cellPadding,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        maxWidth: '360px',
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 600,
                        }}
                        title={ticket.subject}
                      >
                        {ticket.subject}
                      </div>

                      {/* Triage Signals / Reasons Badges */}
                      {reasonsList.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {reasonsList.slice(0, 2).map((reason, rIdx) => {
                            const isUrgentReason = reason.toLowerCase().includes('churn') || reason.toLowerCase().includes('legal') || reason.toLowerCase().includes('outage') || reason.toLowerCase().includes('live');
                            return (
                              <span key={rIdx} className={`reason-tag ${isUrgentReason ? 'reason-tag-urgent' : ''}`}>
                                {reason}
                              </span>
                            );
                          })}
                          {reasonsList.length > 2 && (
                            <span className="reason-tag">+{reasonsList.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Category & Sub-Category */}
                    <td style={{ padding: cellPadding }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="badge badge-category">{formatIssueType(ticket.issue_type)}</span>
                        {formatSubCategory(ticket.sub_category) && (
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600, paddingLeft: '2px' }}>
                            ↳ {formatSubCategory(ticket.sub_category)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: cellPadding }}>
                      {renderStatusBadge(ticket, getEffectiveStatus(ticket), setPendingStatus)}
                    </td>

                    {/* Source with Tooltip */}
                    <td style={{ padding: cellPadding }}>
                      {renderConfidenceBadge(ticket.confidence_source, index < 2)}
                    </td>

                    {/* Date & Last Updated & SLA Badge */}
                    <td
                      style={{
                        padding: cellPadding,
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>{formatDate(ticket.created_at)}</div>
                        {renderSlaBadge(ticket)}
                        {getEffectiveUpdatedAt(ticket) && (
                          <div
                            style={{
                              fontSize: '0.675rem',
                              color: 'var(--accent-primary)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              marginTop: '2px',
                            }}
                            title={`Last modified: ${formatDate(getEffectiveUpdatedAt(ticket))}`}
                          >
                            <Clock size={10} /> {formatDate(getEffectiveUpdatedAt(ticket))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Expand & Drawer Action Controls */}
                    <td
                      style={{
                        padding: cellPadding,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerTicket(ticket);
                          }}
                          aria-label={`Open ticket ${ticket.ticket_id} in side drawer`}
                          title="Open in side drawer"
                          style={{ padding: '3px 5px', borderRadius: 'var(--radius-sm)' }}
                        >
                          <PanelRight size={14} />
                        </button>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
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
                      <td colSpan={9} style={{ padding: '20px 24px' }}>
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
                                  gap: '16px',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
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
                                  Score:{' '}
                                  <strong style={{ color: 'var(--text-primary)' }}>
                                    {ticket.score !== undefined ? ticket.score : getEffectiveUrgencyScore(ticket) * 25} / 100
                                  </strong>
                                </span>

                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  Tier: {renderUrgencyBadge(getEffectiveUrgency(ticket), getEffectiveUrgencyScore(ticket))}
                                </span>

                                <span>
                                  Assignee:{' '}
                                  <select
                                    className="btn-secondary"
                                    style={{ padding: '2px 6px', fontSize: '0.75rem', marginLeft: '4px' }}
                                    value={assignedUser || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setPendingAssignee(ticket.ticket_id, e.target.value || null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="">Unassigned</option>
                                    <option value="Jordan">Jordan M.</option>
                                    <option value="Sofia">Sofia R.</option>
                                    <option value="Miguel">Miguel T.</option>
                                    <option value="Aisha">Aisha B.</option>
                                  </select>
                                </span>

                                {getEffectiveUpdatedAt(ticket) && (
                                  <span>
                                    Updated:{' '}
                                    <strong style={{ color: 'var(--accent-primary)' }}>
                                      {formatDate(getEffectiveUpdatedAt(ticket))}
                                    </strong>
                                  </span>
                                )}
                              </div>

                              {/* Full Triage Reasons Breakdown */}
                              {reasonsList.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                    Triage Signals & Risk Factors:
                                  </span>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {reasonsList.map((reason, rIdx) => {
                                      const isUrgentReason = reason.toLowerCase().includes('churn') || reason.toLowerCase().includes('legal') || reason.toLowerCase().includes('outage') || reason.toLowerCase().includes('live');
                                      return (
                                        <span key={rIdx} className={`reason-tag ${isUrgentReason ? 'reason-tag-urgent' : ''}`}>
                                          {reason}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Multi-Label Domain Tags */}
                              {ticket.tags && ticket.tags.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                  <span style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                    Domain Tags:
                                  </span>
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {ticket.tags.map((tag, tIdx) => (
                                      <span key={tIdx} className="reason-tag" style={{ fontSize: '0.675rem', opacity: 0.85, background: 'var(--bg-card)' }}>
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {hasUnsavedChanges(ticket) && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{
                                    padding: '6px 14px',
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveTicket(ticket);
                                  }}
                                  disabled={savingIds.has(ticket.ticket_id)}
                                  title="Confirm and save ticket status and assignee updates"
                                >
                                  {savingIds.has(ticket.ticket_id) ? (
                                    <RefreshCw size={13} className="animate-spin" />
                                  ) : (
                                    <Save size={13} />
                                  )}
                                  Update Ticket
                                </button>
                              )}

                              {hasUnsavedChanges(ticket) && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDiscardChanges(ticket.ticket_id);
                                  }}
                                  title="Discard unsaved changes"
                                >
                                  <X size={13} />
                                  Discard
                                </button>
                              )}

                              {saveSuccessIds.has(ticket.ticket_id) && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'var(--toast-success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--toast-success-border)' }}>
                                  <Check size={13} /> Ticket Updated!
                                </span>
                              )}

                              <button
                                type="button"
                                className="btn-accent"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                onClick={(e) => handleGenerateResponse(ticket, e)}
                                disabled={generatingIds.has(ticket.ticket_id)}
                                title="Draft an automated customer response email"
                              >
                                {generatingIds.has(ticket.ticket_id) ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <Sparkles size={13} />
                                )}
                                {generatedResponses[ticket.ticket_id] ? 'Regenerate Draft' : 'Draft AI Response'}
                              </button>

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
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
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

                          {/* AI Suggested Response Box */}
                          {generatedResponses[ticket.ticket_id] && (
                            <div
                              style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-focus)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '14px 16px',
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                lineHeight: 1.65,
                                boxShadow: 'var(--shadow-sm)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '10px',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.725rem',
                                    textTransform: 'uppercase',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <Bot size={14} /> Suggested Customer Response ({generatedResponses[ticket.ticket_id].source === 'llm' ? 'Cloud AI' : 'Smart Template'})
                                </span>

                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.725rem' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(generatedResponses[ticket.ticket_id].text);
                                    setCopiedResponseId(ticket.ticket_id);
                                    setTimeout(() => setCopiedResponseId(null), 2000);
                                  }}
                                >
                                  {copiedResponseId === ticket.ticket_id ? (
                                    <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  {copiedResponseId === ticket.ticket_id ? 'Copied Response!' : 'Copy Draft'}
                                </button>
                              </div>

                              <div
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-primary)',
                                  backgroundColor: 'var(--bg-input)',
                                  padding: '12px 14px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {generatedResponses[ticket.ticket_id].text}
                              </div>
                            </div>
                          )}
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

      {/* Side-Flyout Ticket Detail Drawer */}
      <TicketDetailDrawer
        ticket={drawerTicket}
        isOpen={Boolean(drawerTicket)}
        onClose={() => setDrawerTicket(null)}
        effectiveStatus={drawerTicket ? getEffectiveStatus(drawerTicket) : 'new'}
        onStatusChange={(tId, status) => setPendingStatus(tId, status)}
        effectiveAssignee={drawerTicket ? getEffectiveAssignee(drawerTicket) : null}
        onAssigneeChange={(tId, assignee) => setPendingAssignee(tId, assignee)}
        generatedResponse={drawerTicket ? generatedResponses[drawerTicket.ticket_id] : undefined}
        isGeneratingResponse={drawerTicket ? generatingIds.has(drawerTicket.ticket_id) : false}
        onGenerateResponse={async (tId) => {
          if (!drawerTicket) return;
          setGeneratingIds((prev) => new Set(prev).add(tId));
          try {
            const result = await generateTicketResponse({
              ticket_id: tId,
              subject: drawerTicket.subject,
              body: drawerTicket.body,
              issue_type: drawerTicket.issue_type,
              urgency: drawerTicket.urgency,
            });
            setGeneratedResponses((prev) => ({
              ...prev,
              [tId]: { text: result.text, source: result.source },
            }));
          } catch (err) {
            const fallbackText = buildFallbackResponseTemplate(drawerTicket.ticket_id, drawerTicket.issue_type, drawerTicket.urgency);
            setGeneratedResponses((prev) => ({
              ...prev,
              [tId]: { text: fallbackText, source: 'offline-fallback' },
            }));
          } finally {
            setGeneratingIds((prev) => {
              const next = new Set(prev);
              next.delete(tId);
              return next;
            });
          }
        }}
        onSaveTicket={async (updatedTicket) => {
          await handleSaveTicket(updatedTicket);
        }}
      />

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(8px)',
            color: 'var(--text-primary)',
          }}
        >
          <span
            data-testid="bulk-selected-count"
            style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
          >
            {selectedIds.size} {selectedIds.size === 1 ? 'ticket' : 'tickets'} selected
          </span>

          <button
            type="button"
            data-testid="bulk-clear-btn"
            className="btn-secondary"
            onClick={() => setSelectedIds(new Set())}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Clear Selection
          </button>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-primary)' }} />

          <select
            data-testid="bulk-urgency-select"
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            value=""
            onChange={(e) => {
              const val = e.target.value as UrgencyLevel;
              if (val) {
                handleBulkUrgencyUpdate(val);
              }
            }}
          >
            <option value="" disabled>Bulk Update Urgency...</option>
            <option value="critical">Set Critical Urgency</option>
            <option value="high">Set High Urgency</option>
            <option value="medium">Set Medium Urgency</option>
            <option value="low">Set Low Urgency</option>
          </select>

          <button
            type="button"
            data-testid="bulk-export-btn"
            className="btn-primary"
            onClick={handleBulkExport}
            style={{ padding: '4px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} />
            Export Selected
          </button>
        </div>
      )}
    </div>
  );
};
