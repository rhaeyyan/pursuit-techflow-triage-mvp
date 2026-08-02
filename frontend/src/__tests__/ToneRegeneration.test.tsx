// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';
import { TicketTable } from '../components/TicketTable';
import { buildFallbackResponseTemplate } from '../lib/fallbackResponseTemplate';
import { TriagedTicket } from '../types';
import * as ticketsApi from '../lib/ticketsApi';

describe('Tone-Aware AI Draft Regeneration (SPEC 009)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockTicket: TriagedTicket = {
    ticket_id: 'TCK-901',
    subject: 'Database connection pool exhausted',
    body: 'Our database queries are timing out due to connection pool exhaustion during peak hours.',
    urgency: 'critical',
    urgency_score: 4,
    score: 95,
    confidence_source: 'llm',
    created_at: new Date().toISOString(),
    status: 'new',
    issue_type: 'technical',
    customer_id: 'CUST-9901',
    reasons: ['Database pool exhaustion', 'Critical latency anomaly'],
  };

  describe('buildFallbackResponseTemplate Tone Support', () => {
    it('accepts a tone parameter and returns tone-customized draft replies', () => {
      const formalReply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'formal');
      const empathicReply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'empathic');
      const conciseReply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'concise');
      const technicalReply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'technical');

      expect(formalReply).toBeDefined();
      expect(empathicReply).toBeDefined();
      expect(conciseReply).toBeDefined();
      expect(technicalReply).toBeDefined();

      // Tone-specific responses should not all be identical
      expect(empathicReply).not.toEqual(formalReply);
      expect(conciseReply).not.toEqual(formalReply);
      expect(technicalReply).not.toEqual(formalReply);
    });

    it('includes empathic tone phrasing when empathic tone is requested', () => {
      const reply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'empathic');
      expect(reply.toLowerCase()).toMatch(/(understand|apologize|frustrat|patience|empath)/i);
    });

    it('includes concise formatting/summary when concise tone is requested', () => {
      const reply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'concise');
      expect(reply.toLowerCase()).toMatch(/(summary|quick update|status:|concise|action:)/i);
    });

    it('includes technical details or diagnostic parameters when technical tone is requested', () => {
      const reply = buildFallbackResponseTemplate(mockTicket.subject, mockTicket.issue_type, mockTicket.urgency, 'technical');
      expect(reply.toLowerCase()).toMatch(/(diagnostic|metrics|logs|stack|trace|architecture|root cause|endpoint)/i);
    });
  });

  describe('TicketDetailDrawer Tone Selection & Automatic Regeneration', () => {
    it('passes selected tone parameter when generating initial AI response', () => {
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
      fireEvent.change(toneSelect, { target: { value: 'technical' } });

      const generateBtn = screen.getByRole('button', { name: /Generate Response/i });
      fireEvent.click(generateBtn);

      expect(onGenerateResponse).toHaveBeenCalledWith('TCK-901', 'technical');
    });

    it('automatically triggers onGenerateResponse with new tone when tone dropdown is changed and a draft is displayed', () => {
      const onGenerateResponse = vi.fn();
      const existingDraft = {
        text: 'Initial formal draft response.',
        source: 'llm',
      };

      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={onGenerateResponse}
          generatedResponse={existingDraft}
        />
      );

      const toneSelect = screen.getByTestId('ai-tone-select') as HTMLSelectElement;
      fireEvent.change(toneSelect, { target: { value: 'empathic' } });

      expect(onGenerateResponse).toHaveBeenCalledWith('TCK-901', 'empathic');
    });

    it('passes selected tone to onGenerateResponse when clicking the Regenerate button', () => {
      const onGenerateResponse = vi.fn();
      const existingDraft = {
        text: 'Initial draft response.',
        source: 'llm',
      };

      render(
        <TicketDetailDrawer
          ticket={mockTicket}
          isOpen={true}
          onClose={vi.fn()}
          effectiveStatus="new"
          onStatusChange={vi.fn()}
          onAssigneeChange={vi.fn()}
          onGenerateResponse={onGenerateResponse}
          generatedResponse={existingDraft}
        />
      );

      const toneSelect = screen.getByTestId('ai-tone-select') as HTMLSelectElement;
      fireEvent.change(toneSelect, { target: { value: 'concise' } });
      onGenerateResponse.mockClear();

      const regenerateBtn = screen.getByRole('button', { name: /Regenerate/i });
      fireEvent.click(regenerateBtn);

      expect(onGenerateResponse).toHaveBeenCalledWith('TCK-901', 'concise');
    });
  });

  describe('TicketTable Tone Parameter Forwarding', () => {
    it('forwards tone parameter to API and fallback generator when onGenerateResponse is triggered from drawer', async () => {
      const generateSpy = vi.spyOn(ticketsApi, 'generateTicketResponse').mockResolvedValue({
        text: 'Empathic response from API',
        source: 'llm',
      });

      render(<TicketTable tickets={[mockTicket]} />);

      // Open side drawer
      const drawerBtn = screen.getByTitle('Open in side drawer');
      fireEvent.click(drawerBtn);

      // Select empathic tone
      const toneSelect = screen.getByTestId('ai-tone-select') as HTMLSelectElement;
      fireEvent.change(toneSelect, { target: { value: 'empathic' } });

      // Click generate
      const generateBtn = screen.getByRole('button', { name: /Generate Response/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            ticket_id: 'TCK-901',
            tone: 'empathic',
          })
        );
      });
    });
  });
});
