import React, { useState, useEffect } from 'react';
import { TriagedTicket, TicketStatus } from '../types';
import { X, Sparkles, Copy, Check, Bot, Tag, RefreshCw, User, History, SlidersHorizontal, Send, CheckCircle2 } from 'lucide-react';
import {
  renderScoreBadge,
  renderUrgencyBadge,
} from '../lib/ticketFormatters';

interface TicketDetailDrawerProps {
  ticket: TriagedTicket | null;
  isOpen: boolean;
  onClose: () => void;
  effectiveStatus: TicketStatus;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  effectiveAssignee?: string | null;
  onAssigneeChange: (ticketId: string, assignee: string | null) => void;
  generatedResponse?: { text: string; source: string };
  isGeneratingResponse?: boolean;
  onGenerateResponse: (ticketId: string, tone?: string) => void;
  onSaveTicket?: (updated: TriagedTicket) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  effectiveStatus,
  onStatusChange,
  effectiveAssignee,
  onAssigneeChange,
  generatedResponse,
  isGeneratingResponse,
  onGenerateResponse,
  onSaveTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customer' | 'audit'>('overview');
  const [selectedTone, setSelectedTone] = useState<string>('formal');
  const [copied, setCopied] = useState(false);
  const [showMessageSentToast, setShowMessageSentToast] = useState(false);
  const [editedDraftText, setEditedDraftText] = useState<string>('');

