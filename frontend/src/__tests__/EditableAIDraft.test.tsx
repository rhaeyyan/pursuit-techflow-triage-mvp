// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';
import { TriagedTicket } from '../types';

describe('TicketDetailDrawer - Editable AI Draft Response Textarea (SPEC 008)', () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockWriteText.mockClear();
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
        writable: true,
      });
    } else {
      vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(mockWriteText);
    }
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockTicket: TriagedTicket = {
    ticket_id: 'TCK-808',
    subject: 'Webhooks failing with timeout error',
    body: 'Our webhook endpoint is timing out when receiving high payload bursts.',
    urgency: 'high',
    urgency_score: 3,
    score: 85,
    confidence_source: 'llm',
    created_at: '2026-08-02T10:00:00Z',
    status: 'new',
    issue_type: 'technical',
    customer_id: 'CUST-8080',
    reasons: ['Webhook timeout', 'Payload delivery failure'],
  };

  const initialResponse = {
    text: 'Hello, we are investigating the webhook timeout issue with higher priority.',
    source: 'llm',
  };

  const updatedResponse = {
    text: 'Dear customer, we have increased the timeout threshold to 30 seconds for webhooks.',
    source: 'llm',
  };

  it('renders an interactive textarea with data-testid="ai-draft-textarea"', () => {
    render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={initialResponse}
      />
    );

    const textarea = screen.getByTestId('ai-draft-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
    expect(textarea.value).toBe(initialResponse.text);
  });

  it('allows support specialists to edit the draft response in the textarea', () => {
    render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={initialResponse}
      />
    );

    const textarea = screen.getByTestId('ai-draft-textarea') as HTMLTextAreaElement;
    const customText = 'Hello, we are investigating the webhook timeout issue and have escalated to DevOps.';

    fireEvent.change(textarea, { target: { value: customText } });
    expect(textarea.value).toBe(customText);
  });

  it('copies the edited draft text (not initial generated text) when Copy Draft button is clicked', () => {
    render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={initialResponse}
      />
    );

    const textarea = screen.getByTestId('ai-draft-textarea') as HTMLTextAreaElement;
    const modifiedDraft = 'Modified response text for copy action.';
    fireEvent.change(textarea, { target: { value: modifiedDraft } });

    const copyBtn = screen.getByRole('button', { name: /Copy Draft/i });
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith(modifiedDraft);
  });

  it('synchronizes/resets edited draft text state when generatedResponse prop updates', () => {
    const { rerender } = render(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={initialResponse}
      />
    );

    const textarea = screen.getByTestId('ai-draft-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Draft with local edits before tone change.' } });
    expect(textarea.value).toBe('Draft with local edits before tone change.');

    // Rerender component with new generatedResponse (e.g. tone changed or regenerated)
    rerender(
      <TicketDetailDrawer
        ticket={mockTicket}
        isOpen={true}
        onClose={vi.fn()}
        effectiveStatus="new"
        onStatusChange={vi.fn()}
        onAssigneeChange={vi.fn()}
        onGenerateResponse={vi.fn()}
        generatedResponse={updatedResponse}
      />
    );

    expect(textarea.value).toBe(updatedResponse.text);
  });
});
