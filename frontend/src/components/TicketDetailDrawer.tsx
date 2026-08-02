import React, { useState } from 'react';
import { TriagedTicket, TicketStatus } from '../types';
import { X, Sparkles, Copy, Check, Bot, Tag, RefreshCw } from 'lucide-react';
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
  onGenerateResponse: (ticketId: string) => void;
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
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleCopyResponse = () => {
    if (generatedResponse?.text) {
      navigator.clipboard.writeText(generatedResponse.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        {/* Drawer Body Scroll Container */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                STATUS
              </span>
              <select
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
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ASSIGNEE
              </span>
              <select
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> AI Draft Customer Response
              </span>
              {!generatedResponse && (
                <button
                  type="button"
                  className="btn-accent"
                  onClick={() => onGenerateResponse(ticket.ticket_id)}
                  disabled={isGeneratingResponse}
                  style={{ padding: '6px 12px', fontSize: '0.775rem', gap: '6px' }}
                >
                  {isGeneratingResponse ? <RefreshCw size={13} className="animate-spin" /> : <Bot size={13} />}
                  {isGeneratingResponse ? 'Generating…' : 'Generate Response'}
                </button>
              )}
            </div>

            {generatedResponse ? (
              <div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    marginBottom: '10px',
                  }}
                >
                  {generatedResponse.text}
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyResponse}
                  style={{ padding: '6px 12px', fontSize: '0.775rem', gap: '6px' }}
                >
                  {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Draft'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Click "Generate Response" to create an instant customer resolution draft based on triage signals.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
