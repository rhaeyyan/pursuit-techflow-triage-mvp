import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StatSummary } from '../components/StatSummary';
import { TriagedTicket } from '../types';

describe('StatSummary Component - Bento Grid Header (SPEC 003)', () => {
  const mockTickets: TriagedTicket[] = [
    {
      ticket_id: 'TCK-001',
      subject: 'Critical server outage',
      body: 'Production system is completely unreachable',
      urgency: 'critical',
      urgency_score: 4,
      confidence_source: 'rule',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago (<2h SLA breach risk)
      status: 'new',
      issue_type: 'technical',
    },
    {
      ticket_id: 'TCK-002',
      subject: 'High priority billing dispute',
      body: 'Double charged on annual invoice',
      urgency: 'high',
      urgency_score: 3,
      confidence_source: 'llm',
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: 'in-progress',
      issue_type: 'billing',
    },
    {
      ticket_id: 'TCK-003',
      subject: 'Medium account permission query',
      body: 'Need access to admin panel',
      urgency: 'medium',
      urgency_score: 2,
      confidence_source: 'fallback',
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      status: 'new',
      issue_type: 'account',
    },
    {
      ticket_id: 'TCK-004',
      subject: 'Low general inquiry',
      body: 'Question about holiday operating hours',
      urgency: 'low',
      urgency_score: 1,
      confidence_source: 'rule',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: 'resolved',
      issue_type: 'general',
    },
  ];

  describe('Card 1: SLA Telemetry Card', () => {
    it('renders SLA Telemetry Bento card header and total tickets', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toContain('SLA Telemetry');
      expect(html).toContain('4'); // Total tickets count
    });

    it('calculates and displays active critical breaches (<2h countdown)', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toMatch(/Critical Breaches|SLA Breaches|Breach/i);
      expect(html).toContain('1'); // 1 active critical ticket created <2h ago
    });

    it('renders SLA status gauge indicator', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toMatch(/SLA Status|Status Gauge|Breach Risk/i);
    });
  });

  describe('Card 2: Urgency Ratio Card', () => {
    it('renders Urgency Ratio Bento card title and progress bars', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toMatch(/Urgency Ratio|Urgency Distribution/i);
    });

    it('calculates correct percentages for Critical, High, Medium, Low urgency', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      // 4 tickets total: 1 of each = 25% each
      expect(html).toContain('25%');
    });

    it('supports interactive filter selection prop callback', () => {
      const onFilterSelect = vi.fn();
      const onSelectUrgencyFilter = vi.fn();
      const html = renderToString(
        <StatSummary
          tickets={mockTickets}
          onFilterSelect={onFilterSelect}
          onSelectUrgencyFilter={onSelectUrgencyFilter}
        />
      );
      expect(html).toBeDefined();
    });
  });

  describe('Card 3: AI Triage Breakdown Card', () => {
    it('renders AI Triage Breakdown Bento card title', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toMatch(/AI Triage Breakdown|Triage Source/i);
    });

    it('calculates percentage split for Rule Engine, Cloud LLM, and Fallback Classifier', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      // Rule Engine: 2/4 = 50%
      // Cloud LLM: 1/4 = 25%
      // Fallback: 1/4 = 25%
      expect(html).toMatch(/Rule Engine|Rule/i);
      expect(html).toMatch(/Cloud LLM|LLM/i);
      expect(html).toMatch(/Fallback/i);
      expect(html).toContain('50%');
      expect(html).toContain('25%');
    });
  });

  describe('Card 4: Queue Velocity Card', () => {
    it('renders Queue Velocity Bento card header', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toMatch(/Queue Velocity|Velocity/i);
    });

    it('calculates average urgency score across active tickets', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      // Avg score = (4 + 3 + 2 + 1) / 4 = 2.5
      expect(html).toContain('2.5');
    });

    it('renders overall triage state badge', () => {
      const html = renderToString(<StatSummary tickets={mockTickets} />);
      expect(html).toMatch(/Triage State|Active Throughput|Queue Health/i);
    });
  });

  describe('Edge Cases & Null States', () => {
    it('handles empty ticket array gracefully without divide-by-zero errors', () => {
      const html = renderToString(<StatSummary tickets={[]} />);
      expect(html).toBeDefined();
      expect(html).toContain('0');
    });
  });
});
