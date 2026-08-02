// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';
import { TriagedTicket } from '../types';

describe('TicketDetailDrawer Component - Multi-Tab Navigation & AI Tone Controls (SPEC 005)', () => {
  afterEach(() => {
    cleanup();
  });

  const mockTicket: TriagedTicket = {
    ticket_id: 'TCK-201',
    subject: 'API Rate limit unexpected 429 response',
    body: 'We are receiving 429 Too Many Requests errors even though we are under our hourly quota.',
    urgency: 'high',
    urgency_score: 3,
    score: 82,
    confidence_source: 'llm',
    created_at: new Date().toISOString(),
    status: 'new',
    issue_type: 'technical',
    customer_id: 'CUST-8842',
    reasons: ['High request error rate', 'API quota anomaly'],
  };

  describe('Multi-Tab Navigation State (SPEC 005)', () => {
    it('renders navigation tabs for Overview, Customer Metadata, and Audit Trail', () => {
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={vi.fn()}
        />
      );

      const overviewTab = screen.getByTestId('drawer-tab-overview');
      const customerTab = screen.getByTestId('drawer-tab-customer');
      const auditTab = screen.getByTestId('drawer-tab-audit');

      expect(overviewTab).toBeTruthy();
      expect(customerTab).toBeTruthy();
      expect(auditTab).toBeTruthy();
    });

    it('defaults to Overview tab displaying ticket content and triage signals', () => {
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={vi.fn()}
        />
      );

      expect(screen.getByText('API Rate limit unexpected 429 response')).toBeTruthy();
      expect(screen.getByText(/We are receiving 429 Too Many Requests/)).toBeTruthy();
    });

    it('switches to Customer Metadata tab and displays tier badge and past volume', () => {
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={vi.fn()}
        />
      );

      const customerTab = screen.getByTestId('drawer-tab-customer');
      fireEvent.click(customerTab);

      const tierBadge = screen.getByTestId('customer-tier-badge');
      const pastVolume = screen.getByTestId('customer-past-volume');

      expect(tierBadge).toBeTruthy();
      expect(pastVolume).toBeTruthy();
    });

    it('switches to Audit Trail tab and displays lifecycle timeline', () => {
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={vi.fn()}
        />
      );

      const auditTab = screen.getByTestId('drawer-tab-audit');
      fireEvent.click(auditTab);

      const timeline = screen.getByTestId('audit-timeline');
      expect(timeline).toBeTruthy();
    });
  });

  describe('AI Response Tone Selection Controls (SPEC 005)', () => {
    it('renders tone selection dropdown with formal, empathic, concise, and technical options', () => {
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={vi.fn()}
        />
      );

      const toneSelect = screen.getByTestId('ai-tone-select') as HTMLSelectElement;
      expect(toneSelect).toBeTruthy();

      const options = Array.from(toneSelect.options).map((opt) => opt.value);
      expect(options).toEqual(expect.arrayContaining(['formal', 'empathic', 'concise', 'technical']));
    });

    it('updates tone state when tone dropdown selection changes', () => {
      const onGenerateResponse = vi.fn();
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={onGenerateResponse}
        />
      );

      const toneSelect = screen.getByTestId('ai-tone-select') as HTMLSelectElement;
      fireEvent.change(toneSelect, { target: { value: 'empathic' } });
      expect(toneSelect.value).toBe('empathic');
    });
  });

  describe('Keyboard Controls & Escape Key Listener', () => {
    it('triggers onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={onClose}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
