import { TicketStatus } from '../types';

/**
 * Backend API base URL. Previously redefined independently in both
 * `App.tsx` and `TicketTable.tsx` — now shared from a single source.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface UpdateTicketPayload {
  status: TicketStatus;
  assignee: string | null;
}

export interface UpdateTicketResult {
  updated_at: string | null;
}

/**
 * PATCH /api/tickets/:id — persist a status/assignee change.
 * Throws on a non-2xx response or network failure so callers can apply
 * their own optimistic-update fallback (matches prior inline behavior).
 */
export async function updateTicket(
  ticketId: string,
  payload: UpdateTicketPayload
): Promise<UpdateTicketResult> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update ticket ${ticketId}`);
  }
  const data = await res.json();
  return { updated_at: data.updated_at ?? null };
}

export interface GenerateResponsePayload {
  ticket_id: string;
  subject: string;
  body: string;
  issue_type: string;
  urgency: string;
}

export interface GenerateResponseResult {
  text: string;
  source: string;
}

/**
 * POST /api/tickets/generate-response — request an AI/template-drafted
 * customer reply. Throws on a non-2xx response or network failure; the
 * caller is expected to fall back to `buildFallbackResponseTemplate`.
 */
export async function generateTicketResponse(
  payload: GenerateResponsePayload
): Promise<GenerateResponseResult> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/generate-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Backend returned status error');
  }
  const data = await res.json();
  return { text: data.suggested_response, source: data.source };
}
