// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TicketTable } from '../components/TicketTable';
import { TriagedTicket } from '../types';

describe('TicketTable Component - Multi-Select Bulk Actions & SLA Badges (SPEC 004)', () => {
  afterEach(() => {
    cleanup();
  });

  const now = Date.now();

  const mockTickets: TriagedTicket[] = [
    {
      ticket_id: 'TCK-101',
      subject: 'Database connection timeout under heavy load',
      body: 'All database queries are timing out.',
      urgency: 'critical',
      urgency_score: 4,
      score: 95,
      confidence_source: 'rule',
      created_at: new Date(now - 15 * 60 * 1000).toISOString(), // 15m ago (<30m)
      status: 'new',
      issue_type: 'technical',
    },
    {
      ticket_id: 'TCK-102',
      subject: 'Billing portal invoice mismatch',
      body: 'Invoice amount does not match plan.',
      urgency: 'high',
      urgency_score: 3,
      score: 75,
      confidence_source: 'llm',
      created_at: new Date(now - 60 * 60 * 1000).toISOString(), // 1h ago (30m-2h)
      status: 'in-progress',
      issue_type: 'billing',
    },
    {
      ticket_id: 'TCK-103',
      subject: 'SSO configuration guide request',
      body: 'How do I setup Okta SSO?',
      urgency: 'medium',
      urgency_score: 2,
      score: 45,
      confidence_source: 'fallback',
      created_at: new Date(now - 180 * 60 * 1000).toISOString(), // 3h ago (>2h)
      status: 'new',
      issue_type: 'account',
    },
  ];

  describe('Multi-Select Row Selection State & Floating Action Bar', () => {
    it('renders selection checkboxes on ticket rows', () => {
      render(<TicketTable tickets={mockTickets} />);
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      expect(selectAllCheckbox).toBeTruthy();

      const checkbox1 = screen.getByTestId('select-ticket-TCK-101');
      const checkbox2 = screen.getByTestId('select-ticket-TCK-102');
      const checkbox3 = screen.getByTestId('select-ticket-TCK-103');
      expect(checkbox1).toBeTruthy();
      expect(checkbox2).toBeTruthy();
      expect(checkbox3).toBeTruthy();
    });

    it('toggles individual ticket selection and shows floating bulk action bar', () => {
      render(<TicketTable tickets={mockTickets} />);
      const checkbox1 = screen.getByTestId('select-ticket-TCK-101');
      fireEvent.click(checkbox1);

      const bulkCount = screen.getByTestId('bulk-selected-count');
      expect(bulkCount).toBeTruthy();
      expect(bulkCount.textContent).toContain('1');
    });

    it('selects all tickets when master select-all checkbox is clicked', () => {
      render(<TicketTable tickets={mockTickets} />);
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      fireEvent.click(selectAllCheckbox);

      const bulkCount = screen.getByTestId('bulk-selected-count');
      expect(bulkCount.textContent).toContain('3');
    });

    it('clears selection when Clear Selection button is clicked', () => {
      render(<TicketTable tickets={mockTickets} />);
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      fireEvent.click(selectAllCheckbox);

      const clearBtn = screen.getByTestId('bulk-clear-btn');
      fireEvent.click(clearBtn);

      expect(screen.queryByTestId('bulk-selected-count')).toBeNull();
    });

    it('renders bulk export button with data-testid="bulk-export-btn"', () => {
      render(<TicketTable tickets={mockTickets} />);
      const checkbox1 = screen.getByTestId('select-ticket-TCK-101');
      fireEvent.click(checkbox1);

      const exportBtn = screen.getByTestId('bulk-export-btn');
      expect(exportBtn).toBeTruthy();
    });

    it('renders bulk urgency dropdown menu', () => {
      render(<TicketTable tickets={mockTickets} />);
      const checkbox1 = screen.getByTestId('select-ticket-TCK-101');
      fireEvent.click(checkbox1);

      const urgencySelect = screen.getByTestId('bulk-urgency-select');
      expect(urgencySelect).toBeTruthy();
    });
  });

  describe('SLA Breach Countdown Badges (SPEC 004)', () => {
    it('renders SLA countdown badge for each ticket row with data-testid="sla-badge-{ticket_id}"', () => {
      render(<TicketTable tickets={mockTickets} />);
      expect(screen.getByTestId('sla-badge-TCK-101')).toBeTruthy();
      expect(screen.getByTestId('sla-badge-TCK-102')).toBeTruthy();
      expect(screen.getByTestId('sla-badge-TCK-103')).toBeTruthy();
    });

    it('renders critical pulse SLA badge for tickets created <30m ago', () => {
      render(<TicketTable tickets={mockTickets} />);
      const badge1 = screen.getByTestId('sla-badge-TCK-101');
      expect(badge1.textContent).toMatch(/<30m|30m/i);
    });

    it('renders warning SLA badge for tickets created 30m-2h ago', () => {
      render(<TicketTable tickets={mockTickets} />);
      const badge2 = screen.getByTestId('sla-badge-TCK-102');
      expect(badge2.textContent).toMatch(/30m-2h|1h/i);
    });

    it('renders standard SLA badge for tickets created >2h ago', () => {
      render(<TicketTable tickets={mockTickets} />);
      const badge3 = screen.getByTestId('sla-badge-TCK-103');
      expect(badge3.textContent).toMatch(/>2h|3h/i);
    });
  });
});