  useEffect(() => {
    if (generatedResponse?.text) {
      setEditedDraftText(generatedResponse.text);
    } else {
      setEditedDraftText('');
    }
  }, [generatedResponse]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setShowMessageSentToast(false);
    }
  }, [ticket?.ticket_id, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleCopyResponse = () => {
    if (editedDraftText) {
      navigator.clipboard.writeText(editedDraftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendResponse = () => {
    setShowMessageSentToast(true);
    if (ticket) {
      onStatusChange(ticket.ticket_id, 'resolved');
      if (onSaveTicket) {
        onSaveTicket({
          ...ticket,
          status: 'resolved',
          updated_at: new Date().toISOString(),
        });
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ticket Details: ${ticket.subject}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
        transition: 'opacity 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          borderRadius: 0,
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-table-header)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--accent-primary)',
                }}
              >
                {ticket.ticket_id}
              </span>
              {renderUrgencyBadge(ticket.urgency, ticket.urgency_score)}
              {renderScoreBadge(ticket.score)}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {ticket.subject}
            </h3>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            aria-label="Close detail drawer"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Ticket detail tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-primary)',
            padding: '0 16px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            role="tab"
            data-testid="drawer-tab-overview"
            aria-selected={activeTab === 'overview'}
            aria-controls="tabpanel-overview"
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 14px',
              fontSize: '0.825rem',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              color: activeTab === 'overview' ? 'var(--accent-violet)' : 'var(--text-muted)',
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent-violet)' : '2px solid transparent',
              background: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <SlidersHorizontal size={14} />
            Overview & AI Draft
          </button>

          <button
            type="button"
            role="tab"
            data-testid="drawer-tab-customer"
            aria-selected={activeTab === 'customer'}
            aria-controls="tabpanel-customer"
            id="tab-customer"
            onClick={() => setActiveTab('customer')}
            style={{
              padding: '12px 14px',
              fontSize: '0.825rem',
              fontWeight: activeTab === 'customer' ? 700 : 500,
              color: activeTab === 'customer' ? 'var(--accent-violet)' : 'var(--text-muted)',
              borderBottom: activeTab === 'customer' ? '2px solid var(--accent-violet)' : '2px solid transparent',
              background: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={14} />
            Customer Metadata
          </button>

          <button
            type="button"
            role="tab"
            data-testid="drawer-tab-audit"
            aria-selected={activeTab === 'audit'}
            aria-controls="tabpanel-audit"
            id="tab-audit"
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '12px 14px',
              fontSize: '0.825rem',
              fontWeight: activeTab === 'audit' ? 700 : 500,
              color: activeTab === 'audit' ? 'var(--accent-violet)' : 'var(--text-muted)',
              borderBottom: activeTab === 'audit' ? '2px solid var(--accent-violet)' : '2px solid transparent',
              background: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <History size={14} />
            Lifecycle Audit Trail
          </button>
        </div>

        {/* Drawer Body Scroll Container */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Tab Panel 1: Overview */}
          {activeTab === 'overview' && (
            <div
              role="tabpanel"
              id="tabpanel-overview"
              aria-labelledby="tab-overview"
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {showMessageSentToast && (
                <div
                  data-testid="message-sent-toast"
                  role="status"
                  aria-live="polite"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid var(--accent-emerald)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    color: 'var(--accent-emerald)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Message Sent</span>
                </div>
              )}

              {/* Metadata Controls Panel */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: 'var(--bg-input)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <label
                    htmlFor="drawer-status-select"
                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}
                  >
                    STATUS
                  </label>
                  <select
                    id="drawer-status-select"
                    value={effectiveStatus}
                    onChange={(e) => onStatusChange(ticket.ticket_id, e.target.value as TicketStatus)}
                    aria-label="Update ticket status"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="drawer-assignee-select"
                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}
                  >
                    ASSIGNEE
                  </label>
                  <select
                    id="drawer-assignee-select"
                    value={effectiveAssignee || ''}
                    onChange={(e) => onAssigneeChange(ticket.ticket_id, e.target.value || null)}
                    aria-label="Assign ticket specialist"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Unassigned</option>
                    <option value="Jordan M.">Jordan M. (Support Specialist)</option>
                    <option value="Alex P.">Alex P. (Tier 2 Tech Lead)</option>
                    <option value="Sam K.">Sam K. (Billing Lead)</option>
                  </select>
                </div>
              </div>

              {/* Ticket Body Content */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Ticket Message Content
                </h4>
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {ticket.body}
                </div>
              </div>

              {/* Triage Signals / Deterministic Reasons */}
              {ticket.reasons && ticket.reasons.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Automated Triage Signals
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ticket.reasons.map((reason, idx) => (
                      <span key={idx} className="reason-tag" style={{ fontSize: '0.775rem', padding: '4px 10px' }}>
                        <Tag size={12} /> {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggested Response Box */}
              <div
                style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.04)',
                  border: '1px solid var(--btn-accent-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> AI Draft Customer Response
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="ai-tone-select" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Tone:
                    </label>
                    <select
                      id="ai-tone-select"
                      data-testid="ai-tone-select"
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      aria-label="Select AI response tone"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="formal">Formal</option>
                      <option value="empathic">Empathic</option>
                      <option value="concise">Concise</option>
                      <option value="technical">Technical</option>
                    </select>

                    {!generatedResponse && (
                      <button
                        type="button"
                        className="btn-accent"
                        onClick={() => onGenerateResponse(ticket.ticket_id, selectedTone)}
                        disabled={isGeneratingResponse}
                        style={{ padding: '6px 12px', fontSize: '0.775rem', gap: '6px' }}
                      >
                        {isGeneratingResponse ? <RefreshCw size={13} className="animate-spin" /> : <Bot size={13} />}
                        {isGeneratingResponse ? 'Generating…' : 'Generate Response'}
                      </button>
                    )}
                  </div>
                </div>

                {generatedResponse ? (
                  <div>
                    <textarea
                      data-testid="ai-draft-textarea"
                      aria-label="Editable AI draft response"
                      value={editedDraftText}
                      onChange={(e) => setEditedDraftText(e.target.value)}
                      rows={5}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px',
                        fontSize: '0.85rem',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                        marginBottom: '10px',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleCopyResponse}
                          style={{ padding: '6px 12px', fontSize: '0.775rem', gap: '6px' }}
                        >
                          {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                          {copied ? 'Copied to Clipboard!' : 'Copy Draft'}
                        </button>

                        <button
                          type="button"
                          data-testid="respond-btn"
                          className="btn-primary"
                          onClick={handleSendResponse}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.775rem',
                            gap: '6px',
                            backgroundColor: 'var(--accent-emerald)',
                            borderColor: 'var(--accent-emerald)',
                            color: '#ffffff',
                          }}
                        >
                          <Send size={13} />
                          Respond
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-accent"
                        onClick={() => onGenerateResponse(ticket.ticket_id, selectedTone)}
                        disabled={isGeneratingResponse}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                      >
                        <RefreshCw size={12} className={isGeneratingResponse ? 'animate-spin' : ''} />
                        Regenerate ({selectedTone})
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Select a tone and click "Generate Response" to create an instant customer resolution draft based on triage signals.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab Panel 2: Customer Metadata */}
          {activeTab === 'customer' && (
            <div
              role="tabpanel"
              id="tabpanel-customer"
              aria-labelledby="tab-customer"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Customer Account
                    </span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ticket.customer_id || 'CUST-GENERAL'}
                    </h4>
                  </div>

                  <span
                    data-testid="customer-tier-badge"
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: (ticket.score ?? 0) >= 80 || (ticket.customer_id && ticket.customer_id.includes('8'))
                        ? 'rgba(124, 58, 237, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                      color: (ticket.score ?? 0) >= 80 || (ticket.customer_id && ticket.customer_id.includes('8'))
                        ? 'var(--accent-violet)'
                        : 'var(--accent-blue)',
                      border: (ticket.score ?? 0) >= 80 || (ticket.customer_id && ticket.customer_id.includes('8'))
                        ? '1px solid rgba(124, 58, 237, 0.3)'
                        : '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    {(ticket.score ?? 0) >= 80 || (ticket.customer_id && ticket.customer_id.includes('8')) ? 'Enterprise VIP' : 'Pro Tier'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    data-testid="customer-past-volume"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      PAST TICKET VOLUME
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      14 Tickets <span style={{ fontSize: '0.775rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Past 90 Days)</span>
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      SLA RESPONSE TARGET
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      &lt; 2 Hours <span style={{ fontSize: '0.775rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Guaranteed)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Account Attributes
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Issue Category</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{ticket.issue_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Confidence Source</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{ticket.confidence_source}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Priority Matrix Score</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.score} / 100</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Panel 3: Lifecycle Audit Trail */}
          {activeTab === 'audit' && (
            <div
              role="tabpanel"
              id="tabpanel-audit"
              aria-labelledby="tab-audit"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div
                data-testid="audit-timeline"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                }}
              >
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} /> Lifecycle Audit Timeline
                </h4>

                <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '7px',
                      top: '6px',
                      bottom: '6px',
                      width: '2px',
                      backgroundColor: 'var(--border-primary)',
                    }}
                  />

                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-primary)',
                        border: '2px solid var(--bg-card)',
                      }}
                    />
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Ticket Ingested & Created
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recently ingested'}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Submitted by Customer <code style={{ fontSize: '0.75rem' }}>{ticket.customer_id}</code>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-violet)',
                        border: '2px solid var(--bg-card)',
                      }}
                    />
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Automated Triage Evaluation
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Source: {ticket.confidence_source.toUpperCase()} Engine
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Urgency: <strong>{ticket.urgency.toUpperCase()}</strong> (Score: <strong>{ticket.score}/100</strong>, Category: <strong>{ticket.issue_type}</strong>)
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-blue)',
                        border: '2px solid var(--bg-card)',
                      }}
                    />
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Status & Assignment State
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Last modified state
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Status: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{effectiveStatus}</span> | Assignee: <span style={{ fontWeight: 600 }}>{effectiveAssignee || 'Unassigned'}</span>
                    </div>
                  </div>

                  {generatedResponse && (
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '4px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-emerald)',
                          border: '2px solid var(--bg-card)',
                        }}
                      />
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AI Response Draft Generated
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Draft Provider: {generatedResponse.source}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Draft response ready for agent review & dispatch.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

