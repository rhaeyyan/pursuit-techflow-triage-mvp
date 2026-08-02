// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';
import { TriagedTicket } from '../types';

describe('TicketDetailDrawer - AI Draft Respond Button & Notification (SPEC 007)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockTicket: TriagedTicket = {
    ticket_id: 'TCK-707',
    subject: 'Unable to export CSV analytics report',
    body: 'When I click Export CSV, the system throws a 500 server error.',
    urgency: 'high',
    urgency_score: 3,
    score: 88,
    confidence_source: 'llm',
    created_at: '2026-08-01T12:00:00Z',
    status: 'new',
    issue_type: 'technical',
    customer_id: 'CUST-9901',
    reasons: ['Export failure', 'HTTP 500 error'],
  };

  const mockGeneratedResponse = {
    text: 'Hello, we have identified the issue with the CSV export service and applied a fix. Please try exporting again.',
    source: 'llm',
  };

  it('renders the Respond button (data-testid="respond-btn") near the AI-generated draft response', () => {
    render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={mockGeneratedResponse}
      />
    );

    const respondBtn = screen.getByTestId('respond-btn');
    expect(respondBtn).toBeTruthy();
    expect(respondBtn.textContent).toMatch(/Respond|Send Response/i);
  });

  it('displays Message Sent notification (data-testid="message-sent-toast") when Respond button is clicked', () => {
    render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={mockGeneratedResponse}
      />
    );

    const respondBtn = screen.getByTestId('respond-btn');
    fireEvent.click(respondBtn);

    const toast = screen.getByTestId('message-sent-toast');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Message Sent');
  });

  it('updates ticket record with status "resolved" and updated_at timestamp when Respond button is clicked', () => {
    const onSaveTicket = vi.fn();
    render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={mockGeneratedResponse}
        onSaveTicket={onSaveTicket}
      />
    );

    const respondBtn = screen.getByTestId('respond-btn');
    fireEvent.click(respondBtn);

    expect(onSaveTicket).toHaveBeenCalledTimes(1);
    const updatedRecord = onSaveTicket.mock.calls[0][0];
    expect(updatedRecord).toMatchObject({
      ...mockTicket,
      status: 'resolved',
    });
    expect(updatedRecord.updated_at).toBeDefined();
    expect(typeof updatedRecord.updated_at).toBe('string');
  });
});
